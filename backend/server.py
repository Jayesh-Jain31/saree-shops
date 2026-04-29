"""
FastAPI reverse-proxy that:
  - Spawns the Node/Express backend (saree-shops) on port 8002
  - Forwards every incoming HTTP request from uvicorn (port 8001) to it
This allows the Emergent supervisor (which runs `uvicorn server:app --port 8001`)
to host the underlying MERN backend without modifying the supervisor config.
"""
import os
import asyncio
import logging
import subprocess
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

NODE_DIR = Path("/app/backend_node")
UPSTREAM_PORT = int(os.environ.get("NODE_UPSTREAM_PORT", "8002"))
UPSTREAM = f"http://127.0.0.1:{UPSTREAM_PORT}"

logging.basicConfig(level=logging.INFO, format="%(asctime)s [proxy] %(message)s")
log = logging.getLogger("proxy")

app = FastAPI()
_node_proc: subprocess.Popen | None = None
_client: httpx.AsyncClient | None = None


def _build_node_env() -> dict:
    env = os.environ.copy()
    env["PORT"] = str(UPSTREAM_PORT)
    env["NODE_ENV"] = env.get("NODE_ENV", "development")
    # Map Emergent's MONGO_URL to MONGODB_URI expected by the Express app
    if "MONGO_URL" in env and not env.get("MONGODB_URI"):
        db_name = env.get("DB_NAME", "saree_shop")
        mongo_url = env["MONGO_URL"].rstrip("/")
        env["MONGODB_URI"] = f"{mongo_url}/{db_name}"
    return env


@app.on_event("startup")
async def _startup():
    global _node_proc, _client
    env = _build_node_env()
    log.info("Starting node backend on port %s", UPSTREAM_PORT)
    _node_proc = subprocess.Popen(
        ["node", "index.js"],
        cwd=str(NODE_DIR),
        env=env,
    )
    _client = httpx.AsyncClient(base_url=UPSTREAM, timeout=60.0)

    # Wait briefly for Express to bind to port
    for _ in range(60):
        try:
            r = await _client.get("/", timeout=1.0)
            if r.status_code < 500:
                log.info("Node backend is ready (status=%s)", r.status_code)
                break
        except Exception:
            pass
        await asyncio.sleep(0.5)


@app.on_event("shutdown")
async def _shutdown():
    global _node_proc, _client
    if _client:
        await _client.aclose()
    if _node_proc and _node_proc.poll() is None:
        _node_proc.terminate()
        try:
            _node_proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            _node_proc.kill()


_HOP_BY_HOP = {
    "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
    "te", "trailers", "transfer-encoding", "upgrade",
    "content-encoding", "content-length",
}


@app.api_route(
    "/{full_path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
)
async def proxy(full_path: str, request: Request):
    if _client is None:
        return JSONResponse({"error": "proxy not ready"}, status_code=503)

    url = "/" + full_path
    body = await request.body()
    headers = {k: v for k, v in request.headers.items() if k.lower() != "host"}

    try:
        upstream = await _client.request(
            request.method,
            url,
            content=body,
            headers=headers,
            params=request.query_params,
            cookies=request.cookies,
        )
    except httpx.ConnectError:
        return JSONResponse({"error": "upstream not reachable"}, status_code=502)
    except httpx.RequestError as e:
        return JSONResponse({"error": f"upstream error: {e}"}, status_code=502)

    response_headers = {
        k: v for k, v in upstream.headers.items() if k.lower() not in _HOP_BY_HOP
    }
    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=response_headers,
    )

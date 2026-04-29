# Saree Shop — Pulled from GitHub & Running

## Source
- GitHub: https://github.com/Jayesh-Jain31/saree-shops.git (public, MERN clone of Blinkit)
- Pulled & wired into Emergent on 2026-04-29

## Architecture in /app
```
/app/backend/        FastAPI reverse-proxy (uvicorn :8001 — Emergent supervisor)
                     Spawns Node Express on :8002 and forwards every request to it.
/app/backend_node/   Original Express/Mongoose server (saree-shops/server)
/app/frontend/       Vite + React 18 client (yarn start -> vite :3000)
```
- The supervisor command is fixed (`uvicorn server:app --port 8001` and `yarn start`).
  We adapted the project to fit those entrypoints without modifying supervisor config.
- Local MongoDB (`MONGO_URL`) is used; `MONGODB_URI` is derived as `${MONGO_URL}/${DB_NAME}`.

## What works (verified)
- Frontend loads via external preview URL — home page renders banners, categories, footer.
- `GET /api/category/get` returns `{success:true,data:[]}` end-to-end.
- Mongo connected, indexes ensured, Express logs requests.

## What needs real keys to fully function (currently placeholders so server boots)
- `RESEND_API` — order/forgot-password emails
- `CLODINARY_*` — product image uploads
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — online payments
- (Optional) Firebase / Google OAuth keys for client-side social login

## Next Action Items
- Provide real third-party API keys (Cloudinary, Resend, Razorpay) in `/app/backend/.env`
  AND `/app/backend_node/.env`, then `sudo supervisorctl restart backend`.
- Seed an admin user / categories / products to see the UI populated.
- If you want production builds served by Express (single-port), switch to `vite build` +
  static serve from `index.js` — currently dev mode for hot reload.

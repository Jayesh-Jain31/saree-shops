---
name: Server dependency scope
description: Dependency placement rules for the split client/server deployment
---

Backend imports are resolved from `server/node_modules`, so every package imported by server code must be declared in `server/package.json` and `server/package-lock.json`, even when the repository root also has a similarly named package.

**Why:** The backend can crash before opening its port when a package exists only in the root dependency tree; the frontend then reports a misleading “no healthy upstream” error.

**How to apply:** When adding or debugging a server import, install or lock the dependency from `server/` and restart the Backend API workflow before testing the frontend. Optional AI/provider SDKs should be dynamically loaded so a missing feature dependency cannot prevent the core API from booting. For external Docker builds, do not make the image depend on Replit-internal lockfile registry URLs.
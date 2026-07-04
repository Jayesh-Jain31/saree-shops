---
name: Firebase version constraint
description: firebase@12.x is blocked by Replit's security policy; use 10.14.1
---

firebase@12.x pulls in form-data@4.0.0 which has a critical CVE blocked by Replit's package firewall.
Downgrade to firebase@10.14.1 to pass. The app only uses firebase/auth (Google OAuth), so the API is compatible.

**Why:** Replit package firewall blocks packages with critical CVEs. firebase@10.14.1 does not pull form-data@4.x.

**How to apply:** Set `"firebase": "10.14.1"` (exact, not ^) in client/package.json.

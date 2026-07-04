---
name: Razorpay lazy initialization
description: Razorpay must use a Proxy for lazy-init to prevent server crash when keys are missing
---

`new Razorpay({...})` at module load crashes the server if env vars are absent.
Replaced with a Proxy that defers instantiation to first use. Call sites (orders, returns, magicCheckout) use `Razorpay.orders.create(...)` unchanged.

**Why:** Dev environment may not have keys set; server should still start and serve other routes.

**How to apply:** Export a Proxy from `server/config/razorpay.js` that calls `getRazorpay()` lazily on property access. Methods on missing instance throw a clear "not configured" error.

---
name: Resend lazy initialization
description: Resend client must lazy-init; throwing at module load crashes server when RESEND_API absent
---

`new Resend(undefined)` throws at import time, crashing the server before it can listen.
Fixed by lazy-creating the client inside `getResend()` and returning null if key missing. `sendEmail()` skips sending and returns null when unconfigured.

**Why:** Server should start and serve other routes even without email configured.

**How to apply:** In `server/config/sendEmail.js`, wrap `new Resend(...)` in a lazy getter, check for null before calling `resend.emails.send()`.

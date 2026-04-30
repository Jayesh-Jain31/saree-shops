# Saree Shop — Pulled from GitHub & Running

## Source
- GitHub: https://github.com/Jayesh-Jain31/saree-shops.git (public, MERN Blinkit clone)
- Pulled & wired into Emergent on 2026-04-29

## Architecture in /app
```
/app/backend/        FastAPI reverse-proxy on :8001 (Emergent supervisor)
                     Spawns Node Express on :8002 and forwards every request.
/app/backend_node/   Original Express/Mongoose server (saree-shops/server)
/app/frontend/       Vite + React 18 client (yarn start -> vite :3000)
```

## Real 3rd-party keys wired in
- MongoDB Atlas (user's cluster, `test` DB — has real data)
- Cloudinary (cloud: dzrdsne2x)
- Resend email
- Razorpay **LIVE** keys
- JWT access/refresh secrets

## Fixes applied in this session

### Session 1 (got it running)
- FastAPI reverse-proxy to bridge Emergent's fixed `uvicorn :8001` supervisor to the Express server
- CORS allow-list expanded for `.preview.emergentagent.com`, `.preview.emergentcf.cloud`, `.emergentcf.cloud`
- Fixed gzip proxy bug that was returning garbled bytes (was stripping `Content-Encoding` while forwarding compressed body)
- Switched Mongo connection from empty `saree_shop` DB to the real `test` DB
- Migrated all stored Cloudinary URLs from `http://` → `https://` (5 products, 7 categories, 3 sub-categories, 1 banner, 1 user avatar)
- Enabled `secure: true` in Cloudinary SDK so new uploads return HTTPS URLs
- Added `.env` to `.gitignore`, created `.env.example` files safe for GitHub push

### Session 2 (Razorpay Magic Checkout bugs)
Fixed the following bugs caught from the user's screenshots:

1. **Popup address/coupon lost on Vercel serverless** — `getPopupAddresses` / `getPopupCoupon` were in-memory Maps that never survived cross-lambda hops, so `deliveryCharge` and popup-applied-coupons were dropped from the saved order.
   - **Fix**: New `/app/backend_node/models/popupCheckout.model.js` persists them in MongoDB with a 30-min TTL. Helpers are now async and DB-backed.
2. **Success page said "Paid via Razorpay" when user actually chose COD inside the popup**
   - **Fix**: `buildSuccessState` in `CheckoutPage.jsx` now derives `paymentMethod` from `serverOrder.payment_status` ("PAID" → Razorpay, "CASH ON DELIVERY" → COD).
3. **Delivery charge always saved as 0 when popup address was lost**
   - **Fix**: New `/app/backend_node/utils/orderSnapshot.js` helper is the single source of truth for building the address snapshot + resolving delivery charge, with a 4-level fallback (popup → frontend body → delivery-zone lookup by pincode → site setting).
4. **Address `name` field empty in DB** because Razorpay popup doesn't always return a `name`
   - **Fix**: Same helper now falls back to `AddressModel` and then to the user profile to fill `name`/`mobile`.
5. **Success page didn't show coupon discount**
   - **Fix**: Success.jsx now displays "Coupon JAIN −₹100" line when `couponDiscount > 0`.

## Known limitations / still manual
- Existing historical orders in DB still have `deliveryCharge: 0` and `name: ""` — the fixes only affect orders going forward.
- Only 3 of 7 categories have products in the DB (Silk/Cotton/Bandhani). Other category sections render empty.
- "Paan corner" banner is the only active banner in the DB. Replace via Admin → Manage Banners if you want the saree banner.

## Next Action Items
- Re-test the checkout flow end-to-end after pushing to your Vercel deployment to confirm the popup address + delivery charge + correct payment method now flow into My Orders / Admin Orders / Success page.
- Optionally seed delivery zones that cover your target pincodes so the auto delivery-charge lookup picks up a fee when the frontend doesn't provide one.

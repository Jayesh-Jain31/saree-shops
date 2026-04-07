# Blinkit Clone - Full Stack E-Commerce App

## Overview
A full-stack quick-commerce (Blinkit Clone) application built with the MERN stack (MongoDB, Express, React, Node.js). Features user authentication, product/category management, admin panel, cart, coupon system, Razorpay payments, Cash on Delivery, and full order management.

## Architecture
- **Frontend**: React 18 + Vite (port 5000 in dev), Tailwind CSS, Redux Toolkit, React Router
- **Backend**: Express.js (port 8080 in dev), MongoDB/Mongoose, JWT auth, Cloudinary, Resend, Razorpay

## Project Structure
```
/client   - React frontend (Vite dev server on port 5000)
/server   - Express backend API (port 8080)
```

## Development Workflows
- **Start application** (`cd client && npm run dev`) — Frontend on port 5000 with Vite proxy to backend
- **Backend API** (`cd server && npm run dev`) — Express API on port 8080 with nodemon

## Environment Variables / Secrets Required
- `MONGODB_URI` — MongoDB Atlas connection string
- `SECRET_KEY_ACCESS_TOKEN` — JWT access token secret
- `SECRET_KEY_REFRESH_TOKEN` — JWT refresh token secret
- `RESEND_API` — Resend.com API key for emails
- `CLODINARY_CLOUD_NAME` — Cloudinary cloud name
- `CLODINARY_API_KEY` — Cloudinary API key
- `CLODINARY_API_SECRET_KEY` — Cloudinary API secret
- `RAZORPAY_KEY_ID` — Razorpay public key ID
- `RAZORPAY_KEY_SECRET` — Razorpay secret key
- `FRONTEND_URL` — Frontend URL for CORS (set to Replit dev domain in shared env)

## Key Notes
- Vite dev server proxies `/api/*` requests to `http://localhost:8080`
- In production, the Express server serves the built React app from `client/dist`
- MongoDB Atlas must have network access open (0.0.0.0/0) to connect from Replit
- `VITE_BACKEND_URL` is intentionally empty — API calls use relative paths via Vite proxy
- Razorpay public key is served from backend via `/api/config/razorpay-key` (not from VITE_ env var)
- Stripe has been fully removed; only Razorpay + Cash on Delivery remain

## Features
- **Auth**: Register, login, forgot/reset password, JWT with refresh tokens
- **Products**: Category/subcategory/product CRUD, search, image upload to Cloudinary
- **Cart**: Add/update/remove items, quantity management
- **Checkout**: Razorpay online payment + Cash on Delivery (COD can be disabled by admin)
- **Coupons**: Percentage/flat discounts, admin CRUD, user validation at checkout
- **Orders**:
  - Grouped orders: All items from one checkout stored as single order with `items[]` array
  - Order List page (`/dashboard/myorders`): search, filters by status & payment
  - Order Details page (`/dashboard/order/:id`) with items, tracking timeline, price breakdown, address, payment info
  - Cancel order functionality (for non-delivered orders)
  - Order status tracking: Pending → Confirmed → Shipped → Out for Delivery → Delivered
  - Return/Refund: Configurable return period (days), countdown timer, expired state
- **Order Success Page**: Rich confirmation page showing delivery address, estimated time, itemized order, payment summary, date/time
- **Wishlist** (`/dashboard/wishlist`): Toggle products to wishlist, view saved items with add-to-cart
- **Reviews & Ratings**: Star ratings and comments on product detail pages
- **Stock Warning**: "Only X left!" badge on products with low stock (≤5), "Out of stock" for zero
- **Recently Viewed**: LocalStorage-based recently viewed products section on Home page
- **Share Product**: WhatsApp share and copy-link on product detail page
- **Admin Order Management** (`/dashboard/admin-orders`): View all customer orders, search/filter, update status
- **Admin Analytics Dashboard** (`/dashboard/admin-dashboard`): Revenue, orders, products, users stats; order status breakdown; payment methods; monthly revenue chart; top products; recent orders (card view on mobile)
- **Invoice Download**: Print-ready invoice generation from Order Details page
- **Email Order Confirmation**: Automated email via Resend after both COD and Razorpay orders
- **Notifications**: In-app notification bell with persistent notifications for orders and actions
- **Delivery Zones** (`/dashboard/delivery-zones`): Admin configurable pincode-based delivery time estimates + delivery charge. Advanced: set `freeDeliveryAbove` to auto-apply free delivery when cart total meets threshold. Checkout shows "Add ₹X more for free delivery" tip.
- **Site Settings** (`/dashboard/site-settings`): Theme color, policy pages, store name/logo, social links, WhatsApp button, return period, **Maintenance Mode** (on/off + custom message), **COD Restriction** (enable/disable cash on delivery)
- **Maintenance Mode**: Admin toggle in Site Settings. Customers see full-screen maintenance overlay; admins bypass it and shop normally
- **Fraud Detection** (`/dashboard/fraud-detection`): Automatic rule-based COD fraud scoring on every order. Rules: new account + high-value COD, repeated COD cancellations, shared mobile across accounts, burst ordering in 24h, no delivery history. Scores 0–100; critical (80+) orders are hard-blocked at checkout. Scores 30+ auto-flag for admin review. Admin panel: stats cards, filter by type/status/risk level, search, review modal (clear/flag/block), user-level batch scan, delete flags
- **Admin**: Category/subcategory/product management, coupon management

## API Endpoints (New)
- `POST /api/wishlist/toggle` — Add/remove product from wishlist
- `GET /api/wishlist/get` — Get user's wishlist
- `POST /api/review/add` — Add product review
- `POST /api/review/get` — Get reviews for a product
- `DELETE /api/review/delete` — Delete own review
- `GET /api/analytics/dashboard` — Admin analytics data
- `POST /api/analytics/orders` — Admin: list all orders with filters
- `PUT /api/analytics/order-status` — Admin: update order status
- `POST /api/delivery-zone/create` — Admin: create delivery zone
- `GET /api/delivery-zone/get` — Get all delivery zones
- `PUT /api/delivery-zone/update` — Admin: update delivery zone
- `DELETE /api/delivery-zone/delete` — Admin: delete delivery zone
- `POST /api/delivery-zone/check-pincode` — Check delivery availability for pincode

## Order API Endpoints
- `GET /api/order/order-list` — All orders for logged-in user
- `GET /api/order/order-details/:id` — Single order details
- `PUT /api/order/cancel/:id` — Cancel an order
- `POST /api/order/cash-on-delivery` — Place COD order
- `POST /api/order/razorpay` — Create Razorpay payment order
- `POST /api/order/razorpay-verify` — Verify Razorpay payment & save order

## Deployment
- Build: `cd client && npm install && npm run build`
- Run: `node server/index.js` (serves both API and built frontend on port 5000 in production)
- Target: autoscale

## Security Hardening (Applied)
- **Rate Limiting**: `express-rate-limit` — auth endpoints (login/register/forgot-password/OTP) capped at 10 req/15min per IP; all other endpoints capped at 150 req/min
- **httpOnly Cookies Only**: JWT access+refresh tokens are exclusively stored in httpOnly cookies. All `localStorage` token storage removed from `Axios.js` and `Login.jsx`
- **Product Controller Whitelist**: `updateProductDetails` now uses explicit field whitelist instead of `...request.body` spread (prevents arbitrary field injection)
- **XSS in Print Template**: Admin order print function uses `esc()` HTML-escaping helper before interpolating any user data into `document.write()`
- **Console.log Gating**: All `console.log()` calls in server controllers gated behind `NODE_ENV !== 'production'` to prevent PII leakage in production logs
- **Vite CVE-2025-30208**: Upgraded Vite to 5.4.15 (path traversal patch)
- **Helmet**: Added `contentSecurityPolicy: false` flag to allow normal app operation; `crossOriginResourcePolicy: false` retained for image serving

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
- **Checkout**: Razorpay online payment + Cash on Delivery
- **Coupons**: Percentage/flat discounts, admin CRUD, user validation at checkout
- **Orders**:
  - Order List page (`/dashboard/myorders`) with stats, search, filters by status & payment
  - Order Details page (`/dashboard/order/:id`) with tracking timeline, price breakdown, address, payment info
  - Cancel order functionality (for non-delivered orders)
  - Order status tracking: Pending → Confirmed → Shipped → Out for Delivery → Delivered
  - Order model stores: orderStatus, quantity, discountAmt
- **Admin**: Category/subcategory/product management, coupon management

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

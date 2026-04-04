# Blinkit Clone - Full Stack E-Commerce App

## Overview
A full-stack quick-commerce (Blinkit Clone) application built with the MERN stack (MongoDB, Express, React, Node.js). Features user authentication, product/category management, admin panel, cart, orders, and Stripe payments.

## Architecture
- **Frontend**: React 18 + Vite (port 5000 in dev), Tailwind CSS, Redux Toolkit, React Router
- **Backend**: Express.js (port 8080 in dev), MongoDB/Mongoose, JWT auth, Cloudinary, Resend, Stripe

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
- `STRIPE_SECRET_KEY` — Stripe secret key
- `STRIPE_ENPOINT_WEBHOOK_SECRET_KEY` — Stripe webhook secret
- `FRONTEND_URL` — Frontend URL for CORS (set to Replit dev domain in shared env)

## Key Notes
- Vite dev server proxies `/api/*` requests to `http://localhost:8080`
- In production, the Express server serves the built React app from `client/dist`
- MongoDB Atlas must have network access open (0.0.0.0/0) to connect from Replit
- `VITE_BACKEND_URL` is intentionally empty — API calls use relative paths via Vite proxy

## Deployment
- Build: `cd client && npm install && npm run build`
- Run: `node server/index.js` (serves both API and built frontend on port 5000 in production)
- Target: autoscale

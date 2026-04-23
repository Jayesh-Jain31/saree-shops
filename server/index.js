import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import compression from 'compression'
import path from 'path'
import { fileURLToPath } from 'url'
import connectDB from './config/connectDB.js'
import userRouter from './route/user.route.js'
import categoryRouter from './route/category.route.js'
import uploadRouter from './route/upload.router.js'
import subCategoryRouter from './route/subCategory.route.js'
import productRouter from './route/product.route.js'
import cartRouter from './route/cart.route.js'
import addressRouter from './route/address.route.js'
import orderRouter from './route/order.route.js'
import couponRouter from './route/coupon.route.js'
import wishlistRouter from './route/wishlist.route.js'
import reviewRouter from './route/review.route.js'
import analyticsRouter from './route/analytics.route.js'
import deliveryZoneRouter from './route/deliveryZone.route.js'
import bannerRouter from './route/banner.route.js'
import returnRouter from './route/return.route.js'
import walletRouter from './route/wallet.route.js'
import shiprocketRouter from './route/shiprocket.route.js'
import settingsRouter from './route/settings.route.js'
import fraudRouter from './route/fraud.route.js'
import qaRouter from './route/qa.route.js'
import otpRouter from './route/otp.route.js'
import loyaltyRouter from './route/loyalty.route.js'
import bundleRouter from './route/bundle.route.js'
import magicCheckoutRouter from './route/magicCheckout.route.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.set('trust proxy', 1)

// ── Magic Checkout — open CORS before global CORS middleware ──────────
// Razorpay calls these routes from both their servers and browser popup.
// Must be registered BEFORE app.use(cors(...)) so global CORS never blocks them.
app.use('/api/magic-checkout', cors({ origin: '*', credentials: false }), express.json({ limit: '10mb' }), magicCheckoutRouter)

// ── Rate limiters (defined before use) ───────────────────────────────
const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 150,
    message: { message: 'Too many requests, please slow down', error: true, success: false },
    standardHeaders: true,
    legacyHeaders: false,
})

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Too many login attempts. Please try again after 15 minutes.', error: true, success: false },
    standardHeaders: true,
    legacyHeaders: false,
})

// ── Core middleware ───────────────────────────────────────────────────
// Gzip compress all responses for faster transfer
app.use(compression())
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'https://sareeshops.vercel.app',
    'http://localhost:5000',
    'http://localhost:3000',
].filter(Boolean)

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true)
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.replit.dev') || origin.endsWith('.razorpay.com')) {
            return callback(null, true)
        }
        return callback(new Error('Not allowed by CORS'))
    },
    credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())
app.use(morgan('combined'))
app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
}))
app.use(generalLimiter)

// ── Apply strict rate limiting to auth endpoints ──────────────────────
app.use('/api/user/login', authLimiter)
app.use('/api/user/register', authLimiter)
app.use('/api/user/forgot-password', authLimiter)
app.use('/api/user/verify-forgot-password-otp', authLimiter)

// ── API Routes ────────────────────────────────────────────────────────
app.use('/api/user', userRouter)
app.use('/api/category', categoryRouter)
app.use('/api/file', uploadRouter)
app.use('/api/subcategory', subCategoryRouter)
app.use('/api/product', productRouter)
app.use('/api/cart', cartRouter)
app.use('/api/address', addressRouter)
app.use('/api/order', orderRouter)
app.use('/api/coupon', couponRouter)
app.use('/api/wishlist', wishlistRouter)
app.use('/api/review', reviewRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/delivery-zone', deliveryZoneRouter)
app.use('/api/banner', bannerRouter)
app.use('/api/return', returnRouter)
app.use('/api/wallet', walletRouter)
app.use('/api/shiprocket', shiprocketRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/fraud', fraudRouter)
app.use('/api/qa', qaRouter)
app.use('/api/otp', otpRouter)
app.use('/api/loyalty', loyaltyRouter)
app.use('/api/bundle', bundleRouter)

app.get('/api/config/razorpay-key', (req, res) => {
    res.json({ keyId: process.env.RAZORPAY_KEY_ID })
})

// ── Static serving in production ──────────────────────────────────────
const PORT = process.env.PORT || 8080

app.get('/', (req, res) => {
    res.json({ message: "API is running 🚀" })
}) 

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log('Server is running', PORT)
    })
})

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

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

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
app.use(cors({
    credentials: true,
    origin: process.env.FRONTEND_URL,
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

app.get('/api/config/razorpay-key', (req, res) => {
    res.json({ keyId: process.env.RAZORPAY_KEY_ID })
})

// ── Static serving in production ──────────────────────────────────────
const PORT = process.env.PORT || 8080

if (process.env.NODE_ENV === 'production') {
    const clientDistPath = path.join(__dirname, '../client/dist')
    app.use(express.static(clientDistPath))
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientDistPath, 'index.html'))
    })
} else {
    app.get('/', (request, response) => {
        response.json({ message: 'Server is running ' + PORT })
    })
}

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log('Server is running', PORT)
    })
})

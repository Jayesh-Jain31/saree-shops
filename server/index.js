import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import helmet from 'helmet'
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

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(cors({
    credentials : true,
    origin : process.env.FRONTEND_URL
}))
app.use(express.json())
app.use(cookieParser())
app.use(morgan())
app.use(helmet({
    crossOriginResourcePolicy : false
}))

const PORT = process.env.PORT || 8080

app.use('/api/user',userRouter)
app.use("/api/category",categoryRouter)
app.use("/api/file",uploadRouter)
app.use("/api/subcategory",subCategoryRouter)
app.use("/api/product",productRouter)
app.use("/api/cart",cartRouter)
app.use("/api/address",addressRouter)
app.use('/api/order',orderRouter)
app.use('/api/coupon',couponRouter)
app.use('/api/wishlist',wishlistRouter)
app.use('/api/review',reviewRouter)
app.use('/api/analytics',analyticsRouter)

app.get('/api/config/razorpay-key', (req, res) => {
    res.json({ keyId: process.env.RAZORPAY_KEY_ID })
})

if (process.env.NODE_ENV === 'production') {
    const clientDistPath = path.join(__dirname, '../client/dist')
    app.use(express.static(clientDistPath))
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientDistPath, 'index.html'))
    })
} else {
    app.get("/",(request,response)=>{
        response.json({
            message : "Server is running " + PORT
        })
    })
}

connectDB().then(()=>{
    app.listen(PORT,()=>{
        console.log("Server is running",PORT)
    })
})

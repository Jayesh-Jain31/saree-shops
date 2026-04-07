import mongoose from "mongoose";
import dotenv from 'dotenv'
dotenv.config()

if(!process.env.MONGODB_URI){
    throw new Error("Please provide MONGODB_URI in the .env file")
}

async function ensureIndexes() {
    try {
        const db = mongoose.connection.db

        // Products — most queried collection
        await db.collection('products').createIndexes([
            { key: { category: 1 }, name: 'idx_products_category' },
            { key: { subCategory: 1 }, name: 'idx_products_subCategory' },
            { key: { publish: 1 }, name: 'idx_products_publish' },
            { key: { category: 1, publish: 1 }, name: 'idx_products_cat_pub' },
            { key: { stock: 1 }, name: 'idx_products_stock' },
        ])

        // Orders — frequently queried by userId and status
        await db.collection('orders').createIndexes([
            { key: { userId: 1, createdAt: -1 }, name: 'idx_orders_user_date' },
            { key: { orderStatus: 1 }, name: 'idx_orders_status' },
            { key: { orderId: 1 }, name: 'idx_orders_orderId', unique: false },
            { key: { createdAt: -1 }, name: 'idx_orders_date' },
        ])

        // Reviews — queried by productId and userId
        await db.collection('reviews').createIndexes([
            { key: { productId: 1 }, name: 'idx_reviews_product' },
            { key: { userId: 1 }, name: 'idx_reviews_user' },
            // Note: unique compound index may already exist with a different name — skip if so
        ])

        // Cart — queried by userId
        await db.collection('carts').createIndexes([
            { key: { userId: 1 }, name: 'idx_cart_user' },
        ])

        // Returns — queried by userId and status
        await db.collection('returns').createIndexes([
            { key: { userId: 1 }, name: 'idx_returns_user' },
            { key: { status: 1 }, name: 'idx_returns_status' },
        ])

        console.log("DB indexes ensured")
    } catch (err) {
        // Non-fatal — indexes are an optimization, not required for startup
        if (process.env.NODE_ENV !== 'production') console.log("Index setup error:", err.message)
    }
}

async function connectDB(){
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("connect DB")
        // Set up indexes in background (non-blocking)
        ensureIndexes()
    } catch (error) {
        console.log("Mongodb connect error", error)
        process.exit(1)
    }
}

export default connectDB

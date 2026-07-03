import mongoose from "mongoose";

const cartProductSchema = new mongoose.Schema({
    productId : {
        type : mongoose.Schema.ObjectId,
        ref : 'product'
    },
    quantity : {
        type : Number,
        default : 1
    },
    userId : {
        type : mongoose.Schema.ObjectId,
        ref : "User"
    },
    variant : {
        type : {
            name  : { type : String, default : '' },
            price : { type : Number, default : null },
            image : { type : String, default : '' }
        },
        default : null
    }
},{
    timestamps : true
})

cartProductSchema.index({ userId: 1, productId: 1, 'variant.name': 1 })

const CartProductModel = mongoose.model('cartProduct',cartProductSchema)

export default CartProductModel
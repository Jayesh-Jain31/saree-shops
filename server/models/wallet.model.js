import mongoose from "mongoose"

const transactionSchema = new mongoose.Schema({
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true },
    description: { type: String, default: '' },
    reference: { type: String, default: '' },
    balanceAfter: { type: Number, default: 0 }
}, { timestamps: true })

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    balance: { type: Number, default: 0 },
    transactions: [transactionSchema]
}, { timestamps: true })

const WalletModel = mongoose.model('Wallet', walletSchema)
export default WalletModel

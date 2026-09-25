import WalletModel from "../models/wallet.model.js"

export const getWallet = async (req, res) => {
    try {
        const userId = req.userId
        let wallet = await WalletModel.findOne({ userId })
        if (!wallet) {
            wallet = await WalletModel.create({ userId, balance: 0, transactions: [] })
        }
        return res.json({ data: wallet, error: false, success: true })
    } catch (err) {
        return res.status(500).json({ message: err.message || err, error: true, success: false })
    }
}

export const creditWallet = async (req, res) => {
    try {
        const { userId, amount, description, reference } = req.body
        if (!userId || !amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid credit request", error: true, success: false })
        }
        let wallet = await WalletModel.findOne({ userId })
        if (!wallet) wallet = await WalletModel.create({ userId, balance: 0, transactions: [] })

        wallet.balance += amount
        wallet.transactions.unshift({
            type: 'credit',
            amount,
            description: description || 'Wallet credit',
            reference: reference || '',
            balanceAfter: wallet.balance
        })
        await wallet.save()
        return res.json({ message: "Wallet credited", data: wallet, error: false, success: true })
    } catch (err) {
        return res.status(500).json({ message: err.message || err, error: true, success: false })
    }
}

export const debitWalletInternal = async (userId, amount, description, reference = '') => {
    const debitAmount = Number(Number(amount || 0).toFixed(2))
    if (debitAmount <= 0) return

    // Atomically reserve/debit the wallet balance. This prevents concurrent
    // checkout requests from spending the same balance twice.
    const wallet = await WalletModel.findOneAndUpdate(
        { userId, balance: { $gte: debitAmount } },
        { $inc: { balance: -debitAmount } },
        { new: true }
    )

    if (!wallet) throw new Error('Insufficient wallet balance')

    // Append the ledger entry without saving the stale wallet document back.
    // This avoids overwriting a newer balance if another wallet operation
    // happens between the debit and the ledger update.
    try {
        await WalletModel.updateOne(
            { _id: wallet._id },
            {
                $push: {
                    transactions: {
                        $each: [{
                            type: 'debit',
                            amount: debitAmount,
                            description: description || 'Order payment',
                            reference,
                            balanceAfter: Number(wallet.balance || 0)
                        }],
                        $position: 0
                    }
                }
            }
        )
    } catch (transactionErr) {
        console.error('[Wallet] Debit succeeded but transaction history update failed:', transactionErr.message)
    }

    return {
        amount: debitAmount,
        balanceAfter: Number(wallet.balance || 0)
    }
}

export const debitWallet = async (req, res) => {
    try {
        const userId = req.userId
        const { amount, description } = req.body
        const wallet = await WalletModel.findOne({ userId })
        if (!wallet || wallet.balance < amount) {
            return res.status(400).json({ message: "Insufficient wallet balance", error: true, success: false })
        }
        wallet.balance -= amount
        wallet.transactions.unshift({
            type: 'debit',
            amount,
            description: description || 'Wallet payment',
            reference: '',
            balanceAfter: wallet.balance
        })
        await wallet.save()
        return res.json({ message: "Wallet debited", data: wallet, error: false, success: true })
    } catch (err) {
        return res.status(500).json({ message: err.message || err, error: true, success: false })
    }
}

export const getWalletAdmin = async (req, res) => {
    try {
        const { userId } = req.params
        let wallet = await WalletModel.findOne({ userId })
        if (!wallet) wallet = { balance: 0, transactions: [] }
        return res.json({ data: wallet, error: false, success: true })
    } catch (err) {
        return res.status(500).json({ message: err.message || err, error: true, success: false })
    }
}

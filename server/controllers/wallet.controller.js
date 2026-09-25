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

    // Atomic balance check + debit. This prevents two simultaneous checkouts
    // from both reading the same wallet balance and spending it twice.
    const wallet = await WalletModel.findOneAndUpdate(
        {
            userId,
            balance: { $gte: debitAmount }
        },
        {
            $inc: { balance: -debitAmount }
        },
        { new: true }
    )

    if (!wallet) {
        throw new Error('Insufficient wallet balance')
    }

    // Record the transaction using the balance returned by the atomic update.
    // If transaction-history persistence fails, the debit itself remains valid.
    try {
        wallet.transactions.unshift({
            type: 'debit',
            amount: debitAmount,
            description: description || 'Order payment',
            reference,
            balanceAfter: Number(wallet.balance || 0)
        })
        await wallet.save()
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

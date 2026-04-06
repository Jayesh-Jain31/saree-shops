import { Router } from "express"
import auth from "../middleware/auth.js"
import { admin } from "../middleware/Admin.js"
import { getWallet, creditWallet, debitWallet, getWalletAdmin } from "../controllers/wallet.controller.js"

const walletRouter = Router()

walletRouter.get('/get', auth, getWallet)
walletRouter.post('/debit', auth, debitWallet)
walletRouter.post('/credit', creditWallet)
walletRouter.get('/admin/:userId', auth, admin, getWalletAdmin)

export default walletRouter

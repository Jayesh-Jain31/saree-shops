import { Router } from 'express'
import auth from '../middleware/auth.js'
import { admin } from '../middleware/Admin.js'
import {
    createBundle, getBundles, getBundleById,
    updateBundle, deleteBundle, getBundlesByProduct
} from '../controllers/bundle.controller.js'

const bundleRouter = Router()

bundleRouter.get('/', getBundles)
bundleRouter.get('/product/:productId', getBundlesByProduct)
bundleRouter.get('/:id', getBundleById)
bundleRouter.post('/', auth, admin, createBundle)
bundleRouter.put('/:id', auth, admin, updateBundle)
bundleRouter.delete('/:id', auth, admin, deleteBundle)

export default bundleRouter

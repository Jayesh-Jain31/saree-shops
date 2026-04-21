import BundleModel from '../models/bundle.model.js'
import ProductModel from '../models/product.model.js'

const populateProducts = (query) =>
    query.populate({ path: 'products.productId', select: 'name image price discount publish stock' })

export const createBundle = async (req, res) => {
    try {
        const { name, description, image, label, products, discountType, discountValue, displayOrder } = req.body
        if (!name || !products?.length) return res.status(400).json({ message: 'Name and products required', error: true, success: false })
        const bundle = await BundleModel.create({ name, description, image, label, products, discountType, discountValue, displayOrder })
        const populated = await populateProducts(BundleModel.findById(bundle._id))
        return res.json({ message: 'Bundle created', data: populated, error: false, success: true })
    } catch (e) { return res.status(500).json({ message: e.message, error: true, success: false }) }
}

export const getBundles = async (req, res) => {
    try {
        const { activeOnly = false } = req.query
        const filter = activeOnly === 'true' ? { active: true } : {}
        const bundles = await populateProducts(BundleModel.find(filter).sort({ displayOrder: 1, createdAt: -1 }))
        return res.json({ data: bundles, error: false, success: true })
    } catch (e) { return res.status(500).json({ message: e.message, error: true, success: false }) }
}

export const getBundleById = async (req, res) => {
    try {
        const bundle = await populateProducts(BundleModel.findById(req.params.id))
        if (!bundle) return res.status(404).json({ message: 'Bundle not found', error: true, success: false })
        return res.json({ data: bundle, error: false, success: true })
    } catch (e) { return res.status(500).json({ message: e.message, error: true, success: false }) }
}

export const updateBundle = async (req, res) => {
    try {
        const bundle = await BundleModel.findByIdAndUpdate(req.params.id, req.body, { new: true })
        if (!bundle) return res.status(404).json({ message: 'Bundle not found', error: true, success: false })
        const populated = await populateProducts(BundleModel.findById(bundle._id))
        return res.json({ message: 'Bundle updated', data: populated, error: false, success: true })
    } catch (e) { return res.status(500).json({ message: e.message, error: true, success: false }) }
}

export const deleteBundle = async (req, res) => {
    try {
        await BundleModel.findByIdAndDelete(req.params.id)
        return res.json({ message: 'Bundle deleted', error: false, success: true })
    } catch (e) { return res.status(500).json({ message: e.message, error: true, success: false }) }
}

export const getBundlesByProduct = async (req, res) => {
    try {
        const { productId } = req.params
        const bundles = await populateProducts(
            BundleModel.find({ active: true, 'products.productId': productId })
        )
        return res.json({ data: bundles, error: false, success: true })
    } catch (e) { return res.status(500).json({ message: e.message, error: true, success: false }) }
}

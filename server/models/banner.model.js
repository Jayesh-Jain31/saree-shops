import mongoose from 'mongoose'

const bannerSchema = new mongoose.Schema({
    title: { type: String, default: '' },
    image: { type: String, required: true },
    imageMobile: { type: String, default: '' },
    link: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
}, { timestamps: true })

const BannerModel = mongoose.model('Banner', bannerSchema)

export default BannerModel

import mongoose from 'mongoose'

const slideSchema = new mongoose.Schema({
    image: { type: String, required: true },
    imageMobile: { type: String, default: '' },
    title: { type: String, default: '' },
    link: { type: String, default: '' },
}, { _id: false })

const bannerSchema = new mongoose.Schema({
    title: { type: String, default: '' },
    slides: { type: [slideSchema], default: [] },
    image: { type: String, default: '' },
    imageMobile: { type: String, default: '' },
    link: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
}, { timestamps: true })

const BannerModel = mongoose.model('Banner', bannerSchema)

export default BannerModel

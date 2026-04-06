import BannerModel from '../models/banner.model.js'

export async function getBannersController(request, response) {
    try {
        const banners = await BannerModel.find({ isActive: true }).sort({ displayOrder: 1, createdAt: -1 })
        return response.json({ message: 'Banners', data: banners, error: false, success: true })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

export async function getAllBannersAdminController(request, response) {
    try {
        const banners = await BannerModel.find().sort({ displayOrder: 1, createdAt: -1 })
        return response.json({ message: 'All banners', data: banners, error: false, success: true })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

export async function createBannerController(request, response) {
    try {
        const { title, slides, image, imageMobile, link, isActive, displayOrder } = request.body

        // Support both slides array (new) and single image (legacy)
        const hasSlides = Array.isArray(slides) && slides.length > 0
        if (!hasSlides && !image) {
            return response.status(400).json({ message: 'At least one image is required', error: true, success: false })
        }

        const count = await BannerModel.countDocuments()
        const banner = new BannerModel({
            title: title || '',
            slides: hasSlides ? slides : [],
            image: image || '',
            imageMobile: imageMobile || '',
            link: link || '',
            isActive: isActive !== undefined ? isActive : true,
            displayOrder: displayOrder !== undefined ? displayOrder : count,
        })
        await banner.save()
        return response.json({ message: 'Banner created', data: banner, error: false, success: true })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

export async function updateBannerController(request, response) {
    try {
        const { id } = request.params
        const { title, slides, image, imageMobile, link, isActive, displayOrder } = request.body
        const banner = await BannerModel.findByIdAndUpdate(
            id,
            { title, slides, image, imageMobile, link, isActive, displayOrder },
            { new: true }
        )
        if (!banner) {
            return response.status(404).json({ message: 'Banner not found', error: true, success: false })
        }
        return response.json({ message: 'Banner updated', data: banner, error: false, success: true })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

export async function deleteBannerController(request, response) {
    try {
        const { id } = request.params
        const banner = await BannerModel.findByIdAndDelete(id)
        if (!banner) {
            return response.status(404).json({ message: 'Banner not found', error: true, success: false })
        }
        return response.json({ message: 'Banner deleted', error: false, success: true })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

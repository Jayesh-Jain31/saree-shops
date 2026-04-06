import SettingsModel from '../models/settings.model.js'

export async function getSettingsController(request, response) {
    try {
        const settings = await SettingsModel.find({})
        const result = {}
        settings.forEach(s => { result[s.key] = s.value })
        return response.json({ data: result, error: false, success: true })
    } catch (error) {
        return response.status(500).json({ message: error.message, error: true, success: false })
    }
}

export async function updateSettingController(request, response) {
    try {
        const { key, value } = request.body
        if (!key) return response.status(400).json({ message: 'key is required', error: true, success: false })

        const setting = await SettingsModel.findOneAndUpdate(
            { key },
            { value },
            { upsert: true, new: true }
        )

        return response.json({ message: 'Setting saved', data: setting, error: false, success: true })
    } catch (error) {
        return response.status(500).json({ message: error.message, error: true, success: false })
    }
}

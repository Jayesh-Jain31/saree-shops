import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: String, default: '' },
}, { timestamps: true })

const SettingsModel = mongoose.model('Settings', settingsSchema)
export default SettingsModel

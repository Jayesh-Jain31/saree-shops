import QAModel from '../models/qa.model.js'

export async function askQuestionController(req, res) {
    try {
        const userId = req.userId
        const { productId, question } = req.body
        if (!productId || !question?.trim()) {
            return res.status(400).json({ message: 'productId and question are required', error: true, success: false })
        }
        const qa = await QAModel.create({ productId, userId, question: question.trim() })
        await qa.populate('userId', 'name avatar')
        return res.json({ message: 'Question submitted', data: qa, success: true, error: false })
    } catch (error) {
        return res.status(500).json({ message: error.message, error: true, success: false })
    }
}

export async function getProductQAController(req, res) {
    try {
        const { productId } = req.query
        if (!productId) return res.status(400).json({ message: 'productId required', error: true, success: false })
        const qaList = await QAModel.find({ productId })
            .sort({ createdAt: -1 })
            .populate('userId', 'name avatar')
            .lean()
        return res.json({ data: qaList, success: true, error: false })
    } catch (error) {
        return res.status(500).json({ message: error.message, error: true, success: false })
    }
}

export async function answerQuestionController(req, res) {
    try {
        const { qaId } = req.params
        const { answer } = req.body
        if (!answer?.trim()) return res.status(400).json({ message: 'Answer required', error: true, success: false })
        const qa = await QAModel.findByIdAndUpdate(
            qaId,
            { answer: answer.trim(), answeredAt: new Date() },
            { new: true }
        ).populate('userId', 'name avatar')
        if (!qa) return res.status(404).json({ message: 'Q&A not found', error: true, success: false })
        return res.json({ message: 'Answer saved', data: qa, success: true, error: false })
    } catch (error) {
        return res.status(500).json({ message: error.message, error: true, success: false })
    }
}

export async function deleteQAController(req, res) {
    try {
        const { qaId } = req.params
        await QAModel.findByIdAndDelete(qaId)
        return res.json({ message: 'Deleted', success: true, error: false })
    } catch (error) {
        return res.status(500).json({ message: error.message, error: true, success: false })
    }
}

export async function getPendingQAController(req, res) {
    try {
        const pending = await QAModel.find({ answer: null })
            .sort({ createdAt: -1 })
            .populate('userId', 'name')
            .populate('productId', 'name image')
            .lean()
        return res.json({ data: pending, success: true, error: false })
    } catch (error) {
        return res.status(500).json({ message: error.message, error: true, success: false })
    }
}

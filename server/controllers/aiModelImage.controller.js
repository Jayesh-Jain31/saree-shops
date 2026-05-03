import { GoogleGenerativeAI } from '@google/generative-ai'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET_KEY
})

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function generateAiModelImage(req, res) {
    try {
        const { imageUrl } = req.body
        if (!imageUrl) return res.status(400).json({ message: 'imageUrl required', error: true, success: false })

        // Fetch the product image
        const imgRes = await fetch(imageUrl)
        if (!imgRes.ok) throw new Error('Could not fetch the image from URL')
        const imgBuffer = await imgRes.arrayBuffer()
        const base64Image = Buffer.from(imgBuffer).toString('base64')
        const rawMime = imgRes.headers.get('content-type') || 'image/jpeg'
        const mimeType = rawMime.split(';')[0]

        console.log('[AI Model Image] Sending to Gemini, mime:', mimeType)

        // Call Gemini image generation with the saree photo as input
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp-image-generation',
            generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
        })

        const result = await model.generateContent([
            {
                text: `You are a professional fashion photographer. The attached image shows a saree product. 
Generate a high-quality fashion photograph of a beautiful Indian woman elegantly wearing this exact saree. 
Requirements:
- Preserve the exact colors, patterns, borders, and fabric design from the saree in the image
- Drape the saree in traditional Indian style
- Full body shot, the model standing gracefully
- Clean white studio background with soft, professional lighting
- The model should look natural and elegant
- High resolution, professional e-commerce product photography style`
            },
            {
                inlineData: { mimeType, data: base64Image }
            }
        ])

        // Extract generated image from response
        const parts = result.response.candidates?.[0]?.content?.parts || []
        let generatedBase64 = null
        let generatedMime = 'image/png'

        for (const part of parts) {
            if (part.inlineData) {
                generatedBase64 = part.inlineData.data
                generatedMime = part.inlineData.mimeType || 'image/png'
                break
            }
        }

        if (!generatedBase64) {
            const textPart = parts.find(p => p.text)
            console.warn('[AI Model Image] No image in response. Text:', textPart?.text || 'none')
            return res.status(500).json({
                message: 'AI could not generate the model image. Try a clearer product photo.',
                error: true, success: false
            })
        }

        // Upload generated image to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload(
                `data:${generatedMime};base64,${generatedBase64}`,
                { folder: 'binkeyit/ai-model', transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
                (err, result) => { if (err) return reject(err); resolve(result) }
            )
        })

        console.log('[AI Model Image] Success →', uploadResult.secure_url)

        return res.json({
            message: 'AI model image generated!',
            data: { url: uploadResult.secure_url },
            success: true, error: false
        })
    } catch (err) {
        console.error('[AI Model Image] Error:', err.message)
        return res.status(500).json({ message: err.message || 'Failed to generate model image', error: true, success: false })
    }
}

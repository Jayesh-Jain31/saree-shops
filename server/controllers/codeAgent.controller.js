import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CLIENT_SRC = path.resolve(__dirname, '..', '..', 'client', 'src')

function getGenAI() {
    if (!process.env.GEMINI_API_KEY) return null
    return new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
}

function getEditableFiles(dir = CLIENT_SRC, base = CLIENT_SRC, results = []) {
    let items
    try { items = fs.readdirSync(dir) } catch { return results }
    for (const item of items) {
        if (['node_modules', '.git', 'dist', 'assets'].includes(item)) continue
        const full = path.join(dir, item)
        const stat = fs.statSync(full)
        if (stat.isDirectory()) {
            getEditableFiles(full, base, results)
        } else if (/\.(jsx?|css)$/.test(item) && !item.includes('.min.')) {
            results.push(path.relative(base, full))
        }
    }
    return results
}

export async function listFiles(req, res) {
    try {
        const files = getEditableFiles()
        return res.json({ success: true, files })
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message })
    }
}

export async function suggestEdit(req, res) {
    try {
        const { instruction, targetFile } = req.body
        if (!instruction?.trim()) {
            return res.status(400).json({ success: false, message: 'Instruction required' })
        }

        const genAI = getGenAI()
        if (!genAI) {
            return res.status(503).json({ success: false, message: 'GEMINI_API_KEY not configured. Please add it in Secrets.' })
        }

        const files = getEditableFiles()
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        let selectedFile = targetFile

        if (!selectedFile) {
            const fileSelectPrompt = `You are a code-editing assistant for a React e-commerce saree shop app.

User instruction: "${instruction}"

Available files in client/src/ (pick the single most relevant one):
${files.join('\n')}

Reply with ONLY the file path relative to client/src/, nothing else. No explanation, no backticks.
Example reply: pages/Home.jsx`

            const fileResult = await model.generateContent(fileSelectPrompt)
            selectedFile = fileResult.response.text().trim().replace(/^(client\/src\/|src\/)/, '').replace(/`/g, '').trim()
        }

        if (!files.includes(selectedFile)) {
            return res.status(400).json({ success: false, message: `Could not identify the right file to edit. Try specifying it manually.`, availableFiles: files })
        }

        const filePath = path.join(CLIENT_SRC, selectedFile)
        const originalContent = fs.readFileSync(filePath, 'utf-8')

        const editPrompt = `You are a code-editing AI assistant. Edit the following file to fulfill the user's request.

User request: "${instruction}"

File path: client/src/${selectedFile}
File content:
${originalContent}

Rules:
- Return ONLY the complete modified file content — no explanation, no markdown, no code fences
- Preserve all existing imports, logic, and functionality unless explicitly asked to change them
- Make only the minimal targeted changes needed
- Keep the same code style, indentation, and conventions
- Do NOT add comments explaining your changes`

        const editResult = await model.generateContent(editPrompt)
        let modifiedContent = editResult.response.text().trim()

        // Strip any markdown code fences if AI included them
        modifiedContent = modifiedContent
            .replace(/^```[\w]*\r?\n/, '')
            .replace(/\r?\n```$/, '')

        // Generate a plain-English summary of changes
        const summaryPrompt = `In 1-2 short sentences, describe what changed in this code edit for a non-technical user.
User instruction was: "${instruction}"
Reply with ONLY the summary, no preamble.`
        const summaryResult = await model.generateContent(summaryPrompt)
        const summary = summaryResult.response.text().trim()

        return res.json({
            success: true,
            file: selectedFile,
            original: originalContent,
            modified: modifiedContent,
            summary,
        })
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[CodeAgent] suggest error:', err.message)
        return res.status(500).json({ success: false, message: err.message || 'AI agent failed. Check your Gemini API key.' })
    }
}

export async function applyEdit(req, res) {
    try {
        const { file, content } = req.body
        if (!file || content === undefined) {
            return res.status(400).json({ success: false, message: 'file and content are required' })
        }

        // Security: strip path traversal, only allow client/src files
        const safe = path.normalize(file).replace(/^(\.\.(\/|\\|$))+/, '')
        const filePath = path.join(CLIENT_SRC, safe)
        if (!filePath.startsWith(CLIENT_SRC + path.sep) && filePath !== CLIENT_SRC) {
            return res.status(403).json({ success: false, message: 'Access denied: only client/src files can be edited' })
        }

        fs.writeFileSync(filePath, content, 'utf-8')

        return res.json({ success: true, message: `✅ Applied changes to client/src/${safe}` })
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[CodeAgent] apply error:', err.message)
        return res.status(500).json({ success: false, message: err.message })
    }
}

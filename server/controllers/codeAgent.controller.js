import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CLIENT_SRC = path.resolve(__dirname, '..', '..', 'client', 'src')

// In-memory backup store: filePath -> { content, instruction }
const backupStore = new Map()

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

function detectIntent(instruction) {
    const lower = instruction.toLowerCase()
    const isCreate = /\b(create|add|build|make)\b.*(new\s+)?(page|component|section|feature|screen)\b/.test(lower)
        || /\bnew\s+(page|component|section)\b/.test(lower)
    const isRedesign = /\b(redesign|rebuild|rewrite|revamp|redo|restyle|overhaul|completely\s+change|makeover)\b/.test(lower)
    return { isCreate, isRedesign }
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

        const { isCreate, isRedesign } = detectIntent(instruction)
        const files = getEditableFiles()
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        let selectedFile = targetFile
        let isNewFile = false
        let newFilePath = null

        if (!selectedFile) {
            if (isCreate) {
                // Ask AI to decide: edit existing or create new file
                const decidePrompt = `You are a React code assistant for a Blinkit-clone e-commerce app (React + Vite + Tailwind CSS).

User instruction: "${instruction}"

Available files in client/src/:
${files.join('\n')}

Should you CREATE a new file or EDIT an existing one to fulfill this request?
If creating a new file, reply: CREATE:pages/NewPageName.jsx  (use a logical path relative to client/src/)
If editing an existing file, reply: EDIT:path/to/file.jsx  (must be from the list above)

Reply with ONLY one line in that exact format.`

                const decideResult = await model.generateContent(decidePrompt)
                const decision = decideResult.response.text().trim()

                if (decision.startsWith('CREATE:')) {
                    newFilePath = decision.replace('CREATE:', '').trim()
                    isNewFile = true
                    selectedFile = newFilePath
                } else {
                    selectedFile = decision.replace('EDIT:', '').trim().replace(/^(client\/src\/|src\/)/, '').replace(/`/g, '')
                }
            } else {
                // Regular edit: auto-detect file
                const fileSelectPrompt = `You are a code-editing assistant for a React e-commerce saree shop app.

User instruction: "${instruction}"

Available files in client/src/ (pick the single most relevant one):
${files.join('\n')}

Reply with ONLY the file path relative to client/src/, nothing else. No explanation, no backticks.
Example reply: pages/Home.jsx`

                const fileResult = await model.generateContent(fileSelectPrompt)
                selectedFile = fileResult.response.text().trim().replace(/^(client\/src\/|src\/)/, '').replace(/`/g, '').trim()
            }
        }

        // For edits, file must exist in our list
        if (!isNewFile && !files.includes(selectedFile)) {
            return res.status(400).json({
                success: false,
                message: `Could not identify the right file. Try selecting it manually from the dropdown.`,
                availableFiles: files
            })
        }

        const filePath = path.join(CLIENT_SRC, selectedFile)
        let originalContent = ''

        if (!isNewFile) {
            originalContent = fs.readFileSync(filePath, 'utf-8')
        }

        // Build the AI prompt based on intent
        let editPrompt
        if (isNewFile) {
            editPrompt = `You are a senior React developer building a Blinkit-clone e-commerce app.
The app uses: React 18, Vite, Tailwind CSS, React Router, Redux Toolkit, React Hot Toast, React Icons.
Design style: clean, modern, mobile-first, similar to Blinkit/quick-commerce apps.

User request: "${instruction}"

Create the file: client/src/${selectedFile}

Rules:
- Return ONLY the complete file content — no explanation, no markdown, no code fences
- Use React functional components with hooks
- Use Tailwind CSS for all styling
- Make it look professional and polished with good UI/UX
- Import from react, react-router-dom, react-icons, react-redux as needed
- Use consistent code style (2-space indent, single quotes)
- Do NOT add comments explaining your code`
        } else if (isRedesign) {
            editPrompt = `You are a senior React developer and UI/UX designer.
The app is a Blinkit-clone e-commerce app using React 18, Vite, Tailwind CSS, React Router, Redux Toolkit, React Icons.
Design style: clean, modern, mobile-first.

User request: "${instruction}"

Current file (client/src/${selectedFile}):
${originalContent}

Rules:
- Return ONLY the complete redesigned file content — no explanation, no markdown, no code fences
- You MAY completely rewrite the layout, styling and structure — this is a redesign
- Keep all existing logic, state, API calls, and functionality working correctly
- Make it look significantly better and more modern using Tailwind CSS
- Keep the same imports and hooks — just improve the visual design
- Do NOT add comments explaining your changes`
        } else {
            editPrompt = `You are a code-editing AI assistant for a React e-commerce app.

User request: "${instruction}"

File path: client/src/${selectedFile}
File content:
${originalContent}

Rules:
- Return ONLY the complete modified file content — no explanation, no markdown, no code fences
- Preserve all existing imports, logic, and functionality unless explicitly asked to change them
- Make only the targeted changes needed to fulfill the request
- Keep the same code style, indentation, and conventions
- Do NOT add comments explaining your changes`
        }

        const editResult = await model.generateContent(editPrompt)
        let modifiedContent = editResult.response.text().trim()

        // Strip markdown code fences if AI included them
        modifiedContent = modifiedContent
            .replace(/^```[\w]*\r?\n/, '')
            .replace(/\r?\n```$/, '')
            .replace(/^```[\w]*\n/, '')
            .replace(/\n```$/, '')

        // Generate a plain-English summary
        const summaryPrompt = `In 1-2 short sentences, describe what this AI code change does, for a non-technical user.
User asked: "${instruction}"
Action taken: ${isNewFile ? 'Created new file' : isRedesign ? 'Redesigned existing page' : 'Edited existing file'} client/src/${selectedFile}
Reply with ONLY the summary, no preamble.`
        const summaryResult = await model.generateContent(summaryPrompt)
        const summary = summaryResult.response.text().trim()

        return res.json({
            success: true,
            file: selectedFile,
            original: originalContent,
            modified: modifiedContent,
            summary,
            isNewFile,
            isRedesign,
        })
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[CodeAgent] suggest error:', err.message)
        return res.status(500).json({ success: false, message: err.message || 'AI agent failed. Check your Gemini API key.' })
    }
}

export async function applyEdit(req, res) {
    try {
        const { file, content, original } = req.body
        if (!file || content === undefined) {
            return res.status(400).json({ success: false, message: 'file and content are required' })
        }

        const safe = path.normalize(file).replace(/^(\.\.(\/|\\|$))+/, '')
        const filePath = path.join(CLIENT_SRC, safe)
        if (!filePath.startsWith(CLIENT_SRC + path.sep) && filePath !== CLIENT_SRC) {
            return res.status(403).json({ success: false, message: 'Access denied: only client/src files can be edited' })
        }

        // Backup original content before overwriting
        const isNewFile = !fs.existsSync(filePath)
        const backupContent = isNewFile ? null : (original ?? fs.readFileSync(filePath, 'utf-8'))
        backupStore.set(safe, { content: backupContent, isNewFile })

        // Create parent directories if needed (for new files)
        fs.mkdirSync(path.dirname(filePath), { recursive: true })
        fs.writeFileSync(filePath, content, 'utf-8')

        return res.json({
            success: true,
            message: `✅ ${isNewFile ? 'Created' : 'Applied changes to'} client/src/${safe}`,
            canUndo: true,
            isNewFile,
        })
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[CodeAgent] apply error:', err.message)
        return res.status(500).json({ success: false, message: err.message })
    }
}

export async function undoEdit(req, res) {
    try {
        const { file } = req.body
        if (!file) return res.status(400).json({ success: false, message: 'file is required' })

        const safe = path.normalize(file).replace(/^(\.\.(\/|\\|$))+/, '')
        const backup = backupStore.get(safe)

        if (!backup) {
            return res.status(404).json({ success: false, message: 'No backup found for this file. Cannot undo.' })
        }

        const filePath = path.join(CLIENT_SRC, safe)

        if (backup.isNewFile) {
            // File was newly created — delete it on undo
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
            backupStore.delete(safe)
            return res.json({ success: true, message: `↩️ Deleted newly created file client/src/${safe}` })
        }

        fs.writeFileSync(filePath, backup.content, 'utf-8')
        backupStore.delete(safe)
        return res.json({ success: true, message: `↩️ Reverted client/src/${safe} to previous version` })
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[CodeAgent] undo error:', err.message)
        return res.status(500).json({ success: false, message: err.message })
    }
}

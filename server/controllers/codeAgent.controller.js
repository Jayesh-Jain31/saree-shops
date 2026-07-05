import { GoogleGenerativeAI } from '@google/generative-ai'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CLIENT_SRC = path.resolve(__dirname, '..', '..', 'client', 'src')

// ── Session store ─────────────────────────────────────────────────────────────
// sessions[id] = {
//   messages: [{ role, text, changesApplied?, timestamp }],
//   changeStack: [{ id, file, before, isNewFile, instruction, timestamp }]
// }
const sessions = new Map()

function getSession(sessionId) {
    if (!sessionId || !sessions.has(sessionId)) return null
    return sessions.get(sessionId)
}

function createSession() {
    const id = randomUUID()
    sessions.set(id, { messages: [], changeStack: [] })
    return id
}

// ── File helpers ──────────────────────────────────────────────────────────────
function getEditableFiles(dir = CLIENT_SRC, base = CLIENT_SRC, results = []) {
    let items
    try { items = fs.readdirSync(dir) } catch { return results }
    for (const item of items) {
        if (['node_modules', '.git', 'dist', 'assets'].includes(item)) continue
        const full = path.join(dir, item)
        const stat = fs.statSync(full)
        if (stat.isDirectory()) getEditableFiles(full, base, results)
        else if (/\.(jsx?|css)$/.test(item) && !item.includes('.min.')) results.push(path.relative(base, full))
    }
    return results
}

function safeReadFile(relPath) {
    try {
        const full = path.join(CLIENT_SRC, relPath)
        if (!full.startsWith(CLIENT_SRC)) return null
        const content = fs.readFileSync(full, 'utf-8')
        // Cap at 12000 chars to avoid token overflow
        return content.length > 12000 ? content.slice(0, 12000) + '\n// ... (truncated for context)' : content
    } catch { return null }
}

function genGemini() {
    if (!process.env.GEMINI_API_KEY) return null
    return new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
}

function genClaude() {
    if (!process.env.ANTHROPIC_API_KEY) return null
    return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

// ── App context for AI ────────────────────────────────────────────────────────
const APP_CONTEXT = `You are an expert React developer working inside a Blinkit-clone quick-commerce e-commerce app.

Tech stack:
- React 18 + Vite, Tailwind CSS (utility-first styling), React Router v6
- Redux Toolkit (state management), React Hot Toast (notifications)
- React Icons (import from react-icons/fi, react-icons/md, react-icons/fa, react-icons/hi, react-icons/bi)
- Axios for API calls (import from '../utils/Axios'), SummaryApi for endpoint definitions
- Backend: Express + MongoDB (APIs at /api/*)

Design style: Clean, modern, mobile-first, pink/red primary color (#f43f5e), similar to Blinkit/Zepto UI.
Code style: 2-space indentation, single quotes, no semicolons in JSX where avoidable.`

// ── Endpoints ─────────────────────────────────────────────────────────────────
export async function newSession(req, res) {
    const id = createSession()
    return res.json({ success: true, sessionId: id })
}

export async function getSessionData(req, res) {
    const session = getSession(req.params.id)
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' })
    return res.json({ success: true, session })
}

export async function listFiles(req, res) {
    try {
        return res.json({ success: true, files: getEditableFiles() })
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message })
    }
}

export async function chat(req, res) {
    try {
        const { sessionId, message, imageBase64, imageMimeType, model } = req.body
        if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message is required' })

        // ── Select AI model ─────────────────────────────────
        const useClaude = model === 'claude'
        let aiClient = null
        let aiProvider = ''

        if (useClaude) {
            aiClient = genClaude()
            aiProvider = 'claude'
            if (!aiClient) return res.status(503).json({ success: false, message: 'ANTHROPIC_API_KEY not set. Add it in Secrets to use Claude.' })
        } else {
            aiClient = genGemini()
            aiProvider = 'gemini'
            if (!aiClient) return res.status(503).json({ success: false, message: 'GEMINI_API_KEY not set. Add it in Secrets to use Gemini.' })
        }

        // Get or auto-create session
        let sid = sessionId
        if (!sid || !sessions.has(sid)) {
            sid = createSession()
        }
        const session = sessions.get(sid)

        const allFiles = getEditableFiles()

        const historyContext = session.messages.length > 0
            ? `\nConversation so far:\n${session.messages.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'Agent'}: ${m.text}`).join('\n')}`
            : ''

        const changeContext = session.changeStack.length > 0
            ? `\nFiles already modified this session:\n${session.changeStack.map(c => `- client/src/${c.file} (${c.instruction})`).join('\n')}`
            : ''

        // ── PASS 1: Which files does the AI need to read? ──────────────────
        const fileSelectPrompt = `${APP_CONTEXT}${historyContext}${changeContext}

Available files in client/src/:
${allFiles.join('\n')}

User request: "${message}"

Which files do you need to READ to fulfill this request? Also, will you need to CREATE any new files?
Reply with ONLY a JSON object like this (no markdown, no explanation):
{
  "read": ["pages/ProductPage.jsx", "components/ProductCard.jsx"],
  "create": ["pages/AboutUs.jsx"]
}
If no files needed, use empty arrays. Max 5 files to read.`

        let fileSelectText = ''

        if (aiProvider === 'gemini') {
            const geminiModel = aiClient.getGenerativeModel({ model: 'gemini-2.5-flash' })
            const parts = [{ text: fileSelectPrompt }]
            if (imageBase64 && imageMimeType) {
                parts.unshift({ inlineData: { data: imageBase64, mimeType: imageMimeType } })
            }
            const result = await geminiModel.generateContent({ contents: [{ role: 'user', parts }] })
            fileSelectText = result.response.text().trim()
        } else {
            // Claude
            const content = [{ type: 'text', text: fileSelectPrompt }]
            if (imageBase64 && imageMimeType) {
                const mediaType = imageMimeType.startsWith('image/') ? imageMimeType : `image/${imageMimeType}`
                content.unshift({ type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } })
            }
            const result = await aiClient.messages.create({
                model: 'claude-sonnet-5',
                max_tokens: 2048,
                messages: [{ role: 'user', content }]
            })
            fileSelectText = (result.content[0]?.text || '').trim()
        }

        fileSelectText = fileSelectText.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '')

        let filesToRead = []
        let filesToCreate = []
        try {
            const parsed = JSON.parse(fileSelectText)
            filesToRead = (parsed.read || []).filter(f => allFiles.includes(f)).slice(0, 5)
            filesToCreate = parsed.create || []
        } catch { /* ignore, proceed with empty */ }

        // Read the selected files
        const fileContents = {}
        for (const f of filesToRead) {
            const content = safeReadFile(f)
            if (content !== null) fileContents[f] = content
        }

        // ── PASS 2: Generate the actual changes ────────────────────────────
        const fileContentBlock = Object.entries(fileContents).map(([f, c]) =>
            `=== client/src/${f} ===\n${c}`
        ).join('\n\n')

        const editPrompt = `${APP_CONTEXT}${historyContext}${changeContext}

${fileContentBlock ? `Current file contents:\n${fileContentBlock}\n\n` : ''}User request: "${message}"

${filesToCreate.length > 0 ? `You will CREATE these new files: ${filesToCreate.join(', ')}\n` : ''}

Instructions:
1. Analyze the request carefully. If it mentions an error or bug, find and fix it.
2. Make all necessary changes across multiple files if needed.
3. For redesign/rebuild requests, do a full professional rewrite of the UI.
4. For new page/component requests, create complete, polished code.
5. Return a JSON object between <AGENT_RESPONSE> and </AGENT_RESPONSE> tags:

<AGENT_RESPONSE>
{
  "explanation": "Clear explanation of what you are doing and why (2-4 sentences, friendly tone)",
  "changes": [
    {
      "file": "relative/path/from/client-src.jsx",
      "action": "edit",
      "description": "Brief description of what changed in this file",
      "content": "...complete file content..."
    }
  ]
}
</AGENT_RESPONSE>

Action must be "edit" (modify existing) or "create" (new file). Always return the COMPLETE file content.
If you cannot fulfill the request, return changes: [] and explain why in the explanation.`

        let editText = ''

        if (aiProvider === 'gemini') {
            const geminiModel = aiClient.getGenerativeModel({ model: 'gemini-2.5-flash' })
            const parts = [{ text: editPrompt }]
            if (imageBase64 && imageMimeType) {
                parts.unshift({ inlineData: { data: imageBase64, mimeType: imageMimeType } })
            }
            const result = await geminiModel.generateContent({ contents: [{ role: 'user', parts }] })
            editText = result.response.text()
        } else {
            // Claude
            const content = [{ type: 'text', text: editPrompt }]
            if (imageBase64 && imageMimeType) {
                const mediaType = imageMimeType.startsWith('image/') ? imageMimeType : `image/${imageMimeType}`
                content.unshift({ type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } })
            }
            const result = await aiClient.messages.create({
                model: 'claude-sonnet-5',
                max_tokens: 8192,
                messages: [{ role: 'user', content }]
            })
            editText = result.content[0]?.text || ''
        }

        // Extract JSON from tags
const match = editText.match(/<AGENT_RESPONSE>([\s\S]*?)<\/AGENT_RESPONSE>/)

let agentData

if (match) {
  try {
    agentData = JSON.parse(match[1].trim())
  } catch (e) {
    agentData = null
  }
} else {
  try {
    let cleaned = editText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/, '')
      .trim()

    const first = cleaned.indexOf('{')
    const last = cleaned.lastIndexOf('}')

    if (first !== -1 && last !== -1) {
      cleaned = cleaned.slice(first, last + 1)
    }

    agentData = JSON.parse(cleaned)
  } catch (e) {
    return res.json({
      success: true,
      sessionId: sid,
      explanation: editText || 'AI returned an invalid response.',
      changes: []
    })
  }
}

if (!agentData) {
  return res.json({
    success: true,
    sessionId: sid,
    explanation: editText || 'AI returned an invalid response.',
    changes: []
  })
}

        let agentData
        try {
            const jsonStr = match ? match[1].trim() : editText
            agentData = JSON.parse(jsonStr)
        } catch {
            return res.json({
                success: true,
                sessionId: sid,
                explanation: 'I generated a response but could not parse it. Please try again.',
                changes: [],
            })
        }

        // Validate + enrich changes with original content
        const enrichedChanges = []
        for (const change of (agentData.changes || [])) {
            if (!change.file || !change.content) continue
            const safe = path.normalize(change.file).replace(/^(\.\.(\/|\\|$))+/, '')
            const fullPath = path.join(CLIENT_SRC, safe)
            if (!fullPath.startsWith(CLIENT_SRC)) continue

            const exists = fs.existsSync(fullPath)
            const original = exists ? (fs.readFileSync(fullPath, 'utf-8') || '') : ''

            // Clean content
            let content = change.content.trim()
            content = content.replace(/^```[\w]*\r?\n/, '').replace(/\r?\n```$/, '').replace(/^```[\w]*\n/, '').replace(/\n```$/, '')

            enrichedChanges.push({
                file: safe,
                action: exists ? 'edit' : 'create',
                description: change.description || '',
                content,
                original,
                isNewFile: !exists,
            })
        }

        // Store user message in session
        session.messages.push({
            role: 'user',
            text: message,
            hasImage: !!imageBase64,
            timestamp: new Date().toISOString(),
        })

        return res.json({
            success: true,
            sessionId: sid,
            explanation: agentData.explanation || 'Here are the proposed changes:',
            changes: enrichedChanges,
        })
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[CodeAgent] chat error:', err)
        return res.status(500).json({ success: false, message: err.message || 'AI agent failed' })
    }
}

export async function applyBatch(req, res) {
    try {
        const { sessionId, changes, instruction } = req.body
        if (!Array.isArray(changes) || changes.length === 0) {
            return res.status(400).json({ success: false, message: 'No changes to apply' })
        }

        const session = getSession(sessionId)
        const applied = []

        for (const change of changes) {
            const safe = path.normalize(change.file).replace(/^(\.\.(\/|\\|$))+/, '')
            const fullPath = path.join(CLIENT_SRC, safe)
            if (!fullPath.startsWith(CLIENT_SRC)) continue

            const isNewFile = !fs.existsSync(fullPath)
            const before = isNewFile ? null : fs.readFileSync(fullPath, 'utf-8')

            fs.mkdirSync(path.dirname(fullPath), { recursive: true })
            fs.writeFileSync(fullPath, change.content, 'utf-8')

            const changeId = randomUUID()
            if (session) {
                session.changeStack.push({
                    id: changeId,
                    file: safe,
                    before,
                    isNewFile,
                    instruction: instruction || 'Applied change',
                    timestamp: new Date().toISOString(),
                })
            }

            applied.push({ file: safe, changeId, isNewFile })
        }

        if (session) {
            session.messages.push({
                role: 'agent',
                text: `Applied ${applied.length} file change(s): ${applied.map(a => a.file).join(', ')}`,
                changesApplied: applied,
                timestamp: new Date().toISOString(),
            })
        }

        return res.json({
            success: true,
            message: `✅ Applied ${applied.length} change(s)`,
            applied,
        })
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[CodeAgent] applyBatch error:', err)
        return res.status(500).json({ success: false, message: err.message })
    }
}

export async function undoChange(req, res) {
    try {
        const { sessionId, changeId } = req.body
        const session = getSession(sessionId)
        if (!session) return res.status(404).json({ success: false, message: 'Session not found. Start a new session.' })

        const idx = session.changeStack.findIndex(c => c.id === changeId)
        if (idx === -1) return res.status(404).json({ success: false, message: 'Change not found in session history.' })

        const change = session.changeStack[idx]
        const fullPath = path.join(CLIENT_SRC, change.file)
        if (!fullPath.startsWith(CLIENT_SRC)) return res.status(403).json({ success: false, message: 'Access denied' })

        if (change.isNewFile) {
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath)
        } else {
            fs.writeFileSync(fullPath, change.before, 'utf-8')
        }

        session.changeStack.splice(idx, 1)

        return res.json({
            success: true,
            message: `↩️ Undid: ${change.isNewFile ? 'Deleted' : 'Reverted'} client/src/${change.file}`,
        })
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[CodeAgent] undo error:', err)
        return res.status(500).json({ success: false, message: err.message })
    }
}

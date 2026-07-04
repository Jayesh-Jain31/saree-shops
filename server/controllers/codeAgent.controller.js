import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CLIENT_SRC = path.resolve(__dirname, '..', '..', 'client', 'src')

// Use gemini-1.5-flash: 1,500 req/day free vs gemini-2.5-flash's 20/day
const GEMINI_MODEL = 'gemini-1.5-flash'

const sessions = new Map()

function getSession(sid) {
    return sessions.has(sid) ? sessions.get(sid) : null
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
        if (fs.statSync(full).isDirectory()) getEditableFiles(full, base, results)
        else if (/\.(jsx?|css)$/.test(item) && !item.includes('.min.')) results.push(path.relative(base, full))
    }
    return results
}

function safeReadFile(relPath) {
    try {
        const full = path.join(CLIENT_SRC, relPath)
        if (!full.startsWith(CLIENT_SRC)) return null
        const c = fs.readFileSync(full, 'utf-8')
        return c.length > 10000 ? c.slice(0, 10000) + '\n// ... (truncated)' : c
    } catch { return null }
}

// ── Smart heuristic file picker (no AI call needed) ───────────────────────────
// Extracts keywords from the instruction and scores files by path match.
// Returns up to `limit` most relevant files.
function heuristicPickFiles(instruction, allFiles, limit = 4) {
    const text = instruction.toLowerCase()

    // Extract meaningful tokens (3+ chars, skip stop words)
    const stops = new Set(['the', 'and', 'for', 'that', 'with', 'this', 'add', 'make', 'create',
        'change', 'update', 'fix', 'page', 'component', 'file', 'want', 'need', 'please'])
    const tokens = text.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(t => t.length >= 3 && !stops.has(t))

    // Known keyword → filename pattern mappings
    const hints = [
        [['product', 'productdetail', 'product detail', 'product page'], ['ProductDetail', 'Product']],
        [['home', 'homepage', 'landing'], ['Home', 'index']],
        [['cart', 'basket'], ['Cart', 'cart']],
        [['checkout', 'payment', 'order'], ['Checkout', 'checkout', 'Order']],
        [['header', 'navbar', 'navigation', 'nav'], ['Header', 'Navbar', 'Nav']],
        [['footer'], ['Footer', 'footer']],
        [['login', 'signin', 'sign in'], ['Login', 'login']],
        [['register', 'signup', 'sign up'], ['Register', 'register']],
        [['profile', 'account', 'user'], ['UserProfile', 'Profile', 'UserMenu']],
        [['category', 'categories'], ['Category', 'category']],
        [['search'], ['Search', 'search']],
        [['wishlist', 'saved'], ['Wishlist', 'wishlist']],
        [['admin', 'dashboard'], ['Admin', 'admin', 'Dashboard']],
        [['banner', 'hero', 'slide'], ['Banner', 'Carousel', 'Hero']],
        [['card', 'product card', 'item'], ['ProductCard', 'Card']],
        [['address', 'delivery'], ['Address', 'Delivery']],
        [['coupon', 'discount', 'promo'], ['Coupon', 'coupon']],
        [['notification', 'alert'], ['Notification', 'notification']],
        [['index', 'css', 'style', 'tailwind', 'color', 'font', 'theme'], ['index.css', 'App.css']],
    ]

    const scores = new Map()
    for (const f of allFiles) scores.set(f, 0)

    // Score by hint matches
    for (const [keywords, patterns] of hints) {
        if (keywords.some(k => text.includes(k))) {
            for (const f of allFiles) {
                if (patterns.some(p => f.toLowerCase().includes(p.toLowerCase()))) {
                    scores.set(f, scores.get(f) + 10)
                }
            }
        }
    }

    // Score by raw token matches in file path
    for (const token of tokens) {
        for (const f of allFiles) {
            if (f.toLowerCase().includes(token)) scores.set(f, scores.get(f) + 3)
        }
    }

    // Sort by score, take top N with score > 0, fallback to common files
    const ranked = allFiles.filter(f => scores.get(f) > 0).sort((a, b) => scores.get(b) - scores.get(a))
    if (ranked.length > 0) return ranked.slice(0, limit)

    // Fallback: return common layout files
    const fallback = allFiles.filter(f => /Home|Layout|App/.test(f))
    return fallback.slice(0, 2)
}

function detectIntent(instruction) {
    const lower = instruction.toLowerCase()
    const isCreate = /\b(create|build|make)\b.*(new\s+)?(page|component|section|screen)\b/.test(lower) || /\bnew\s+(page|component)\b/.test(lower)
    const isRedesign = /\b(redesign|rebuild|rewrite|revamp|redo|restyle|overhaul|completely change|makeover)\b/.test(lower)
    const isFix = /\b(fix|bug|error|issue|broken|not working|debug|crash)\b/.test(lower)
    return { isCreate, isRedesign, isFix }
}

function friendlyError(err) {
    const msg = err?.message || ''
    if (msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests')) {
        const retryMatch = msg.match(/retry in ([\d.]+)s/)
        const wait = retryMatch ? `Wait ~${Math.ceil(parseFloat(retryMatch[1]))}s and try again.` : 'Wait a minute and try again.'
        return `⚠️ Gemini API rate limit hit (free tier). ${wait}\n\nTip: gemini-1.5-flash allows 1,500 requests/day. You may have hit the per-minute limit. Simply retry in a few seconds.`
    }
    if (msg.includes('API_KEY') || msg.includes('401')) return '🔑 Invalid Gemini API key. Check your GEMINI_API_KEY secret.'
    return msg || 'AI agent failed — please try again.'
}

const APP_CONTEXT = `You are an expert React developer working inside a Blinkit-clone quick-commerce e-commerce app.
Tech stack: React 18 + Vite, Tailwind CSS, React Router v6, Redux Toolkit, React Hot Toast, React Icons (react-icons/fi, /md, /fa, /hi, /bi).
API calls use Axios from '../utils/Axios' and SummaryApi from '../common/SummaryApi'.
Backend APIs at /api/*. Design: clean, modern, mobile-first, pink/rose primary color.
Code style: 2-space indent, single quotes.`

// ── Endpoints ─────────────────────────────────────────────────────────────────
export async function newSession(req, res) {
    return res.json({ success: true, sessionId: createSession() })
}

export async function getSessionData(req, res) {
    const s = getSession(req.params.id)
    if (!s) return res.status(404).json({ success: false, message: 'Session not found' })
    return res.json({ success: true, session: s })
}

export async function listFiles(req, res) {
    try { return res.json({ success: true, files: getEditableFiles() }) }
    catch (err) { return res.status(500).json({ success: false, message: err.message }) }
}

export async function chat(req, res) {
    try {
        const { sessionId, message, imageBase64, imageMimeType } = req.body
        if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message is required' })

        if (!process.env.GEMINI_API_KEY) {
            return res.status(503).json({ success: false, message: 'GEMINI_API_KEY not set. Add it in Secrets.' })
        }

        const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        let sid = sessionId
        if (!sid || !sessions.has(sid)) sid = createSession()
        const session = sessions.get(sid)

        const allFiles = getEditableFiles()
        const { isCreate, isRedesign, isFix } = detectIntent(message)

        // ── Pick files to read using heuristic (NO AI call) ───────────────
        const pickedFiles = heuristicPickFiles(message, allFiles, isRedesign || isCreate ? 2 : 4)
        const fileContents = {}
        for (const f of pickedFiles) {
            const c = safeReadFile(f)
            if (c !== null) fileContents[f] = c
        }

        const historyBlock = session.messages.length > 0
            ? `\nPrevious conversation (summary):\n${session.messages.slice(-5).map(m => `${m.role === 'user' ? 'User' : 'Agent'}: ${m.text}`).join('\n')}`
            : ''
        const changesBlock = session.changeStack.length > 0
            ? `\nAlready modified this session:\n${session.changeStack.map(c => `- client/src/${c.file} (${c.instruction})`).join('\n')}`
            : ''

        const fileBlock = Object.entries(fileContents).map(([f, c]) => `=== client/src/${f} ===\n${c}`).join('\n\n')

        const allFilesList = allFiles.join('\n')

        const modeNote = isCreate
            ? 'The user wants to CREATE a new file. Build a complete, polished component/page.'
            : isRedesign
                ? 'The user wants a full REDESIGN. You may completely rewrite the layout and styling. Keep all logic/state working.'
                : isFix
                    ? 'The user wants to FIX a bug or error. Analyze carefully and make the minimal correct fix.'
                    : 'Make the targeted changes the user described.'

        const prompt = `${APP_CONTEXT}${historyBlock}${changesBlock}

All available files in client/src/:
${allFilesList}

${fileBlock ? `Relevant file contents:\n${fileBlock}\n` : ''}

User request: "${message}"

${modeNote}

IMPORTANT: Respond with ONLY a JSON object between <AGENT_RESPONSE> and </AGENT_RESPONSE> tags. No other text.

<AGENT_RESPONSE>
{
  "explanation": "2-3 sentence friendly explanation of what you are doing",
  "changes": [
    {
      "file": "relative/path.jsx",
      "action": "edit OR create",
      "description": "one line: what changed",
      "content": "COMPLETE file content here"
    }
  ]
}
</AGENT_RESPONSE>`

        const model = ai.getGenerativeModel({ model: GEMINI_MODEL })

        const parts = []
        if (imageBase64 && imageMimeType) parts.push({ inlineData: { data: imageBase64, mimeType: imageMimeType } })
        parts.push({ text: prompt })

        const result = await model.generateContent({ contents: [{ role: 'user', parts }] })
        const raw = result.response.text()

        const match = raw.match(/<AGENT_RESPONSE>([\s\S]*?)<\/AGENT_RESPONSE>/)
        let agentData = null
        if (match) {
            try { agentData = JSON.parse(match[1].trim()) } catch { /* fall through */ }
        }
        if (!agentData) {
            const clean = raw.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim()
            try { agentData = JSON.parse(clean) } catch { /* fall through */ }
        }

        if (!agentData) {
            return res.json({ success: true, sessionId: sid, explanation: raw.trim() || 'Could not parse response. Try rephrasing.', changes: [] })
        }

        // Enrich changes with original content
        const enriched = []
        for (const ch of agentData.changes || []) {
            if (!ch.file || !ch.content) continue
            const safe = path.normalize(ch.file).replace(/^(\.\.(\/|\\|$))+/, '')
            const full = path.join(CLIENT_SRC, safe)
            if (!full.startsWith(CLIENT_SRC)) continue
            const exists = fs.existsSync(full)
            const original = exists ? (fs.readFileSync(full, 'utf-8') || '') : ''
            let content = ch.content.trim().replace(/^```[\w]*\r?\n/, '').replace(/\r?\n```$/, '').replace(/^```[\w]*\n/, '').replace(/\n```$/, '')
            enriched.push({ file: safe, action: exists ? 'edit' : 'create', description: ch.description || '', content, original, isNewFile: !exists })
        }

        session.messages.push({ role: 'user', text: message, hasImage: !!imageBase64, timestamp: new Date().toISOString() })

        return res.json({ success: true, sessionId: sid, explanation: agentData.explanation || 'Here are the changes:', changes: enriched })
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[CodeAgent] chat error:', err.message)
        return res.status(500).json({ success: false, message: friendlyError(err) })
    }
}

export async function applyBatch(req, res) {
    try {
        const { sessionId, changes, instruction } = req.body
        if (!Array.isArray(changes) || changes.length === 0) return res.status(400).json({ success: false, message: 'No changes to apply' })
        const session = getSession(sessionId)
        const applied = []
        for (const ch of changes) {
            const safe = path.normalize(ch.file).replace(/^(\.\.(\/|\\|$))+/, '')
            const full = path.join(CLIENT_SRC, safe)
            if (!full.startsWith(CLIENT_SRC)) continue
            const isNew = !fs.existsSync(full)
            const before = isNew ? null : fs.readFileSync(full, 'utf-8')
            fs.mkdirSync(path.dirname(full), { recursive: true })
            fs.writeFileSync(full, ch.content, 'utf-8')
            const id = randomUUID()
            if (session) session.changeStack.push({ id, file: safe, before, isNewFile: isNew, instruction: instruction || 'Applied', timestamp: new Date().toISOString() })
            applied.push({ file: safe, changeId: id, isNewFile: isNew })
        }
        if (session) session.messages.push({ role: 'agent', text: `Applied ${applied.length} change(s): ${applied.map(a => a.file).join(', ')}`, changesApplied: applied, timestamp: new Date().toISOString() })
        return res.json({ success: true, message: `✅ Applied ${applied.length} change(s)`, applied })
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[CodeAgent] applyBatch error:', err.message)
        return res.status(500).json({ success: false, message: err.message })
    }
}

export async function undoChange(req, res) {
    try {
        const { sessionId, changeId } = req.body
        const session = getSession(sessionId)
        if (!session) return res.status(404).json({ success: false, message: 'Session not found. Start a new session.' })
        const idx = session.changeStack.findIndex(c => c.id === changeId)
        if (idx === -1) return res.status(404).json({ success: false, message: 'Change not found in session.' })
        const ch = session.changeStack[idx]
        const full = path.join(CLIENT_SRC, ch.file)
        if (ch.isNewFile) { if (fs.existsSync(full)) fs.unlinkSync(full) }
        else { fs.writeFileSync(full, ch.before, 'utf-8') }
        session.changeStack.splice(idx, 1)
        return res.json({ success: true, message: `↩️ Reverted client/src/${ch.file}` })
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[CodeAgent] undo error:', err.message)
        return res.status(500).json({ success: false, message: err.message })
    }
}

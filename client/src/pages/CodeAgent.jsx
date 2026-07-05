import React, { useState, useRef, useEffect, useCallback } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import {
    FiSend, FiCheck, FiX, FiChevronDown, FiChevronUp,
    FiRotateCcw, FiPlusCircle, FiImage, FiTrash2, FiZap,
    FiCode, FiRefreshCw, FiAlertCircle,
} from 'react-icons/fi'
import { MdAutoFixHigh } from 'react-icons/md'
import { HiSparkles } from 'react-icons/hi'

// ── LCS diff engine ──────────────────────────────────────────────────────────
function diffLines(a, b) {
    const aL = a.split('\n'), bL = b.split('\n')
    const m = aL.length, n = bL.length
    const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1))
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = aL[i-1] === bL[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1])
    const result = []; let i = m, j = n
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && aL[i-1] === bL[j-1]) { result.unshift({ t: '=', l: aL[i-1] }); i--; j-- }
        else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) { result.unshift({ t: '+', l: bL[j-1] }); j-- }
        else { result.unshift({ t: '-', l: aL[i-1] }); i-- }
    }
    return result
}

function visibleDiff(diff, all) {
    if (all) return diff.map((d, i) => ({ ...d, n: i + 1 }))
    const C = 4, changed = new Set()
    diff.forEach((d, i) => { if (d.t !== '=') changed.add(i) })
    const vis = new Set()
    changed.forEach(i => { for (let k = Math.max(0, i - C); k <= Math.min(diff.length - 1, i + C); k++) vis.add(k) })
    const r = []; let prev = -1
    diff.forEach((d, i) => {
        if (!vis.has(i)) return
        if (prev !== -1 && i > prev + 1) r.push({ t: '…' })
        r.push({ ...d, n: i + 1 }); prev = i
    })
    return r
}

// ── Diff viewer ──────────────────────────────────────────────────────────────
function DiffViewer({ original, modified, isNewFile }) {
    const [all, setAll] = useState(false)
    if (isNewFile) {
        const lines = modified.split('\n')
        return (
            <div className='rounded-lg overflow-hidden border border-green-800 bg-[#0d1117] text-xs font-mono'>
                <div className='flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-green-900'>
                    <span className='text-green-400 font-semibold'>✨ New file</span>
                    <span className='text-green-500'>+{lines.length} lines</span>
                </div>
                <div className='overflow-auto max-h-72 leading-5'>
                    {lines.map((line, idx) => (
                        <div key={idx} className='flex bg-[#0d1b12] hover:brightness-110'>
                            <span className='w-9 text-right pr-2 text-gray-600 select-none border-r border-gray-800 py-0.5 pl-2 flex-shrink-0'>{idx + 1}</span>
                            <span className='w-5 text-center flex-shrink-0 py-0.5 text-green-400 font-bold'>+</span>
                            <span className='py-0.5 px-2 whitespace-pre flex-1 text-green-300'>{line}</span>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
    const diff = diffLines(original, modified)
    const { added, removed } = diff.reduce((a, d) => { if (d.t === '+') a.added++; else if (d.t === '-') a.removed++; return a }, { added: 0, removed: 0 })
    if (added === 0 && removed === 0) return <p className='text-xs text-gray-400 py-2 text-center'>No visible changes detected.</p>
    const vis = visibleDiff(diff, all)
    return (
        <div className='rounded-lg overflow-hidden border border-gray-700 bg-[#0d1117] text-xs font-mono'>
            <div className='flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-gray-700'>
                <span className='text-gray-400'>Changes</span>
                <div className='flex items-center gap-3'>
                    <span className='text-green-400'>+{added}</span>
                    <span className='text-red-400'>-{removed}</span>
                    {diff.length > 8 && (
                        <button onClick={() => setAll(v => !v)} className='text-gray-500 hover:text-gray-200 flex items-center gap-0.5 transition'>
                            {all ? <><FiChevronUp size={11}/> Less</> : <><FiChevronDown size={11}/> All</>}
                        </button>
                    )}
                </div>
            </div>
            <div className='overflow-auto max-h-72 leading-5'>
                {vis.map((d, i) => {
                    if (d.t === '…') return <div key={i} className='px-3 py-0.5 text-gray-600 bg-[#161b22] border-y border-gray-800 select-none'>···</div>
                    const bg = d.t === '+' ? 'bg-[#0d1b12]' : d.t === '-' ? 'bg-[#1b0d0d]' : ''
                    const tc = d.t === '+' ? 'text-green-300' : d.t === '-' ? 'text-red-300' : 'text-gray-500'
                    const prefix = d.t === '+' ? '+' : d.t === '-' ? '-' : ' '
                    return (
                        <div key={i} className={`flex ${bg} hover:brightness-110`}>
                            <span className='w-9 text-right pr-2 text-gray-700 select-none border-r border-gray-800 py-0.5 pl-2 flex-shrink-0'>{d.n}</span>
                            <span className={`w-5 text-center flex-shrink-0 py-0.5 font-bold ${tc}`}>{prefix}</span>
                            <span className={`py-0.5 px-2 whitespace-pre flex-1 ${tc}`}>{d.l}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ── File change card inside a chat message ───────────────────────────────────
function ChangeCard({ change, onApprove, onReject, status }) {
    const [open, setOpen] = useState(true)
    const approved = status === 'approved'
    const rejected = status === 'rejected'
    const pending = !approved && !rejected

    return (
        <div className={`rounded-xl border mt-2 overflow-hidden transition-all ${approved ? 'border-green-300 bg-green-50' : rejected ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
            {/* Header */}
            <div className='flex items-center gap-2 px-3 py-2 cursor-pointer select-none' onClick={() => setOpen(v => !v)}>
                <FiCode size={13} className={approved ? 'text-green-500' : rejected ? 'text-red-400' : 'text-violet-500'} />
                <span className='text-xs font-mono font-semibold text-gray-700 flex-1 truncate'>client/src/{change.file}</span>
                {change.isNewFile && <span className='text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold'>NEW</span>}
                {approved && <span className='text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1'><FiCheck size={9}/> Applied</span>}
                {rejected && <span className='text-[10px] bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-bold flex items-center gap-1'><FiX size={9}/> Rejected</span>}
                {open ? <FiChevronUp size={13} className='text-gray-400 flex-shrink-0'/> : <FiChevronDown size={13} className='text-gray-400 flex-shrink-0'/>}
            </div>

            {open && (
                <div className='px-3 pb-3'>
                    {change.description && <p className='text-xs text-gray-500 mb-2'>{change.description}</p>}
                    <DiffViewer original={change.original} modified={change.content} isNewFile={change.isNewFile} />
                    {pending && (
                        <div className='flex gap-2 mt-3'>
                            <button onClick={onApprove} className='flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition shadow-sm'>
                                <FiCheck size={12}/> Apply this change
                            </button>
                            <button onClick={onReject} className='flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-semibold transition'>
                                <FiX size={12}/> Skip
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ── Chat message bubble ──────────────────────────────────────────────────────
function AgentMessage({ msg, onApproveChange, onRejectChange, changeStatuses }) {
    return (
        <div className='flex gap-3 mb-4'>
            <div className='w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow mt-0.5'>
                <MdAutoFixHigh size={16}/>
            </div>
            <div className='flex-1 min-w-0'>
                {msg.thinking && (
                    <div className='flex items-center gap-2 text-xs text-violet-500 mb-2 animate-pulse'>
                        <span className='flex gap-1'>
                            <span className='w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce' style={{animationDelay:'0ms'}}/>
                            <span className='w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce' style={{animationDelay:'150ms'}}/>
                            <span className='w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce' style={{animationDelay:'300ms'}}/>
                        </span>
                        {msg.thinkingText || 'Thinking…'}
                    </div>
                )}
                {msg.explanation && (
                    <div className='bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-700 leading-relaxed'>
                        {msg.explanation}
                    </div>
                )}
                {msg.error && (
                    <div className='flex items-start gap-2 bg-red-50 border border-red-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-red-600'>
                        <FiAlertCircle size={15} className='mt-0.5 flex-shrink-0'/> {msg.error}
                    </div>
                )}
                {(msg.changes || []).map((ch, i) => (
                    <ChangeCard
                        key={i}
                        change={ch}
                        status={changeStatuses?.[`${msg.id}-${i}`]}
                        onApprove={() => onApproveChange(msg.id, i, ch)}
                        onReject={() => onRejectChange(msg.id, i)}
                    />
                ))}
            </div>
        </div>
    )
}

function UserMessage({ msg }) {
    return (
        <div className='flex gap-3 mb-4 justify-end'>
            <div className='max-w-[80%]'>
                {msg.imageDataUrl && (
                    <div className='mb-1 flex justify-end'>
                        <img src={msg.imageDataUrl} alt='attachment' className='max-h-40 max-w-xs rounded-xl border border-gray-200 shadow-sm'/>
                    </div>
                )}
                <div className='bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed shadow-sm'>
                    {msg.text}
                </div>
            </div>
            <div className='w-8 h-8 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold flex-shrink-0 mt-0.5'>
                You
            </div>
        </div>
    )
}

// ── Undo stack panel ──────────────────────────────────────────────────────────
function UndoStack({ stack, onUndo, undoing }) {
    if (stack.length === 0) return null
    return (
        <div className='border-t border-gray-100 bg-gray-50 p-3'>
            <p className='text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2'>Applied Changes — click ↩ to undo</p>
            <div className='flex flex-col gap-1.5 max-h-48 overflow-y-auto'>
                {[...stack].reverse().map((c) => (
                    <div key={c.id} className='flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5'>
                        <FiCode size={11} className='text-violet-400 flex-shrink-0'/>
                        <div className='flex-1 min-w-0'>
                            <p className='text-xs font-mono text-gray-600 truncate'>{c.file}</p>
                            <p className='text-[10px] text-gray-400 truncate'>{c.instruction}</p>
                        </div>
                        {c.isNewFile && <span className='text-[9px] bg-green-100 text-green-700 px-1 rounded font-bold'>NEW</span>}
                        <button
                            onClick={() => onUndo(c.id)}
                            disabled={undoing === c.id}
                            title='Undo this change'
                            className='flex items-center gap-1 text-[11px] text-gray-400 hover:text-orange-500 hover:bg-orange-50 border border-gray-200 hover:border-orange-200 rounded px-1.5 py-0.5 transition disabled:opacity-40 flex-shrink-0'
                        >
                            {undoing === c.id
                                ? <span className='w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin'/>
                                : <FiRotateCcw size={11}/>
                            }
                            Undo
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ── Starter prompts ───────────────────────────────────────────────────────────
const STARTERS = [
    { icon: '🎨', text: 'Redesign the product detail page to look premium and modern' },
    { icon: '📄', text: 'Create a new About Us page with team section and company values' },
    { icon: '🐛', text: 'The cart is not updating quantity — find and fix the bug' },
    { icon: '📱', text: 'Create a sticky mobile bottom navigation bar component' },
    { icon: '✨', text: 'Add skeleton loading to the home page product grid' },
    { icon: '💳', text: 'Redesign the checkout page to look cleaner and more trustworthy' },
]

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CodeAgent() {
    const [sessionId, setSessionId] = useState(null)
    const [messages, setMessages] = useState([])
    const [changeStatuses, setChangeStatuses] = useState({})
    const [undoStack, setUndoStack] = useState([])
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)
    const [undoing, setUndoing] = useState(null)
    const [image, setImage] = useState(null) // { dataUrl, base64, mimeType, name }
    const chatEndRef = useRef(null)
    const fileInputRef = useRef(null)
    const textareaRef = useRef(null)

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

    // ── Image handling ──────────────────────────────────────────────────────
    const handleImageFile = (file) => {
        if (!file || !file.type.startsWith('image/')) return
        const reader = new FileReader()
        reader.onload = (e) => {
            const dataUrl = e.target.result
            const base64 = dataUrl.split(',')[1]
            setImage({ dataUrl, base64, mimeType: file.type, name: file.name })
        }
        reader.readAsDataURL(file)
    }

    const handlePaste = useCallback((e) => {
        const items = e.clipboardData?.items
        if (!items) return
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                handleImageFile(item.getAsFile())
                break
            }
        }
    }, [])

    useEffect(() => {
        document.addEventListener('paste', handlePaste)
        return () => document.removeEventListener('paste', handlePaste)
    }, [handlePaste])

    // ── Send message ────────────────────────────────────────────────────────
    const sendMessage = async () => {
        if (!input.trim() || sending) return
        const text = input.trim()
        const imgSnapshot = image
        setInput('')
        setImage(null)
        setSending(true)

        const userMsg = { id: `u-${Date.now()}`, role: 'user', text, imageDataUrl: imgSnapshot?.dataUrl }
        const thinkingMsg = { id: `t-${Date.now()}`, role: 'agent', thinking: true, thinkingText: 'Reading your codebase…' }
        setMessages(prev => [...prev, userMsg, thinkingMsg])

        try {
            const res = await Axios({
                ...SummaryApi.codeAgentChat,
                data: {
                    sessionId,
                    message: text,
                    imageBase64: imgSnapshot?.base64 || undefined,
                    imageMimeType: imgSnapshot?.mimeType || undefined,
                },
            })

            const data = res.data
            const newSid = data.sessionId || sessionId
            if (newSid && newSid !== sessionId) setSessionId(newSid)

            const agentMsg = {
                id: `a-${Date.now()}`,
                role: 'agent',
                explanation: data.explanation,
                changes: data.changes || [],
                error: data.success === false ? (data.message || 'Unknown error') : null,
            }

            setMessages(prev => prev.filter(m => m.id !== thinkingMsg.id).concat(agentMsg))
        } catch (err) {
            const errMsg = { id: `e-${Date.now()}`, role: 'agent', error: err?.response?.data?.message || 'Failed to reach AI. Check your ANTHROPIC_API_KEY in Secrets.' }
            setMessages(prev => prev.filter(m => m.id !== thinkingMsg.id).concat(errMsg))
        } finally {
            setSending(false)
        }
    }

    // ── Apply a single change ───────────────────────────────────────────────
    const handleApproveChange = async (msgId, changeIdx, change) => {
        const key = `${msgId}-${changeIdx}`
        setChangeStatuses(s => ({ ...s, [key]: 'applying' }))

        // Find instruction from message
        const userMsg = messages.slice().reverse().find(m => m.role === 'user')
        const instruction = userMsg?.text || 'Applied change'

        try {
            const res = await Axios({
                ...SummaryApi.codeAgentApplyBatch,
                data: {
                    sessionId,
                    changes: [{ file: change.file, content: change.content }],
                    instruction,
                },
            })
            if (res.data?.success) {
                setChangeStatuses(s => ({ ...s, [key]: 'approved' }))
                const applied = res.data.applied || []
                setUndoStack(prev => [...prev, ...applied.map(a => ({
                    id: a.changeId,
                    file: a.file,
                    isNewFile: a.isNewFile,
                    instruction,
                }))])
                toast.success(`Applied: ${change.file}`)
            } else {
                setChangeStatuses(s => ({ ...s, [key]: undefined }))
                toast.error(res.data?.message || 'Failed to apply')
            }
        } catch (err) {
            setChangeStatuses(s => ({ ...s, [key]: undefined }))
            toast.error(err?.response?.data?.message || 'Failed to apply change')
        }
    }

    const handleRejectChange = (msgId, changeIdx) => {
        const key = `${msgId}-${changeIdx}`
        setChangeStatuses(s => ({ ...s, [key]: 'rejected' }))
        toast('Skipped this change.', { icon: '⏭' })
    }

    // ── Undo a change ───────────────────────────────────────────────────────
    const handleUndo = async (changeId) => {
        setUndoing(changeId)
        try {
            const res = await Axios({
                ...SummaryApi.codeAgentUndo,
                data: { sessionId, changeId },
            })
            if (res.data?.success) {
                setUndoStack(prev => prev.filter(c => c.id !== changeId))
                toast.success(res.data.message || 'Change reverted')
            } else {
                toast.error(res.data?.message || 'Could not undo')
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Undo failed')
        } finally {
            setUndoing(null)
        }
    }

    // ── New session ─────────────────────────────────────────────────────────
    const startNewSession = () => {
        setSessionId(null)
        setMessages([])
        setChangeStatuses({})
        setUndoStack([])
        setInput('')
        setImage(null)
        toast('Started a new session', { icon: '🔄' })
    }

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
    }

    const isEmpty = messages.length === 0

    return (
        <div className='h-[calc(100vh-80px)] flex flex-col max-w-4xl mx-auto'>
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className='flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0'>
                <div className='w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow'>
                    <MdAutoFixHigh size={20}/>
                </div>
                <div className='flex-1 min-w-0'>
                    <h1 className='text-base font-bold text-gray-800'>Code AI Agent</h1>
                    <p className='text-xs text-gray-400'>
                        {sessionId ? <span className='text-green-500 font-mono'>● Session active</span> : 'Start typing to begin a session'}
                    </p>
                </div>
                <div className='flex items-center gap-2'>
                    {sessionId && (
                        <span className='hidden sm:flex items-center gap-1 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1'>
                            <HiSparkles size={11} className='text-violet-400'/> {undoStack.length} changes
                        </span>
                    )}
                    <button
                        onClick={startNewSession}
                        className='flex items-center gap-1.5 text-xs text-gray-500 hover:text-violet-600 border border-gray-200 hover:border-violet-300 bg-white rounded-lg px-3 py-1.5 transition'
                    >
                        <FiRefreshCw size={12}/> New session
                    </button>
                </div>
            </div>

            {/* ── Chat thread ─────────────────────────────────────────────── */}
            <div className='flex-1 overflow-y-auto px-4 py-4 bg-white'>
                {/* Empty state */}
                {isEmpty && (
                    <div className='flex flex-col items-center justify-center h-full gap-6 pb-6'>
                        <div className='text-center'>
                            <div className='w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-lg mx-auto mb-4'>
                                <MdAutoFixHigh size={32}/>
                            </div>
                            <h2 className='text-lg font-bold text-gray-800 mb-1'>What do you want to build?</h2>
                            <p className='text-sm text-gray-400 max-w-sm'>Describe a change, redesign, new feature, or paste an error. I'll read your code and make the changes — you approve each one.</p>
                        </div>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl'>
                            {STARTERS.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => setInput(s.text)}
                                    className='text-left flex items-start gap-2.5 bg-gray-50 hover:bg-violet-50 border border-gray-200 hover:border-violet-200 rounded-xl px-3 py-2.5 transition group'
                                >
                                    <span className='text-base flex-shrink-0 mt-0.5'>{s.icon}</span>
                                    <span className='text-xs text-gray-600 group-hover:text-violet-700 leading-relaxed'>{s.text}</span>
                                </button>
                            ))}
                        </div>
                        <div className='flex flex-wrap justify-center gap-3 text-xs text-gray-400'>
                            <span className='flex items-center gap-1'><FiImage size={12} className='text-violet-400'/> Paste screenshot</span>
                            <span className='flex items-center gap-1'><FiZap size={12} className='text-violet-400'/> Multi-file edits</span>
                            <span className='flex items-center gap-1'><FiRotateCcw size={12} className='text-violet-400'/> Undo any change</span>
                            <span className='flex items-center gap-1'><FiAlertCircle size={12} className='text-violet-400'/> Fix errors</span>
                        </div>
                    </div>
                )}

                {/* Messages */}
                {messages.map((msg) => {
                    if (msg.role === 'user') return <UserMessage key={msg.id} msg={msg}/>
                    return (
                        <AgentMessage
                            key={msg.id}
                            msg={msg}
                            changeStatuses={changeStatuses}
                            onApproveChange={handleApproveChange}
                            onRejectChange={handleRejectChange}
                        />
                    )
                })}
                <div ref={chatEndRef}/>
            </div>

            {/* ── Undo stack ───────────────────────────────────────────────── */}
            <UndoStack stack={undoStack} onUndo={handleUndo} undoing={undoing}/>

            {/* ── Input area ──────────────────────────────────────────────── */}
            <div className='flex-shrink-0 border-t border-gray-100 bg-white px-3 py-3'>
                {/* Image preview */}
                {image && (
                    <div className='flex items-center gap-2 mb-2 bg-violet-50 border border-violet-200 rounded-xl px-3 py-2'>
                        <img src={image.dataUrl} alt='preview' className='h-10 w-10 object-cover rounded-lg border border-violet-300'/>
                        <div className='flex-1 min-w-0'>
                            <p className='text-xs font-medium text-violet-700 truncate'>{image.name || 'Image attached'}</p>
                            <p className='text-[10px] text-violet-400'>AI will use this as visual context</p>
                        </div>
                        <button onClick={() => setImage(null)} className='text-violet-400 hover:text-red-400 transition p-1'>
                            <FiTrash2 size={13}/>
                        </button>
                    </div>
                )}

                <div className='flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 transition'>
                    {/* Image upload button */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        title='Attach image (or Ctrl+V to paste)'
                        className='flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-400 hover:text-violet-500 transition mb-0.5'
                    >
                        <FiImage size={16}/>
                    </button>
                    <input ref={fileInputRef} type='file' accept='image/*' className='hidden' onChange={e => { handleImageFile(e.target.files[0]); e.target.value = '' }}/>

                    {/* Text input */}
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder='Describe what you want to build, fix, or change… (Enter to send, Shift+Enter for new line)'
                        rows={1}
                        style={{ resize: 'none', maxHeight: '120px', overflowY: 'auto' }}
                        className='flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none leading-relaxed py-1.5'
                        onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                    />

                    {/* Send button */}
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || sending}
                        className='flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow hover:opacity-90 disabled:opacity-30 transition mb-0.5'
                    >
                        {sending
                            ? <span className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'/>
                            : <FiSend size={15}/>
                        }
                    </button>
                </div>
                <p className='text-[10px] text-gray-300 text-center mt-1.5'>AI reads your actual source files · Changes only apply when you click "Apply this change"</p>
            </div>
        </div>
    )
}

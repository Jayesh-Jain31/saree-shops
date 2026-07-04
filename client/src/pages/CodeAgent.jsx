import React, { useState, useRef, useEffect } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import { FiCode, FiSend, FiCheck, FiX, FiChevronDown, FiClock, FiRotateCcw, FiPlusCircle } from 'react-icons/fi'
import { MdAutoFixHigh, MdDesignServices } from 'react-icons/md'
import { HiSparkles } from 'react-icons/hi'

// ── Simple LCS-based line diff ────────────────────────────────────────────────
function diffLines(oldStr, newStr) {
    const a = oldStr.split('\n')
    const b = newStr.split('\n')
    const m = a.length, n = b.length
    const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1))
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1])
    const result = []
    let i = m, j = n
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && a[i-1] === b[j-1]) {
            result.unshift({ type: 'equal', line: a[i-1] })
            i--; j--
        } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
            result.unshift({ type: 'add', line: b[j-1] })
            j--
        } else {
            result.unshift({ type: 'remove', line: a[i-1] })
            i--
        }
    }
    return result
}

function countChanges(diff) {
    return diff.reduce((acc, d) => {
        if (d.type === 'add') acc.added++
        if (d.type === 'remove') acc.removed++
        return acc
    }, { added: 0, removed: 0 })
}

function getVisibleDiff(diff, showAll) {
    if (showAll) return diff.map((d, i) => ({ ...d, lineNum: i + 1 }))
    const CONTEXT = 5
    const changed = new Set()
    diff.forEach((d, i) => { if (d.type !== 'equal') changed.add(i) })
    const visible = new Set()
    changed.forEach(i => {
        for (let k = Math.max(0, i - CONTEXT); k <= Math.min(diff.length - 1, i + CONTEXT); k++)
            visible.add(k)
    })
    const result = []
    let prev = -1
    diff.forEach((d, i) => {
        if (visible.has(i)) {
            if (prev !== -1 && i > prev + 1) result.push({ type: 'ellipsis' })
            result.push({ ...d, lineNum: i + 1 })
            prev = i
        }
    })
    return result
}

// ── Diff viewer ───────────────────────────────────────────────────────────────
function DiffViewer({ original, modified, isNewFile }) {
    const [showAll, setShowAll] = useState(false)

    if (isNewFile) {
        const lines = modified.split('\n')
        return (
            <div className='rounded-xl overflow-hidden border border-green-700 bg-gray-950'>
                <div className='flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700'>
                    <span className='text-xs text-green-400 font-mono font-semibold'>✨ New file — full content</span>
                    <span className='text-xs text-green-400 font-mono'>+{lines.length} lines</span>
                </div>
                <div className='overflow-auto max-h-[450px] font-mono text-xs leading-5'>
                    {lines.map((line, idx) => (
                        <div key={idx} className='flex bg-green-950 hover:brightness-110'>
                            <span className='w-8 text-right pr-2 text-gray-600 select-none flex-shrink-0 border-r border-gray-800 py-0.5 pl-2'>{idx + 1}</span>
                            <span className='w-5 text-center flex-shrink-0 py-0.5 text-green-400 font-bold'>+</span>
                            <span className='py-0.5 px-2 whitespace-pre flex-1 text-green-300'>{line}</span>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const diff = diffLines(original, modified)
    const visible = getVisibleDiff(diff, showAll)
    const { added, removed } = countChanges(diff)
    const hasChanges = added > 0 || removed > 0

    if (!hasChanges) {
        return (
            <div className='text-center py-8 text-gray-400 text-sm'>
                No changes detected — the file already matches your request.
            </div>
        )
    }

    return (
        <div className='rounded-xl overflow-hidden border border-gray-200 bg-gray-950'>
            <div className='flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700'>
                <span className='text-xs text-gray-400 font-mono'>Diff Preview</span>
                <div className='flex items-center gap-3 text-xs'>
                    <span className='text-green-400 font-mono'>+{added}</span>
                    <span className='text-red-400 font-mono'>-{removed}</span>
                    {!showAll && diff.length > 10 && (
                        <button onClick={() => setShowAll(true)} className='text-gray-400 hover:text-white flex items-center gap-1 transition'>
                            Show all <FiChevronDown size={12} />
                        </button>
                    )}
                </div>
            </div>
            <div className='overflow-auto max-h-[450px] font-mono text-xs leading-5'>
                {visible.map((d, idx) => {
                    if (d.type === 'ellipsis') return (
                        <div key={idx} className='px-4 py-1 text-gray-500 bg-gray-900 border-y border-gray-800 select-none'>···</div>
                    )
                    const bg = d.type === 'add' ? 'bg-green-950' : d.type === 'remove' ? 'bg-red-950' : ''
                    const prefix = d.type === 'add' ? '+' : d.type === 'remove' ? '-' : ' '
                    const textColor = d.type === 'add' ? 'text-green-300' : d.type === 'remove' ? 'text-red-300' : 'text-gray-400'
                    return (
                        <div key={idx} className={`flex ${bg} hover:brightness-110`}>
                            <span className='w-8 text-right pr-2 text-gray-600 select-none flex-shrink-0 border-r border-gray-800 py-0.5 pl-2'>{d.lineNum}</span>
                            <span className={`w-5 text-center flex-shrink-0 py-0.5 ${textColor} font-bold`}>{prefix}</span>
                            <span className={`py-0.5 px-2 whitespace-pre flex-1 ${textColor}`}>{d.line}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ── History item ──────────────────────────────────────────────────────────────
function HistoryItem({ entry, onUndo, undoing }) {
    return (
        <div className='flex items-start gap-3 p-3 rounded-xl bg-green-50 border border-green-100'>
            <div className='w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5'>
                {entry.isNewFile ? <FiPlusCircle size={13} className='text-green-600' /> : <FiCheck size={13} className='text-green-600' />}
            </div>
            <div className='min-w-0 flex-1'>
                <p className='text-sm text-gray-800 font-medium'>{entry.instruction}</p>
                <div className='flex items-center gap-2 mt-0.5 flex-wrap'>
                    <p className='text-xs text-gray-500 font-mono truncate'>client/src/{entry.file}</p>
                    {entry.isNewFile && <span className='text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold'>NEW FILE</span>}
                    {entry.isRedesign && <span className='text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-semibold'>REDESIGN</span>}
                </div>
                <p className='text-[11px] text-gray-400 mt-0.5 flex items-center gap-1'>
                    <FiClock size={10} /> {entry.time}
                </p>
            </div>
            <button
                onClick={() => onUndo(entry)}
                disabled={undoing === entry.file}
                title='Undo this change'
                className='flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 border border-gray-200 hover:border-orange-300 rounded-lg px-2 py-1.5 transition flex-shrink-0 disabled:opacity-40'
            >
                {undoing === entry.file
                    ? <span className='w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin' />
                    : <FiRotateCcw size={12} />
                }
                Undo
            </button>
        </div>
    )
}

// ── Example prompt chips ──────────────────────────────────────────────────────
const EXAMPLES = [
    { label: '🎨 Redesign product page', prompt: 'Redesign the product detail page to look more modern and premium' },
    { label: '📄 Create About Us page', prompt: 'Create a new About Us page with company info, team section, and contact' },
    { label: '🛒 Add wishlist button to cards', prompt: 'Add a heart wishlist toggle button to product cards' },
    { label: '🎯 Make header sticky', prompt: 'Make the header sticky on scroll with a shadow' },
    { label: '💳 Redesign checkout', prompt: 'Redesign the checkout page to look cleaner and more trustworthy' },
    { label: '✨ Add skeleton loading', prompt: 'Add skeleton loading placeholders to the product listing page' },
    { label: '📱 Mobile bottom nav', prompt: 'Create a mobile bottom navigation bar component' },
    { label: '🏷️ Add sale badge to products', prompt: 'Add a "SALE" badge on discounted products in product cards' },
]

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CodeAgent() {
    const [instruction, setInstruction] = useState('')
    const [loading, setLoading] = useState(false)
    const [applying, setApplying] = useState(false)
    const [undoing, setUndoing] = useState(null)
    const [preview, setPreview] = useState(null)
    const [history, setHistory] = useState([])
    const [files, setFiles] = useState([])
    const [selectedFile, setSelectedFile] = useState('')
    const textareaRef = useRef(null)

    useEffect(() => {
        Axios({ ...SummaryApi.codeAgentFiles })
            .then(r => { if (r.data?.success) setFiles(r.data.files) })
            .catch(() => {})
    }, [])

    const handleGenerate = async () => {
        if (!instruction.trim() || loading) return
        setLoading(true)
        setPreview(null)
        try {
            const res = await Axios({
                ...SummaryApi.codeAgentSuggest,
                data: { instruction: instruction.trim(), targetFile: selectedFile || undefined },
            })
            if (res.data?.success) {
                setPreview(res.data)
            } else {
                toast.error(res.data?.message || 'AI could not generate a suggestion')
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to reach AI. Check your Gemini API key.')
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async () => {
        if (!preview || applying) return
        setApplying(true)
        try {
            const res = await Axios({
                ...SummaryApi.codeAgentApply,
                data: { file: preview.file, content: preview.modified, original: preview.original },
            })
            if (res.data?.success) {
                toast.success(res.data.message || 'Change applied! Vite will hot-reload.')
                setHistory(h => [{
                    instruction,
                    file: preview.file,
                    isNewFile: preview.isNewFile,
                    isRedesign: preview.isRedesign,
                    time: new Date().toLocaleTimeString('en-IN'),
                }, ...h])
                setPreview(null)
                setInstruction('')
                setSelectedFile('')
            } else {
                toast.error(res.data?.message || 'Failed to apply change')
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to apply change')
        } finally {
            setApplying(false)
        }
    }

    const handleReject = () => {
        setPreview(null)
        toast('Change rejected. Nothing was modified.', { icon: '❌' })
    }

    const handleUndo = async (entry) => {
        setUndoing(entry.file)
        try {
            const res = await Axios({
                ...SummaryApi.codeAgentUndo,
                data: { file: entry.file },
            })
            if (res.data?.success) {
                toast.success(res.data.message || 'Change reverted!')
                setHistory(h => h.filter(e => e !== entry))
            } else {
                toast.error(res.data?.message || 'Could not undo')
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Undo failed')
        } finally {
            setUndoing(null)
        }
    }

    const handleKey = (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate()
    }

    return (
        <div className='max-w-4xl mx-auto px-4 py-6'>
            {/* Header */}
            <div className='flex items-center gap-3 mb-6'>
                <div className='w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-lg'>
                    <MdAutoFixHigh size={24} />
                </div>
                <div>
                    <h1 className='text-xl font-bold text-gray-800'>Code Editing AI Agent</h1>
                    <p className='text-sm text-gray-500'>Tell it what to build or change — it reads your code, makes the edit, you approve</p>
                </div>
            </div>

            {/* Capability badges */}
            <div className='flex flex-wrap gap-2 mb-5'>
                <span className='flex items-center gap-1.5 text-xs bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-3 py-1 font-medium'>
                    <MdDesignServices size={13} /> Redesign pages
                </span>
                <span className='flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 font-medium'>
                    <FiPlusCircle size={12} /> Create new pages & components
                </span>
                <span className='flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 font-medium'>
                    <HiSparkles size={13} /> Small tweaks & fixes
                </span>
                <span className='flex items-center gap-1.5 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-3 py-1 font-medium'>
                    <FiRotateCcw size={12} /> Undo any change
                </span>
            </div>

            {/* Instruction panel */}
            <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5'>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>What do you want to build or change?</label>
                <textarea
                    ref={textareaRef}
                    value={instruction}
                    onChange={e => setInstruction(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder='e.g. "Redesign the product page to look premium" or "Create a new About Us page" or "Add sale badge to product cards"'
                    rows={3}
                    className='w-full text-sm text-gray-800 placeholder-gray-400 border border-gray-200 rounded-xl px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition'
                />

                {/* File picker */}
                <div className='mt-3 flex flex-wrap items-center gap-3'>
                    <div className='flex items-center gap-2 flex-1 min-w-[200px]'>
                        <FiCode size={14} className='text-gray-400 flex-shrink-0' />
                        <select
                            value={selectedFile}
                            onChange={e => setSelectedFile(e.target.value)}
                            className='text-xs text-gray-600 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-violet-300 w-full bg-white'
                        >
                            <option value=''>Auto-detect file (recommended)</option>
                            {files.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={!instruction.trim() || loading}
                        className='flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold shadow hover:opacity-90 disabled:opacity-40 transition'
                    >
                        {loading ? (
                            <span className='flex items-center gap-2'>
                                <span className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                                AI is thinking…
                            </span>
                        ) : (
                            <><FiSend size={14} /> Generate Preview</>
                        )}
                    </button>
                </div>

                {/* Loading hint */}
                {loading && (
                    <p className='text-xs text-violet-500 mt-3 animate-pulse'>
                        ✨ Reading your code and generating changes… this may take 10–30 seconds for big rewrites.
                    </p>
                )}

                {/* Example prompts */}
                {!preview && !loading && (
                    <div className='mt-4'>
                        <p className='text-[11px] text-gray-400 mb-2 font-medium uppercase tracking-wider'>Try these examples</p>
                        <div className='flex flex-wrap gap-2'>
                            {EXAMPLES.map(ex => (
                                <button
                                    key={ex.prompt}
                                    onClick={() => setInstruction(ex.prompt)}
                                    className='text-[11px] bg-gray-50 border border-gray-200 text-gray-600 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 rounded-full px-3 py-1 transition'
                                >
                                    {ex.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Preview panel */}
            {preview && (
                <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5'>
                    {/* File + intent badges + summary */}
                    <div className='flex items-start justify-between gap-4 mb-4'>
                        <div>
                            <div className='flex items-center gap-2 mb-1 flex-wrap'>
                                <span className='text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full font-mono'>
                                    client/src/{preview.file}
                                </span>
                                {preview.isNewFile && (
                                    <span className='text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full'>
                                        ✨ New file
                                    </span>
                                )}
                                {preview.isRedesign && (
                                    <span className='text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full'>
                                        🎨 Full redesign
                                    </span>
                                )}
                            </div>
                            {preview.summary && (
                                <p className='text-sm text-gray-600'>{preview.summary}</p>
                            )}
                        </div>
                    </div>

                    <DiffViewer original={preview.original} modified={preview.modified} isNewFile={preview.isNewFile} />

                    {/* Approve / Reject */}
                    <div className='flex items-center gap-3 mt-4 flex-wrap'>
                        <button
                            onClick={handleApprove}
                            disabled={applying}
                            className='flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold shadow transition disabled:opacity-50'
                        >
                            {applying ? (
                                <span className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                            ) : <FiCheck size={15} />}
                            Approve & Apply
                        </button>
                        <button
                            onClick={handleReject}
                            disabled={applying}
                            className='flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 text-sm font-semibold transition disabled:opacity-50'
                        >
                            <FiX size={15} /> Reject
                        </button>
                        <p className='text-xs text-gray-400 ml-auto hidden sm:block'>Ctrl+Enter to generate</p>
                    </div>
                </div>
            )}

            {/* History */}
            {history.length > 0 && (
                <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-5'>
                    <p className='text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2'>
                        <FiClock size={14} className='text-gray-400' /> Applied Changes (this session)
                    </p>
                    <div className='grid gap-2'>
                        {history.map((entry, i) => (
                            <HistoryItem key={i} entry={entry} onUndo={handleUndo} undoing={undoing} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

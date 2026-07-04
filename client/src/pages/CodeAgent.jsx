import React, { useState, useRef, useEffect } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import { FiCode, FiSend, FiCheck, FiX, FiChevronDown, FiClock } from 'react-icons/fi'
import { MdAutoFixHigh } from 'react-icons/md'

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

// Only show ±5 lines of context around changes
function getVisibleDiff(diff, showAll) {
    if (showAll) return diff
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
function DiffViewer({ original, modified }) {
    const [showAll, setShowAll] = useState(false)
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
                        <div key={idx} className='px-4 py-1 text-gray-500 bg-gray-900 border-y border-gray-800 select-none'>
                            ···
                        </div>
                    )
                    const bg = d.type === 'add' ? 'bg-green-950' : d.type === 'remove' ? 'bg-red-950' : ''
                    const prefix = d.type === 'add' ? '+' : d.type === 'remove' ? '-' : ' '
                    const textColor = d.type === 'add' ? 'text-green-300' : d.type === 'remove' ? 'text-red-300' : 'text-gray-400'
                    return (
                        <div key={idx} className={`flex ${bg} hover:brightness-110`}>
                            <span className='w-8 text-right pr-2 text-gray-600 select-none flex-shrink-0 border-r border-gray-800 py-0.5 pl-2'>
                                {d.lineNum}
                            </span>
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
function HistoryItem({ entry }) {
    return (
        <div className='flex items-start gap-3 p-3 rounded-xl bg-green-50 border border-green-100'>
            <div className='w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5'>
                <FiCheck size={13} className='text-green-600' />
            </div>
            <div className='min-w-0'>
                <p className='text-sm text-gray-800 font-medium'>{entry.instruction}</p>
                <p className='text-xs text-gray-500 mt-0.5 font-mono truncate'>client/src/{entry.file}</p>
                <p className='text-[11px] text-gray-400 mt-0.5 flex items-center gap-1'>
                    <FiClock size={10} /> {entry.time}
                </p>
            </div>
        </div>
    )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CodeAgent() {
    const [instruction, setInstruction] = useState('')
    const [loading, setLoading] = useState(false)
    const [applying, setApplying] = useState(false)
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
                data: { file: preview.file, content: preview.modified },
            })
            if (res.data?.success) {
                toast.success('Change applied! Vite will hot-reload.')
                setHistory(h => [{
                    instruction,
                    file: preview.file,
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

    const handleKey = (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate()
    }

    const EXAMPLES = [
        'Change the hero banner background color to deep navy blue',
        'Add "New Arrival" badge to product cards',
        'Make the header sticky on scroll',
        'Change the footer background to dark gray',
        'Add a loading spinner to the login button',
    ]

    return (
        <div className='max-w-4xl mx-auto px-4 py-6'>
            {/* Header */}
            <div className='flex items-center gap-3 mb-6'>
                <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow'>
                    <MdAutoFixHigh size={22} />
                </div>
                <div>
                    <h1 className='text-xl font-bold text-gray-800'>Code Editing AI Agent</h1>
                    <p className='text-sm text-gray-500'>Describe a change → review the diff → approve or reject</p>
                </div>
            </div>

            {/* Instruction panel */}
            <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5'>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>What do you want to change?</label>
                <textarea
                    ref={textareaRef}
                    value={instruction}
                    onChange={e => setInstruction(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder='e.g. "Change the hero banner text to Welcome to our store" or "Make product cards have rounded corners"'
                    rows={3}
                    className='w-full text-sm text-gray-800 placeholder-gray-400 border border-gray-200 rounded-xl px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition'
                />

                {/* File picker (optional) */}
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
                                Generating…
                            </span>
                        ) : (
                            <><FiSend size={14} /> Generate Preview</>
                        )}
                    </button>
                </div>

                {/* Example prompts */}
                {!preview && !loading && (
                    <div className='mt-4'>
                        <p className='text-[11px] text-gray-400 mb-2 font-medium uppercase tracking-wider'>Examples</p>
                        <div className='flex flex-wrap gap-2'>
                            {EXAMPLES.map(ex => (
                                <button
                                    key={ex}
                                    onClick={() => setInstruction(ex)}
                                    className='text-[11px] bg-gray-50 border border-gray-200 text-gray-600 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 rounded-full px-3 py-1 transition'
                                >
                                    {ex}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Preview panel */}
            {preview && (
                <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5 animate-fadeIn'>
                    {/* File + summary */}
                    <div className='flex items-start justify-between gap-4 mb-4'>
                        <div>
                            <div className='flex items-center gap-2 mb-1'>
                                <span className='text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full font-mono'>
                                    client/src/{preview.file}
                                </span>
                            </div>
                            {preview.summary && (
                                <p className='text-sm text-gray-600'>{preview.summary}</p>
                            )}
                        </div>
                    </div>

                    {/* Diff viewer */}
                    <DiffViewer original={preview.original} modified={preview.modified} />

                    {/* Approve / Reject */}
                    <div className='flex items-center gap-3 mt-4'>
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
                        <p className='text-xs text-gray-400 ml-auto hidden sm:block'>
                            Ctrl+Enter to generate
                        </p>
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
                        {history.map((entry, i) => <HistoryItem key={i} entry={entry} />)}
                    </div>
                </div>
            )}
        </div>
    )
}

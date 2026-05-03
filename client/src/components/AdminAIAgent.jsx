import React, { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import isAdmin from '../utils/isAdmin'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'

const QUICK_ACTIONS = [
  { label: '📊 Today\'s stats', msg: 'Give me today\'s order and revenue stats' },
  { label: '⏳ Pending orders', msg: 'How many pending orders do I have?' },
  { label: '🏆 Top products', msg: 'What are my top selling products?' },
  { label: '📦 Low stock', msg: 'Which products are low on stock?' },
  { label: '💰 This month revenue', msg: 'What is my revenue this month?' },
  { label: '👥 Total customers', msg: 'How many customers do I have?' },
]

function TypingDots() {
  return (
    <div className='flex items-center gap-1 px-3 py-2'>
      {[0, 1, 2].map(i => (
        <span key={i} className='w-2 h-2 rounded-full bg-pink-400 animate-bounce' style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  )
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  const text = msg.content || ''

  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>')

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      {!isUser && (
        <div className='w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold mr-1.5 flex-shrink-0 mt-0.5'>A</div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? 'bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-br-sm'
            : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-bl-sm'
        }`}
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
      {isUser && (
        <div className='w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold ml-1.5 flex-shrink-0 mt-0.5'>Me</div>
      )}
    </div>
  )
}

export default function AdminAIAgent() {
  const user = useSelector(s => s.user)
  const [open, setOpen]       = useState(false)
  const [input, setInput]     = useState('')
  const [history, setHistory] = useState([
    { role: 'assistant', content: '👋 Hi! I\'m **Aria**, your AI store assistant.\n\nI can give you **analytics**, **insights**, and even take **actions** like cancelling orders or creating coupons.\n\nWhat would you like to know?' }
  ])
  const [loading, setLoading] = useState(false)
  const [showQuick, setShowQuick] = useState(true)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, loading, open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  if (!isAdmin(user?.role)) return null

  const sendMessage = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    const userMsg = { role: 'user', content: msg }
    const newHistory = [...history, userMsg]
    setHistory(newHistory)
    setInput('')
    setLoading(true)
    setShowQuick(false)

    try {
      const res = await Axios({
        ...SummaryApi.aiAgentChat,
        data: {
          message: msg,
          history: newHistory.slice(-12).map(h => ({ role: h.role, content: h.content })),
        },
      })
      if (res.data?.success) {
        setHistory(prev => [...prev, { role: 'assistant', content: res.data.response }])
      } else {
        setHistory(prev => [...prev, { role: 'assistant', content: '❌ Something went wrong. Please try again.' }])
      }
    } catch (err) {
      setHistory(prev => [...prev, { role: 'assistant', content: '❌ Failed to reach AI. Check your connection.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const clearChat = () => {
    setHistory([{ role: 'assistant', content: '👋 Chat cleared! How can I help you?' }])
    setShowQuick(true)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className='fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center'
        title='AI Admin Assistant'
      >
        {open ? (
          <svg xmlns='http://www.w3.org/2000/svg' className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg>
        ) : (
          <svg xmlns='http://www.w3.org/2000/svg' className='w-7 h-7' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2' /></svg>
        )}
        {!open && (
          <span className='absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white' />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className='fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] h-[520px] max-h-[calc(100vh-120px)] flex flex-col rounded-2xl shadow-2xl border border-gray-200 overflow-hidden bg-gray-50'>

          {/* Header */}
          <div className='bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-3 flex items-center justify-between flex-shrink-0'>
            <div className='flex items-center gap-2'>
              <div className='w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm'>A</div>
              <div>
                <p className='text-white font-semibold text-sm leading-tight'>Aria — AI Assistant</p>
                <p className='text-pink-100 text-[10px]'>Powered by Gemini · Admin only</p>
              </div>
            </div>
            <button onClick={clearChat} className='text-white/70 hover:text-white text-[10px] bg-white/10 hover:bg-white/20 rounded-full px-2 py-1 transition'>Clear</button>
          </div>

          {/* Messages */}
          <div className='flex-1 overflow-y-auto p-3 space-y-1'>
            {history.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
            {loading && (
              <div className='flex justify-start mb-2'>
                <div className='w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold mr-1.5 flex-shrink-0'>A</div>
                <div className='bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm'>
                  <TypingDots />
                </div>
              </div>
            )}

            {/* Quick actions */}
            {showQuick && !loading && (
              <div className='pt-2'>
                <p className='text-[10px] text-gray-400 text-center mb-2'>Quick actions</p>
                <div className='flex flex-wrap gap-1.5 justify-center'>
                  {QUICK_ACTIONS.map(a => (
                    <button
                      key={a.label}
                      onClick={() => sendMessage(a.msg)}
                      className='text-[11px] bg-white border border-pink-200 text-pink-600 hover:bg-pink-50 rounded-full px-2.5 py-1 transition font-medium'
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className='flex-shrink-0 bg-white border-t border-gray-100 p-2'>
            <div className='flex items-end gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2'>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder='Ask anything about your store...'
                rows={1}
                className='flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none outline-none max-h-24'
                style={{ lineHeight: '1.4' }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className='w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition flex-shrink-0'
              >
                <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4 rotate-90' fill='currentColor' viewBox='0 0 24 24'><path d='M2 21l21-9L2 3v7l15 2-15 2z'/></svg>
              </button>
            </div>
            <p className='text-[9px] text-gray-300 text-center mt-1'>Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </>
  )
}

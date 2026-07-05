import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
    FiCode, FiMessageSquare, FiImage, FiArrowRight,
    FiCpu, FiLayers, FiZap, FiTerminal,
} from 'react-icons/fi'
import { MdAutoFixHigh } from 'react-icons/md'
import { FaRobot } from 'react-icons/fa'
import { HiSparkles } from 'react-icons/hi'

const AI_TOOLS = [
    {
        id: 'code-agent',
        title: 'Code AI Agent',
        description: 'Edit, redesign, and fix your React code. Supports both Gemini (free) and Claude 3.7 (premium). Ask it to change any page or component.',
        icon: FiCode,
        color: 'violet',
        route: '/dashboard/code-agent',
        badge: 'Multi-model',
        features: ['Redesign pages', 'Fix bugs', 'Create components', 'Multi-file edits'],
    },
    {
        id: 'ai-chat',
        title: 'AI Admin Assistant',
        description: 'Chat with an AI that knows your store data. Ask about orders, revenue, inventory, or tell it to cancel orders, create coupons, toggle products.',
        icon: FiMessageSquare,
        color: 'emerald',
        route: '/dashboard/ai-agent',
        badge: 'Live data',
        features: ['Store analytics', 'Order actions', 'Coupon creation', 'Inventory alerts'],
    },
    {
        id: 'ai-image',
        title: 'AI Model Images',
        description: 'Generate model-wearing-product images with AI. Upload a product photo and get a professional model image for your catalog.',
        icon: FiImage,
        color: 'pink',
        route: '/dashboard/product',
        badge: 'Gemini Flash',
        features: ['Model generation', 'Product photos', 'Catalog images'],
    },
]

const colorMap = {
    violet: {
        bg: 'bg-violet-50', border: 'border-violet-200', hoverBorder: 'hover:border-violet-300',
        iconBg: 'bg-violet-500', text: 'text-violet-600', badge: 'bg-violet-100 text-violet-700',
        arrow: 'text-violet-500', ring: 'focus:ring-violet-200',
    },
    emerald: {
        bg: 'bg-emerald-50', border: 'border-emerald-200', hoverBorder: 'hover:border-emerald-300',
        iconBg: 'bg-emerald-500', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700',
        arrow: 'text-emerald-500', ring: 'focus:ring-emerald-200',
    },
    pink: {
        bg: 'bg-pink-50', border: 'border-pink-200', hoverBorder: 'hover:border-pink-300',
        iconBg: 'bg-pink-500', text: 'text-pink-600', badge: 'bg-pink-100 text-pink-700',
        arrow: 'text-pink-500', ring: 'focus:ring-pink-200',
    },
}

export default function AgentRouter() {
    const navigate = useNavigate()

    return (
        <div className='max-w-5xl mx-auto px-4 py-6 pb-20'>
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className='mb-8'>
                <div className='flex items-center gap-3 mb-2'>
                    <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow'>
                        <FaRobot size={20}/>
                    </div>
                    <div>
                        <h1 className='text-xl font-bold text-gray-800'>AI Agent Router</h1>
                        <p className='text-sm text-gray-400'>Pick an AI tool to supercharge your store</p>
                    </div>
                </div>
            </div>

            {/* ── Stats strip ───────────────────────────────────────────── */}
            <div className='grid grid-cols-3 gap-3 mb-8'>
                <div className='bg-white border border-gray-200 rounded-xl p-3 text-center'>
                    <FiCpu size={18} className='text-violet-400 mx-auto mb-1'/>
                    <p className='text-lg font-bold text-gray-800'>3</p>
                    <p className='text-[10px] text-gray-400 uppercase tracking-wider'>AI Tools</p>
                </div>
                <div className='bg-white border border-gray-200 rounded-xl p-3 text-center'>
                    <FiLayers size={18} className='text-emerald-400 mx-auto mb-1'/>
                    <p className='text-lg font-bold text-gray-800'>2</p>
                    <p className='text-[10px] text-gray-400 uppercase tracking-wider'>AI Models</p>
                </div>
                <div className='bg-white border border-gray-200 rounded-xl p-3 text-center'>
                    <FiZap size={18} className='text-pink-400 mx-auto mb-1'/>
                    <p className='text-lg font-bold text-gray-800'>1</p>
                    <p className='text-[10px] text-gray-400 uppercase tracking-wider'>Click Away</p>
                </div>
            </div>

            {/* ── Tool cards ────────────────────────────────────────────── */}
            <div className='grid gap-4'>
                {AI_TOOLS.map((tool) => {
                    const c = colorMap[tool.color]
                    const Icon = tool.icon
                    return (
                        <button
                            key={tool.id}
                            onClick={() => navigate(tool.route)}
                            className={`text-left bg-white border ${c.border} ${c.hoverBorder} rounded-2xl p-4 sm:p-5 transition hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 ${c.ring}`}
                        >
                            <div className='flex gap-4'>
                                <div className={`w-12 h-12 rounded-xl ${c.iconBg} flex items-center justify-center text-white shadow flex-shrink-0`}>
                                    <Icon size={22}/>
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <div className='flex items-center gap-2 mb-1 flex-wrap'>
                                        <h2 className='text-base font-bold text-gray-800'>{tool.title}</h2>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
                                            {tool.badge}
                                        </span>
                                    </div>
                                    <p className='text-sm text-gray-500 leading-relaxed mb-3'>
                                        {tool.description}
                                    </p>
                                    <div className='flex flex-wrap gap-1.5'>
                                        {tool.features.map((f, i) => (
                                            <span key={i} className={`text-[10px] font-medium ${c.text} ${c.bg} px-2 py-0.5 rounded-md`}>
                                                {f}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className={`flex-shrink-0 self-center ${c.arrow}`}>
                                    <FiArrowRight size={20}/>
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* ── Bottom tip ──────────────────────────────────────────── */}
            <div className='mt-8 bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3'>
                <FiTerminal size={16} className='text-gray-400 mt-0.5 flex-shrink-0'/>
                <div>
                    <p className='text-xs text-gray-500 leading-relaxed'>
                        <strong className='text-gray-700'>Tip:</strong> Start with the <strong>Code AI Agent</strong> for quick UI changes, or the <strong>AI Admin Assistant</strong> for store management tasks. All AI tools use your real store data — no demos, no placeholders.
                    </p>
                </div>
            </div>
        </div>
    )
}

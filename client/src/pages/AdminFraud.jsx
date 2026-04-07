import React, { useEffect, useState, useCallback } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import {
  FaShieldAlt, FaExclamationTriangle, FaBan, FaCheckCircle,
  FaSearch, FaSyncAlt, FaUser, FaBoxOpen, FaTrash
} from 'react-icons/fa'
import { MdOutlineWarningAmber } from 'react-icons/md'

const RISK_CONFIG = {
  critical: { color: 'bg-red-100 text-red-700 border-red-300',    dot: 'bg-red-500',    label: 'Critical' },
  high:     { color: 'bg-orange-100 text-orange-700 border-orange-300', dot: 'bg-orange-500', label: 'High' },
  medium:   { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', dot: 'bg-yellow-500', label: 'Medium' },
  low:      { color: 'bg-green-100 text-green-700 border-green-300',  dot: 'bg-green-500',  label: 'Low' },
}

const STATUS_CONFIG = {
  flagged: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: '🚩 Flagged' },
  cleared: { color: 'bg-green-50 text-green-700 border-green-200',    label: '✅ Cleared' },
  blocked: { color: 'bg-red-50 text-red-700 border-red-200',          label: '🔴 Blocked' },
}

const RiskBadge = ({ level }) => {
  const cfg = RISK_CONFIG[level] || RISK_CONFIG.low
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.flagged
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

const StatCard = ({ label, value, sub, color }) => (
  <div className={`rounded-2xl p-4 border ${color}`}>
    <p className='text-2xl font-black'>{value}</p>
    <p className='text-xs font-bold mt-0.5'>{label}</p>
    {sub && <p className='text-[10px] mt-0.5 opacity-70'>{sub}</p>}
  </div>
)

const ActionModal = ({ flag, onClose, onSave }) => {
  const [status, setStatus] = useState(flag.status)
  const [note, setNote] = useState(flag.reviewNote || '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const res = await Axios({ ...SummaryApi.updateFraudFlag, url: `${SummaryApi.updateFraudFlag.url}/${flag._id}`, data: { status, reviewNote: note } })
      if (res.data.success) { toast.success('Updated!'); onSave() }
    } catch { toast.error('Failed to update') }
    finally { setSaving(false) }
  }

  return (
    <div className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4'>
        <div className='flex items-center justify-between'>
          <h3 className='font-bold text-gray-800'>Review Flag</h3>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600 text-lg'>✕</button>
        </div>

        <div className='bg-gray-50 rounded-xl p-3 space-y-1.5'>
          <p className='text-xs font-bold text-gray-500 uppercase'>Risk Reasons</p>
          {flag.reasons?.map((r, i) => (
            <div key={i} className='flex items-start gap-2 text-xs text-gray-700'>
              <MdOutlineWarningAmber className='text-orange-400 flex-shrink-0 mt-0.5' size={13} />
              {r}
            </div>
          ))}
        </div>

        <div>
          <label className='text-xs font-bold text-gray-600 block mb-1'>Update Status</label>
          <div className='flex gap-2'>
            {['flagged', 'cleared', 'blocked'].map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                  status === s
                    ? s === 'blocked' ? 'bg-red-500 text-white border-red-500'
                      : s === 'cleared' ? 'bg-green-500 text-white border-green-500'
                      : 'bg-yellow-400 text-white border-yellow-400'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className='text-xs font-bold text-gray-600 block mb-1'>Admin Note</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            placeholder='Optional note about this review...'
            className='w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-orange-400 resize-none bg-gray-50'
          />
        </div>

        <div className='flex gap-2'>
          <button onClick={onClose} className='flex-1 py-2.5 border rounded-xl text-sm text-gray-600'>Cancel</button>
          <button onClick={save} disabled={saving} className='flex-1 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-bold disabled:opacity-50'>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

const AdminFraud = () => {
  const [flags, setFlags] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [selected, setSelected] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterRisk, setFilterRisk] = useState('all')
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: filterStatus, type: filterType, limit: 200 })
      if (filterRisk !== 'all') params.set('riskLevel', filterRisk)
      const [flagRes, statRes] = await Promise.all([
        Axios({ ...SummaryApi.getFraudFlags, url: `${SummaryApi.getFraudFlags.url}?${params}` }),
        Axios({ ...SummaryApi.getFraudStats }),
      ])
      if (flagRes.data.success) setFlags(flagRes.data.data)
      if (statRes.data.success) setStats(statRes.data.data)
    } catch { toast.error('Failed to load fraud data') }
    finally { setLoading(false) }
  }, [filterStatus, filterType, filterRisk])

  useEffect(() => { fetchData() }, [fetchData])

  const runScan = async () => {
    setScanning(true)
    try {
      const res = await Axios({ ...SummaryApi.runFraudScan })
      toast.success(res.data.message || 'Scan complete')
      fetchData()
    } catch { toast.error('Scan failed') }
    finally { setScanning(false) }
  }

  const deleteFlag = async (id) => {
    if (!confirm('Remove this flag?')) return
    try {
      await Axios({ ...SummaryApi.deleteFraudFlag, url: `${SummaryApi.deleteFraudFlag.url}/${id}` })
      toast.success('Flag removed')
      fetchData()
    } catch { toast.error('Failed') }
  }

  const filtered = flags.filter(f => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      f.userId?.name?.toLowerCase().includes(q) ||
      f.userId?.email?.toLowerCase().includes(q) ||
      f.userId?.mobile?.toString().includes(q) ||
      f.snapshot?.orderId?.toLowerCase().includes(q)
    )
  })

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-5xl mx-auto px-4 py-6 space-y-5'>

        {/* Header */}
        <div className='flex items-start justify-between flex-wrap gap-3'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center'>
              <FaShieldAlt className='text-red-600' size={18} />
            </div>
            <div>
              <h1 className='text-xl font-black text-gray-800'>Fraud Detection</h1>
              <p className='text-xs text-gray-500'>Monitor suspicious orders and users</p>
            </div>
          </div>
          <button
            onClick={runScan}
            disabled={scanning}
            className='flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors'
          >
            <FaSyncAlt size={13} className={scanning ? 'animate-spin' : ''} />
            {scanning ? 'Scanning...' : 'Scan Users'}
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
            <StatCard label='Total Flags' value={stats.total} color='border-gray-200 bg-white text-gray-800' />
            <StatCard label='Critical' value={stats.critical} sub={`${stats.high} high`} color='border-red-200 bg-red-50 text-red-700' />
            <StatCard label='Flagged' value={stats.flagged} color='border-yellow-200 bg-yellow-50 text-yellow-700' />
            <StatCard label='Blocked' value={stats.blocked} sub={`${stats.cleared} cleared`} color='border-purple-200 bg-purple-50 text-purple-700' />
          </div>
        )}

        {/* Filters */}
        <div className='bg-white rounded-2xl border p-4 space-y-3'>
          <div className='relative'>
            <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-300' size={13} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder='Search by name, email, mobile or order ID...'
              className='w-full pl-8 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-orange-400 bg-gray-50'
            />
          </div>
          <div className='flex flex-wrap gap-2 text-xs font-semibold'>
            {/* Status filter */}
            {['all', 'flagged', 'cleared', 'blocked'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-full border transition-colors ${filterStatus === s ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-500 hover:border-orange-300'}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
            <span className='text-gray-300 self-center'>|</span>
            {/* Type filter */}
            {['all', 'order', 'user'].map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-full border transition-colors ${filterType === t ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 text-gray-500 hover:border-blue-300'}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
            <span className='text-gray-300 self-center'>|</span>
            {/* Risk filter */}
            {['all', 'critical', 'high', 'medium', 'low'].map(r => (
              <button key={r} onClick={() => setFilterRisk(r)}
                className={`px-3 py-1.5 rounded-full border transition-colors ${filterRisk === r ? 'bg-red-500 text-white border-red-500' : 'border-gray-200 text-gray-500 hover:border-red-200'}`}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Flag List */}
        {loading ? (
          <div className='flex items-center justify-center py-20'>
            <div className='w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin' />
          </div>
        ) : filtered.length === 0 ? (
          <div className='bg-white rounded-2xl border p-12 text-center'>
            <FaShieldAlt className='text-gray-200 mx-auto mb-3' size={40} />
            <p className='text-gray-400 font-semibold'>No flags found</p>
            <p className='text-gray-400 text-sm mt-1'>Run a user scan or place COD orders to generate data</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {filtered.map(flag => (
              <div key={flag._id} className={`bg-white rounded-2xl border-2 p-4 ${
                flag.riskLevel === 'critical' ? 'border-red-200' :
                flag.riskLevel === 'high' ? 'border-orange-200' :
                flag.riskLevel === 'medium' ? 'border-yellow-200' : 'border-gray-100'
              }`}>
                <div className='flex items-start justify-between gap-3 flex-wrap'>
                  <div className='flex items-center gap-3'>
                    {/* Type icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      flag.type === 'order' ? 'bg-blue-100' : 'bg-purple-100'
                    }`}>
                      {flag.type === 'order'
                        ? <FaBoxOpen className='text-blue-600' size={14} />
                        : <FaUser className='text-purple-600' size={14} />
                      }
                    </div>
                    <div>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <p className='text-sm font-bold text-gray-800'>
                          {flag.userId?.name || 'Unknown User'}
                        </p>
                        <RiskBadge level={flag.riskLevel} />
                        <StatusBadge status={flag.status} />
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          flag.type === 'order' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                        }`}>
                          {flag.type === 'order' ? '📦 Order' : '👤 User'}
                        </span>
                      </div>
                      <p className='text-xs text-gray-500 mt-0.5'>
                        {flag.userId?.email}
                        {flag.userId?.mobile && ` · 📞 ${flag.userId.mobile}`}
                      </p>
                    </div>
                  </div>

                  {/* Risk score */}
                  <div className='flex items-center gap-2 flex-shrink-0'>
                    <div className='text-center'>
                      <p className={`text-2xl font-black leading-none ${
                        flag.riskLevel === 'critical' ? 'text-red-600' :
                        flag.riskLevel === 'high' ? 'text-orange-600' :
                        flag.riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      }`}>{flag.riskScore}</p>
                      <p className='text-[9px] text-gray-400 font-bold uppercase'>RISK SCORE</p>
                    </div>
                  </div>
                </div>

                {/* Order info */}
                {flag.snapshot?.orderId && (
                  <div className='mt-3 flex items-center gap-2 text-xs text-gray-500'>
                    <span className='font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700'>#{flag.snapshot.orderId}</span>
                    {flag.snapshot.totalAmt && (
                      <span className='font-semibold text-gray-700'>{DisplayPriceInRupees(flag.snapshot.totalAmt)}</span>
                    )}
                    <span className='bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded font-semibold'>💵 COD</span>
                  </div>
                )}

                {/* Reasons */}
                <div className='mt-3 space-y-1'>
                  {flag.reasons?.slice(0, 3).map((r, i) => (
                    <div key={i} className='flex items-start gap-2 text-xs text-gray-600'>
                      <FaExclamationTriangle className='text-orange-400 flex-shrink-0 mt-0.5' size={10} />
                      {r}
                    </div>
                  ))}
                  {flag.reasons?.length > 3 && (
                    <p className='text-[10px] text-gray-400'>+{flag.reasons.length - 3} more reasons</p>
                  )}
                </div>

                {/* Review note */}
                {flag.reviewNote && (
                  <div className='mt-2 bg-blue-50 rounded-xl px-3 py-2 text-xs text-blue-700'>
                    💬 {flag.reviewNote}
                  </div>
                )}

                {/* Footer */}
                <div className='mt-3 pt-3 border-t border-dashed border-gray-100 flex items-center justify-between'>
                  <span className='text-[10px] text-gray-400'>Flagged {fmt(flag.createdAt)}</span>
                  <div className='flex items-center gap-2'>
                    <button
                      onClick={() => deleteFlag(flag._id)}
                      className='p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors'
                    >
                      <FaTrash size={11} />
                    </button>
                    <button
                      onClick={() => setSelected(flag)}
                      className='px-3 py-1.5 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700'
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <ActionModal
          flag={selected}
          onClose={() => setSelected(null)}
          onSave={() => { setSelected(null); fetchData() }}
        />
      )}
    </div>
  )
}

export default AdminFraud

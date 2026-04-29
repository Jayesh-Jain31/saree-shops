import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import { FaQuestionCircle, FaCheckCircle, FaLock } from 'react-icons/fa'

const ProductQA = ({ productId }) => {
  const user = useSelector(state => state.user)
  const isAdmin = user?.role === 'ADMIN'
  const [qaList, setQaList] = useState([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [answeringId, setAnsweringId] = useState(null)
  const [answerText, setAnswerText] = useState('')

  const fetchQA = async () => {
    if (!productId) return
    setLoading(true)
    try {
      const res = await Axios({ ...SummaryApi.getProductQA, params: { productId } })
      if (res.data.success) setQaList(res.data.data || [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchQA() }, [productId])

  const handleAsk = async (e) => {
    e.preventDefault()
    if (!question.trim()) return
    setSubmitting(true)
    try {
      const res = await Axios({ ...SummaryApi.askQuestion, data: { productId, question } })
      if (res.data.success) {
        toast.success('Question submitted!')
        setQuestion('')
        fetchQA()
      }
    } catch (err) {
      if (err?.response?.status === 401) toast.error('Please login to ask a question')
      else toast.error('Failed to submit question')
    } finally { setSubmitting(false) }
  }

  const handleAnswer = async (qaId) => {
    if (!answerText.trim()) return
    try {
      const res = await Axios({ url: `/api/qa/${qaId}/answer`, method: 'put', data: { answer: answerText } })
      if (res.data.success) {
        toast.success('Answer saved')
        setAnsweringId(null)
        setAnswerText('')
        fetchQA()
      }
    } catch { toast.error('Failed to save answer') }
  }

  const handleDelete = async (qaId) => {
    if (!window.confirm('Delete this Q&A?')) return
    try {
      await Axios({ url: `/api/qa/${qaId}`, method: 'delete' })
      fetchQA()
    } catch { toast.error('Failed to delete') }
  }

  const answered = qaList.filter(q => q.answer)
  const pending = qaList.filter(q => !q.answer)

  return (
    <div className='mt-6'>
      <h3 className='font-bold text-gray-800 text-lg mb-4 flex items-center gap-2'>
        <FaQuestionCircle className='text-blue-500' size={18} />
        Customer Q&A
        <span className='text-sm font-normal text-gray-400'>({qaList.length})</span>
      </h3>

      {/* Ask a question */}
      {user?._id ? (
        <form onSubmit={handleAsk} className='mb-5 flex gap-2'>
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder='Ask a question about this product...'
            className='flex-1 border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 bg-blue-50'
            maxLength={300}
          />
          <button type='submit' disabled={submitting || !question.trim()} className='px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-sm font-semibold transition'>
            {submitting ? '...' : 'Ask'}
          </button>
        </form>
      ) : (
        <div className='mb-5 flex items-center gap-2 text-sm text-gray-500 bg-gray-50 border rounded-xl px-4 py-3'>
          <FaLock size={13} /> <span>Please login to ask a question</span>
        </div>
      )}

      {loading && <p className='text-sm text-gray-400'>Loading Q&A...</p>}

      {/* Admin: pending answers */}
      {isAdmin && pending.length > 0 && (
        <div className='mb-4 space-y-3'>
          <p className='text-xs font-semibold text-orange-600 uppercase tracking-wide'>Pending Answers ({pending.length})</p>
          {pending.map(qa => (
            <div key={qa._id} className='bg-orange-50 border border-orange-200 rounded-xl p-4'>
              <p className='text-sm font-medium text-gray-800 mb-1'>Q: {qa.question}</p>
              <p className='text-xs text-gray-400 mb-2'>Asked by {qa.userId?.name || 'Customer'}</p>
              {answeringId === qa._id ? (
                <div className='flex gap-2 mt-2'>
                  <textarea
                    value={answerText}
                    onChange={e => setAnswerText(e.target.value)}
                    className='flex-1 border rounded-lg p-2 text-sm resize-none'
                    rows={2}
                    placeholder='Type answer here...'
                  />
                  <div className='flex flex-col gap-1'>
                    <button onClick={() => handleAnswer(qa._id)} className='px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-semibold'>Save</button>
                    <button onClick={() => { setAnsweringId(null); setAnswerText('') }} className='px-3 py-1 bg-gray-100 rounded-lg text-xs'>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className='flex gap-2 mt-1'>
                  <button onClick={() => { setAnsweringId(qa._id); setAnswerText('') }} className='px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold'>Answer</button>
                  <button onClick={() => handleDelete(qa._id)} className='px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs'>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Answered Q&A */}
      {answered.length > 0 ? (
        <div className='space-y-4'>
          {answered.map(qa => (
            <div key={qa._id} className='bg-gray-50 rounded-xl p-4 border'>
              <div className='flex items-start gap-2 mb-2'>
                <span className='text-blue-600 font-bold text-sm flex-shrink-0'>Q</span>
                <p className='text-sm text-gray-800'>{qa.question}</p>
              </div>
              <div className='flex items-start gap-2 ml-5'>
                <FaCheckCircle className='text-green-500 flex-shrink-0 mt-0.5' size={13} />
                <p className='text-sm text-gray-700'>{qa.answer}</p>
              </div>
              {isAdmin && (
                <button onClick={() => handleDelete(qa._id)} className='mt-2 ml-7 text-xs text-red-400 hover:text-red-600'>Delete</button>
              )}
            </div>
          ))}
        </div>
      ) : (
        !loading && <p className='text-sm text-gray-400 text-center py-4'>No answered questions yet. Be the first to ask!</p>
      )}
    </div>
  )
}

export default ProductQA

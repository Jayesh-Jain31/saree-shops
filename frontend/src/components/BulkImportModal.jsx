import React, { useState, useRef } from 'react'
import { FaDownload, FaUpload, FaCheckCircle, FaTimesCircle, FaTimes, FaFileImport } from 'react-icons/fa'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'

const TEMPLATE_HEADERS = ['name', 'price', 'discount', 'stock', 'unit', 'description', 'category', 'subCategory', 'image', 'publish']
const TEMPLATE_EXAMPLE = [
  ['Banarasi Silk Saree', '2499', '10', '50', '1 piece', 'Beautiful Banarasi silk saree with golden border', 'Saree', 'Silk Sarees', 'https://example.com/image.jpg', 'true'],
  ['Cotton Printed Saree', '899', '5', '100', '1 piece', 'Lightweight cotton saree with floral print', 'Saree', 'Cotton Sarees', '', 'true'],
]

const parseCSV = (text) => {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim())
  if (lines.length < 2) return { headers: [], rows: [], error: 'CSV must have at least a header row and one data row' }

  const parseRow = (line) => {
    const result = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQuotes = !inQuotes }
      else if (line[i] === ',' && !inQuotes) { result.push(current.trim()); current = '' }
      else { current += line[i] }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseRow(lines[0]).map(h => h.replace(/^"|"$/g, '').trim().toLowerCase())
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const vals = parseRow(lines[i])
    if (vals.every(v => !v.trim())) continue
    const obj = {}
    headers.forEach((h, idx) => { obj[h] = (vals[idx] || '').replace(/^"|"$/g, '').trim() })
    rows.push(obj)
  }
  return { headers, rows, error: null }
}

const downloadTemplate = () => {
  const rows = [TEMPLATE_HEADERS, ...TEMPLATE_EXAMPLE]
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'product_import_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

const BulkImportModal = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState('upload')
  const [rows, setRows] = useState([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [fileName, setFileName] = useState('')
  const fileRef = useRef()

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.name.endsWith('.csv')) return toast.error('Please upload a .csv file')
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const { rows: parsed, error } = parseCSV(ev.target.result)
      if (error) return toast.error(error)
      if (parsed.length === 0) return toast.error('No data rows found in CSV')
      if (parsed.length > 500) return toast.error('Max 500 rows per import')
      setRows(parsed)
      setStep('preview')
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    setImporting(true)
    try {
      const res = await Axios({ ...SummaryApi.bulkImportProduct, data: { products: rows } })
      if (res.data.success) {
        setResult(res.data.data)
        setStep('result')
        if (res.data.data.succeeded > 0) onSuccess?.()
      } else {
        toast.error(res.data.message || 'Import failed')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const hasRequired = (row) => row.name && row.price && row.unit && row.description

  return (
    <div className='fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4' onClick={onClose}>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col' onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className='flex items-center justify-between p-5 border-b flex-shrink-0'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center'>
              <FaFileImport className='text-blue-600' size={18} />
            </div>
            <div>
              <h2 className='font-bold text-gray-800'>Bulk Import Products</h2>
              <p className='text-xs text-gray-500'>Upload a CSV to add multiple products at once</p>
            </div>
          </div>
          <button onClick={onClose} className='w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100'>
            <FaTimes className='text-gray-500' size={14} />
          </button>
        </div>

        {/* Body */}
        <div className='overflow-y-auto flex-1 p-5'>

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className='space-y-4'>
              <div className='bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 space-y-2'>
                <p className='font-semibold'>📋 CSV Column Guide:</p>
                <div className='grid grid-cols-2 gap-1 text-xs'>
                  <span><b>name</b> — Product name (required)</span>
                  <span><b>price</b> — Price in ₹ (required)</span>
                  <span><b>unit</b> — e.g. "1 piece" (required)</span>
                  <span><b>description</b> — Description (required)</span>
                  <span><b>discount</b> — Discount % e.g. 10</span>
                  <span><b>stock</b> — Stock quantity</span>
                  <span><b>category</b> — Category name (must exist)</span>
                  <span><b>subCategory</b> — Sub-category name (must exist)</span>
                  <span><b>image</b> — Image URL (use | to separate multiple)</span>
                  <span><b>publish</b> — true or false</span>
                </div>
              </div>

              <button
                onClick={downloadTemplate}
                className='flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-700 transition'
              >
                <FaDownload size={14} /> Download Template CSV
              </button>

              <div
                onClick={() => fileRef.current?.click()}
                className='border-2 border-dashed border-blue-300 rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:bg-blue-50 transition'
              >
                <FaUpload className='text-blue-400' size={32} />
                <p className='text-sm font-semibold text-gray-600'>Click to select your CSV file</p>
                <p className='text-xs text-gray-400'>Max 500 rows per upload</p>
              </div>
              <input ref={fileRef} type='file' accept='.csv' className='hidden' onChange={handleFile} />
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <p className='text-sm font-semibold text-gray-700'>{fileName} — <span className='text-blue-600'>{rows.length} rows</span></p>
                <button onClick={() => { setStep('upload'); setRows([]); setFileName(''); fileRef.current && (fileRef.current.value = '') }} className='text-xs text-gray-400 underline'>Change file</button>
              </div>
              <div className='overflow-x-auto rounded-xl border'>
                <table className='w-full text-xs'>
                  <thead className='bg-gray-50 border-b'>
                    <tr>
                      <th className='px-3 py-2 text-left text-gray-500 font-semibold'>#</th>
                      <th className='px-3 py-2 text-left text-gray-500 font-semibold'>Name</th>
                      <th className='px-3 py-2 text-left text-gray-500 font-semibold'>Price</th>
                      <th className='px-3 py-2 text-left text-gray-500 font-semibold'>Discount</th>
                      <th className='px-3 py-2 text-left text-gray-500 font-semibold'>Stock</th>
                      <th className='px-3 py-2 text-left text-gray-500 font-semibold'>Unit</th>
                      <th className='px-3 py-2 text-left text-gray-500 font-semibold'>Category</th>
                      <th className='px-3 py-2 text-left text-gray-500 font-semibold'>Status</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y'>
                    {rows.slice(0, 50).map((row, i) => {
                      const ok = hasRequired(row)
                      return (
                        <tr key={i} className={ok ? 'bg-white' : 'bg-red-50'}>
                          <td className='px-3 py-2 text-gray-400'>{i + 2}</td>
                          <td className='px-3 py-2 font-medium text-gray-800 max-w-[140px] truncate'>{row.name || <span className='text-red-400'>missing</span>}</td>
                          <td className='px-3 py-2'>₹{row.price || <span className='text-red-400'>missing</span>}</td>
                          <td className='px-3 py-2'>{row.discount ? `${row.discount}%` : '—'}</td>
                          <td className='px-3 py-2'>{row.stock || '—'}</td>
                          <td className='px-3 py-2'>{row.unit || <span className='text-red-400'>missing</span>}</td>
                          <td className='px-3 py-2 max-w-[100px] truncate'>{row.category || '—'}</td>
                          <td className='px-3 py-2'>
                            {ok
                              ? <span className='text-green-600 font-semibold'>✓ Ready</span>
                              : <span className='text-red-500 font-semibold'>✗ Incomplete</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {rows.length > 50 && <p className='text-xs text-gray-400 text-center py-2'>Showing first 50 of {rows.length} rows</p>}
              </div>
              <p className='text-xs text-gray-500'>
                {rows.filter(hasRequired).length} of {rows.length} rows are valid and will be imported.
                {rows.filter(r => !hasRequired(r)).length > 0 && <span className='text-red-500 ml-1'>{rows.filter(r => !hasRequired(r)).length} rows will be skipped (missing required fields).</span>}
              </p>
            </div>
          )}

          {/* Step 3: Result */}
          {step === 'result' && result && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='bg-green-50 border border-green-200 rounded-xl p-4 text-center'>
                  <FaCheckCircle className='text-green-500 mx-auto mb-1' size={28} />
                  <p className='text-2xl font-bold text-green-600'>{result.succeeded}</p>
                  <p className='text-xs text-green-700 font-medium'>Products Created</p>
                </div>
                <div className='bg-red-50 border border-red-200 rounded-xl p-4 text-center'>
                  <FaTimesCircle className='text-red-400 mx-auto mb-1' size={28} />
                  <p className='text-2xl font-bold text-red-500'>{result.failed}</p>
                  <p className='text-xs text-red-600 font-medium'>Failed / Skipped</p>
                </div>
              </div>
              {result.failedRows?.length > 0 && (
                <div className='rounded-xl border overflow-hidden'>
                  <div className='bg-red-50 px-4 py-2 border-b'>
                    <p className='text-xs font-bold text-red-600'>Failed Rows</p>
                  </div>
                  <div className='divide-y max-h-48 overflow-y-auto'>
                    {result.failedRows.map((f, i) => (
                      <div key={i} className='px-4 py-2 text-xs flex gap-3'>
                        <span className='text-gray-400 w-10'>Row {f.row}</span>
                        <span className='font-medium text-gray-700 flex-1 truncate'>{f.name}</span>
                        <span className='text-red-500'>{f.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='border-t p-4 flex-shrink-0 flex gap-3 justify-end'>
          {step === 'upload' && (
            <button onClick={onClose} className='px-5 py-2.5 border rounded-xl text-sm text-gray-600 hover:bg-gray-50'>Cancel</button>
          )}
          {step === 'preview' && (
            <>
              <button onClick={onClose} className='px-5 py-2.5 border rounded-xl text-sm text-gray-600 hover:bg-gray-50'>Cancel</button>
              <button
                onClick={handleImport}
                disabled={importing || rows.filter(hasRequired).length === 0}
                className='px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition'
              >
                {importing
                  ? <><div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' /> Importing...</>
                  : <><FaFileImport size={14} /> Import {rows.filter(hasRequired).length} Products</>}
              </button>
            </>
          )}
          {step === 'result' && (
            <button onClick={onClose} className='px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700'>
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default BulkImportModal

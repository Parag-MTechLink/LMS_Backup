import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams, useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import { estimationsService, rfqsService } from '../../../services/labManagementApi'
import { formatCurrencyINR } from '../../../utils/currency'
import { Plus, X, Trash2, ExternalLink, Eye, User, Package, Clock, DollarSign, FileText, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react'

// Status config
const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'pendingreview', label: 'Pending Review', color: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  { value: 'accepted', label: 'Accepted', color: 'bg-green-50 text-greengreen-800 border-green-200' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-50 text-red-800 border-red-200' },
]

const TEST_TYPE_MAP = {
  1: 'EMC Testing',
  2: 'RF Testing',
  3: 'Safety Testing',
}

function Estimations() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [estimations, setEstimations] = useState([])
  const [rfqs, setRfqs] = useState([])
  const [testTypes, setTestTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    rfqId: 0,
    margin: 0,
    discount: 0,
    notes: '',
  })
  const [testItems, setTestItems] = useState([])

  // View / detail modal state
  const [viewEstimation, setViewEstimation] = useState(null)   // row data (fast)
  const [viewDetails, setViewDetails] = useState(null)   // full API response
  const [viewLoading, setViewLoading] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [reviewComments, setReviewComments] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)

  useEffect(() => {
    loadData()
    const createFromRfq = searchParams.get('createFromRfq')
    if (createFromRfq) {
      setFormData(prev => ({ ...prev, rfqId: parseInt(createFromRfq) }))
      setShowModal(true)
    }
  }, [searchParams])

  const loadData = async () => {
    try {
      const [estimationsData, rfqsData, testTypesData] = await Promise.all([
        estimationsService.getAll(),
        rfqsService.getAll(),
        estimationsService.getTestTypes(),
      ])
      const rfqId = searchParams.get('rfqId')
      let filtered = estimationsData
      if (rfqId) filtered = estimationsData.filter(e => e.rfqId?.toString() === rfqId)
      setEstimations(filtered)
      setRfqs(rfqsData)
      setTestTypes(testTypesData)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // ─── View modal ────────────────────────────────────────────
  const handleViewClick = async (estimation) => {
    setViewEstimation(estimation)
    setViewDetails(null)
    setNewStatus(estimation.status ?? 'draft')
    setReviewComments('')
    setViewLoading(true)
    try {
      const detail = await estimationsService.getById(estimation.id)
      setViewDetails(detail)
      setNewStatus(detail.status ?? estimation.status ?? 'draft')
    } catch {
      setViewDetails(estimation)   // fallback to list row
    } finally {
      setViewLoading(false)
    }
  }

  const closeView = () => {
    setViewEstimation(null)
    setViewDetails(null)
    setReviewComments('')
  }

  const handleSaveStatus = async () => {
    if (!viewEstimation) return
    setSavingStatus(true)
    try {
      await estimationsService.review(viewEstimation.id, {
        status: newStatus,
        comments: reviewComments || undefined,
      })
      toast.success('Status updated successfully')
      // Update local list without full reload
      setEstimations(prev =>
        prev.map(e => e.id === viewEstimation.id ? { ...e, status: newStatus } : e)
      )
      setViewEstimation(prev => prev ? { ...prev, status: newStatus } : prev)
      setViewDetails(prev => prev ? { ...prev, status: newStatus } : prev)
      setReviewComments('')
    } catch {
      toast.error('Failed to update status')
    } finally {
      setSavingStatus(false)
    }
  }

  // ─── Create modal helpers ───────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.rfqId === 0) { toast.error('Please select an RFQ'); return }
    if (testItems.length === 0) { toast.error('Please add at least one test item'); return }
    try {
      await estimationsService.create({
        rfqId: formData.rfqId,
        tests: testItems,
        margin: formData.margin,
        discount: formData.discount,
        notes: formData.notes,
      })
      toast.success('Estimation created successfully')
      setShowModal(false)
      resetForm()
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create estimation')
    }
  }

  const resetForm = () => {
    setFormData({ rfqId: 0, margin: 0, discount: 0, notes: '' })
    setTestItems([])
  }

  const addTestItem = () =>
    setTestItems([...testItems, { testTypeId: 0, numberOfDUT: 1, hours: 0, ratePerHour: 0, remarks: '' }])

  const removeTestItem = (index) =>
    setTestItems(testItems.filter((_, i) => i !== index))

  const updateTestItem = (index, field, value) => {
    const updated = [...testItems]
    updated[index] = { ...updated[index], [field]: value }
    if (field === 'testTypeId' && value) {
      const tt = testTypes.find(t => t.id === value)
      if (tt) updated[index].ratePerHour = tt.defaultRate
    }
    setTestItems(updated)
  }

  const calcTestCost = (item) => item.hours * item.ratePerHour * item.numberOfDUT
  const calcSubtotal = () => testItems.reduce((s, i) => s + calcTestCost(i), 0)
  const calcTotalHours = () => testItems.reduce((s, i) => s + i.hours * i.numberOfDUT, 0)
  const calcTotal = () => {
    const sub = calcSubtotal()
    return sub * (1 + formData.margin / 100) * (1 - formData.discount / 100)
  }

  const getStatusGradient = (status) => {
    const s = status?.toLowerCase() ?? ''
    if (s === 'draft') return 'from-gray-400 to-gray-500'
    if (s === 'accepted') return 'from-green-400 to-emerald-500'
    if (s === 'rejected') return 'from-red-400 to-pink-500'
    if (s === 'pendingreview') return 'from-yellow-400 to-orange-500'
    return 'from-blue-400 to-cyan-500'
  }

  const getStatusLabel = (status) =>
    STATUS_OPTIONS.find(o => o.value === status?.toLowerCase())?.label ?? status

  const display = viewDetails ?? viewEstimation

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-gray-600">Loading estimations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Estimations</h1>
          <p className="text-gray-600">Project cost estimations and proposals</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Estimation</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Estimations', value: estimations.length, color: 'border-green-500', bg: 'bg-green-100', emoji: '💰' },
          { label: 'Total Value', value: formatCurrencyINR(estimations.reduce((s, e) => s + (e.totalCost || 0), 0)), color: 'border-blue-500', bg: 'bg-blue-100', emoji: '📊' },
          { label: 'Total Hours', value: estimations.reduce((s, e) => s + (e.totalHours || 0), 0).toFixed(1), color: 'border-purple-500', bg: 'bg-purple-100', emoji: '⏱️' },
          { label: 'Accepted', value: estimations.filter(e => e.status?.toLowerCase() === 'accepted').length, color: 'border-orange-500', bg: 'bg-orange-100', emoji: '✓' },
        ].map(card => (
          <div key={card.label} className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${card.color}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-full ${card.bg} flex items-center justify-center`}>
                <span className="text-2xl">{card.emoji}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-green-50">
              <tr>
                {['Estimation ID', 'Customer', 'Product', 'Total Cost', 'Total Hours', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {estimations.length > 0 ? estimations.map((est, idx) => (
                <motion.tr
                  key={est.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-green-50 transition-colors duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{est.estimationId}</div>
                    <div className="text-xs text-gray-500">v{est.version}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {est.rfqCustomerName?.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-900">{est.rfqCustomerName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{est.rfqProduct}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{formatCurrencyINR(est.totalCost)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{est.totalHours?.toFixed(1) || '0.0'} hrs</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r ${getStatusGradient(est.status)} text-white shadow-sm`}>
                      {getStatusLabel(est.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex flex-col gap-1 items-start">
                      <button
                        onClick={() => handleViewClick(est)}
                        className="text-green-600 hover:text-green-800 transition-colors"
                      >
                        View
                      </button>
                      {est.status?.toLowerCase() === 'accepted' && (
                        <button
                          onClick={() => navigate(`/lab/management/projects?createFromEstimation=${est.id}`)}
                          className="text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
                        >
                          Create Project <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <span className="text-3xl">💰</span>
                      </div>
                      <p className="text-gray-600 font-medium mb-1">No estimations yet</p>
                      <p className="text-sm text-gray-400">Get started by creating your first estimation</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          VIEW ESTIMATION DETAILS MODAL
      ══════════════════════════════════════════ */}
      {viewEstimation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-200 max-h-[92vh] flex flex-col"
          >
            {/* Modal header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {display?.estimationId ?? viewEstimation.estimationId}
                      <span className="ml-2 text-sm font-normal text-gray-500">v{display?.version ?? viewEstimation.version}</span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">Estimation Details</p>
                  </div>
                </div>
                <button
                  onClick={closeView}
                  className="p-2 hover:bg-white/70 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {viewLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                  <div className="w-8 h-8 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
                  <span className="text-sm">Loading details…</span>
                </div>
              ) : (
                <>
                  {/* Current status badge */}
                  <div>
                    <span className={`inline-flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-full bg-gradient-to-r ${getStatusGradient(display?.status)} text-white shadow-sm`}>
                      {display?.status?.toLowerCase() === 'accepted' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {getStatusLabel(display?.status)}
                    </span>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4 flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Customer</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{display?.rfqCustomerName || '—'}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Product</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{display?.rfqProduct || '—'}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Hours</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{display?.totalHours?.toFixed(1) || '0.0'} hrs</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Cost</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{formatCurrencyINR(display?.totalCost)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Cost breakdown */}
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Cost Breakdown</h3>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Margin</span>
                        <span className="font-medium">{display?.margin ?? 0}%</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Discount</span>
                        <span className="font-medium">{display?.discount ?? 0}%</span>
                      </div>
                      <div className="flex justify-between font-bold text-green-700 pt-1.5 border-t border-green-200">
                        <span>Total Cost</span>
                        <span>{formatCurrencyINR(display?.totalCost)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Test Items */}
                  {display?.items?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                          {display.items.length}
                        </span>
                        Test Items
                      </h3>
                      <div className="overflow-hidden rounded-xl border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-100 text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              {['#', 'Test Type', 'DUT', 'Hours', 'Rate/hr', 'Cost', 'Remarks'].map(h => (
                                <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {display.items.map((item, i) => {
                              const ttName = testTypes.find(t => t.id === item.testTypeId)?.name
                                ?? TEST_TYPE_MAP[item.testTypeId]
                                ?? `Type ${item.testTypeId}`
                              const cost = item.hours * item.ratePerHour * item.numberOfDUT
                              return (
                                <tr key={i} className="hover:bg-green-50 transition-colors">
                                  <td className="px-3 py-2.5 text-xs text-gray-400">{i + 1}</td>
                                  <td className="px-3 py-2.5 font-medium text-gray-900">{ttName}</td>
                                  <td className="px-3 py-2.5 text-gray-600">{item.numberOfDUT}</td>
                                  <td className="px-3 py-2.5 text-gray-600">{item.hours}</td>
                                  <td className="px-3 py-2.5 text-gray-600">{formatCurrencyINR(item.ratePerHour)}</td>
                                  <td className="px-3 py-2.5 font-semibold text-gray-900">{formatCurrencyINR(cost)}</td>
                                  <td className="px-3 py-2.5 text-gray-500 text-xs">{item.remarks || '—'}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {display?.notes && (
                    <div className="bg-gray-50 rounded-xl p-4 flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Notes</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{display.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* ── Status Change ── */}
                  <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                      Change Status
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {STATUS_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setNewStatus(opt.value)}
                          className={`px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-150
                            ${newStatus === opt.value
                              ? 'ring-2 ring-offset-1 ring-green-500 border-green-500 bg-green-50 text-green-800'
                              : `${opt.color} hover:opacity-80`
                            }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows={2}
                      value={reviewComments}
                      onChange={e => setReviewComments(e.target.value)}
                      placeholder="Optional comments (appended to notes)"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-all"
                    />
                    <button
                      onClick={handleSaveStatus}
                      disabled={savingStatus || newStatus === (display?.status ?? '')}
                      className="w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow hover:shadow-md hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-150"
                    >
                      {savingStatus ? 'Saving…' : 'Save Status'}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button
                onClick={closeView}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {display?.status?.toLowerCase() === 'accepted' && (
                <button
                  onClick={() => {
                    closeView()
                    navigate(`/lab/management/projects?createFromEstimation=${viewEstimation.id}`)
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Create Project <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          CREATE ESTIMATION MODAL
      ══════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 my-8"
          >
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Create New Estimation</h2>
                <button onClick={() => { setShowModal(false); resetForm() }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* RFQ Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">RFQ <span className="text-red-500">*</span></label>
                <select
                  required
                  value={formData.rfqId}
                  onChange={(e) => setFormData({ ...formData, rfqId: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  <option value={0}>Select RFQ</option>
                  {rfqs.map(rfq => (
                    <option key={rfq.id} value={rfq.id}>{rfq.customerName} - {rfq.product}</option>
                  ))}
                </select>
              </div>

              {/* Test Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">Test Items <span className="text-red-500">*</span></label>
                  <button
                    type="button"
                    onClick={addTestItem}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Test
                  </button>
                </div>
                <div className="space-y-4">
                  {testItems.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">Test Item {index + 1}</span>
                        <button type="button" onClick={() => removeTestItem(index)} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1">
                          <Trash2 className="w-4 h-4" /> Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Test Type</label>
                          <select
                            required
                            value={item.testTypeId}
                            onChange={(e) => updateTestItem(index, 'testTypeId', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          >
                            <option value={0}>Select Test Type</option>
                            {testTypes.map(tt => (
                              <option key={tt.id} value={tt.id}>{tt.name} ({formatCurrencyINR(tt.defaultRate)}/hr)</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Number of DUT</label>
                          <input type="number" required min="1" value={item.numberOfDUT}
                            onChange={(e) => updateTestItem(index, 'numberOfDUT', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Hours</label>
                          <input type="number" required min="0" step="0.1" value={item.hours}
                            onChange={(e) => updateTestItem(index, 'hours', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Rate per Hour (₹)</label>
                          <input type="number" required min="0" step="0.01" value={item.ratePerHour}
                            onChange={(e) => updateTestItem(index, 'ratePerHour', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
                          <input type="text" value={item.remarks}
                            onChange={(e) => updateTestItem(index, 'remarks', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                            placeholder="Optional remarks" />
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 pt-2 border-t border-gray-100">
                        Cost: {formatCurrencyINR(calcTestCost(item))}
                      </div>
                    </div>
                  ))}
                  {testItems.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                      <p className="text-gray-500 text-sm">No test items added yet</p>
                      <p className="text-gray-400 text-xs mt-1">Click "Add Test" to get started</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cost Calculation */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Cost Calculation</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">{formatCurrencyINR(calcSubtotal())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Hours:</span>
                    <span className="font-semibold">{calcTotalHours().toFixed(1)} hrs</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Margin (%)</label>
                      <input type="number" min="0" step="0.1" value={formData.margin}
                        onChange={(e) => setFormData({ ...formData, margin: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Discount (%)</label>
                      <input type="number" min="0" step="0.1" value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm" />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-green-200 mt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-semibold">Total Cost:</span>
                      <span className="text-lg font-bold text-green-700">{formatCurrencyINR(calcTotal())}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Optional notes about this estimation"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm() }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  Create Estimation
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Estimations

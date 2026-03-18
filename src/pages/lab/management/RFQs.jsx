import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { rfqsService, customersService } from '../../../services/labManagementApi'
import { getApiErrorMessage } from '../../../utils/apiError'
import toast, { Toaster } from 'react-hot-toast'
import { Plus, X, FileSpreadsheet, Trash2, Download, User, Mail, Phone, Package, Calendar, AlertCircle, CheckCircle, Clock, Eye, ChevronDown } from 'lucide-react'
import RouteSkeleton from '../../../components/RouteSkeleton'
import ConfirmDeleteModal from '../../../components/labManagement/ConfirmDeleteModal'
import { useLabManagementAuth } from '../../../contexts/LabManagementAuthContext'

function RFQs() {
  const navigate = useNavigate()
  const { user } = useLabManagementAuth()
  const isAdmin = user?.role === 'Admin'
  const [rfqs, setRfqs] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadError, setUploadError] = useState(null)
  const [uploadMissing, setUploadMissing] = useState([])
  const [uploading, setUploading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  // View Details modal
  const [viewRfq, setViewRfq] = useState(null)
  const [viewDetails, setViewDetails] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  // Status change inside view modal
  const [rfqStatus, setRfqStatus] = useState('')
  const [rfqComment, setRfqComment] = useState('')
  const [savingRfqStatus, setSavingRfqStatus] = useState(false)
  const [formData, setFormData] = useState({
    customerId: 0,
    product: '',
    receivedDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [rfqsData, customersData] = await Promise.all([
        rfqsService.getAll(),
        customersService.getAll(),
      ])
      setRfqs(rfqsData)
      setCustomers(customersData)
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return;

    if (!formData.customerId || formData.customerId === 0) {
      toast.error('Please select a customer')
      return
    }

    try {
      setIsSubmitting(true)
      await rfqsService.create(formData)
      toast.success('RFQ created successfully')
      setShowModal(false)
      setFormData({ customerId: 0, product: '', receivedDate: new Date().toISOString().split('T')[0] })
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create RFQ')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      toast.error('Please select an Excel file (.xlsx)')
      return
    }
    setUploading(true)
    setUploadError(null)
    setUploadMissing([])
    try {
      const res = await rfqsService.uploadExcel(uploadFile)
      const errList = res.errors ?? res.missing_fields ?? []
      if (res.status === 'Incomplete' && errList.length) {
        setUploadMissing(errList)
        setUploadError(res.message || 'Validation failed. Please fix errors.')
      } else {
        toast.success(res.message || 'RFQ submitted successfully.')
        setShowUploadModal(false)
        setUploadFile(null)
        setUploadMissing([])
        setUploadError(null)
        loadData()
      }
    } catch (error) {
      const msg = getApiErrorMessage(error)
      setUploadError(msg)
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleViewClick = async (rfq) => {
    setViewRfq(rfq)
    setViewDetails(null)
    setRfqStatus(rfq.status ?? 'pending')
    setRfqComment('')
    setViewLoading(true)
    try {
      const details = await rfqsService.getById(rfq.id)
      setViewDetails(details)
      setRfqStatus(details?.status ?? rfq.status ?? 'pending')
    } catch {
      // Fallback: show what we already have from the list
      setViewDetails(rfq)
    } finally {
      setViewLoading(false)
    }
  }

  const handleSaveRfqStatus = async () => {
    if (!viewRfq) return
    setSavingRfqStatus(true)
    try {
      await rfqsService.updateStatus(viewRfq.id, rfqStatus)
      toast.success('Status updated successfully')
      setRfqs(prev => prev.map(r => r.id === viewRfq.id ? { ...r, status: rfqStatus } : r))
      setViewRfq(prev => prev ? { ...prev, status: rfqStatus } : prev)
      setViewDetails(prev => prev ? { ...prev, status: rfqStatus } : prev)
      setRfqComment('')
    } catch {
      toast.error('Failed to update status')
    } finally {
      setSavingRfqStatus(false)
    }
  }

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() ?? ''
    if (statusLower === 'pending') return 'from-yellow-400 to-orange-500'
    if (statusLower === 'approved') return 'from-green-400 to-emerald-500'
    if (statusLower === 'rejected') return 'from-red-400 to-pink-500'
    if (statusLower === 'pending review') return 'from-blue-400 to-cyan-500'
    return 'from-blue-400 to-cyan-500'
  }

  const getStatusIcon = (status) => {
    const s = status?.toLowerCase() ?? ''
    if (s === 'approved') return <CheckCircle className="w-4 h-4" />
    if (s === 'rejected') return <AlertCircle className="w-4 h-4" />
    return <Clock className="w-4 h-4" />
  }

  const handleDeleteClick = (e, rfq) => {
    e.stopPropagation()
    setDeleteTarget(rfq)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await rfqsService.delete(deleteTarget.id)
      toast.success('RFQ deleted successfully')
      setDeleteTarget(null)
      loadData()
    } catch (err) {
      toast.error(getApiErrorMessage(err) || 'Failed to delete RFQ')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <RouteSkeleton />
  }

  // Resolve display data (prefer detailed fetch, fall back to list row)
  const displayRfq = viewDetails ?? viewRfq

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">RFQs</h1>
          <p className="text-gray-600">Request for Quotations management</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create RFQ</span>
          </button>
          <button
            onClick={() => { setShowUploadModal(true); setUploadError(null); setUploadMissing([]); setUploadFile(null); }}
            className="px-6 py-3 border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary/10 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>Upload RFQ (Excel)</span>
          </button>
        </div>
      </div>

      {/* RFQs Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-primary/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Received Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rfqs.length > 0 ? (
                rfqs.map((rfq, index) => (
                  <motion.tr
                    key={rfq.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-primary/5 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {rfq.customerName.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="ml-3 text-sm font-medium text-gray-900">{rfq.customerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{rfq.product}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {new Date(rfq.receivedDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r ${getStatusColor(rfq.status)} text-white shadow-sm`}>
                        {rfq.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewClick(rfq)}
                        className="text-primary hover:text-primary-dark transition-colors mr-3"
                      >
                        View
                      </button>
                      <button
                        onClick={() => {
                          navigate(`/lab/management/estimations?createFromRfq=${rfq.id}`)
                        }}
                        className="text-green-600 hover:text-green-800 transition-colors mr-3"
                      >
                        Create Estimation
                      </button>
                      {isAdmin && (
                        <button
                          onClick={(e) => handleDeleteClick(e, rfq)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                          title="Delete RFQ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <span className="text-3xl">📋</span>
                      </div>
                      <p className="text-gray-600 font-medium mb-1">No RFQs yet</p>
                      <p className="text-sm text-gray-400">Get started by creating your first RFQ</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── View RFQ Details Modal ── */}
      {viewRfq && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-md">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">RFQ Details</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      ID: <span className="font-mono">{viewRfq.id}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setViewRfq(null); setViewDetails(null); }}
                  className="p-2 hover:bg-white/70 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {viewLoading ? (
              <div className="p-10 flex flex-col items-center justify-center gap-3 text-gray-400">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-sm">Loading details…</span>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Status badge */}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-full bg-gradient-to-r ${getStatusColor(displayRfq?.status ?? viewRfq.status)} text-white shadow-sm`}>
                    {getStatusIcon(displayRfq?.status ?? viewRfq.status)}
                    {displayRfq?.status ?? viewRfq.status}
                  </span>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Customer */}
                  <div className="bg-gray-50 rounded-xl p-4 flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Customer</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">
                        {displayRfq?.customerName ?? displayRfq?.company_name ?? viewRfq.customerName}
                      </p>
                      {displayRfq?.contact_person && (
                        <p className="text-xs text-gray-500 mt-0.5">{displayRfq.contact_person}</p>
                      )}
                    </div>
                  </div>

                  {/* Product */}
                  <div className="bg-gray-50 rounded-xl p-4 flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Product / Project</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">
                        {displayRfq?.product ?? displayRfq?.project_type ?? viewRfq.product}
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  {displayRfq?.email && (
                    <div className="bg-gray-50 rounded-xl p-4 flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Email</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">{displayRfq.email}</p>
                      </div>
                    </div>
                  )}

                  {/* Phone */}
                  {displayRfq?.phone && (
                    <div className="bg-gray-50 rounded-xl p-4 flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Phone</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{displayRfq.phone}</p>
                      </div>
                    </div>
                  )}

                  {/* Received Date */}
                  <div className="bg-gray-50 rounded-xl p-4 flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Received Date</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {new Date(displayRfq?.receivedDate ?? viewRfq.receivedDate).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Deadline */}
                  {displayRfq?.deadline && (
                    <div className="bg-gray-50 rounded-xl p-4 flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Deadline</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">
                          {new Date(displayRfq.deadline).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sample / Test Details */}
                {displayRfq?.sample_details && Array.isArray(displayRfq.sample_details) && displayRfq.sample_details.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        {displayRfq.sample_details.length}
                      </span>
                      Test / Sample Items
                    </h3>
                    <div className="overflow-hidden rounded-xl border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Test Name</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Standard</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {displayRfq.sample_details.map((item, i) => (
                            <tr key={i} className="hover:bg-primary/5 transition-colors">
                              <td className="px-4 py-2.5 text-xs text-gray-400">{i + 1}</td>
                              <td className="px-4 py-2.5 text-sm text-gray-900 font-medium">{item.test_name ?? item.name ?? '—'}</td>
                              <td className="px-4 py-2.5 text-sm text-gray-600">{item.standard ?? '—'}</td>
                              <td className="px-4 py-2.5 text-sm text-gray-600 text-right">{item.quantity ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Missing fields warning */}
                {displayRfq?.missing_fields?.length > 0 && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800 mb-1">Missing / Invalid Fields</p>
                      <ul className="list-disc list-inside text-sm text-amber-700 space-y-0.5">
                        {displayRfq.missing_fields.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
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
                    {[
                      { value: 'pending', label: 'Pending', border: 'border-yellow-200 bg-yellow-50 text-yellow-800' },
                      { value: 'pending review', label: 'Pending Review', border: 'border-blue-200 bg-blue-50 text-blue-800' },
                      { value: 'approved', label: 'Approved', border: 'border-green-200 bg-green-50 text-green-800' },
                      { value: 'rejected', label: 'Rejected', border: 'border-red-200 bg-red-50 text-red-800' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setRfqStatus(opt.value)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-150
                          ${rfqStatus === opt.value
                            ? 'ring-2 ring-offset-1 ring-primary border-primary bg-primary/10 text-primary'
                            : `${opt.border} hover:opacity-80`
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    value={rfqComment}
                    onChange={e => setRfqComment(e.target.value)}
                    placeholder="Optional comment"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all"
                  />
                  <button
                    onClick={handleSaveRfqStatus}
                    disabled={savingRfqStatus || rfqStatus === (displayRfq?.status ?? viewRfq?.status ?? '')}
                    className="w-full py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl shadow hover:shadow-md hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-150"
                  >
                    {savingRfqStatus ? 'Saving…' : 'Save Status'}
                  </button>
                </div>

                {/* Footer actions */}
                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => { setViewRfq(null); setViewDetails(null); }}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setViewRfq(null)
                      setViewDetails(null)
                      navigate(`/lab/management/estimations?createFromRfq=${viewRfq.id}`)
                    }}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
                  >
                    Create Estimation
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Create RFQ Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Create New RFQ</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <p className="text-sm text-red-500 mb-4">Please fill all the mandatory details in the form (*)</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value={0}>Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Received Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.receivedDate}
                  onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create RFQ'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Upload RFQ (Excel) Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Upload RFQ (Excel)</h2>
                <button
                  onClick={() => { setShowUploadModal(false); setUploadFile(null); setUploadError(null); setUploadMissing([]); }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Upload a .xlsx file. Row 2: company, contact, email, phone, project title, testing type, deadline, urgent; from row 6: test name, standard, quantity.</p>
              <button
                type="button"
                onClick={() => rfqsService.downloadTemplate().catch(() => toast.error('Failed to download template'))}
                className="flex items-center gap-2 text-sm text-primary hover:underline font-medium"
              >
                <Download className="w-4 h-4" />
                Download Excel template
              </button>
              <input
                type="file"
                accept=".xlsx"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-medium"
              />
              {uploadError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                  {uploadError}
                </div>
              )}
              {uploadMissing?.length > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
                  <p className="font-medium mb-1">Missing or invalid fields:</p>
                  <ul className="list-disc list-inside">
                    {uploadMissing.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowUploadModal(false); setUploadFile(null); setUploadError(null); setUploadMissing([]); }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUploadSubmit}
                  disabled={!uploadFile || uploading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete RFQ"
        message="Are you sure you want to delete this RFQ? This action cannot be undone."
        entityName={deleteTarget ? `${deleteTarget.product} (${deleteTarget.customerName})` : ''}
        loading={deleting}
      />
    </div>
  )
}

export default RFQs

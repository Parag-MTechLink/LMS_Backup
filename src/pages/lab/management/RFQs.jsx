import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { rfqsService, customersService } from '../../../services/labManagementApi'
import { getApiErrorMessage } from '../../../utils/apiError'
import toast, { Toaster } from 'react-hot-toast'
import { Plus, X, FileSpreadsheet, Trash2, Download, User, Mail, Phone, Package, Calendar, AlertCircle, CheckCircle, Clock, Eye, ChevronDown, Trash, FileText } from 'lucide-react'
import RouteSkeleton from '../../../components/RouteSkeleton'
import ConfirmDeleteModal from '../../../components/labManagement/ConfirmDeleteModal'
import { useLabManagementAuth } from '../../../contexts/LabManagementAuthContext'
import Input from '../../../components/labManagement/Input'
import clsx from 'clsx'

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
    details: {}
  })
  const [dynamicFields, setDynamicFields] = useState([]) // [{ key: '', value: '' }]

  const addDynamicField = () => {
    setDynamicFields([...dynamicFields, { key: '', value: '' }])
  }

  const removeDynamicField = (index) => {
    setDynamicFields(dynamicFields.filter((_, i) => i !== index))
  }

  const handleDynamicFieldChange = (index, field, value) => {
    const updated = [...dynamicFields]
    updated[index][field] = value
    setDynamicFields(updated)
  }

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
      
      // Build details from dynamicFields
      const details = {}
      dynamicFields.forEach(field => {
        if (field.key.trim()) {
          details[field.key.trim()] = field.value
        }
      })

      const payload = { ...formData, details }
      await rfqsService.create(payload)
      toast.success('RFQ created successfully')
      setShowModal(false)
      setFormData({ customerId: 0, product: '', receivedDate: new Date().toISOString().split('T')[0], details: {} })
      setDynamicFields([])
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create RFQ')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      toast.error('Please select a Word file (.docx)')
      return
    }
    setUploading(true)
    setUploadError(null)
    setUploadMissing([])
    try {
      const res = await rfqsService.upload(uploadFile)
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

  const handleDownloadRfqFile = async () => {
    if (!viewRfq) return
    try {
      await rfqsService.downloadUploadedFile(viewRfq.id)
    } catch {
      toast.error('Failed to download file')
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
            <Download className="w-5 h-5 transition-transform group-hover:-translate-y-1" />
            <span>Upload RFQ (Word)</span>
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
      </div>      {/* ── View RFQ Details Modal ── */}
      {viewRfq && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl border border-gray-200 max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Modal Header */}
            <div className="p-8 border-b border-gray-100 bg-gradient-to-br from-primary/5 via-white to-primary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-xl shadow-primary/20 ring-4 ring-primary/10">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Job Request Details</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded uppercase tracking-wider">RFQ ID: {viewRfq.id}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-gradient-to-r ${getStatusColor(displayRfq?.status ?? viewRfq.status)} text-white`}>
                        {displayRfq?.status ?? viewRfq.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setViewRfq(null); setViewDetails(null); }}
                  className="p-3 hover:bg-gray-100 rounded-2xl transition-all active:scale-90 bg-gray-50 text-gray-400 hover:text-gray-900"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {viewLoading ? (
                <div className="p-20 flex flex-col items-center justify-center gap-4 text-gray-400">
                  <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <span className="text-sm font-medium animate-pulse tracking-widest uppercase">Fetching Data...</span>
                </div>
              ) : (
                <div className="p-8 space-y-10">
                  {/* Primary Info Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Customer Entity</p>
                      <p className="text-lg font-bold text-gray-900 mt-1 leading-tight">
                        {displayRfq?.customerName ?? displayRfq?.company_name ?? viewRfq.customerName}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Product / Project</p>
                      <p className="text-lg font-bold text-gray-900 mt-1 leading-tight">
                        {displayRfq?.product ?? displayRfq?.project_type ?? viewRfq.product}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
                        <Calendar className="w-5 h-5 text-orange-600" />
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Received On</p>
                      <p className="text-lg font-bold text-gray-900 mt-1 leading-tight">
                        {new Date(displayRfq?.receivedDate ?? viewRfq.receivedDate).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Document & Quick Actions */}
                  <div className="flex flex-col sm:flex-row gap-6">
                    {displayRfq?.rfq_file_path && (
                      <div className="flex-1 bg-primary/5 rounded-2xl p-6 border border-primary/10 flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <Download className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-primary/60 font-bold uppercase tracking-widest">Original File</p>
                            <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">
                              {displayRfq.rfq_file_path.split(/[\\/]/).pop()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleDownloadRfqFile}
                          className="px-6 py-2.5 bg-primary text-white text-sm font-black rounded-xl hover:bg-primary-dark transition-all active:scale-95 shadow-lg shadow-primary/25 flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Equipment Under Test (EUT) Details */}
                  {displayRfq?.details && Object.keys(displayRfq.details).length > 0 && (
                    <div className="space-y-8">
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-gray-100" />
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">Equipment Under Test (EUT) Details</h4>
                        <div className="h-px flex-1 bg-gray-100" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Technical Specifications */}
                        <div className="space-y-4">
                          <h5 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                            Technical Specifications
                          </h5>
                          <div className="grid grid-cols-1 gap-3">
                            {[
                              { label: 'Supply Voltage', key: 'Supply Voltage' },
                              { label: 'Operating Frequency', key: 'Operating Frequency' },
                              { label: 'Current', key: 'Current' },
                              { label: 'Weight', key: 'Weight' },
                              { label: 'Dimensions', key: 'Dimensions' }
                            ].map(spec => displayRfq.details[spec.key] && (
                              <div key={spec.key} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">{spec.label}</span>
                                <span className="text-xs font-black text-gray-900">{displayRfq.details[spec.key]}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Connectivity & Software */}
                        <div className="space-y-4">
                          <h5 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                            Connectivity & Software
                          </h5>
                          <div className="grid grid-cols-1 gap-3">
                            {[
                              { label: 'Power Ports', key: 'Power Ports' },
                              { label: 'Signal Lines', key: 'Signal Lines' },
                              { label: 'Software Name', key: 'Software Name' },
                              { label: 'Software Version', key: 'Software Version' }
                            ].map(spec => displayRfq.details[spec.key] && (
                              <div key={spec.key} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">{spec.label}</span>
                                <span className="text-xs font-black text-gray-900">{displayRfq.details[spec.key]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Generic / Other details */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(displayRfq.details)
                          .filter(([key]) => ![
                            'Supply Voltage', 'Operating Frequency', 'Current', 'Weight', 'Dimensions',
                            'Power Ports', 'Signal Lines', 'Software Name', 'Software Version',
                            'Designation', 'Project Code', 'Quantity', 'Manufacturer', 'Model No', 'Serial No'
                          ].includes(key))
                          .map(([key, value]) => (
                            <div key={key} className="p-3 rounded-xl border border-gray-100 bg-white shadow-sm">
                              <label className="text-[9px] uppercase font-black tracking-widest text-gray-400 block mb-1">{key}</label>
                              <p className="text-xs text-gray-900 font-bold">{value || '—'}</p>
                            </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing fields warning */}
                  {displayRfq?.missing_fields?.length > 0 && (
                    <div className="rounded-2xl bg-red-50 border border-red-100 p-6 flex gap-4 animate-pulse">
                      <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-black text-red-900 uppercase tracking-widest mb-2">Attention Required</p>
                        <p className="text-sm text-red-700 font-medium">The document is missing some critical fields that need manual correction.</p>
                        <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1">
                          {displayRfq.missing_fields.map((f, i) => (
                            <li key={i} className="text-xs text-red-600 font-bold flex items-center gap-1.5">
                              <span className="w-1 h-1 bg-red-400 rounded-full" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Status Management */}
                  <div className="bg-gray-50/80 rounded-3xl p-8 space-y-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        Workflow Management
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Current:</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-gradient-to-r ${getStatusColor(displayRfq?.status ?? viewRfq.status)} text-white`}>
                          {displayRfq?.status ?? viewRfq.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { value: 'pending', label: 'Hold', color: 'border-yellow-200 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-300' },
                        { value: 'pending review', label: 'Review', color: 'border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300' },
                        { value: 'approved', label: 'Approve', color: 'border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300' },
                        { value: 'rejected', label: 'Reject', color: 'border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setRfqStatus(opt.value)}
                          className={`px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all duration-300 transform active:scale-95 shadow-sm
                            ${rfqStatus === opt.value
                              ? 'ring-4 ring-primary/10 border-primary bg-primary text-white shadow-lg shadow-primary/25'
                              : `${opt.color} bg-white`
                            }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <textarea
                        rows={2}
                        value={rfqComment}
                        onChange={e => setRfqComment(e.target.value)}
                        placeholder="Internal notes or comments regarding this status change..."
                        className="w-full px-5 py-4 text-sm font-medium border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none resize-none transition-all placeholder:text-gray-300"
                      />
                      <button
                        onClick={handleSaveRfqStatus}
                        disabled={savingRfqStatus || rfqStatus === (displayRfq?.status ?? viewRfq?.status ?? '')}
                        className="w-full py-4 bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:grayscale transition-all"
                      >
                        {savingRfqStatus ? 'Processing...' : 'Apply Status Change'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex gap-4">
              <button
                onClick={() => { setViewRfq(null); setViewDetails(null); }}
                className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-2xl text-gray-600 text-xs font-black uppercase tracking-widest hover:bg-white hover:border-gray-300 hover:text-gray-900 transition-all active:scale-95 shadow-sm"
              >
                Close View
              </button>
              <button
                onClick={() => {
                  setViewRfq(null)
                  setViewDetails(null)
                  navigate(`/lab/management/estimations?createFromRfq=${viewRfq.id}`)
                }}
                className="flex-1 px-6 py-4 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all active:scale-95 shadow-xl shadow-gray-200"
              >
                Build Estimation
              </button>
            </div>
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

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              <p className="text-sm font-medium text-gray-500">
                Please fill all the mandatory details in the form (*)
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  >
                    <option value={0}>Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.companyName}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label={<>Product / Project <span className="text-red-500">*</span></>}
                  required
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  placeholder="e.g. Environmental Testing - Batch A"
                  icon={<Package className="w-5 h-5" />}
                />

                <Input
                  label={<>Received Date <span className="text-red-500">*</span></>}
                  type="date"
                  required
                  value={formData.receivedDate}
                  onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                  icon={<Calendar className="w-5 h-5" />}
                />
              </div>

              {/* Dynamic Enrichment Section */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-primary" />
                    Customization Enrichment
                  </h3>
                  <button
                    type="button"
                    onClick={addDynamicField}
                    className="text-xs font-medium text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
                  >
                    Add Field
                  </button>
                </div>

                <div className="space-y-3">
                  <AnimatePresence>
                    {dynamicFields.map((field, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex gap-2 items-start"
                      >
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Field Name (e.g. Email)"
                            value={field.key}
                            onChange={(e) => handleDynamicFieldChange(index, 'key', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                          />
                        </div>
                        <div className="flex-[1.5]">
                          <input
                            type="text"
                            placeholder="Value"
                            value={field.value}
                            onChange={(e) => handleDynamicFieldChange(index, 'value', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDynamicField(index)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {dynamicFields.length === 0 && (
                    <p className="text-xs text-gray-400 italic text-center py-2">
                      No custom fields added yet.
                    </p>
                  )}
                </div>
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

      {/* ── Create / Upload RFQ Modal ── */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-gray-200 overflow-hidden"
          >
            <div className="p-8 border-b border-gray-100 bg-gradient-to-br from-primary/5 via-white to-primary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Download className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">Import Word RFQ</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Automated Data Extraction</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-90"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <p className="text-sm text-gray-600 font-medium leading-relaxed mb-4">
                  Upload the filled <span className="font-bold text-gray-900 tracking-tight">Job Request Form (.docx)</span>. Our parser will automatically extract customer details, product info, and project parameters.
                </p>
                <button
                  type="button"
                  onClick={() => rfqsService.downloadTemplate().catch(() => toast.error('Failed to download template'))}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-primary/20 text-primary text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary/5 hover:border-primary/40 transition-all active:scale-[0.98] shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Get Word Template
                </button>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Select Document</label>
                <div className="relative group">
                  <input
                    type="file"
                    accept=".docx"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full h-32 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-2 group-hover:border-primary/40 group-hover:bg-primary/5 transition-all duration-300">
                    <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-white flex items-center justify-center transition-colors shadow-sm">
                      <FileText className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-xs font-bold text-gray-500 group-hover:text-primary transition-colors text-center px-4">
                      {uploadFile ? uploadFile.name : 'Click to browse or drag & drop'}
                    </p>
                    <p className="text-[10px] text-gray-300 font-medium tracking-wide">Supported: Microsoft Word (.docx)</p>
                  </div>
                </div>
              </div>

              {uploadError && (
                <div className="rounded-2xl bg-red-50 border border-red-100 p-4 flex gap-3 animate-in slide-in-from-top-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-xs font-bold text-red-700 leading-relaxed">{uploadError}</p>
                </div>
              )}

              {uploadMissing?.length > 0 && (
                <div className="rounded-2xl bg-orange-50 border border-orange-100 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Incomplete Data</span>
                  </div>
                  <ul className="grid grid-cols-1 gap-1">
                    {uploadMissing.map((f, i) => (
                      <li key={i} className="text-[10px] text-orange-700 font-bold px-2 py-0.5">
                        • {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex gap-4">
              <button
                onClick={() => { setShowUploadModal(false); setUploadFile(null); setUploadError(null); setUploadMissing([]); }}
                className="flex-1 px-6 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-600 text-xs font-black uppercase tracking-widest hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadSubmit}
                disabled={uploading || !uploadFile}
                className="flex-1 px-6 py-4 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-primary-dark transition-all active:scale-95 shadow-xl shadow-primary/25 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Parsing...
                  </>
                ) : (
                  'Start Upload'
                )}
              </button>
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

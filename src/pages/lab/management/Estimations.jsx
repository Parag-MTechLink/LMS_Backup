import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import { estimationsService, rfqsService } from '../../../services/labManagementApi'
import { formatCurrencyINR } from '../../../utils/currency'
import { Plus, X, Eye, Trash2, ExternalLink, Calculator, FileText, Calendar, Wallet, Clock, Tag, PlusCircle, Trash, Upload, Download, CheckCircle } from 'lucide-react'
import Input from '../../../components/labManagement/Input'
import clsx from 'clsx'

function Estimations() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [estimations, setEstimations] = useState([])
  const [rfqs, setRfqs] = useState([])
  const [testTypes, setTestTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showRateChartModal, setShowRateChartModal] = useState(false)
  const [uploadingRateChart, setUploadingRateChart] = useState(false)
  const [testTypesHierarchy, setTestTypesHierarchy] = useState([])
  const [selectedEstimation, setSelectedEstimation] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [formData, setFormData] = useState({
    rfqId: 0,
    margin: 0,
    discount: 0,
    notes: '',
    details: {}
  })
  const [dynamicFields, setDynamicFields] = useState([]) // [{ key: '', value: '' }]
  const [testItems, setTestItems] = useState([])

  useEffect(() => {
    loadData()
    // Check if we should open modal from RFQ
    const createFromRfq = searchParams.get('createFromRfq')
    if (createFromRfq) {
      setFormData(prev => ({ ...prev, rfqId: parseInt(createFromRfq) }))
      setShowModal(true)
    }
  }, [searchParams])

  const loadData = async () => {
    try {
      const [estimationsData, rfqsData, testTypesData, hierarchyData] = await Promise.all([
        estimationsService.getAll(),
        rfqsService.getAll(),
        estimationsService.getTestTypes(),
        estimationsService.getTestTypesHierarchy(),
      ])
      
      // Filter by RFQ if rfqId in URL
      const rfqId = searchParams.get('rfqId')
      let filteredEstimations = estimationsData
      if (rfqId) {
        filteredEstimations = estimationsData.filter(e => e.rfqId?.toString() === rfqId)
      }
      
      setEstimations(filteredEstimations)
      setRfqs(rfqsData)
      setTestTypes(testTypesData)
      setTestTypesHierarchy(hierarchyData)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleRateChartUpload = async (file) => {
    if (!file) return
    try {
      setUploadingRateChart(true)
      await estimationsService.uploadRateChart(file)
      toast.success('Rate chart uploaded and parsed successfully')
      setShowRateChartModal(false)
      loadData() // Reload test types
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload rate chart')
    } finally {
      setUploadingRateChart(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return;
    
    if (formData.rfqId === 0) {
      toast.error('Please select an RFQ')
      return
    }

    if (testItems.length === 0) {
      toast.error('Please add at least one test item')
      return
    }

    const hasMissingTestType = testItems.some(item => !item.testTypeId || item.testTypeId === 0)
    if (hasMissingTestType) {
      toast.error('Please select a Test Type for all test items')
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

      await estimationsService.create({
        rfqId: formData.rfqId,
        tests: testItems,
        margin: formData.margin,
        discount: formData.discount,
        notes: formData.notes,
        details: details
      })
      toast.success('Estimation created successfully')
      setShowModal(false)
      resetForm()
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create estimation')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({ rfqId: 0, margin: 0, discount: 0, notes: '', details: {} })
    setTestItems([])
    setDynamicFields([])
  }
  
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this estimation? This action cannot be undone.')) {
      return
    }
    
    try {
      await estimationsService.delete(id)
      toast.success('Estimation deleted successfully')
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete estimation')
    }
  }

  const addTestItem = () => {
    setTestItems([...testItems, { categoryId: 0, testTypeId: 0, numberOfDUT: 1, hours: 0, ratePerHour: 0, remarks: '' }])
  }

  const removeTestItem = (index) => {
    setTestItems(testItems.filter((_, i) => i !== index))
  }

  const updateTestItem = (index, field, value) => {
    const updated = [...testItems]
    updated[index] = { ...updated[index], [field]: value }
    
    // Auto-fill logic
    if (field === 'categoryId') {
      updated[index].testTypeId = 0
      updated[index].ratePerHour = 0
    }
    
    if (field === 'testTypeId' && value) {
      const category = testTypesHierarchy.find(c => c.id === updated[index].categoryId)
      const test = category?.children?.find(t => t.id === value)
      if (test) {
        updated[index].ratePerHour = test.defaultRate
        updated[index].testTypeName = `${category.name} - ${test.name}`
        // If it's a "per test" unit, we could optionally default hours to 1
        if (test.unit?.toLowerCase().includes('test')) {
          updated[index].hours = 1
        }
      }
    }
    
    setTestItems(updated)
  }

  const calculateTestCost = (item) => {
    const testType = testTypes.find(tt => tt.id === item.testTypeId)
    const unit = testType?.unit?.toLowerCase() || 'per hour'
    const rate = parseFloat(item.ratePerHour) || 0
    const dut = parseInt(item.numberOfDUT) || 0
    const hours = parseFloat(item.hours) || 0
    
    if (unit.includes('test')) {
      return rate * dut
    }
    return hours * rate * dut
  }

  const calculateSubtotal = () => {
    return testItems.reduce((sum, item) => sum + calculateTestCost(item), 0)
  }

  const calculateTotalHours = () => {
    return testItems.reduce((sum, item) => sum + ((parseFloat(item.hours) || 0) * (parseInt(item.numberOfDUT) || 0)), 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const withMargin = subtotal * (1 + formData.margin / 100)
    const withDiscount = withMargin * (1 - formData.discount / 100)
    return withDiscount
  }

  const addDynamicField = () => {
    setDynamicFields([...dynamicFields, { key: '', value: '' }])
  }

  const removeDynamicField = (index) => {
    setDynamicFields(dynamicFields.filter((_, i) => i !== index))
  }

  const handleReview = async (id, status) => {
    try {
      await estimationsService.review(id, { status, comments: '' })
      toast.success(`Estimation ${status} successfully`)
      setShowDetailModal(false)
      loadData()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const handleDynamicFieldChange = (index, field, value) => {
    const updated = [...dynamicFields]
    updated[index][field] = value
    setDynamicFields(updated)
  }

  const getStatusColor = (status) => {
    const statusLower = status.toLowerCase()
    if (statusLower === 'draft') return 'from-gray-400 to-gray-500'
    if (statusLower === 'accepted' || statusLower === 'approved') return 'from-green-400 to-emerald-500'
    if (statusLower === 'rejected') return 'from-red-400 to-pink-500'
    if (statusLower === 'pendingreview') return 'from-yellow-400 to-orange-500'
    return 'from-blue-400 to-cyan-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
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
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowRateChartModal(true)}
            className="px-4 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl shadow-sm hover:bg-gray-50 hover:shadow-md active:scale-95 transition-all duration-200 flex items-center space-x-2"
          >
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Upload Rate Chart</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Estimation</span>
          </button>
        </div>
      </div>

      {/* Budget Tracking Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Estimations</p>
              <p className="text-2xl font-bold text-gray-900">{estimations.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrencyINR(estimations.reduce((sum, e) => sum + (e.totalCost || 0), 0))}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">
                {estimations.reduce((sum, e) => sum + (e.totalHours || 0), 0).toFixed(1)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-2xl">⏱️</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Accepted</p>
              <p className="text-2xl font-bold text-gray-900">
                {estimations.filter(e => e.status?.toLowerCase() === 'accepted').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-2xl">✓</span>
            </div>
          </div>
        </div>
      </div>

      {/* Estimations Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-green-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Estimation ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Total Cost
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {estimations.length > 0 ? (
                estimations.map((estimation, index) => (
                  <motion.tr
                    key={estimation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-green-50 transition-colors duration-200"
                  >
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{estimation.estimationId}</div>
                      <div className="text-[10px] text-gray-500 uppercase">v{estimation.version}</div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center max-w-[180px]">
                        <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                          {estimation.rfqCustomerName?.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="ml-2 text-xs font-medium text-gray-900 truncate" title={estimation.rfqCustomerName}>
                          {estimation.rfqCustomerName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-900 truncate max-w-[150px]" title={estimation.rfqProduct}>
                        {estimation.rfqProduct}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {formatCurrencyINR(estimation.totalCost)}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-600 font-medium">{estimation.totalHours?.toFixed(1) || '0.0'}h</div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-gradient-to-r ${getStatusColor(estimation.status)} text-white shadow-sm`}>
                        {estimation.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => {
                            setSelectedEstimation(estimation)
                            setShowDetailModal(true)
                          }}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>

                        {['accepted', 'approved'].includes(estimation.status?.toLowerCase()) && (
                          <button
                            onClick={() => navigate(`/lab/management/projects?createFromEstimation=${estimation.id}`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50 transition-all text-xs"
                            title="Create Project"
                          >
                            <PlusCircle className="w-4 h-4" />
                            <span>Create Project</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(estimation.id)}
                          className="flex items-center p-1.5 rounded-md text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                          title="Delete Estimation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
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

      {/* Create Estimation Modal */}
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
                <button
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              <p className="text-sm text-red-500 mb-4">Please fill all the mandatory details in the form (*)</p>
              {/* RFQ Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RFQ <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.rfqId}
                  onChange={(e) => setFormData({ ...formData, rfqId: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  <option value={0}>Select RFQ</option>
                  {rfqs.map((rfq) => (
                    <option key={rfq.id} value={rfq.id}>
                      {rfq.customerName} - {rfq.product}
                    </option>
                  ))}
                </select>
              </div>

              {/* Test Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Test Items
                  </label>
                  <button
                    type="button"
                    onClick={addTestItem}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Test
                  </button>
                </div>
                <div className="space-y-4">
                  {testItems.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">Test Item {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeTestItem(index)}
                          className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Test Category <span className="text-red-500">*</span>
                          </label>
                          <select
                            required
                            value={item.categoryId || 0}
                            onChange={(e) => updateTestItem(index, 'categoryId', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          >
                            <option value={0}>Select Category</option>
                            {testTypesHierarchy.map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Sub Test Selection <span className="text-red-500">*</span>
                          </label>
                          <select
                            required
                            disabled={!item.categoryId}
                            value={item.testTypeId || 0}
                            onChange={(e) => updateTestItem(index, 'testTypeId', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                          >
                            <option value={0}>Select Test</option>
                            {testTypesHierarchy.find(c => c.id === item.categoryId)?.children?.map((test) => (
                              <option key={test.id} value={test.id}>
                                {test.name} - {formatCurrencyINR(test.defaultRate)}/{test.unit}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Number of DUT <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.numberOfDUT}
                            onChange={(e) => updateTestItem(index, 'numberOfDUT', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Hours <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.1"
                            value={item.hours}
                            onChange={(e) => updateTestItem(index, 'hours', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Rate per Hour (₹) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={item.ratePerHour}
                            onChange={(e) => updateTestItem(index, 'ratePerHour', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
                          <input
                            type="text"
                            value={item.remarks}
                            onChange={(e) => updateTestItem(index, 'remarks', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                            placeholder="Optional remarks"
                          />
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 pt-2 border-t border-gray-100">
                        Cost: {formatCurrencyINR(calculateTestCost(item))}
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
                    <span className="font-semibold">{formatCurrencyINR(calculateSubtotal())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Hours:</span>
                    <span className="font-semibold">{calculateTotalHours().toFixed(1)} hrs</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Margin (%)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.margin}
                        onChange={(e) => setFormData({ ...formData, margin: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Discount (%)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-green-200 mt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-semibold">Total Cost:</span>
                      <span className="text-lg font-bold text-green-700">{formatCurrencyINR(calculateTotal())}</span>
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

              {/* Dynamic Enrichment Section */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-green-600" />
                    Customization-Specific Enrichment
                  </h3>
                  <button
                    type="button"
                    onClick={addDynamicField}
                    className="text-xs font-medium text-green-600 hover:text-green-700 transition-colors flex items-center gap-1"
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
                            placeholder="Field Name"
                            value={field.key}
                            onChange={(e) => handleDynamicFieldChange(index, 'key', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                          />
                        </div>
                        <div className="flex-[1.5]">
                          <input
                            type="text"
                            placeholder="Value"
                            value={field.value}
                            onChange={(e) => handleDynamicFieldChange(index, 'value', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
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
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Estimation'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Estimation Detail Modal */}
      {showDetailModal && selectedEstimation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 my-8"
          >
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <Calculator className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Estimation Details</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      ID: <span className="font-mono font-semibold">{selectedEstimation.estimationId}</span> • v{selectedEstimation.version}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowDetailModal(false); setSelectedEstimation(null); }}
                  className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-8 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Top Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Customer</span>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-green-600" />
                    {selectedEstimation.rfqCustomerName}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Product / Project</span>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    {selectedEstimation.rfqProduct}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Status</span>
                  <span className={clsx(
                    'px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 mt-1',
                    getStatusColor(selectedEstimation.status).replace('from-', 'bg-').split(' ')[0] + '/20',
                    getStatusColor(selectedEstimation.status).replace('from-', 'text-').split(' ')[0]
                  )}>
                    {selectedEstimation.status}
                  </span>
                </div>
              </div>

              {/* Tests Table */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  Planned Tests & Activities
                </h3>
                <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Test / Activity</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Qty (DUT)</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Hours</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Rate</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {selectedEstimation.items?.map((test, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900">{test.testTypeName ?? 'Test / Activity'}</p>
                            {test.remarks && <p className="text-xs text-gray-500 mt-0.5">{test.remarks}</p>}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">{test.numberOfDUT}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">{test.hours}</td>
                          <td className="px-4 py-3 text-right text-sm text-gray-600">{formatCurrencyINR(test.ratePerHour)}</td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                            {formatCurrencyINR(test.hours * test.ratePerHour * test.numberOfDUT)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <footer className="bg-gray-50/50">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-right text-sm font-medium text-gray-500">Subtotal</td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">{formatCurrencyINR(selectedEstimation.subtotal)}</td>
                      </tr>
                    </footer>
                  </table>
                </div>
              </div>

              {/* Dynamic Enrichment Display */}
              {selectedEstimation.details && Object.keys(selectedEstimation.details).length > 0 && (
                <div className="pt-2">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-green-600" />
                    Customization Enrichment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(selectedEstimation.details).map(([key, value]) => (
                      <div key={key} className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                        <span className="text-[10px] uppercase tracking-wider text-green-600 font-bold block mb-1">{key}</span>
                        <p className="text-sm font-medium text-gray-900">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary & Totals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900">Notes & Remarks</h3>
                  <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100 min-h-[100px]">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedEstimation.notes || 'No additional notes provided for this estimation.'}
                    </p>
                  </div>
                </div>
                <div className="space-y-3 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrencyINR(selectedEstimation.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Margin ({selectedEstimation.margin}%)</span>
                    <span>+{formatCurrencyINR(selectedEstimation.subtotal * (selectedEstimation.margin / 100))}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Discount ({selectedEstimation.discount}%)</span>
                    <span className="text-red-500">-{formatCurrencyINR((selectedEstimation.subtotal * (1 + selectedEstimation.margin / 100)) * (selectedEstimation.discount / 100))}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-base font-bold text-gray-900">Grand Total</span>
                    <span className="text-2xl font-black text-green-700">{formatCurrencyINR(selectedEstimation.totalCost)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => { setShowDetailModal(false); setSelectedEstimation(null); }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Close View
              </button>
              {(selectedEstimation.status?.toLowerCase() === 'accepted' || selectedEstimation.status?.toLowerCase() === 'approved') && (
                <button
                  onClick={() => navigate(`/lab/management/projects?createFromEstimation=${selectedEstimation.id}`)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-5 h-5" />
                  Initiate Project
                </button>
              )}
              {selectedEstimation.status?.toLowerCase() === 'draft' && (
                <>
                  <button
                    onClick={() => handleReview(selectedEstimation.id, 'Approved')}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview(selectedEstimation.id, 'Rejected')}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Reject
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Rate Chart Upload Modal */}
      {showRateChartModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Upload Rate Chart</h2>
              <button 
                type="button"
                onClick={() => setShowRateChartModal(false)} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Drop your rate chart here</h3>
                <p className="text-sm text-gray-500 mt-1">Only PDF files are supported currently</p>
              </div>

              <div className="flex flex-col gap-4">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleRateChartUpload(e.target.files[0])}
                  className="hidden"
                  id="rate-chart-input"
                />
                <label
                  htmlFor="rate-chart-input"
                  className={clsx(
                    "w-full py-8 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all group",
                    uploadingRateChart && "opacity-50 pointer-events-none"
                  )}
                >
                  <Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-500 mb-2" />
                  <span className="text-sm font-medium text-gray-700">
                    {uploadingRateChart ? 'Processing...' : 'Click to select or drag and drop'}
                  </span>
                </label>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Standard Rate Chart</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">PDF Template</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => estimationsService.downloadRateChartTemplate()}
                    className="p-2.5 bg-white hover:bg-gray-50 rounded-xl text-blue-600 transition-all shadow-sm border border-gray-100 active:scale-95"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex gap-3">
                <div className="text-blue-600 mt-0.5">
                  <Calculator className="w-4 h-4" />
                </div>
                <p className="text-xs text-blue-800 leading-relaxed font-medium">
                  <strong>Note:</strong> Uploading a new rate chart will replace all existing test types. Please ensure your PDF matches the standard template format for accurate parsing.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Estimations

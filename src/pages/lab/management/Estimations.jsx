import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams, useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import { estimationsService, rfqsService } from '../../../services/labManagementApi'
import { formatCurrencyINR } from '../../../utils/currency'
import { Plus, X, Trash2, ExternalLink } from 'lucide-react'

function Estimations() {
  const [searchParams] = useSearchParams()
  const { user } = useLabManagementAuth()
  const canCreate = user?.role !== 'Quality Manager'
  const [estimations, setEstimations] = useState([])
  const [rfqs, setRfqs] = useState([])
  const [testTypes, setTestTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedEstimation, setSelectedEstimation] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [formData, setFormData] = useState({
    rfqId: 0,
    margin: 0,
    discount: 0,
    notes: '',
  })
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
      const [estimationsData, rfqsData, testTypesData] = await Promise.all([
        estimationsService.getAll(),
        rfqsService.getAll(),
        estimationsService.getTestTypes(),
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
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
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

  const addTestItem = () => {
    setTestItems([...testItems, { testTypeId: 0, numberOfDUT: 1, hours: 0, ratePerHour: 0, remarks: '' }])
  }

  const removeTestItem = (index) => {
    setTestItems(testItems.filter((_, i) => i !== index))
  }

  const updateTestItem = (index, field, value) => {
    const updated = [...testItems]
    updated[index] = { ...updated[index], [field]: value }
    
    // Auto-fill rate if test type is selected
    if (field === 'testTypeId' && value) {
      const testType = testTypes.find(tt => tt.id === value)
      if (testType) {
        updated[index].ratePerHour = testType.defaultRate
      }
    }
    
    setTestItems(updated)
  }

  const calculateTestCost = (item) => {
    return item.hours * item.ratePerHour * item.numberOfDUT
  }

  const calculateSubtotal = () => {
    return testItems.reduce((sum, item) => sum + calculateTestCost(item), 0)
  }

  const calculateTotalHours = () => {
    return testItems.reduce((sum, item) => sum + (item.hours * item.numberOfDUT), 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const withMargin = subtotal * (1 + formData.margin / 100)
    const withDiscount = withMargin * (1 - formData.discount / 100)
    return withDiscount
  }

  const getStatusColor = (status) => {
    const statusLower = status.toLowerCase()
    if (statusLower === 'draft') return 'from-gray-400 to-gray-500'
    if (statusLower === 'accepted') return 'from-green-400 to-emerald-500'
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
        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Estimation</span>
          </button>
        )}
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Estimation ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Total Cost
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Total Hours
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
              {estimations.length > 0 ? (
                estimations.map((estimation, index) => (
                  <motion.tr
                    key={estimation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-green-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{estimation.estimationId}</div>
                      <div className="text-xs text-gray-500">v{estimation.version}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {estimation.rfqCustomerName?.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="ml-3 text-sm font-medium text-gray-900">{estimation.rfqCustomerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{estimation.rfqProduct}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrencyINR(estimation.totalCost)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{estimation.totalHours?.toFixed(1) || '0.0'} hrs</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r ${getStatusColor(estimation.status)} text-white shadow-sm`}>
                        {estimation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedEstimation(estimation)
                          setShowDetailModal(true)
                        }}
                        className="text-green-600 hover:text-green-800 transition-colors mr-3"
                      >
                        View
                      </button>
                      {canCreate && estimation.status?.toLowerCase() === 'accepted' && (
                        <button
                          onClick={() => {
                            // Navigate to create project from accepted estimation
                            navigate(`/lab/management/projects?createFromEstimation=${estimation.id}`)
                          }}
                          className="text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
                        >
                          Create Project
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
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
                            Test Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            required
                            value={item.testTypeId}
                            onChange={(e) => updateTestItem(index, 'testTypeId', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          >
                            <option value={0}>Select Test Type</option>
                            {testTypes.map((tt) => (
                              <option key={tt.id} value={tt.id}>
                                {tt.name} ({formatCurrencyINR(tt.defaultRate)}/hr)
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
                            onChange={(e) => updateTestItem(index, 'numberOfDUT', parseInt(e.target.value))}
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
                            onChange={(e) => updateTestItem(index, 'hours', parseFloat(e.target.value))}
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
                            onChange={(e) => updateTestItem(index, 'ratePerHour', parseFloat(e.target.value))}
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

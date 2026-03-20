import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Search, BarChart3, CheckCircle, XCircle, Clock, Eye, Download, Plus } from 'lucide-react'
import { testResultsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Badge from '../../../components/labManagement/Badge'
import Input from '../../../components/labManagement/Input'
import Modal from '../../../components/labManagement/Modal'
import SampleTestResultModal from '../../../components/labManagement/modals/SampleTestResultModal'
import UploadTestResultForm from '../../../components/labManagement/forms/UploadTestResultForm'
import Button from '../../../components/labManagement/Button'

function TestResults() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showSampleModal, setShowSampleModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedResult, setSelectedResult] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadResults()
  }, [])

  const loadResults = async () => {
    try {
      setLoading(true)
      let data
      const executionId = new URLSearchParams(window.location.search).get('executionId')
      if (executionId) {
        // Load results for specific execution
        data = await testResultsService.getByExecution(parseInt(executionId))
      } else {
        // Load all results
        data = await testResultsService.getAll()
      }

      setResults(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading test results:', error)
      toast.error('Failed to load test results')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      Pass: 'success',
      Fail: 'danger',
      Pending: 'warning',
      'Under Review': 'info'
    }
    return colors[status] || 'default'
  }

  const handleDownload = (result, e) => {
    e.stopPropagation()
    toast.success(`Downloading report for Result #${result.id}...`)
    // Mock download logic
    setTimeout(() => {
      toast.success('Download complete')
    }, 1500)
  }

  const executionId = new URLSearchParams(window.location.search).get('executionId')

  const filteredResults = results.filter(result => {
    const matchesSearch = result.id?.toString().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || result.passFail?.toString() === selectedStatus
    const matchesExecution = !executionId || result.testExecutionId?.toString() === executionId
    return matchesSearch && matchesStatus && matchesExecution
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading test results...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            Test Results
          </h1>
          <p className="text-gray-600 mt-1">View and analyze test results</p>
        </div>

        <Button
          onClick={() => setShowUploadModal(true)}
          icon={<Plus className="w-5 h-5" />}
        >
          Upload Result
        </Button>
      </motion.div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Search results..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-5 h-5" />}
          />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Results</option>
            <option value="true">Pass</option>
            <option value="false">Fail</option>
          </select>
        </div>
      </Card>

      {/* Results Grid */}
      {filteredResults.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No test results found</p>
            <p className="text-sm text-gray-400 mt-1">Test results will appear here once executions are completed or uploaded</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResults.map((result, index) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card
                hover
                className="cursor-pointer h-full flex flex-col"
                onClick={() => {
                  setSelectedResult(result)
                  setShowSampleModal(true)
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${result.passFail ? 'from-green-500 to-emerald-500' : 'from-red-500 to-rose-500'} flex items-center justify-center shadow-lg`}>
                    {result.passFail ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : (
                      <XCircle className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <Badge variant={result.passFail ? 'success' : 'danger'}>
                    {result.passFail ? 'Pass' : 'Fail'}
                  </Badge>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Result #{result.id}
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-2" />
                    {new Date(result.testDate).toLocaleDateString()}
                  </div>

                  {result.testType && (
                    <div className="text-sm text-gray-600">
                      Type: {result.testType}
                    </div>
                  )}
                </div>

                <div className="mt-auto flex items-center gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedResult(result)
                      setShowSampleModal(true)
                    }}
                    className="flex-1 px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>

                  <button
                    onClick={(e) => handleDownload(result, e)}
                    className="flex-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Test Result"
        size="lg"
      >
        <UploadTestResultForm
          onSuccess={() => {
            setShowUploadModal(false)
            loadResults()
          }}
          onCancel={() => setShowUploadModal(false)}
        />
      </Modal>

      {/* Sample Result Modal */}
      <Modal
        isOpen={showSampleModal}
        onClose={() => setShowSampleModal(false)}
        title="Test Result Details"
        size="lg"
      >
        <SampleTestResultModal
          isOpen={showSampleModal}
          onClose={() => setShowSampleModal(false)}
          result={selectedResult}
        />
      </Modal>
    </div>
  )
}

export default TestResults

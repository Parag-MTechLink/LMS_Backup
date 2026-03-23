import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Search, BarChart3, CheckCircle, XCircle, Clock, Eye, Download, Plus } from 'lucide-react'
import { testResultsService, apiService, testPlansService, testExecutionsService, projectsService, customersService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Badge from '../../../components/labManagement/Badge'
import Input from '../../../components/labManagement/Input'
import Modal from '../../../components/labManagement/Modal'
import SampleTestResultModal, { prefetchExtendedDetails } from '../../../components/labManagement/modals/SampleTestResultModal'
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
      
      // Fetch names and relations to map to cards seamlessly
      const [executions, plans, projsData, custsData] = await Promise.all([
          testExecutionsService.getAll().catch(() => []),
          testPlansService.getAll().catch(() => []),
          projectsService.getAll().catch(() => []),
          customersService.getAll().catch(() => [])
      ]);
      
      const custsMap = {};
      (Array.isArray(custsData) ? custsData : []).forEach(c => custsMap[c.id] = {
          companyName: c.companyName || c.name || '-',
          customerName: c.contactPerson || c.name || c.companyName || '-'
      });

      const projsMap = {};
      (Array.isArray(projsData) ? projsData : []).forEach(p => projsMap[p.id] = {
          clientId: p.clientId || p.client_id || p.organization_id || p.organizationId
      });

      const plansMap = {};
      (Array.isArray(plans) ? plans : []).forEach(p => plansMap[p.id] = {
          name: p.name,
          projectId: p.projectId || p.project_id,
          assignedEngineerName: p.assignedEngineerName || p.assigned_engineer_name || null
      });
      
      const execsMap = {};
      (Array.isArray(executions) ? executions : []).forEach(e => {
          let execName = null;
          if (e.notes) {
              const m = e.notes.match(/^\[([^\]]+)\]/);
              if (m) execName = m[1].trim();
          }
          const plan = plansMap[e.testPlanId] || {};
          const proj = projsMap[plan.projectId] || {};
          const cust = custsMap[proj.clientId] || {};
          
          execsMap[e.id] = {
              testPlanName: plan.name || `Plan ${e.testPlanId}`,
              executionName: execName || plan.name || `Plan ${e.testPlanId}`,
              executionNumber: e.executionNumber || e.id,
              companyName: cust.companyName || '-',
              customerName: cust.customerName || '-',
              assignedEngineerName: e.executedByName || plan.assignedEngineerName || '-',
              testPlanId: e.testPlanId
          };
      });

      const enrichedData = (Array.isArray(data) ? data : []).map(r => ({
          ...r,
          ...execsMap[r.testExecutionId]
      }));

      setResults(enrichedData)
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

  const handleDownload = async (result, e) => {
    e.stopPropagation()
    if (result?.attachments && result.attachments.length > 0) {
      try {
        toast.loading(`Downloading report for Result #${result.id}...`, { id: `dl-${result.id}` })
        const url = result.attachments[0]
        const res = await apiService.client.get(url, { responseType: 'blob' })
        const blobUrl = URL.createObjectURL(res.data)
        const link = document.createElement('a')
        link.href = blobUrl
        
        const contentDisposition = res.headers['content-disposition']
        const urlExt = url.split('.').pop().split(/#|\?/)[0]
        let filename = `Report_${result?.id || 'doc'}${urlExt && urlExt.length <= 4 ? '.' + urlExt : ''}`
        
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="?([^"]+)"?/)
            if (match && match[1]) filename = match[1]
        }
        
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.parentNode.removeChild(link)
        URL.revokeObjectURL(blobUrl)
        toast.success(`Download complete`, { id: `dl-${result.id}` })
      } catch (error) {
        console.error("Download failed", error)
        toast.error('Failed to download report', { id: `dl-${result.id}` })
      }
    } else {
      toast.error('No report file attached')
    }
  }

  const executionId = new URLSearchParams(window.location.search).get('executionId')

  const filteredResults = results.filter(result => {
    const matchesSearch = result.id?.toString().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || result.passFail?.toString() === selectedStatus
    const matchesExecution = !executionId || result.testExecutionId?.toString() === executionId
    return matchesSearch && matchesStatus && matchesExecution
  })

  useEffect(() => {
    filteredResults.forEach(r => {
      if (r.testExecutionId) {
        prefetchExtendedDetails(r.testExecutionId, {
          projectExe: r.assignedEngineerName || r.projectExe,
          customerName: r.customerName,
          companyName: r.companyName,
          dutName: r.dutName,
          testPlanId: r.testPlanId,
          testPlanName: r.testPlanName,
          executionName: r.executionName,
          executionNumber: r.executionNumber
        })
      }
    })
  }, [filteredResults])

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

                <div className="mb-3 mt-1">
                  <h3 className="text-base font-bold text-gray-900 leading-tight mb-1 truncate" title={result.testPlanName || 'Unknown Plan'}>
                    {result.testPlanName || 'Unknown Plan'}
                  </h3>
                  <div className="text-sm font-medium text-gray-600 truncate" title={result.executionName ? `${result.executionName} #${result.executionNumber || result.testExecutionId}` : `Execution #${result.testExecutionId || '-'}`}>
                    {result.executionName ? `${result.executionName} #${result.executionNumber || result.testExecutionId}` : `Execution #${result.testExecutionId || '-'}`}
                  </div>
                </div>

                <div className="space-y-2 mb-4 mt-auto">
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
        showCloseIcon={false}
      >
        <SampleTestResultModal
          isOpen={showSampleModal}
          onClose={() => setShowSampleModal(false)}
          onUpdate={(updatedFields) => {
             setSelectedResult(prev => ({...prev, ...updatedFields}))
             setResults(prev => prev.map(r => r.id === selectedResult.id ? {...r, ...updatedFields} : r))
          }}
          result={selectedResult}
        />
      </Modal>
    </div>
  )
}

export default TestResults

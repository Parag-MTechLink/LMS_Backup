import { useEffect, useState } from 'react'
import { useLabManagementAuth } from '../../../contexts/LabManagementAuthContext'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, Play, Clock, User, ExternalLink } from 'lucide-react'
import { testExecutionsService } from '../../../services/labManagementApi'
import { testPlansService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Button from '../../../components/labManagement/Button'
import Badge from '../../../components/labManagement/Badge'
import Input from '../../../components/labManagement/Input'
import Modal from '../../../components/labManagement/Modal'
import CreateTestExecutionForm from '../../../components/labManagement/forms/CreateTestExecutionForm'
import SampleTestExecutionModal from '../../../components/labManagement/modals/SampleTestExecutionModal'

function TestExecutions() {
  const [executions, setExecutions] = useState([])
  const [testPlans, setTestPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSampleModal, setShowSampleModal] = useState(false)
  const [selectedExecution, setSelectedExecution] = useState(null)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useLabManagementAuth()
  const canCreate = user?.role !== 'Quality Manager'

  const testPlanId = searchParams.get('testPlanId')
  //... (omitting middle part to keep it simple, I better use two separate replace calls if lines are far apart or just rewrite the component start)


  useEffect(() => {
    loadTestPlans()
    loadExecutions()
  }, [])

  const loadTestPlans = async () => {
    try {
      const data = await testPlansService.getAll()
      setTestPlans(data)
    } catch (error) {
      toast.error('Failed to load test plans')
    }
  }

  const loadExecutions = async () => {
    try {
      setLoading(true)
      if (testPlanId) {
        const data = await testExecutionsService.getByTestPlan(parseInt(testPlanId))
        setExecutions(Array.isArray(data) ? data : [])
        setSelectedPlan(testPlanId)
      } else {
        const data = await testExecutionsService.getAll()
        setExecutions(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      toast.error('Failed to load test executions')
    } finally {
      setLoading(false)
    }
  }


  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || ''
    if (['completed', 'passed', 'meet compliance', 'success'].includes(statusLower)) return 'success'
    if (['failed', "doesn't meet compliance", 'danger'].includes(statusLower)) return 'danger'
    if (['pending', 'waiting'].includes(statusLower)) return 'warning'
    if (['inprogress', 'running', 'active'].includes(statusLower.replace(/\s+/g, ''))) return 'info'
    return 'default'
  }

  const parseExecName = (exec) => {
    const m = exec.notes?.match(/^\[([^\]]+)\]/)
    return m ? m[1].trim() : null
  }

  const filteredExecutions = executions.filter(exec => {
    const execName = parseExecName(exec) ?? ''
    const matchesSearch = !searchTerm ||
      exec.id?.toString().includes(searchTerm.toLowerCase()) ||
      execName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPlan = selectedPlan === 'all' || exec.testPlanId?.toString() === selectedPlan
    const matchesStatus = selectedStatus === 'all' || exec.status?.toLowerCase() === selectedStatus.toLowerCase()
    const matchesUrlPlan = !testPlanId || exec.testPlanId?.toString() === testPlanId
    return matchesSearch && matchesPlan && matchesStatus && matchesUrlPlan
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading test executions...</p>
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
              <Play className="w-6 h-6 text-white" />
            </div>
            Test Executions
          </h1>
          <p className="text-gray-600 mt-1">Track and manage test execution progress</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => setShowCreateModal(true)}
            icon={<Plus className="w-5 h-5" />}
          >
            New Execution
          </Button>
        )}
      </motion.div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search executions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-5 h-5" />}
          />
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Test Plans</option>
            {testPlans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="inprogress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="passed">Passed</option>
            <option value="cancelled">Cancelled</option>
            <option value="meet compliance">Meet Compliance</option>
            <option value="doesn't meet compliance">Doesn't Meet Compliance</option>
          </select>
        </div>
      </Card>

      {/* Executions Grid */}
      {filteredExecutions.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No test executions found</p>
            <p className="text-sm text-gray-400 mt-1">Create your first test execution to get started</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExecutions.map((execution, index) => {
            const execName = parseExecName(execution)
            const openDetail = () => {
              setSelectedExecution(execution)
              setShowSampleModal(true)
            }
            return (
              <motion.div
                key={execution.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Card hover className="cursor-pointer h-full flex flex-col" onClick={openDetail}>
                  {/* Link to parent test plan */}
                  {execution.testPlanId && (
                    <div className="mb-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/lab/management/test-plans/${execution.testPlanId}`)
                        }}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        View Test Plan
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Icon + status badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant={getStatusColor(execution.status)}>
                      {execution.status}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-0.5">
                    {execName ?? `Execution #${execution.executionNumber ?? execution.id}`}
                  </h3>
                  {execName && (
                    <p className="text-xs text-gray-400 mb-2">#{execution.executionNumber ?? execution.id}</p>
                  )}

                  {/* Meta */}
                  <div className="mt-auto space-y-1.5">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>
                        {execution.startTime
                          ? new Date(execution.startTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : execution.createdAt
                            ? new Date(execution.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                            : 'No date'}
                        {execution.endTime && (
                          <> – {new Date(execution.endTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</>
                        )}
                      </span>
                    </div>

                    {execution.executedByName && (
                      <div className="flex items-center text-sm text-gray-500">
                        <User className="w-4 h-4 mr-2" />
                        {execution.executedByName}
                      </div>
                    )}

                    {/* Footer actions */}
                    <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openDetail() }}
                        className="flex-1 text-xs text-gray-600 hover:text-gray-900 hover:underline text-center"
                      >
                        View Details
                      </button>
                      {canCreate && ['completed', 'passed', 'meet compliance', "doesn't meet compliance"].includes(
                        execution.status?.toLowerCase()
                      ) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/lab/management/test-results?executionId=${execution.id}`)
                            }}
                            className="flex-1 text-xs text-primary hover:underline text-center"
                          >
                            View Results →
                          </button>
                        )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create Execution Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Test Execution"
        size="lg"
      >
        <CreateTestExecutionForm
          testPlanId={testPlanId ? parseInt(testPlanId) : undefined}
          onSuccess={() => {
            setShowCreateModal(false)
            loadExecutions()
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Execution Detail / Edit Modal */}
      <Modal
        isOpen={showSampleModal}
        onClose={() => setShowSampleModal(false)}
        title="Edit Test Execution"
        size="lg"
      >
        <SampleTestExecutionModal
          isOpen={showSampleModal}
          onClose={() => setShowSampleModal(false)}
          execution={selectedExecution}
          onUpdated={() => loadExecutions()}
        />
      </Modal>
    </div>
  )
}

export default TestExecutions

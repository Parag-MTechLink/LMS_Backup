import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FlaskConical, Clock, User, Play, BarChart3, Plus } from 'lucide-react'
import { testPlansService, testExecutionsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Badge from '../../../components/labManagement/Badge'
import Button from '../../../components/labManagement/Button'
import Modal from '../../../components/labManagement/Modal'
import CreateTestExecutionForm from '../../../components/labManagement/forms/CreateTestExecutionForm'
import UploadTestResultForm from '../../../components/labManagement/forms/UploadTestResultForm'

function TestPlanDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [plan, setPlan] = useState(null)
  const [executions, setExecutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateExecutionModal, setShowCreateExecutionModal] = useState(false)
  const [showUploadResultModal, setShowUploadResultModal] = useState(false)

  useEffect(() => {
    if (id) {
      loadData(parseInt(id, 10))
    }
  }, [id])

  const loadData = async (planId) => {
    try {
      setLoading(true)
      const [planData, executionsData] = await Promise.all([
        testPlansService.getById(planId),
        testExecutionsService.getByTestPlan(planId),
      ])
      setPlan(planData)
      setExecutions(Array.isArray(executionsData) ? executionsData : [])
    } catch (error) {
      console.error('Error loading test plan details:', error)
      toast.error('Failed to load test plan details')
    } finally {
      setLoading(false)
    }
  }

  const statusColor = useMemo(() => {
    if (!plan?.status) return 'default'
    const map = {
      Draft: 'default',
      Approved: 'info',
      InProgress: 'warning',
      Completed: 'success',
      Cancelled: 'danger',
    }
    return map[plan.status] || 'default'
  }, [plan])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-gray-600">Loading test plan details...</p>
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="py-12 text-center">
            <p className="text-lg font-medium text-gray-900">Test plan not found</p>
            <p className="mt-2 text-sm text-gray-600">The requested test plan does not exist.</p>
            <Button className="mt-4" onClick={() => navigate('/lab/management/test-plans')}>
              Back to Test Plans
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-lg">
            <FlaskConical className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{plan.name}</h1>
            <p className="mt-1 text-sm text-gray-600">Detailed test plan information</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={statusColor}>{plan.status}</Badge>
          <Button
            variant="outline"
            onClick={() => navigate('/lab/management/test-plans')}
          >
            Back to Plans
          </Button>
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowCreateExecutionModal(true)}
          >
            New Execution
          </Button>
        </div>
      </motion.div>

      {/* Plan summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-gray-500">Test Type</p>
            <p className="text-lg font-semibold text-gray-900">{plan.testType}</p>
            <p className="text-sm text-gray-500">
              Project: {plan.projectName || 'N/A'}
            </p>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-gray-500">Assigned Engineer</p>
            <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              {plan.assignedEngineerName || 'Unassigned'}
            </p>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-gray-500">Timeline</p>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>
                {plan.plannedStartDate
                  ? new Date(plan.plannedStartDate).toLocaleDateString()
                  : 'N/A'}{' '}
                –{' '}
                {plan.plannedEndDate
                  ? new Date(plan.plannedEndDate).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Description */}
      <Card>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">Description</h2>
        <p className="text-sm text-gray-700">
          {plan.description || 'No description provided for this test plan.'}
        </p>
      </Card>

      {/* Executions */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Play className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Executions</h2>
              <p className="text-xs text-gray-500">
                {executions.length} execution{executions.length === 1 ? '' : 's'} linked to this plan
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreateExecutionModal(true)}
          >
            Add Execution
          </Button>
        </div>

        {executions.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            No executions yet. Create the first execution for this plan.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {executions.map((exec) => (
              <div
                key={exec.id}
                className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">
                    Execution #{exec.executionNumber ?? exec.id} — {exec.status}
                  </p>
                  <p className="text-xs text-gray-500">
                    Started:{' '}
                    {exec.startTime ? new Date(exec.startTime).toLocaleString() : 'N/A'}{' '}
                    · End:{' '}
                    {exec.endTime ? new Date(exec.endTime).toLocaleString() : 'N/A'}
                  </p>
                  {exec.executedByName && (
                    <p className="text-xs text-gray-500">
                      By {exec.executedByName}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      navigate(
                        `/lab/management/test-results?executionId=${exec.id}`,
                      )
                    }
                    icon={<BarChart3 className="h-4 w-4" />}
                  >
                    View Results
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Execution Modal */}
      <Modal
        isOpen={showCreateExecutionModal}
        onClose={() => setShowCreateExecutionModal(false)}
        title="Create Test Execution"
        size="lg"
      >
        <CreateTestExecutionForm
          testPlanId={plan.id}
          onSuccess={() => {
            setShowCreateExecutionModal(false)
            loadData(plan.id)
          }}
          onCancel={() => setShowCreateExecutionModal(false)}
        />
      </Modal>

      {/* Upload Result Modal (generic; user selects execution) */}
      <Modal
        isOpen={showUploadResultModal}
        onClose={() => setShowUploadResultModal(false)}
        title="Upload Test Result"
        size="lg"
      >
        <UploadTestResultForm
          onSuccess={() => {
            setShowUploadResultModal(false)
            loadData(plan.id)
          }}
          onCancel={() => setShowUploadResultModal(false)}
        />
      </Modal>
    </div>
  )
}

export default TestPlanDetails


import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FlaskConical, Clock, User, Play, BarChart3, Plus, Pencil, Check, X, ChevronDown } from 'lucide-react'
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

  // ── inline edit state ──
  const [editField, setEditField] = useState(null) // 'engineer' | 'timeline' | 'description'
  const [editValues, setEditValues] = useState({
    assignedEngineerName: '',
    plannedStartDate: '',
    plannedEndDate: '',
    description: '',
  })
  const [saving, setSaving] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)

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

  const startEdit = (field) => {
    setEditValues({
      assignedEngineerName: plan.assignedEngineerName || '',
      plannedStartDate: plan.plannedStartDate
        ? new Date(plan.plannedStartDate).toISOString().split('T')[0]
        : '',
      plannedEndDate: plan.plannedEndDate
        ? new Date(plan.plannedEndDate).toISOString().split('T')[0]
        : '',
      description: plan.description || '',
    })
    setEditField(field)
  }

  const cancelEdit = () => setEditField(null)

  const saveEdit = async () => {
    setSaving(true)
    try {
      const payload = {}
      if (editField === 'engineer') {
        payload.assigned_engineer_name = editValues.assignedEngineerName || null
        payload.assignedEngineerName = editValues.assignedEngineerName || null
      } else if (editField === 'timeline') {
        payload.planned_start_date = editValues.plannedStartDate
          ? new Date(editValues.plannedStartDate).toISOString()
          : null
        payload.planned_end_date = editValues.plannedEndDate
          ? new Date(editValues.plannedEndDate).toISOString()
          : null
        // camelCase aliases for the backend alias support
        payload.plannedStartDate = payload.planned_start_date
        payload.plannedEndDate = payload.planned_end_date
      } else if (editField === 'description') {
        payload.description = editValues.description || null
      }

      const updated = await testPlansService.update(plan.id, payload)
      setPlan((prev) => ({ ...prev, ...updated }))
      toast.success('Updated successfully')
      setEditField(null)
    } catch {
      toast.error('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    setSavingStatus(true)
    try {
      const updated = await testPlansService.update(plan.id, { status: newStatus })
      setPlan((prev) => ({ ...prev, status: updated?.status ?? newStatus }))
      toast.success('Status updated')
    } catch {
      toast.error('Failed to update status')
    } finally {
      setSavingStatus(false)
    }
  }

  const STATUS_OPTIONS = [
    { value: 'Draft', label: 'Draft', color: 'text-gray-600 bg-gray-100' },
    { value: 'Approved', label: 'Approved', color: 'text-blue-700 bg-blue-100' },
    { value: 'InProgress', label: 'In Progress', color: 'text-amber-700 bg-amber-100' },
    { value: 'Completed', label: 'Completed', color: 'text-green-700 bg-green-100' },
    { value: 'Cancelled', label: 'Cancelled', color: 'text-red-700 bg-red-100' },
  ]

  const currentStatusOpt = STATUS_OPTIONS.find((s) => s.value === plan?.status) ?? STATUS_OPTIONS[0]

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

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'

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
          {/* Editable status dropdown */}
          <div className="relative">
            <select
              value={plan.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={savingStatus}
              className={`appearance-none pl-3 pr-8 py-1.5 text-sm font-semibold rounded-lg border-2 border-transparent cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 ${currentStatusOpt.color}`}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-60" />
          </div>
          <Button variant="outline" onClick={() => navigate('/lab/management/test-plans')}>
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
        {/* Test Type (read-only) */}
        <Card>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-gray-500">Test Type</p>
            <p className="text-lg font-semibold text-gray-900">{plan.testType}</p>
            <p className="text-sm text-gray-500">Project: {plan.projectName || 'N/A'}</p>
          </div>
        </Card>

        {/* Assigned Engineer (editable) */}
        <Card>
          {editField === 'engineer' ? (
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase text-gray-500">Assigned Engineer</p>
              <input
                type="text"
                value={editValues.assignedEngineerName}
                onChange={(e) =>
                  setEditValues((v) => ({ ...v, assignedEngineerName: e.target.value }))
                }
                placeholder="Engineer name"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark disabled:opacity-60 transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase text-gray-500">Assigned Engineer</p>
                <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  {plan.assignedEngineerName || 'Unassigned'}
                </p>
              </div>
              <button
                onClick={() => startEdit('engineer')}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
        </Card>

        {/* Timeline (editable) */}
        <Card>
          {editField === 'timeline' ? (
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase text-gray-500">Timeline</p>
              <div className="flex flex-col gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                  <input
                    type="date"
                    value={editValues.plannedStartDate}
                    onChange={(e) =>
                      setEditValues((v) => ({ ...v, plannedStartDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">End Date</label>
                  <input
                    type="date"
                    value={editValues.plannedEndDate}
                    onChange={(e) =>
                      setEditValues((v) => ({ ...v, plannedEndDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark disabled:opacity-60 transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase text-gray-500">Timeline</p>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span>
                    {fmtDate(plan.plannedStartDate)} – {fmtDate(plan.plannedEndDate)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => startEdit('timeline')}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
        </Card>
      </div>

      {/* Description (editable) */}
      <Card>
        {editField === 'description' ? (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Description</h2>
            <textarea
              rows={4}
              value={editValues.description}
              onChange={(e) => setEditValues((v) => ({ ...v, description: e.target.value }))}
              placeholder="Enter test plan description"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                disabled={saving}
                className="flex items-center gap-1 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-60 transition"
              >
                <Check className="w-4 h-4" />
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1 px-4 py-2 border border-gray-300 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="mb-2 text-sm font-semibold text-gray-700">Description</h2>
              <p className="text-sm text-gray-700">
                {plan.description || 'No description provided for this test plan.'}
              </p>
            </div>
            <button
              onClick={() => startEdit('description')}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition flex-shrink-0"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        )}
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
            {executions.map((exec) => {
              // Parse "[Execution Name] rest of notes" format
              const nameMatch = exec.notes?.match(/^\[([^\]]+)\](.*)$/s)
              const execName = nameMatch ? nameMatch[1].trim() : null
              const extraNotes = nameMatch ? nameMatch[2].trim() : exec.notes

              return (
                <div
                  key={exec.id}
                  className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-gray-900 flex items-center flex-wrap gap-1.5">
                      {execName
                        ? <>{execName} <span className="font-normal text-gray-400">· #{exec.executionNumber ?? exec.id}</span></>
                        : <>Execution #{exec.executionNumber ?? exec.id}</>}
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${exec.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          exec.status === 'InProgress' ? 'bg-amber-100 text-amber-700' :
                            exec.status === 'Failed' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-600'
                        }`}>
                        {exec.status}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Started: {exec.startTime ? new Date(exec.startTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      {' · '}
                      End: {exec.endTime ? new Date(exec.endTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </p>
                    {exec.executedByName && (
                      <p className="text-xs text-gray-500">By {exec.executedByName}</p>
                    )}
                    {extraNotes && (
                      <p className="text-xs text-gray-400 italic">{extraNotes}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigate(`/lab/management/test-results?executionId=${exec.id}`)
                      }
                      icon={<BarChart3 className="h-4 w-4" />}
                    >
                      View Results
                    </Button>
                  </div>
                </div>
              )
            })}
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

      {/* Upload Result Modal */}
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

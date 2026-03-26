import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, FlaskConical, Clock, ExternalLink, AlertCircle, Eye } from 'lucide-react'
import { testPlansService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Button from '../../../components/labManagement/Button'
import Badge from '../../../components/labManagement/Badge'
import Input from '../../../components/labManagement/Input'
import Modal from '../../../components/labManagement/Modal'
import CreateTestPlanForm from '../../../components/labManagement/forms/CreateTestPlanForm'
import SampleTestPlanModal from '../../../components/labManagement/modals/SampleTestPlanModal'

function TestPlans() {
  const [testPlans, setTestPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSampleModal, setShowSampleModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadTestPlans()
  }, [])

  // Filter by project if projectId in URL
  useEffect(() => {
    const projectId = new URLSearchParams(window.location.search).get('projectId')
    if (projectId) {
      setSelectedType('all')
      // Filter will be applied in filteredPlans
    }
  }, [])

  const loadTestPlans = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await testPlansService.getAll()
      // Ensure data is an array and has required fields
      const normalizedData = Array.isArray(data) ? data.map(plan => ({
        ...plan,
        id: plan.id || Math.random(),
        name: plan.name || 'Unnamed Test Plan',
        testType: plan.testType || 'EMC',
        status: plan.status || 'Draft',
        description: plan.description || '',
        projectName: plan.projectName || 'N/A',
        assignedEngineerName: plan.assignedEngineerName || null,
        createdAt: plan.createdAt || new Date().toISOString(),
        projectId: plan.projectId || null
      })) : []
      console.log('Test Plans loaded:', normalizedData.length, 'plans')
      setTestPlans(normalizedData)
    } catch (error) {
      console.error('Error loading test plans:', error)
      setError(error.message || 'Failed to load test plans')
      toast.error('Failed to load test plans')
      setTestPlans([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const getTestTypeIcon = (type) => {
    const icons = {
      EMC: '⚡',
      RF: '📡',
      Safety: '🛡️',
      Environmental: '🌡️',
      Software: '💻'
    }
    return icons[type] || '🧪'
  }

  const getTestTypeColor = (type) => {
    const colors = {
      EMC: 'from-purple-500 to-pink-500',
      RF: 'from-blue-500 to-cyan-500',
      Safety: 'from-red-500 to-orange-500',
      Environmental: 'from-green-500 to-emerald-500',
      Software: 'from-indigo-500 to-purple-500'
    }
    return colors[type] || 'from-gray-500 to-gray-600'
  }

  const getStatusColor = (status) => {
    const colors = {
      Draft: 'default',
      Approved: 'info',
      InProgress: 'warning',
      Completed: 'success',
      Cancelled: 'danger'
    }
    return colors[status] || 'default'
  }

  const projectId = new URLSearchParams(window.location.search).get('projectId')

  // Ensure we always have valid data before filtering
  const safeTestPlans = Array.isArray(testPlans) ? testPlans : []

  const filteredPlans = safeTestPlans.filter(plan => {
    if (!plan) return false
    const planName = (plan.name || '').toLowerCase()
    const projectName = (plan.projectName || '').toLowerCase()
    const description = (plan.description || '').toLowerCase()
    const searchLower = (searchTerm || '').toLowerCase()

    const matchesSearch = !searchLower || planName.includes(searchLower) ||
      projectName.includes(searchLower) ||
      description.includes(searchLower)
    const matchesType = selectedType === 'all' || (plan.testType || '') === selectedType
    const matchesStatus = selectedStatus === 'all' || (plan.status || '') === selectedStatus
    const matchesProject = !projectId || (plan.projectId?.toString() || '') === projectId
    return matchesSearch && matchesType && matchesStatus && matchesProject
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading test plans...</p>
        </div>
      </div>
    )
  }

  if (error && testPlans.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Test Plans</h1>
          <p className="mt-2 text-gray-600">Manage and track all test plans</p>
        </div>
        <Card>
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-gray-900 font-medium mb-2">Error loading test plans</p>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={loadTestPlans}>Retry</Button>
          </div>
        </Card>
      </div>
    )
  }

  // Ensure we always have valid data
  const safeFilteredPlans = Array.isArray(filteredPlans) ? filteredPlans : []

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
              <FlaskConical className="w-6 h-6 text-white" />
            </div>
            Test Plans
          </h1>
          <p className="text-gray-600 mt-1">Manage and track all test plans</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          icon={<Plus className="w-5 h-5" />}
        >
          Create Test Plan
        </Button>
      </motion.div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search test plans..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-5 h-5" />}
          />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Test Types</option>
            <option value="EMC">EMC</option>
            <option value="RF">RF</option>
            <option value="Safety">Safety</option>
            <option value="Environmental">Environmental</option>
            <option value="Software">Software</option>
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Approved">Approved</option>
            <option value="InProgress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </Card>

      {/* Test Plans Grid */}
      {!safeFilteredPlans || safeFilteredPlans.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FlaskConical className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No test plans found</p>
            <p className="text-sm text-gray-400 mt-1">
              {!safeTestPlans || safeTestPlans.length === 0
                ? 'Create your first test plan to get started'
                : 'Try adjusting your filters'}
            </p>
            {(!safeTestPlans || safeTestPlans.length === 0) && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="mt-4"
                icon={<Plus className="w-5 h-5" />}
              >
                Create Test Plan
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {safeFilteredPlans.map((plan, index) => {
            if (!plan || !plan.id) return null
            return (
              <motion.div
                key={plan.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card
                  hover
                  className="cursor-pointer h-full flex flex-col"
                  onClick={() => plan.id && navigate(`/lab/management/test-plans/${plan.id}`)}
                >
                  {plan.projectId && (
                    <div className="mb-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/lab/management/projects/${plan.projectId}`)
                        }}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        View Project
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getTestTypeColor(plan.testType || 'EMC')} flex items-center justify-center text-2xl shadow-lg`}>
                      {getTestTypeIcon(plan.testType || 'EMC')}
                    </div>
                    <Badge variant={getStatusColor(plan.status || 'Draft')}>
                      {plan.status || 'Draft'}
                    </Badge>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {plan.name || 'Unnamed Test Plan'}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {plan.description || 'No description'}
                  </p>

                  <div className="mt-auto space-y-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="font-medium">Project:</span>
                      <span className="ml-2">{plan.projectName || 'N/A'}</span>
                    </div>

                    {plan.assignedEngineerName && (
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="font-medium">Engineer:</span>
                        <span className="ml-2">{plan.assignedEngineerName}</span>
                      </div>
                    )}

                    <div className="flex items-center text-xs text-gray-400 mt-3 pt-3 border-t border-gray-200">
                      <Clock className="w-4 h-4 mr-1" />
                      {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : 'N/A'}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (plan.id) {
                            navigate(`/lab/management/test-executions?testPlanId=${plan.id}`)
                          }
                        }}
                        className="text-xs text-primary hover:underline w-full text-left"
                      >
                        View Executions →
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedPlan(plan)
                          setShowSampleModal(true)
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700 hover:underline w-full text-left mt-2 flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> View Sample Plan
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Test Plan"
        size="lg"
      >
        {showCreateModal && (
          <CreateTestPlanForm
            onSuccess={() => {
              setShowCreateModal(false)
              loadTestPlans()
            }}
            onCancel={() => setShowCreateModal(false)}
          />
        )}
      </Modal>

      {/* Sample Plan Modal */}
      <Modal
        isOpen={showSampleModal}
        onClose={() => setShowSampleModal(false)}
        title="Test Plan Details"
        size="lg"
      >
        <SampleTestPlanModal
          isOpen={showSampleModal}
          onClose={() => setShowSampleModal(false)}
          testPlan={selectedPlan}
        />
      </Modal>
    </div>
  )
}

export default TestPlans

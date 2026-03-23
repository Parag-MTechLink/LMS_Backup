import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  FolderKanban, 
  Package, 
  FileCheck, 
  FlaskConical,
  Clock,
  BarChart3,
  Users,
  ExternalLink,
  Shield,
  CheckCircle2,
  UserCheck,
  ClipboardCheck,
  CreditCard,
  Send,
  History,
  MessageSquare,
  AlertCircle,
  MoreVertical,
  Plus,
  X
} from 'lucide-react'
import { projectsService } from '../../../services/labManagementApi'
import { samplesService } from '../../../services/labManagementApi'
import { trfsService } from '../../../services/labManagementApi'
import { testPlansService } from '../../../services/labManagementApi'
import CreateTRFForm from '../../../components/labManagement/forms/CreateTRFForm'
import toast, { Toaster } from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Badge from '../../../components/labManagement/Badge'

import { useLabManagementAuth } from '../../../contexts/LabManagementAuthContext'

function ProjectDetail() {
  const { user } = useLabManagementAuth()
  const canCreate = user?.role !== 'Quality Manager'
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [samples, setSamples] = useState([])
  const [trfs, setTrfs] = useState([])
  const [testPlans, setTestPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [teamLeads, setTeamLeads] = useState([])
  const [selectedTL, setSelectedTL] = useState('')
  const [activities, setActivities] = useState([])
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showAddTRFModal, setShowAddTRFModal] = useState(false)

  useEffect(() => {
    if (id) {
      loadProject()
      loadRelatedData()
    }
  }, [id])

  const loadProject = async () => {
    try {
      const data = await projectsService.getById(parseInt(id))
      setProject(data)
    } catch (error) {
      // If getById fails, try to get from getAll
      const allProjects = await projectsService.getAll()
      const foundProject = allProjects.find(p => p.id === parseInt(id))
      if (foundProject) {
        setProject(foundProject)
      } else {
        toast.error('Project not found')
        navigate('/lab/management/projects')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadRelatedData = async () => {
    if (!id) return
    try {
      const [samplesData, trfsData, plansData] = await Promise.all([
        samplesService.getAll(parseInt(id)).catch(() => []),
        trfsService.getAll(parseInt(id)).catch(() => []),
        testPlansService.getAll(parseInt(id)).catch(() => [])
      ])
      setSamples(samplesData)
      setTrfs(trfsData)
      setTestPlans(plansData)
    } catch (error) {
      // Silently fail
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FolderKanban },
    { id: 'test-plans', label: 'Test Plans', icon: FlaskConical, count: testPlans.length },
    { id: 'samples', label: 'Samples', icon: Package, count: samples.length },
    { id: 'trfs', label: 'TRFs', icon: FileCheck, count: trfs.length },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Project not found</p>
        <button
          onClick={() => navigate('/lab/management/projects')}
          className="mt-4 text-primary hover:underline"
        >
          Back to Projects
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/lab/management/projects')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-600 mt-1">Project Code: {project.code}</p>
        </div>
        <Badge variant={project.status === 'active' ? 'success' : 'default'}>
          {project.status}
        </Badge>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Client</p>
                    <p className="font-medium text-gray-900">{project.clientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge variant={project.status === 'active' ? 'success' : 'default'}>
                      {project.status}
                    </Badge>
                  </div>
                  {project.oem && (
                    <div>
                      <p className="text-sm text-gray-600">OEM</p>
                      <p className="font-medium text-gray-900">{project.oem}</p>
                    </div>
                  )}
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-primary">{testPlans.length}</p>
                    <p className="text-sm text-gray-600">Test Plans</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{samples.length}</p>
                    <p className="text-sm text-gray-600">Samples</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{trfs.length}</p>
                    <p className="text-sm text-gray-600">TRFs</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {testPlans.filter(p => p.status === 'Completed').length}
                    </p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'test-plans' && (
          <div className="space-y-4">
            {testPlans.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <FlaskConical className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No test plans for this project</p>
                  <button
                    onClick={() => navigate('/lab/management/test-plans')}
                    className="mt-4 text-primary hover:underline"
                  >
                    Create Test Plan
                  </button>
                </div>
              </Card>
            ) : (
              testPlans.map((plan) => (
                <Card
                  key={plan.id}
                  hover
                  className="cursor-pointer"
                  onClick={() => navigate(`/lab/management/test-plans/${plan.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FlaskConical className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                        <p className="text-sm text-gray-600">{plan.description || 'No description'}</p>
                        <p className="text-xs text-gray-500 mt-1">Type: {plan.testType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={plan.status === 'Completed' ? 'success' : plan.status === 'InProgress' ? 'warning' : 'default'}>
                        {plan.status}
                      </Badge>
                      <ExternalLink className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'samples' && (
          <div className="space-y-4">
            {samples.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No samples for this project</p>
                  <button
                    onClick={() => navigate('/lab/management/samples')}
                    className="mt-4 text-primary hover:underline"
                  >
                    Add Sample
                  </button>
                </div>
              </Card>
            ) : (
              samples.map((sample) => (
                <Card
                  key={sample.id}
                  hover
                  className="cursor-pointer"
                  onClick={() => navigate(`/lab/management/samples/${sample.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{sample.sampleNumber || `Sample-${sample.id}`}</h3>
                        {sample.receivedDate && (
                          <p className="text-sm text-gray-600">
                            Received: {new Date(sample.receivedDate).toLocaleDateString()}
                          </p>
                        )}
                        {sample.storageLocation && (
                          <p className="text-xs text-gray-500 mt-1">Location: {sample.storageLocation}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={sample.condition === 'Good' ? 'success' : sample.condition === 'Damaged' ? 'danger' : 'warning'}>
                        {sample.condition || 'Unknown'}
                      </Badge>
                      <ExternalLink className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'trfs' && (
          <div className="space-y-4">
            {/* Header row with Add TRF button */}
            {canCreate && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddTRFModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-all shadow shadow-primary/20"
                >
                  <Plus className="w-4 h-4" />
                  Add TRF
                </button>
              </div>
            )}

            {trfs.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <FileCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No TRFs for this project yet</p>
                  <p className="text-sm text-gray-400 mt-1">Use the "Add TRF" button above to attach a TRF to this project.</p>
                  <p className="text-gray-600">No TRFs for this project</p>
                  <button
                    onClick={() => navigate('/lab/management/trfs')}
                    className="mt-4 text-primary hover:underline"
                  >
                    Create TRF
                  </button>
                </div>
              </Card>
            ) : (
              trfs.map((trf) => (
                <Card
                  key={trf.id}
                  hover
                  className="cursor-pointer"
                  onClick={() => navigate(`/lab/management/trfs/${trf.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileCheck className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{trf.trfNumber || `TRF-${trf.id}`}</h3>
                        {trf.createdAt && (
                          <p className="text-sm text-gray-600">
                            Created: {new Date(trf.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={trf.status === 'Approved' ? 'success' : trf.status === 'Rejected' ? 'danger' : 'default'}>
                        {trf.status || 'Draft'}
                      </Badge>
                      <ExternalLink className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
      <Toaster position="top-right" />

      {/* Add TRF Modal */}
      {showAddTRFModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Add TRF</h3>
                  <p className="text-sm text-gray-500">Attach a Test Report Form to this project</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddTRFModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <CreateTRFForm
                projectId={parseInt(id)}
                onSuccess={() => {
                  setShowAddTRFModal(false)
                  loadRelatedData()
                }}
                onCancel={() => setShowAddTRFModal(false)}
              />
            </div>
          </motion.div>
        </div>
      )}

      {/* Workflow History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <History className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Workflow Activity Log</h3>
                  <p className="text-sm text-gray-500">Chronological history of this project</p>
                </div>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 rotate-90" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activities.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No activity recorded yet</p>
                </div>
              ) : (
                <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                  {activities.map((activity, idx) => (
                    <div key={activity.id} className="relative flex items-start gap-6 group">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-primary/20 group-hover:border-primary transition-colors flex-shrink-0 z-10 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-transparent group-hover:border-primary/10 group-hover:bg-white transition-all">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-primary uppercase tracking-wider">
                            {activity.processStep}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(activity.timestamp).toLocaleString(undefined, {
                              day: '2-digit', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 font-medium mb-2">{activity.action}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Users className="w-3 h-3" />
                          <span>{activity.userName} – <span className="italic">{activity.userRole}</span></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default ProjectDetail

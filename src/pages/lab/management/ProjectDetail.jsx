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
  Edit2,
  AlertCircle,
  History,
  Plus
} from 'lucide-react'
import { useLabManagementAuth } from '../../../contexts/LabManagementAuthContext'
import Modal from '../../../components/labManagement/Modal'
import CreateProjectForm from '../../../components/labManagement/forms/CreateProjectForm'
import { projectsService } from '../../../services/labManagementApi'
import { samplesService } from '../../../services/labManagementApi'
import { trfsService } from '../../../services/labManagementApi'
import { testPlansService } from '../../../services/labManagementApi'
import CreateTRFForm from '../../../components/labManagement/forms/CreateTRFForm'
import toast, { Toaster } from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Badge from '../../../components/labManagement/Badge'

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
  const [activity, setActivity] = useState([])
  const [loadingActivity, setLoadingActivity] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddTRFModal, setShowAddTRFModal] = useState(false)
  const isAdmin = user?.role === 'Admin'

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

  const loadActivity = async () => {
    if (!id) return
    try {
      setLoadingActivity(true)
      const data = await projectsService.getActivity(parseInt(id))
      setActivity(data)
    } catch (error) {
      console.error('Error loading activity:', error)
    } finally {
      setLoadingActivity(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'activity') {
      loadActivity()
    }
  }, [activeTab, id])

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FolderKanban },
    { id: 'test-plans', label: 'Test Plans', icon: FlaskConical, count: testPlans.length },
    { id: 'samples', label: 'Samples', icon: Package, count: samples.length },
    { id: 'trfs', label: 'TRFs', icon: FileCheck, count: trfs.length },
    { id: 'activity', label: 'Activity', icon: History },
  ]

  const isProjectAtRisk = () => {
    if (!project || !project.endDate || project.status === 'completed') return false
    const now = new Date()
    const deadline = new Date(project.endDate)
    const diffTime = deadline - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const progress = project.progress || 0
    
    if (diffDays <= 0 && progress < 100) return true
    if (diffDays <= 7 && progress < 80) return true
    if (diffDays <= 3 && progress < 90) return true
    return false
  }

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
        <div className="flex items-center gap-3">
          <Badge variant={project.priority === 'Critical' ? 'danger' : project.priority === 'High' ? 'warning' : 'default'}>
            {project.priority || 'Medium'} Priority
          </Badge>
          <Badge variant={project.status === 'active' ? 'success' : 'default'}>
            {project.status}
          </Badge>
          {isProjectAtRisk() && (
            <Badge variant="danger" className="animate-pulse">
              At Risk
            </Badge>
          )}
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Edit2 className="w-4 h-4" />
            Edit Project
          </button>
        )}
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
                    <p className="text-sm text-gray-600">Project Code</p>
                    <p className="font-medium text-gray-900">{project.code}</p>
                  </div>
                  <div className="pt-2">
                    <p className="text-sm text-gray-600 mb-2">Project Progress</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${project.progress || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-primary">{project.progress || 0}%</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline & Priority</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Priority Level</p>
                      <p className={`font-bold ${
                        project.priority === 'Critical' ? 'text-red-600' : 
                        project.priority === 'High' ? 'text-amber-600' : 'text-primary'
                      }`}>{project.priority || 'Medium'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge variant={project.status === 'active' ? 'success' : 'default'}>
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Start Date</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <p className="font-medium text-gray-900">
                          {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">End Date (Deadline)</p>
                      <div className="flex items-center gap-2 mt-1">
                        <AlertCircle className={`w-4 h-4 ${isProjectAtRisk() ? 'text-red-500' : 'text-gray-400'}`} />
                        <p className={`font-medium ${isProjectAtRisk() ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
                          {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

        {activeTab === 'activity' && (
          <div className="space-y-6">
            {loadingActivity ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
              </div>
            ) : activity.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No activity recorded yet.</p>
                </div>
              </Card>
            ) : (
              <div className="relative pl-8 space-y-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                {activity.map((log, index) => (
                  <div key={index} className="relative">
                    <div className={`absolute -left-10 w-5 h-5 rounded-full border-4 border-white shadow-sm z-10 ${
                      log.action === 'project.create' ? 'bg-green-500' :
                      log.action === 'project.assign' ? 'bg-primary' :
                      log.action === 'project.status_change' ? 'bg-amber-500' :
                      'bg-blue-400'
                    }`} />
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-gray-900">
                          {log.action === 'project.create' ? 'Project Created' :
                           log.action === 'project.assign' ? 'Project Assigned' :
                           log.action === 'project.status_change' ? 'Status Changed' :
                           'Project Updated'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {log.action === 'project.create' ? `Initial setup by ${log.user}` :
                         log.action === 'project.assign' ? `Assigned to ${log.details?.manager_name} by ${log.user}` :
                         log.action === 'project.status_change' ? `Status updated from "${log.details?.from}" to "${log.details?.to}" by ${log.user}` :
                         `Updated by ${log.user}`}
                      </p>
                      {log.action === 'project.update' && log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-3 overflow-hidden rounded-lg border border-gray-100 bg-gray-50/50">
                          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-100/80 transition-colors"
                               onClick={(e) => {
                                 const content = e.currentTarget.nextElementSibling;
                                 content.classList.toggle('hidden');
                               }}>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                              View {Object.keys(log.details).length} Changes
                            </span>
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          </div>
                          <div className="p-2 space-y-1.5 hidden">
                            {Object.entries(log.details).map(([key, diff]) => {
                              const label = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                              const isDiff = diff && typeof diff === 'object' && 'old' in diff && 'new' in diff;
                              
                              const formatValue = (val) => {
                                if (val === null || val === undefined || val === 'None') return 'Not set';
                                // Check if it's an ISO date string
                                if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
                                  return new Date(val).toLocaleDateString(undefined, { 
                                    year: 'numeric', month: 'short', day: 'numeric' 
                                  });
                                }
                                return String(val);
                              };

                              return (
                                <div key={key} className="flex flex-col text-xs p-1.5 rounded bg-white border border-gray-50">
                                  <span className="font-bold text-gray-700 mb-1">{label}</span>
                                  {isDiff ? (
                                    <div className="flex items-center gap-2 text-[11px]">
                                      <span className="text-red-500 bg-red-50 px-1.5 py-0.5 rounded line-through decoration-red-300">
                                        {formatValue(diff.old)}
                                      </span>
                                      <span className="text-gray-400">→</span>
                                      <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-medium">
                                        {formatValue(diff.new)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-600 italic">Changed to: {formatValue(diff)}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Project"
        size="lg"
      >
        <CreateProjectForm
          project={project}
          onSuccess={() => {
            setShowEditModal(false)
            loadProject()
          }}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      {/* Add TRF Modal */}
      <Modal
        isOpen={showAddTRFModal}
        onClose={() => setShowAddTRFModal(false)}
        title="Add TRF to Project"
        size="lg"
      >
        <CreateTRFForm
          projectId={parseInt(id)}
          onSuccess={() => {
            setShowAddTRFModal(false)
            loadRelatedData()
          }}
          onCancel={() => setShowAddTRFModal(false)}
        />
      </Modal>
    </div>
  )
}

export default ProjectDetail

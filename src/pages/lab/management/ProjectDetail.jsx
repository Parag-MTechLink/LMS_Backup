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
  Send
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { projectsService, authService, notificationsService } from '../../../services/labManagementApi'
import { samplesService } from '../../../services/labManagementApi'
import { trfsService } from '../../../services/labManagementApi'
import { testPlansService } from '../../../services/labManagementApi'
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

  useEffect(() => {
    if (id) {
      loadProject()
      loadRelatedData()
      if (user?.role === 'Project Manager' || user?.role === 'Admin') {
        loadTeamLeads()
      }
    }
  }, [id, user])

  const loadTeamLeads = async () => {
    try {
      const allUsers = await authService.getAllUsers()
      setTeamLeads(allUsers.filter(u => u.role === 'Team Lead'))
    } catch (error) {
      console.error('Failed to load team leads')
    }
  }

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

  const handleApprove = async (type) => {
    try {
      let updatedProject
      if (type === 'quality') updatedProject = await projectsService.approveQuality(project.id)
      else if (type === 'project') updatedProject = await projectsService.approveProject(project.id)
      else if (type === 'technical') updatedProject = await projectsService.approveTechnical(project.id)
      
      setProject(updatedProject)
      toast.success('Project approved successfully')
    } catch (error) {
      toast.error('Failed to approve project')
    }
  }

  const handleAssignTL = async () => {
    if (!selectedTL) return
    try {
      const updatedProject = await projectsService.assignTL(project.id, selectedTL)
      setProject(updatedProject)
      toast.success('Team Lead assigned successfully')
    } catch (error) {
      toast.error('Failed to assign Team Lead')
    }
  }

  const handleWorkflowAction = async (action) => {
    try {
      let updatedProject
      if (action === 'submit') {
        updatedProject = await projectsService.submitReport(project.id)
      } else if (action === 'review') {
        updatedProject = await projectsService.tlReview(project.id)
      } else if (action === 'payment') {
        updatedProject = await projectsService.verifyPayment(project.id)
      }
      setProject(updatedProject)
      toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} completed`)
    } catch (error) {
      toast.error(`Failed to ${action} project`)
    }
  }

  const getStatusVariant = (status) => {
    const s = status?.toLowerCase()
    if (s === 'approved' || s === 'completed') return 'success'
    if (s === 'testing_in_progress' || s === 'report_submitted' || s === 'tl_reviewed') return 'warning'
    if (s === 'payment_pending' || s === 'pending_payment') return 'danger'
    if (s === 'pending_team_lead') return 'default'
    return 'default'
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
        <Badge variant={getStatusVariant(project.status)}>
          {project.status.replace(/_/g, ' ')}
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
                  {project.teamLeadName && (
                    <div>
                      <p className="text-sm text-gray-600">Assigned Team Lead</p>
                      <p className="font-medium text-blue-600 flex items-center gap-1">
                        <UserCheck className="w-4 h-4" />
                        {project.teamLeadName}
                      </p>
                    </div>
                  )}
                </div>

                {/* Workflow Approvals */}
                <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Workflow Control
                  </h4>

                  {/* ── PM: Assign Team Lead ── */}
                  {project.status === 'pending_team_lead' && (user?.role === 'Project Manager' || user?.role === 'Admin') && (
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
                      <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                        <UserCheck className="w-4 h-4" />
                        Assign Team Lead to start testing
                      </p>
                      <div className="flex gap-2">
                        <select
                          value={selectedTL}
                          onChange={(e) => setSelectedTL(e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary transition-all"
                        >
                          <option value="">Select Team Lead...</option>
                          {teamLeads.map(tl => (
                            <option key={tl.id} value={tl.id}>{tl.full_name}</option>
                          ))}
                        </select>
                        <button
                          onClick={handleAssignTL}
                          disabled={!selectedTL}
                          className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-all"
                        >
                          Assign
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── TL/Admin: Workflow Actions ── */}
                  <div className="grid grid-cols-1 gap-3">
                    {project.status === 'testing_in_progress' && (user?.role === 'Team Lead' || user?.role === 'Technical Manager' || user?.role === 'Admin') && (
                       <button
                         onClick={() => handleWorkflowAction('submit')}
                         className="w-full flex items-center justify-center gap-2 p-3 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-all font-semibold"
                       >
                         <ClipboardCheck className="w-5 h-5" />
                         Submit Test Report
                       </button>
                    )}

                    {project.status === 'report_submitted' && (user?.role === 'Team Lead' || user?.role === 'Admin') && (
                      <button
                        onClick={() => handleWorkflowAction('review')}
                        className="w-full flex items-center justify-center gap-2 p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-100 transition-all font-semibold"
                      >
                        <Send className="w-5 h-5" />
                        Complete TL Review
                      </button>
                    )}

                    {/* Final Approvals (Only visible after TL review or if admin) */}
                    {(project.status === 'tl_reviewed' || project.status === 'approved' || user?.role === 'Admin') && (
                      <div className="space-y-3 pt-2">
                        <p className="text-xs text-gray-500 font-medium">Final Approval Group</p>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-3">
                            {project.qualityManagerApproved ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <Clock className="w-5 h-5 text-gray-400" />
                            )}
                            <span className="text-sm font-medium">Quality Manager</span>
                          </div>
                          {user?.role === 'Quality Manager' && !project.qualityManagerApproved && (
                            <button onClick={() => handleApprove('quality')} className="px-3 py-1 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark">
                              Approve
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-3">
                            {project.projectManagerApproved ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <Clock className="w-5 h-5 text-gray-400" />
                            )}
                            <span className="text-sm font-medium">Project Manager</span>
                          </div>
                          {user?.role === 'Project Manager' && !project.projectManagerApproved && (
                            <button onClick={() => handleApprove('project')} className="px-3 py-1 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark">
                              Approve
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-3">
                            {project.technicalManagerApproved ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <Clock className="w-5 h-5 text-gray-400" />
                            )}
                            <span className="text-sm font-medium">Technical Manager</span>
                          </div>
                          {user?.role === 'Technical Manager' && !project.technicalManagerApproved && (
                            <button onClick={() => handleApprove('technical')} className="px-3 py-1 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark">
                              Approve
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Payment Verification */}
                    {!project.paymentCompleted && (user?.role === 'Finance Manager' || user?.role === 'Admin') && (
                      <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-3">
                        <p className="text-sm text-emerald-800 font-medium flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Verify payment to release final report
                        </p>
                        <button
                          onClick={() => handleWorkflowAction('payment')}
                          className="w-full py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-md"
                        >
                          Confirm Payment Received
                        </button>
                      </div>
                    )}

                    {project.paymentCompleted && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-green-800">Payment Verified</p>
                          <p className="text-xs text-green-600">The final report can now be released.</p>
                        </div>
                      </div>
                    )}
                  </div>
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
                  {canCreate && (
                    <button
                      onClick={() => navigate('/lab/management/test-plans')}
                      className="mt-4 text-primary hover:underline"
                    >
                      Create Test Plan
                    </button>
                  )}
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
                  {canCreate && (
                    <button
                      onClick={() => navigate('/lab/management/samples')}
                      className="mt-4 text-primary hover:underline"
                    >
                      Add Sample
                    </button>
                  )}
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
            {trfs.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <FileCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No TRFs for this project</p>
                  {canCreate && (
                    <button
                      onClick={() => navigate('/lab/management/trfs')}
                      className="mt-4 text-primary hover:underline"
                    >
                      Create TRF
                    </button>
                  )}
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
    </div>
  )
}

function Card({ children, className = '', hover = false, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 transition-all ${hover ? 'hover:shadow-md hover:border-primary/30' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export default ProjectDetail

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
  MoreVertical
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
  const [activities, setActivities] = useState([])
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  useEffect(() => {
    if (id) {
      loadProject()
      loadRelatedData()
      loadActivities()
      if (user?.role === 'Project Manager' || user?.role === 'Admin') {
        loadTeamLeads()
      }
    }
  }, [id, user])

  const loadActivities = async () => {
    try {
      const data = await projectsService.getActivities(id)
      setActivities(data)
    } catch (error) {
      console.error('Failed to load activities')
    }
  }

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
      loadActivities()
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
      loadActivities()
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
      loadActivities()
      toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} completed`)
    } catch (error) {
      toast.error(`Failed to ${action} project`)
    }
  }

  const findActivity = (processStep) => {
    // Find the most recent activity for a specific process step
    // Handle both exact matches and partial matches for the triple approval
    return activities.find(a => 
      a.processStep.toLowerCase().includes(processStep.toLowerCase()) || 
      processStep.toLowerCase().includes(a.processStep.toLowerCase())
    )
  }

  const findApproverActivity = (role) => {
    return activities.find(a => 
      a.processStep === 'Triple Management Approval' && a.userRole === role
    )
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
                      <p className="font-medium text-primary flex items-center gap-2 mt-1">
                        <UserCheck className="w-4 h-4" />
                        {project.teamLeadName}
                      </p>
                    </div>
                  )}
                </div>

                {/* Workflow Actions Section */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      Workflow Control
                    </h4>
                    <button 
                      onClick={() => setShowHistoryModal(true)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-all"
                    >
                      <History className="w-4 h-4" />
                      View History
                    </button>
                  </div>

                  {/* Actionable Area */}

                  {/* Actionable Area */}
                  <div className="space-y-4">
                    {/* ── PM/Admin: Assign Team Lead ── */}
                    {project.status === 'pending_team_lead' && (user?.role === 'Project Manager' || user?.role === 'Admin') && (
                      <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-4">
                        <div className="flex items-center gap-3">
                          <UserCheck className="w-5 h-5 text-blue-600" />
                          <p className="text-base font-bold text-blue-900">Assign Team Lead</p>
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={selectedTL}
                            onChange={(e) => setSelectedTL(e.target.value)}
                            className="flex-1 px-4 py-2.5 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-primary transition-all text-sm"
                          >
                            <option value="">Select a Lead Engineer...</option>
                            {teamLeads.map(tl => (
                              <option key={tl.id} value={tl.id}>{tl.full_name}</option>
                            ))}
                          </select>
                          <button
                            onClick={handleAssignTL}
                            disabled={!selectedTL}
                            className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
                          >
                            Assign
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── Workflow Buttons ── */}
                    <div className="grid grid-cols-1 gap-3">
                      {project.status === 'testing_in_progress' && ((user?.role === 'Team Lead' && user?.id === project.teamLeadId) || user?.role === 'Technical Manager' || user?.role === 'Admin') && (
                         <button
                           onClick={() => handleWorkflowAction('submit')}
                           className="group w-full flex items-center justify-between p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                         >
                           <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                               <ClipboardCheck className="w-6 h-6" />
                             </div>
                             <div className="text-left">
                               <p className="font-bold">Submit Test Report</p>
                               <p className="text-xs text-indigo-100">Upload and finalize the results</p>
                             </div>
                           </div>
                           <ArrowLeft className="w-5 h-5 rotate-180 opacity-0 group-hover:opacity-100 transition-all" />
                         </button>
                      )}

                      {project.status === 'report_submitted' && ((user?.role === 'Team Lead' && user?.id === project.teamLeadId) || user?.role === 'Technical Manager' || user?.role === 'Admin') && (
                        <button
                          onClick={() => handleWorkflowAction('review')}
                          className="group w-full flex items-center justify-between p-4 bg-amber-500 text-white rounded-2xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-200"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                              <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                              <p className="font-bold">Complete TL Review</p>
                              <p className="text-xs text-amber-50">Final check before management approval</p>
                            </div>
                          </div>
                          <ArrowLeft className="w-5 h-5 rotate-180 opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                      )}
                    </div>

                    {/* ── Final Approvals (Group) ── */}
                    {(project.status === 'tl_reviewed' || project.status === 'approved' || project.status === 'completed' || user?.role === 'Admin') && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-bold text-gray-700">Triple Management Approval</p>
                          {project.pendingApprovals?.length > 0 && (
                            <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-600 font-bold rounded-full border border-red-100 animate-pulse">
                              Pending {project.pendingApprovals.length}
                            </span>
                          )}
                        </div>

                        {[
                          { role: 'Quality Manager', key: 'qualityManagerApproved', action: 'quality' },
                          { role: 'Project Manager', key: 'projectManagerApproved', action: 'project' },
                          { role: 'Technical Manager', key: 'technicalManagerApproved', action: 'technical' }
                        ].map((approver) => {
                          const act = findApproverActivity(approver.role)
                          return (
                            <div key={approver.role} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${project[approver.key] ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'}`}>
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${project[approver.key] ? 'bg-green-100' : 'bg-gray-100'}`}>
                                  {project[approver.key] ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Clock className="w-5 h-5 text-gray-400" />}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-900">{approver.role}</p>
                                  <p className={`text-xs ${project[approver.key] ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                                    {project[approver.key] 
                                      ? `Approved by ${act?.userName || 'Manager'} on ${act ? new Date(act.timestamp).toLocaleDateString() : 'N/A'}` 
                                      : 'Awaiting Review'}
                                  </p>
                                </div>
                              </div>
                              {user?.role === approver.role && !project[approver.key] && project.status === 'tl_reviewed' && (
                                <button 
                                  onClick={() => handleApprove(approver.action)}
                                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition-all"
                                >
                                  Approve
                                </button>
                              )}
                            </div>
                          )
                        })}

                        {project.status === 'tl_reviewed' && project.pendingApprovals?.length > 0 && (
                          <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <div className="space-y-1">
                              <p className="text-sm text-red-800 font-bold">Pending at Final Approval</p>
                              <p className="text-xs text-red-700 leading-relaxed">
                                Awaiting approval from: <span className="font-bold">{project.pendingApprovals.join(', ')}</span>
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Step 9: Payment Verification (Finance) ── */}
                    {(project.status === 'approved' || project.status === 'completed' || user?.role === 'Admin' || user?.role === 'Finance Manager') && (
                      <div className={`mt-6 p-5 rounded-2xl border transition-all ${project.paymentCompleted ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-gray-100 shadow-sm'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${project.paymentCompleted ? 'bg-emerald-100' : 'bg-blue-50'}`}>
                              <CreditCard className={`w-6 h-6 ${project.paymentCompleted ? 'text-emerald-600' : 'text-blue-600'}`} />
                            </div>
                            <div>
                              <p className="text-base font-bold text-gray-900">Payment Verification</p>
                              <p className={`text-sm ${project.paymentCompleted ? 'text-emerald-600 font-medium' : 'text-gray-500'}`}>
                                {project.paymentCompleted ? 'Verified & Completed' : 'Finance Review Required'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {!project.paymentCompleted && (user?.role === 'Finance Manager' || user?.role === 'Admin') && (
                          <button
                            onClick={() => handleWorkflowAction('payment')}
                            className="w-full py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                          >
                            Confirm Payment Received
                          </button>
                        )}
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

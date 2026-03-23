import { useEffect, useState } from 'react'
import { useLabManagementAuth } from '../../../contexts/LabManagementAuthContext'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Plus, Search, FileCheck, CheckCircle, Clock,
  ExternalLink, AlertTriangle, Zap, ArrowRight, X
} from 'lucide-react'
import { trfsService } from '../../../services/labManagementApi'
import { projectsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Button from '../../../components/labManagement/Button'
import Badge from '../../../components/labManagement/Badge'
import Input from '../../../components/labManagement/Input'
import Modal from '../../../components/labManagement/Modal'
import CreateTRFForm from '../../../components/labManagement/forms/CreateTRFForm'

// ─── Priority config ──────────────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  Urgent: { bg: 'bg-red-100 text-red-700',    icon: <AlertTriangle className="w-3 h-3 mr-1 inline" /> },
  High:   { bg: 'bg-orange-100 text-orange-700', icon: <Zap className="w-3 h-3 mr-1 inline" /> },
  Normal: { bg: 'bg-blue-100 text-blue-700',   icon: null },
  Low:    { bg: 'bg-gray-100 text-gray-600',   icon: null },
}

// ─── Status action map (who can do what transition) ──────────────────────────
// key = current status, value = { label, next, allowedRoles }
const STATUS_ACTIONS = {
  Draft:     { label: 'Submit',  next: 'Submitted', allowedRoles: ['Testing Engineer', 'Team Lead', 'Admin'] },
  Submitted: { label: 'Approve', next: 'Approved',  allowedRoles: ['Lab Manager', 'Quality Manager', 'Technical Manager', 'Admin'] },
}

function TRFs() {
  const [trfs, setTrfs] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(null) // trf id being actioned
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useLabManagementAuth()
  const canCreate = user?.role !== 'Quality Manager'

  const projectId = searchParams.get('projectId')

  useEffect(() => {
    loadProjects()
    loadTRFs()
  }, [])

  const loadProjects = async () => {
    try {
      const data = await projectsService.getAll()
      setProjects(data)
    } catch {
      toast.error('Failed to load projects')
    }
  }

  const loadTRFs = async () => {
    try {
      setLoading(true)
      if (projectId) {
        const data = await trfsService.getAll(parseInt(projectId))
        setTrfs(data)
        setSelectedProject(projectId)
      } else {
        const data = await trfsService.getAll()
        setTrfs(data)
      }
    } catch {
      toast.error('Failed to load TRFs')
    } finally {
      setLoading(false)
    }
  }

  const getStatusVariant = (status) => {
    const map = { Draft: 'default', Submitted: 'info', Approved: 'success', Rejected: 'danger' }
    return map[status] || 'default'
  }

  const handleStatusAction = async (trf, next) => {
    setActionLoading(trf.id)
    try {
      await trfsService.updateStatus(trf.id, next, user?.full_name)
      toast.success(`TRF marked as ${next}`)
      loadTRFs()
    } catch (err) {
      toast.error(err?.response?.data?.detail || `Failed to update status`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (trf) => {
    setActionLoading(trf.id)
    try {
      await trfsService.updateStatus(trf.id, 'Rejected', user?.full_name)
      toast.success('TRF rejected')
      loadTRFs()
    } catch {
      toast.error('Failed to reject TRF')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredTRFs = trfs.filter((trf) => {
    const trfNumber = trf.trfNumber || `TRF-${trf.id}`
    const matchesSearch =
      trfNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trf.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trf.test_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trf.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProject = selectedProject === 'all' || trf.projectId?.toString() === selectedProject
    const matchesStatus = selectedStatus === 'all' || (trf.status || 'Draft') === selectedStatus
    return matchesSearch && matchesProject && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-gray-600">Loading TRFs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
            Test Request Forms
          </h1>
          <p className="text-gray-500 mt-1 ml-1">
            {trfs.length} TRF{trfs.length !== 1 ? 's' : ''} total
            {trfs.filter(t => (t.status || 'Draft') === 'Submitted').length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                {trfs.filter(t => (t.status || 'Draft') === 'Submitted').length} awaiting review
              </span>
            )}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreateModal(true)} icon={<Plus className="w-5 h-5" />}>
            New TRF
          </Button>
        )}
      </motion.div>

      {/* ── Filters ── */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search TRFs, project, test type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-5 h-5" />}
          />
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </Card>

      {/* ── Grid ── */}
      {filteredTRFs.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FileCheck className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No TRFs found</p>
            <p className="text-sm text-gray-400 mt-1">
              {canCreate ? 'Click "New TRF" to create one.' : 'No TRFs match your filters.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTRFs.map((trf, index) => {
            const status = trf.status || 'Draft'
            const action = STATUS_ACTIONS[status]
            const priorityCfg = PRIORITY_CONFIG[trf.priority] || PRIORITY_CONFIG.Normal
            const canAction = action && action.allowedRoles.includes(user?.role)
            const isActioning = actionLoading === trf.id
            const canReject = status === 'Submitted' && ['Lab Manager', 'Quality Manager', 'Technical Manager', 'Admin'].includes(user?.role)

            return (
              <motion.div
                key={trf.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                whileHover={{ y: -4 }}
              >
                <Card hover className="cursor-pointer h-full flex flex-col" onClick={() => navigate(`/lab/management/trfs/${trf.id}`)}>
                  {/* Project link */}
                  {trf.projectId && (
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/lab/management/projects/${trf.projectId}`) }}
                      className="text-xs text-primary hover:underline flex items-center gap-1 mb-2 w-fit"
                    >
                      {trf.projectName || `Project #${trf.projectId}`}
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}

                  {/* Top row: icon + status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-md flex-shrink-0">
                      <FileCheck className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={getStatusVariant(status)}>{status}</Badge>
                      {trf.priority && (
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${priorityCfg.bg}`}>
                          {priorityCfg.icon}{trf.priority}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* TRF number + test type */}
                  <h3 className="text-lg font-bold text-gray-900">{trf.trfNumber || `TRF-${trf.id}`}</h3>
                  {trf.test_type && (
                    <p className="text-sm font-medium text-primary mt-0.5">{trf.test_type}</p>
                  )}

                  {/* Description snippet */}
                  {trf.description && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{trf.description}</p>
                  )}

                  {/* Sample description snippet */}
                  {trf.sample_description && (
                    <p className="text-xs text-gray-400 mt-1 italic line-clamp-1">
                      Sample: {trf.sample_description}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="mt-auto pt-3 space-y-1.5">
                    {trf.created_at && (
                      <div className="flex items-center text-xs text-gray-400">
                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                        {new Date(trf.created_at).toLocaleDateString()}
                      </div>
                    )}
                    {status === 'Approved' && trf.approved_by && (
                      <div className="flex items-center text-xs text-green-600">
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        Approved by {trf.approved_by}
                      </div>
                    )}
                    {status === 'Rejected' && trf.approved_by && (
                      <div className="flex items-center text-xs text-red-500">
                        <X className="w-3.5 h-3.5 mr-1.5" />
                        Rejected by {trf.approved_by}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  {(canAction || canReject) && (
                    <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {canAction && (
                        <button
                          disabled={isActioning}
                          onClick={() => handleStatusAction(trf, action.next)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-all"
                        >
                          {isActioning ? 'Processing...' : (
                            <>{action.label} <ArrowRight className="w-3.5 h-3.5" /></>
                          )}
                        </button>
                      )}
                      {canReject && (
                        <button
                          disabled={isActioning}
                          onClick={() => handleReject(trf)}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 disabled:opacity-50 transition-all"
                        >
                          {isActioning ? '...' : <><X className="w-3.5 h-3.5" />Reject</>}
                        </button>
                      )}
                    </div>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ── Create Modal ── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create TRF"
        size="lg"
      >
        <CreateTRFForm
          projectId={projectId ? parseInt(projectId) : undefined}
          onSuccess={() => { setShowCreateModal(false); loadTRFs() }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  )
}

export default TRFs

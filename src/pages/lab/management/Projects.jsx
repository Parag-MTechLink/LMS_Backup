import { motion } from 'framer-motion'
import { FolderKanban, Plus, Search, ExternalLink, Trash2 } from 'lucide-react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { projectsService, customersService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Modal from '../../../components/labManagement/Modal'
import CreateProjectForm from '../../../components/labManagement/forms/CreateProjectForm'
import ConfirmDeleteModal from '../../../components/labManagement/ConfirmDeleteModal'
import { useDebounce } from '../../../hooks/useDebounce'
import RouteSkeleton from '../../../components/RouteSkeleton'
import { useLabManagementAuth } from '../../../contexts/LabManagementAuthContext'

function Projects() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useLabManagementAuth()
  const isAdmin = user?.role === 'Sales Manager' || user?.role === 'Project Manager'
  const canCreate = user?.role !== 'Quality Manager' && (user?.role === 'Sales Manager' || user?.role === 'Project Manager')
  const [projects, setProjects] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true)
      const data = await projectsService.getAll()
      setProjects(data)
    } catch (error) {
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadCustomers = useCallback(async () => {
    try {
      const data = await customersService.getAll()
      setCustomers(data)
    } catch (error) {
      console.error('Failed to load customers:', error)
    }
  }, [])

  useEffect(() => {
    loadProjects()
    loadCustomers()
  }, [loadProjects, loadCustomers])

  // Support deep-linking from notifications or redirections
  useEffect(() => {
    const s = searchParams.get('search')
    if (s) setSearchTerm(s)

    const rfqId = searchParams.get('createFromRfq')
    if (rfqId && canCreate) {
      setShowCreateModal(true)
    }
  }, [searchParams, canCreate])

  const customerId = searchParams.get('customerId')

  const filteredProjects = useMemo(() => {
    return projects
      .filter(project => {
        const matchesSearch = !debouncedSearchTerm ||
          project.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          project.clientName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        const matchesCustomer = !customerId || project.clientId?.toString() === customerId
        const matchesFilter = !selectedCustomer || project.clientId?.toString() === selectedCustomer
        return matchesSearch && matchesCustomer && matchesFilter
      })
      .map(p => {
        const created = new Date(p.createdAt || p.created_at)
        const isNew = (new Date() - created) < 24 * 60 * 60 * 1000
        return { ...p, isNew }
      })
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.updated_at || a.createdAt || a.created_at)
        const dateB = new Date(b.updatedAt || b.updated_at || b.createdAt || b.created_at)
        return dateB - dateA
      })
  }, [projects, debouncedSearchTerm, customerId, selectedCustomer])

  const handleDeleteClick = (e, project) => {
    e.stopPropagation()
    setDeleteTarget(project)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await projectsService.delete(deleteTarget.id)
      toast.success('Project deleted successfully')
      setDeleteTarget(null)
      loadProjects()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete project')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <RouteSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="mt-2 text-gray-600">Manage all your lab projects</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All Customers</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.companyName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/lab/management/projects/${project.id}`)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FolderKanban className="w-6 h-6 text-primary" />
                </div>
                {project.isNew && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-primary border-2 border-white text-[8px] font-bold text-white items-center justify-center">N</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={(e) => handleDeleteClick(e, project)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${project.status === 'approved' || project.status === 'completed'
                    ? 'text-green-700 bg-green-50'
                    : project.status === 'testing_in_progress'
                      ? 'text-blue-700 bg-blue-50'
                      : 'text-yellow-700 bg-yellow-50'
                    }`}
                >
                  {project.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{project.clientName}</p>
            {project.code && (
              <p className="text-xs text-gray-500 mb-4">Code: {project.code}</p>
            )}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/lab/management/projects/${project.id}`)
                }}
                className="text-sm text-primary hover:text-primary-dark flex items-center gap-1"
              >
                View Details
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/lab/management/test-plans?projectId=${project.id}`)
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Test Plans
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
        size="lg"
      >
        <CreateProjectForm
          estimationId={searchParams.get('createFromEstimation')}
          rfqId={searchParams.get('createFromRfq')}
          customerId={searchParams.get('customerId')}
          onSuccess={() => {
            setShowCreateModal(false)
            loadProjects()
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete project"
        message="Are you sure you want to delete this project? This action cannot be undone."
        entityName={deleteTarget ? deleteTarget.name : ''}
        loading={deleting}
      />
    </div>
  )
}

export default Projects

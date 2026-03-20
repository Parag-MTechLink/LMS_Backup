import { motion } from 'framer-motion'
import { FolderKanban, Plus, Search, ExternalLink, Trash2, Edit2, Activity, AlertCircle, BarChart3, Clock, Users } from 'lucide-react'
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
  const isAdmin = user?.role === 'Admin'
  const [projects, setProjects] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const isProjectAtRisk = (project) => {
    if (!project.endDate || project.status === 'completed') return false
    const now = new Date()
    const deadline = new Date(project.endDate)
    const diffTime = deadline - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const progress = project.progress || 0
    
    // At risk if:
    // 1. Deadline passed and not finished
    // 2. Less than 7 days left and progress < 80%
    // 3. Less than 3 days left and progress < 90%
    if (diffDays <= 0 && progress < 100) return true
    if (diffDays <= 7 && progress < 80) return true
    if (diffDays <= 3 && progress < 90) return true
    return false
  }
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [activeFilter, setActiveFilter] = useState('all') // 'all', 'active', 'high-priority'
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'allocation'

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

  // Support deep-linking from notifications
  useEffect(() => {
    const s = searchParams.get('search')
    if (s) setSearchTerm(s)
  }, [searchParams])

  const customerId = searchParams.get('customerId')

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = !debouncedSearchTerm ||
        project.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        project.clientName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      const matchesCustomer = !customerId || project.clientId?.toString() === customerId
      const matchesFilter = !selectedCustomer || project.clientId?.toString() === selectedCustomer
      
      let matchesStats = true
      if (activeFilter === 'active') {
        matchesStats = project.status === 'active'
      } else if (activeFilter === 'high-priority') {
        matchesStats = ['High', 'Critical'].includes(project.priority)
      }

      return matchesSearch && matchesCustomer && matchesFilter && matchesStats
    })
  }, [projects, debouncedSearchTerm, customerId, selectedCustomer, activeFilter])

  const handleEditClick = (e, project) => {
    e.stopPropagation()
    setSelectedProject(project)
  }

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

  const allocationData = useMemo(() => {
    if (!isAdmin) return []
    const managersMap = {}
    
    projects.forEach(p => {
      if (!p.managerId) return
      if (!managersMap[p.managerId]) {
        managersMap[p.managerId] = {
          id: p.managerId,
          name: p.managerName || 'Unknown Manager',
          total: 0,
          active: 0,
          completed: 0,
          totalProgress: 0
        }
      }
      const m = managersMap[p.managerId]
      m.total++
      if (p.status === 'active') m.active++
      if (p.status === 'completed') m.completed++
      m.totalProgress += (p.progress || 0)
    })
    
    return Object.values(managersMap).map(m => ({
      ...m,
      avgProgress: Math.round(m.totalProgress / m.total),
      intensity: m.active > 5 ? 'High' : m.active > 2 ? 'Medium' : 'Low'
    }))
  }, [projects, isAdmin])

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
        <div className="flex items-center gap-3">
          {isAdmin && (
            <div className="flex bg-gray-100 p-1 rounded-lg mr-2">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode('allocation')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'allocation' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Allocation
              </button>
            </div>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { id: 'all', label: 'Total Projects', value: projects.length, icon: FolderKanban, color: 'text-blue-600', bg: 'bg-blue-50', activeBg: 'ring-2 ring-blue-500 bg-blue-50/50' },
          { id: 'active', label: 'Active Projects', value: projects.filter(p => p.status === 'active').length, icon: Activity, color: 'text-green-600', bg: 'bg-green-50', activeBg: 'ring-2 ring-green-500 bg-green-50/50' },
          { id: 'high-priority', label: 'High Priority', value: projects.filter(p => ['High', 'Critical'].includes(p.priority)).length, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', activeBg: 'ring-2 ring-red-500 bg-red-50/50' },
          { id: 'progress', label: 'Avg. Progress', value: `${Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length || 0)}%`, icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50', activeBg: '' }
        ].map((stat, i) => (
          <div 
            key={i} 
            onClick={() => stat.id !== 'progress' && setActiveFilter(stat.id === activeFilter ? 'all' : stat.id)}
            className={`bg-white rounded-xl p-4 shadow-sm border transition-all duration-200 flex items-center gap-4 cursor-pointer
              ${activeFilter === stat.id ? stat.activeBg : 'border-gray-100 hover:border-gray-300'}
              ${stat.id === 'progress' ? 'cursor-default pointer-events-none' : 'hover:shadow-md'}
            `}
          >
            <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                {stat.id === 'progress' && (
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full" 
                      style={{ width: stat.value }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={viewMode === 'list' ? "Search projects..." : "Search managers..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          {viewMode === 'list' && (
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
          )}
        </div>
      </div>

      {viewMode === 'list' ? (
        /* Projects Grid View */
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
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-primary" />
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <>
                    <button
                      onClick={(e) => handleEditClick(e, project)}
                      className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Edit project"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, project)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${project.priority === 'Critical'
                      ? 'text-red-700 bg-red-50 border border-red-100'
                      : project.priority === 'High'
                        ? 'text-amber-700 bg-amber-50 border border-amber-100'
                        : project.priority === 'Low'
                          ? 'text-gray-700 bg-gray-50 border border-gray-100'
                          : 'text-blue-700 bg-blue-50 border border-blue-100' // Medium
                    }`}
                  >
                    {project.priority || 'Medium'}
                  </span>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${project.status === 'active'
                      ? 'text-blue-700 bg-blue-50'
                      : project.status === 'completed'
                        ? 'text-green-700 bg-green-50'
                        : 'text-yellow-700 bg-yellow-50'
                      }`}
                  >
                    {project.status}
                  </span>
                  {isProjectAtRisk(project) && (
                    <span className="px-3 py-1 text-[10px] font-bold rounded-full bg-red-600 text-white animate-pulse">
                      AT RISK
                    </span>
                  )}
                </div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
            <p className="text-sm text-gray-600 mb-2 font-medium">{project.clientName}</p>
            
            {project.managerName && (
              <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10 mb-3 w-fit">
                <Users className="w-3.5 h-3.5" />
                <span className="font-medium">Manager: {project.managerName}</span>
              </div>
            )}
            
            <div className="space-y-3 mb-4">
              {project.code && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FolderKanban className="w-3.5 h-3.5" />
                  <span>Code: {project.code}</span>
                </div>
              )}
              {(project.startDate || project.endDate) && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span className={isProjectAtRisk(project) ? 'text-red-600 font-bold' : ''}>
                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'} - {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}
                  </span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-gray-500">Progress</span>
                <span className="text-xs font-bold text-primary">{project.progress || 0}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${project.progress || 0}%` }}
                  className="bg-primary h-full rounded-full"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
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
      ) : (
        /* Resource Allocation View */
        <div className="grid grid-cols-1 gap-6">
          {allocationData
            .filter(m => !debouncedSearchTerm || m.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
            .map(manager => (
              <div key={manager.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1 w-full space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {manager.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{manager.name}</h3>
                        <p className="text-sm text-gray-500">Project Manager</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        manager.intensity === 'High' ? 'bg-red-100 text-red-700' :
                        manager.intensity === 'Medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {manager.intensity} Workload
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 uppercase font-bold text-center">Total</p>
                      <p className="text-xl font-bold text-gray-900 text-center">{manager.total}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                      <p className="text-xs text-green-600 uppercase font-bold text-center">Active</p>
                      <p className="text-xl font-bold text-green-700 text-center">{manager.active}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <p className="text-xs text-blue-600 uppercase font-bold text-center">Completed</p>
                      <p className="text-xl font-bold text-blue-700 text-center">{manager.completed}</p>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-64 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-gray-600">Avg. Team Progress</span>
                    <span className="font-bold text-primary">{manager.avgProgress}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out shadow-sm ${
                        manager.avgProgress > 75 ? 'bg-green-500' :
                        manager.avgProgress > 40 ? 'bg-primary' :
                        'bg-amber-500'
                      }`}
                      style={{ width: `${manager.avgProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg">
                    <span className="text-[10px] text-gray-500 font-medium uppercase">Efficiency Index</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <div 
                          key={s}
                          className={`w-1.5 h-3 rounded-sm ${
                            s <= (manager.avgProgress / 20) ? 'bg-primary' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          {allocationData.length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No managers found or no assignments made yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || !!selectedProject}
        onClose={() => {
          setShowCreateModal(false)
          setSelectedProject(null)
        }}
        title={selectedProject ? "Edit Project" : "Create New Project"}
        size="lg"
      >
        <CreateProjectForm
          project={selectedProject}
          estimationId={searchParams.get('createFromEstimation')}
          customerId={searchParams.get('customerId')}
          onSuccess={() => {
            setShowCreateModal(false)
            setSelectedProject(null)
            loadProjects()
          }}
          onCancel={() => {
            setShowCreateModal(false)
            setSelectedProject(null)
          }}
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

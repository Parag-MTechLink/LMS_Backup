import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, FileCheck, CheckCircle, Clock, ExternalLink } from 'lucide-react'
import { trfsService } from '../../../services/labManagementApi'
import { projectsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Button from '../../../components/labManagement/Button'
import Badge from '../../../components/labManagement/Badge'
import Input from '../../../components/labManagement/Input'
import Modal from '../../../components/labManagement/Modal'
import CreateTRFForm from '../../../components/labManagement/forms/CreateTRFForm'

function TRFs() {
  const [trfs, setTrfs] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const projectId = searchParams.get('projectId')

  useEffect(() => {
    loadProjects()
    loadTRFs()
  }, [])

  const loadProjects = async () => {
    try {
      const data = await projectsService.getAll()
      setProjects(data)
    } catch (error) {
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
    } catch (error) {
      toast.error('Failed to load TRFs')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    if (!status) return 'default'
    const colors = {
      Draft: 'default',
      Submitted: 'info',
      Approved: 'success',
      Rejected: 'danger'
    }
    return colors[status] || 'default'
  }

  const filteredTRFs = trfs.filter(trf => {
    const trfNumber = trf.trfNumber || `TRF-${trf.id}`
    const matchesSearch = trfNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trf.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProject = selectedProject === 'all' || trf.projectId?.toString() === selectedProject
    const matchesStatus = selectedStatus === 'all' || (trf.status || 'Draft') === selectedStatus
    return matchesSearch && matchesProject && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading TRFs...</p>
        </div>
      </div>
    )
  }

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
              <FileCheck className="w-6 h-6 text-white" />
            </div>
            TRFs
          </h1>
          <p className="text-gray-600 mt-1">Test Request Forms management</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          icon={<Plus className="w-5 h-5" />}
        >
          New TRF
        </Button>
      </motion.div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search TRFs..."
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
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
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

      {/* TRFs Grid */}
      {filteredTRFs.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FileCheck className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No TRFs found</p>
            <p className="text-sm text-gray-400 mt-1">Create your first TRF to get started</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTRFs.map((trf, index) => (
            <motion.div
              key={trf.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card
                hover
                className="cursor-pointer h-full flex flex-col"
                onClick={() => navigate(`/lab/management/trfs/${trf.id}`)}
              >
                {trf.projectId && (
                  <div className="mb-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/lab/management/projects/${trf.projectId}`)
                      }}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      View Project
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg">
                    <FileCheck className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant={getStatusColor(trf.status)}>
                    {trf.status || 'Draft'}
                  </Badge>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {trf.trfNumber || `TRF-${trf.id}`}
                </h3>
                
                <div className="mt-auto space-y-2">
                  {trf.projectName && (
                    <div className="text-sm text-gray-600">
                      Project: {trf.projectName}
                    </div>
                  )}
                  
                  {trf.createdAt && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-2" />
                      {new Date(trf.createdAt).toLocaleDateString()}
                    </div>
                  )}
                  
                  {trf.status === 'Approved' && (
                    <div className="flex items-center text-sm text-green-600 mt-2">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approved
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create TRF"
        size="lg"
      >
        <CreateTRFForm
          projectId={projectId ? parseInt(projectId) : undefined}
          onSuccess={() => {
            setShowCreateModal(false)
            loadTRFs()
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  )
}

export default TRFs

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, Package, Calendar, MapPin, CheckCircle, ExternalLink } from 'lucide-react'
import { samplesService } from '../../../services/labManagementApi'
import { projectsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Button from '../../../components/labManagement/Button'
import Badge from '../../../components/labManagement/Badge'
import Input from '../../../components/labManagement/Input'
import Modal from '../../../components/labManagement/Modal'
import CreateSampleForm from '../../../components/labManagement/forms/CreateSampleForm'

function Samples() {
  const [samples, setSamples] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] = useState('all')
  const [selectedCondition, setSelectedCondition] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const projectId = searchParams.get('projectId')

  useEffect(() => {
    loadProjects()
    loadSamples()
  }, [])

  const loadProjects = async () => {
    try {
      const data = await projectsService.getAll()
      setProjects(data)
    } catch (error) {
      toast.error('Failed to load projects')
    }
  }

  const loadSamples = async () => {
    try {
      setLoading(true)
      if (projectId) {
        const data = await samplesService.getAll(parseInt(projectId))
        setSamples(data)
        setSelectedProject(projectId)
      } else {
        const data = await samplesService.getAll()
        setSamples(data)
      }
    } catch (error) {
      toast.error('Failed to load samples')
    } finally {
      setLoading(false)
    }
  }

  const getConditionColor = (condition) => {
    const colors = {
      Good: 'success',
      Damaged: 'danger',
      Incomplete: 'warning',
      Unknown: 'default'
    }
    return colors[condition] || 'default'
  }

  const filteredSamples = samples.filter(sample => {
    const matchesSearch = sample.sampleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sample.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProject = selectedProject === 'all' || sample.projectId?.toString() === selectedProject
    const matchesCondition = selectedCondition === 'all' || sample.condition === selectedCondition
    return matchesSearch && matchesProject && matchesCondition
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading samples...</p>
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
              <Package className="w-6 h-6 text-white" />
            </div>
            Samples
          </h1>
          <p className="text-gray-600 mt-1">Manage sample tracking and disposition</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          icon={<Plus className="w-5 h-5" />}
        >
          New Sample
        </Button>
      </motion.div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search samples..."
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
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Conditions</option>
            <option value="Good">Good</option>
            <option value="Damaged">Damaged</option>
            <option value="Incomplete">Incomplete</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>
      </Card>

      {/* Samples Grid */}
      {filteredSamples.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No samples found</p>
            <p className="text-sm text-gray-400 mt-1">Create your first sample to get started</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSamples.map((sample, index) => (
            <motion.div
              key={sample.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card
                hover
                className="cursor-pointer h-full flex flex-col"
                onClick={() => navigate(`/lab/management/samples/${sample.id}`)}
              >
                {sample.projectId && (
                  <div className="mb-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/lab/management/projects/${sample.projectId}`)
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
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant={getConditionColor(sample.condition)}>
                    {sample.condition}
                  </Badge>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {sample.sampleNumber}
                </h3>
                
                <div className="mt-auto space-y-2">
                  {sample.projectName && (
                    <div className="text-sm text-gray-600">
                      Project: {sample.projectName}
                    </div>
                  )}
                  
                  {sample.receivedDate && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(sample.receivedDate).toLocaleDateString()}
                    </div>
                  )}
                  
                  {sample.storageLocation && (
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-2" />
                      {sample.storageLocation}
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
        title="Create Sample"
        size="lg"
      >
        <CreateSampleForm
          projectId={projectId ? parseInt(projectId) : undefined}
          onSuccess={() => {
            setShowCreateModal(false)
            loadSamples()
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  )
}

export default Samples

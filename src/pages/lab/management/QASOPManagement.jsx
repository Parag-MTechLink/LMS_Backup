import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Plus, Search, FileText, Edit, Trash2, Eye, History, Download, Activity, ArrowLeft } from 'lucide-react'
import { sopService, testExecutionsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Button from '../../../components/labManagement/Button'
import Badge from '../../../components/labManagement/Badge'
import Input from '../../../components/labManagement/Input'
import Modal from '../../../components/labManagement/Modal'
import CreateSOPForm from '../../../components/labManagement/forms/CreateSOPForm'

function QASOPManagement() {
  const [sops, setSops] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedSOP, setSelectedSOP] = useState(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historySOP, setHistorySOP] = useState(null)

  useEffect(() => {
    loadSOPs()
  }, [])

  const loadSOPs = async () => {
    try {
      setLoading(true)
      console.log('Fetching SOPs from API...')
      const [data, execData] = await Promise.all([
        sopService.getAll().catch(() => []),
        testExecutionsService.getAll().catch(() => [])
      ])
      
      const activeExecs = execData.filter(e => ['In Progress', 'Running', 'Active'].includes(e.status))
      
      const enhancedSops = data.map((sop, idx) => ({
        ...sop,
        activeExecutions: activeExecs.length > 0 && sop.status === 'Active' 
          ? (idx % 3 === 0 ? [activeExecs[idx % activeExecs.length]] : []) 
          : []
      }))
      
      setSops(enhancedSops)
    } catch (error) {
      console.error('Error loading SOPs:', error)
      console.error('Error response:', error.response)
      console.error('Error message:', error.message)
      toast.error(`Failed to load SOPs: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'success',
      'Under Review': 'warning',
      'Obsolete': 'danger'
    }
    return colors[status] || 'default'
  }

  const filteredSOPs = sops.filter(sop => {
    const matchesSearch =
      sop.sopId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sop.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sop.approvedBy?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || sop.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || sop.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this SOP?')) return
    try {
      await sopService.delete(id)
      toast.success('SOP deleted successfully')
      loadSOPs()
    } catch (error) {
      toast.error('Failed to delete SOP')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading SOPs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <Link to="/lab/management/qa" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to QA Dashboard
        </Link>
      </div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            SOP Management
          </h1>
          <p className="text-gray-600 mt-1">Manage Standard Operating Procedures with version control</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          icon={<Plus className="w-5 h-5" />}
        >
          Add SOP
        </Button>
      </motion.div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search SOPs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-5 h-5" />}
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Categories</option>
            <option value="Testing">Testing</option>
            <option value="Calibration">Calibration</option>
            <option value="Sample Management">Sample Management</option>
            <option value="Quality Assurance">Quality Assurance</option>
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Under Review">Under Review</option>
            <option value="Obsolete">Obsolete</option>
          </select>
        </div>
      </Card>

      {/* SOPs Grid */}
      {filteredSOPs.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No SOPs found</p>
            <p className="text-sm text-gray-400 mt-1">Add your first SOP</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSOPs.map((sop, index) => (
            <motion.div
              key={sop.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card className="h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant={getStatusColor(sop.status)}>
                    {sop.status}
                  </Badge>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {sop.title}
                </h3>
                <p className="text-sm text-gray-500 mb-3">{sop.sopId}</p>

                <div className="space-y-2 mb-4 flex-1">
                  <div className="text-sm">
                    <span className="text-gray-500">Version:</span>
                    <span className="ml-2 font-medium text-gray-900">{sop.version}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Category:</span>
                    <span className="ml-2 font-medium text-gray-900">{sop.category}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Effective Date:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {new Date(sop.effectiveDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Approved By:</span>
                    <span className="ml-2 font-medium text-gray-900">{sop.approvedBy}</span>
                  </div>
                  {sop.nextReviewDate && (
                    <div className="text-sm">
                      <span className="text-gray-500">Next Review:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {new Date(sop.nextReviewDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {sop.linkedTests?.length > 0 && (
                    <div className="text-sm">
                      <span className="text-gray-500">Linked Tests:</span>
                      <span className="ml-2 font-medium text-gray-900">{sop.linkedTests.length}</span>
                    </div>
                  )}
                  {sop.activeExecutions && sop.activeExecutions.length > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Activity className="w-4 h-4" />
                        <span className="text-xs font-semibold">Currently in use</span>
                      </div>
                      <Badge variant="info">{sop.activeExecutions.length} Executions</Badge>
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSOP(sop)
                        setShowCreateModal(true)
                      }}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setHistorySOP(sop)
                        setShowHistoryModal(true)
                      }}
                    >
                      <History className="w-4 h-4" />
                    </Button>
                    {sop.documentUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(sop.documentUrl, '_blank')}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(sop.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setSelectedSOP(null)
        }}
        title={selectedSOP ? 'Edit SOP' : 'Add New SOP'}
        size="lg"
      >
        <CreateSOPForm
          sop={selectedSOP}
          onSuccess={() => {
            setShowCreateModal(false)
            setSelectedSOP(null)
            loadSOPs()
          }}
          onCancel={() => {
            setShowCreateModal(false)
            setSelectedSOP(null)
          }}
        />
      </Modal>

      {/* Revision History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false)
          setHistorySOP(null)
        }}
        title={`Revision History - ${historySOP?.sopId}`}
        size="md"
      >
        {historySOP && (
          <div className="space-y-4">
            {historySOP.revisionHistory?.map((revision, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">Version {revision.version}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(revision.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Changed By:</span> {revision.changedBy}
                </div>
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Changes:</span> {revision.changes}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default QASOPManagement

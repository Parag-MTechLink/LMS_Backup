import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, ClipboardCheck, Calendar, User } from 'lucide-react'
import { auditsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Button from '../../../components/labManagement/Button'
import Badge from '../../../components/labManagement/Badge'
import Input from '../../../components/labManagement/Input'
import Modal from '../../../components/labManagement/Modal'
import CreateAuditForm from '../../../components/labManagement/forms/CreateAuditForm'

function Audits() {
  const [audits, setAudits] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadAudits()
  }, [])

  const loadAudits = async () => {
    try {
      setLoading(true)
      const data = await auditsService.getAll()
      setAudits(data)
    } catch (error) {
      toast.error('Failed to load audits')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      Scheduled: 'info',
      InProgress: 'warning',
      Completed: 'success',
      Cancelled: 'danger'
    }
    return colors[status] || 'default'
  }

  const filteredAudits = audits.filter(audit => {
    const matchesSearch = audit.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || audit.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading audits...</p>
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
              <ClipboardCheck className="w-6 h-6 text-white" />
            </div>
            Audits
          </h1>
          <p className="text-gray-600 mt-1">Audit management and tracking</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          icon={<Plus className="w-5 h-5" />}
        >
          New Audit
        </Button>
      </motion.div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Search audits..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-5 h-5" />}
          />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="InProgress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </Card>

      {/* Audits Grid */}
      {filteredAudits.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <ClipboardCheck className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No audits found</p>
            <p className="text-sm text-gray-400 mt-1">Create your first audit to get started</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAudits.map((audit, index) => (
            <motion.div
              key={audit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card
                className="h-full flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg">
                    <ClipboardCheck className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant={getStatusColor(audit.status)}>
                    {audit.status}
                  </Badge>
                </div>

                <div className="mb-2">
                  <span className="text-sm font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md mb-1 inline-block">
                    {audit.auditNumber}
                  </span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {audit.auditType}
                  </Badge>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {audit.title}
                </h3>

                {audit.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {audit.description}
                  </p>
                )}

                <div className="mt-auto space-y-2">
                  {audit.auditDate && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(audit.auditDate).toLocaleDateString()}
                    </div>
                  )}

                  {audit.auditorName && (
                    <div className="flex items-center text-sm text-gray-500">
                      <User className="w-4 h-4 mr-2" />
                      {audit.auditorName}
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
        title="Create New Audit"
        size="lg"
      >
        <CreateAuditForm
          onSuccess={() => {
            setShowCreateModal(false)
            loadAudits()
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  )
}

export default Audits

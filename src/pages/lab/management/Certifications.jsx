import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Shield, Calendar, CheckCircle } from 'lucide-react'
import { certificationsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Button from '../../../components/labManagement/Button'
import Badge from '../../../components/labManagement/Badge'
import Input from '../../../components/labManagement/Input'
import Modal from '../../../components/labManagement/Modal'
import CreateCertificationForm from '../../../components/labManagement/forms/CreateCertificationForm'

function Certifications() {
  const [certifications, setCertifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadCertifications()
  }, [])

  const loadCertifications = async () => {
    try {
      setLoading(true)
      const data = await certificationsService.getAll()
      setCertifications(data)
    } catch (error) {
      toast.error('Failed to load certifications')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      Active: 'success',
      Expired: 'danger',
      Pending: 'warning',
      Renewal: 'info'
    }
    return colors[status] || 'default'
  }

  const filteredCertifications = certifications.filter(cert => {
    const matchesSearch = cert.certificateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.standard?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || cert.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading certifications...</p>
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
              <Shield className="w-6 h-6 text-white" />
            </div>
            Certifications
          </h1>
          <p className="text-gray-600 mt-1">Certification management and tracking</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          icon={<Plus className="w-5 h-5" />}
        >
          New Certification
        </Button>
      </motion.div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Search certifications..."
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
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
            <option value="Pending">Pending</option>
            <option value="Renewal">Renewal</option>
          </select>
        </div>
      </Card>

      {/* Certifications Grid */}
      {filteredCertifications.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No certifications found</p>
            <p className="text-sm text-gray-400 mt-1">Create your first certification to get started</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertifications.map((cert, index) => (
            <motion.div
              key={cert.id}
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
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant={getStatusColor(cert.status)}>
                    {cert.status}
                  </Badge>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {cert.certificateNumber || `CERT-${cert.id}`}
                </h3>

                {cert.standard && (
                  <p className="text-sm text-gray-600 mb-4">
                    Standard: {cert.standard}
                  </p>
                )}

                <div className="mt-auto space-y-2">
                  {cert.issueDate && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-2" />
                      Issued: {new Date(cert.issueDate).toLocaleDateString()}
                    </div>
                  )}

                  {cert.expiryDate && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-2" />
                      Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                    </div>
                  )}

                  {cert.status === 'Active' && (
                    <div className="flex items-center text-sm text-green-600 mt-2">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Active
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
        title="Create New Certification"
        size="lg"
      >
        <CreateCertificationForm
          onSuccess={() => {
            setShowCreateModal(false)
            loadCertifications()
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  )
}

export default Certifications

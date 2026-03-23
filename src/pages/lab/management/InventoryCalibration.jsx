import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { calibrationsService, instrumentsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Button from '../../../components/labManagement/Button'
import Badge from '../../../components/labManagement/Badge'
import Input from '../../../components/labManagement/Input'
import Modal from '../../../components/labManagement/Modal'
import CreateCalibrationForm from '../../../components/labManagement/forms/CreateCalibrationForm'

function InventoryCalibration() {
  const [calibrations, setCalibrations] = useState([])
  const [instruments, setInstruments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCalibration, setSelectedCalibration] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [calData, instData] = await Promise.all([
        calibrationsService.getAll(),
        instrumentsService.getAll()
      ])
      setCalibrations(calData)
      setInstruments(instData)
    } catch (error) {
      toast.error('Failed to load calibration data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'Valid': 'success',
      'Due Soon': 'warning',
      'Overdue': 'danger'
    }
    return colors[status] || 'default'
  }

  const getDaysUntilDue = (nextDueDate) => {
    if (!nextDueDate) return null
    const today = new Date()
    const due = new Date(nextDueDate)
    const diffTime = due - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const filteredCalibrations = calibrations.filter(cal => {
    const matchesSearch = 
      cal.calibrationId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cal.instrumentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cal.certifiedBy?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || cal.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading calibrations...</p>
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            Calibration Management
          </h1>
          <p className="text-gray-600 mt-1">Track calibration schedules, certificates, and compliance</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          icon={<Plus className="w-5 h-5" />}
        >
          Add Calibration
        </Button>
      </motion.div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Search calibrations..."
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
            <option value="Valid">Valid</option>
            <option value="Due Soon">Due Soon</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </Card>

      {/* Calibrations Grid */}
      {filteredCalibrations.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No calibrations found</p>
            <p className="text-sm text-gray-400 mt-1">Add your first calibration record</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCalibrations.map((calibration, index) => {
            const daysUntilDue = getDaysUntilDue(calibration.nextDueDate)
            return (
              <motion.div
                key={calibration.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card className="h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant={getStatusColor(calibration.status)}>
                      {calibration.status}
                    </Badge>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {calibration.instrumentName}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">{calibration.calibrationId}</p>
                  
                  <div className="space-y-2 mb-4 flex-1">
                    <div className="text-sm">
                      <span className="text-gray-500">Last Calibration:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {new Date(calibration.lastCalibrationDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Next Due:</span>
                      <span className={`ml-2 font-medium ${
                        daysUntilDue !== null && daysUntilDue < 30 ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {new Date(calibration.nextDueDate).toLocaleDateString()}
                        {daysUntilDue !== null && daysUntilDue < 30 && (
                          <span className="ml-2 text-xs">({daysUntilDue} days)</span>
                        )}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Frequency:</span>
                      <span className="ml-2 font-medium text-gray-900">{calibration.calibrationFrequency}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Certified By:</span>
                      <span className="ml-2 font-medium text-gray-900">{calibration.certifiedBy}</span>
                    </div>
                    {calibration.certificateNumber && (
                      <div className="text-sm">
                        <span className="text-gray-500">Certificate:</span>
                        <span className="ml-2 font-medium text-gray-900">{calibration.certificateNumber}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCalibration(calibration)
                        setShowCreateModal(true)
                      }}
                      className="w-full"
                    >
                      View Details
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setSelectedCalibration(null)
        }}
        title={selectedCalibration ? 'Edit Calibration' : 'Add New Calibration'}
        size="lg"
      >
        <CreateCalibrationForm
          calibration={selectedCalibration}
          instruments={instruments}
          onSuccess={() => {
            setShowCreateModal(false)
            setSelectedCalibration(null)
            loadData()
          }}
          onCancel={() => {
            setShowCreateModal(false)
            setSelectedCalibration(null)
          }}
        />
      </Modal>
    </div>
  )
}

export default InventoryCalibration

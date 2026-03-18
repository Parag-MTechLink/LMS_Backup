import { useEffect, useState } from 'react'
import { useLabManagementAuth } from '../../../contexts/LabManagementAuthContext'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Wrench, Edit, Trash2, Eye, AlertCircle } from 'lucide-react'
import { instrumentsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Button from '../../../components/labManagement/Button'
import Badge from '../../../components/labManagement/Badge'
import Input from '../../../components/labManagement/Input'
import Modal from '../../../components/labManagement/Modal'
import CreateInstrumentForm from '../../../components/labManagement/forms/CreateInstrumentForm'

function InventoryInstruments() {
  const [instruments, setInstruments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedInstrument, setSelectedInstrument] = useState(null)
  const navigate = useNavigate()
  const { user } = useLabManagementAuth()
  const canCreate = user?.role !== 'Quality Manager'

  useEffect(() => {
    loadInstruments()
  }, [])

  const loadInstruments = async () => {
    try {
      setLoading(true)
      const data = await instrumentsService.getAll()
      setInstruments(data)
    } catch (error) {
      toast.error('Failed to load instruments')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'success',
      'Under Maintenance': 'warning',
      'Out of Service': 'danger'
    }
    return colors[status] || 'default'
  }

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this instrument?')) {
      return
    }
    try {
      await instrumentsService.deactivate(id)
      toast.success('Instrument deactivated successfully')
      loadInstruments()
    } catch (error) {
      toast.error('Failed to deactivate instrument')
    }
  }

  const departments = [...new Set(instruments.map(i => i.assignedDepartment).filter(Boolean))]

  const filteredInstruments = instruments.filter(instrument => {
    const matchesSearch = 
      instrument.instrumentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instrument.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instrument.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instrument.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instrument.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || instrument.status === selectedStatus
    const matchesDepartment = selectedDepartment === 'all' || instrument.assignedDepartment === selectedDepartment
    return matchesSearch && matchesStatus && matchesDepartment
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading instruments...</p>
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            Instruments Management
          </h1>
          <p className="text-gray-600 mt-1">Manage lab instruments, maintenance, and warranty tracking</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => setShowCreateModal(true)}
            icon={<Plus className="w-5 h-5" />}
          >
            Add Instrument
          </Button>
        )}
      </motion.div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search instruments..."
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
            <option value="Under Maintenance">Under Maintenance</option>
            <option value="Out of Service">Out of Service</option>
          </select>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Instruments Grid */}
      {filteredInstruments.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No instruments found</p>
            <p className="text-sm text-gray-400 mt-1">Add your first instrument to get started</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInstruments.map((instrument, index) => (
            <motion.div
              key={instrument.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card className="h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <Wrench className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant={getStatusColor(instrument.status)}>
                    {instrument.status}
                  </Badge>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {instrument.name}
                </h3>
                <p className="text-sm text-gray-500 mb-3">{instrument.instrumentId}</p>
                
                <div className="space-y-2 mb-4 flex-1">
                  <div className="text-sm">
                    <span className="text-gray-500">Manufacturer:</span>
                    <span className="ml-2 font-medium text-gray-900">{instrument.manufacturer}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Model:</span>
                    <span className="ml-2 font-medium text-gray-900">{instrument.model}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Serial:</span>
                    <span className="ml-2 font-medium text-gray-900">{instrument.serialNumber}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Location:</span>
                    <span className="ml-2 font-medium text-gray-900">{instrument.labLocation}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Department:</span>
                    <span className="ml-2 font-medium text-gray-900">{instrument.assignedDepartment}</span>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedInstrument(instrument)
                        navigate(`/lab/management/inventory/instruments/${instrument.id}`)
                      }}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {canCreate && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedInstrument(instrument)
                            setShowCreateModal(true)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {instrument.status === 'Active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeactivate(instrument.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </>
                    )}
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
          setSelectedInstrument(null)
        }}
        title={selectedInstrument ? 'Edit Instrument' : 'Add New Instrument'}
        size="lg"
      >
        <CreateInstrumentForm
          instrument={selectedInstrument}
          onSuccess={() => {
            setShowCreateModal(false)
            setSelectedInstrument(null)
            loadInstruments()
          }}
          onCancel={() => {
            setShowCreateModal(false)
            setSelectedInstrument(null)
          }}
        />
      </Modal>
    </div>
  )
}

export default InventoryInstruments

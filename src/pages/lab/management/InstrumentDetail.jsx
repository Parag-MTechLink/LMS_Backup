import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Wrench, 
  Calendar, 
  ShoppingCart,
  Clock,
  User,
  Phone,
  Building2,
  AlertCircle,
  FileText,
  History,
  Edit,
  Trash2
} from 'lucide-react'
import { instrumentsService, calibrationsService, inventoryTransactionsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Badge from '../../../components/labManagement/Badge'
import Button from '../../../components/labManagement/Button'
import Modal from '../../../components/labManagement/Modal'
import CreateInstrumentForm from '../../../components/labManagement/forms/CreateInstrumentForm'
import CreateTransactionForm from '../../../components/labManagement/forms/CreateTransactionForm'

function InstrumentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [instrument, setInstrument] = useState(null)
  const [calibrations, setCalibrations] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)

  useEffect(() => {
    if (id) {
      // Reset state to avoid showing old data while new id is loading
      setInstrument(null)
      setCalibrations([])
      setTransactions([])
      loadData()
    }
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await instrumentsService.getById(parseInt(id))
      setInstrument(data)
      
      // Load related data
      const [calibData, transData] = await Promise.all([
        calibrationsService.getAll(parseInt(id)).catch(() => []),
        inventoryTransactionsService.getAll({ 
          item_id: parseInt(id), 
          item_type: 'Instrument' 
        }).catch(() => [])
      ])
      
      setCalibrations(calibData)
      setTransactions(transData)
    } catch (error) {
      toast.error('Failed to load instrument details')
      navigate('/lab/management/inventory/instruments')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTransaction = async (txnId) => {
    if (!window.confirm('Are you sure you want to delete this transaction? This will not revert stock changes.')) return
    try {
      await inventoryTransactionsService.delete(txnId)
      toast.success('Transaction deleted')
      loadData()
    } catch (error) {
      toast.error('Failed to delete transaction')
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

  if (loading && !instrument) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading instrument details...</p>
        </div>
      </div>
    )
  }

  if (!instrument) return null

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'calibration', label: 'Calibration History', icon: Calendar, count: calibrations.length },
    { id: 'transactions', label: 'Usage Logs', icon: History, count: transactions.length },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          onClick={() => navigate('/lab/management/inventory/instruments')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors w-fit"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{instrument.name}</h1>
            <Badge variant={getStatusColor(instrument.status)}>{instrument.status}</Badge>
          </div>
          <p className="text-gray-600 mt-1">Instrument ID: {instrument.instrumentId}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
          <Button onClick={() => setShowEditModal(true)}>Edit Instrument</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card title="Instrument Specifications">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Manufacturer</p>
                    <p className="font-medium text-gray-900">{instrument.manufacturer || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Model</p>
                    <p className="font-medium text-gray-900">{instrument.model || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Serial Number</p>
                    <p className="font-medium text-gray-900">{instrument.serialNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Location / Lab</p>
                    <p className="font-medium text-gray-900">{instrument.labLocation || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Assigned Department</p>
                    <p className="font-medium text-gray-900">{instrument.assignedDepartment || 'N/A'}</p>
                  </div>
                </div>
              </Card>

              <Card title="Notes & Additional Info">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {instrument.notes || 'No additional notes provided for this instrument.'}
                </p>
              </Card>
            </div>

            <div className="space-y-6">
              <Card title="Lifecycle & Warranty">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      Purchase Date
                    </div>
                    <span className="font-medium text-gray-900">
                      {instrument.purchaseDate ? new Date(instrument.purchaseDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <AlertCircle className="w-4 h-4" />
                      Warranty Expiry
                    </div>
                    <span className={`font-medium ${
                      instrument.warrantyExpiry && new Date(instrument.warrantyExpiry) < new Date() 
                        ? 'text-red-600' 
                        : 'text-gray-900'
                    }`}>
                      {instrument.warrantyExpiry ? new Date(instrument.warrantyExpiry).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </Card>

              <Card title="Service Vendor">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Vendor Name</p>
                      <p className="font-medium text-gray-900">{instrument.serviceVendor || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Contact / Email</p>
                      <p className="font-medium text-gray-900">{instrument.serviceVendorContact || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'calibration' && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-3 font-semibold text-gray-900">Calibration ID</th>
                    <th className="pb-3 font-semibold text-gray-900">Last Date</th>
                    <th className="pb-3 font-semibold text-gray-900">Due Date</th>
                    <th className="pb-3 font-semibold text-gray-900">Frequency</th>
                    <th className="pb-3 font-semibold text-gray-900">Certified By</th>
                    <th className="pb-3 font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {calibrations.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-gray-500">
                        No calibration records found for this instrument.
                      </td>
                    </tr>
                  ) : (
                    calibrations.map((calib) => (
                      <tr key={calib.id}>
                        <td className="py-4 font-medium text-gray-900">{calib.calibrationId}</td>
                        <td className="py-4 text-gray-600">{new Date(calib.lastCalibrationDate).toLocaleDateString()}</td>
                        <td className="py-4 text-gray-600">{new Date(calib.nextDueDate).toLocaleDateString()}</td>
                        <td className="py-4 text-gray-600">{calib.calibrationFrequency}</td>
                        <td className="py-4 text-gray-600">{calib.certifiedBy}</td>
                        <td className="py-4">
                          <Badge variant={calib.status === 'Valid' ? 'success' : 'warning'}>{calib.status}</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mb-4">
              <p className="text-sm text-blue-800">
                <strong>About Usage Logs:</strong> These logs provide a complete audit trail of how this instrument has been utilized across different laboratory tests. It tracks who used the instrument, for what purpose, and the specific date of activity.
              </p>
            </div>
            {transactions.length === 0 ? (
              <Card>
                <p className="text-center py-8 text-gray-500">No usage logs or transactions found.</p>
              </Card>
            ) : (
              transactions.map((txn) => (
                <Card key={txn.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        txn.transactionType === 'Usage' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                      }`}>
                        <History className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{txn.transactionType} - {txn.purpose}</p>
                        <p className="text-sm text-gray-500">Used by {txn.usedBy} on {new Date(txn.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={txn.transactionType === 'Usage' ? 'danger' : 'success'}>
                        {txn.transactionType === 'Usage' ? '-' : '+'}{txn.quantity}
                      </Badge>
                      <div className="flex gap-1 border-l pl-3 ml-1">
                        <button
                          onClick={() => {
                            setSelectedTransaction(txn)
                            setShowTransactionModal(true)
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-primary transition-colors"
                          title="Edit Transaction"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(txn.id)}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2"></div>
        <div className="space-y-6">
          <Card title="Quick Actions" icon={<Wrench className="w-5 h-5" />}>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start text-left"
                onClick={() => setShowEditModal(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Update Instrument Details
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left"
                onClick={() => navigate(`/lab/management/inventory/transactions?itemId=${id}&type=Instrument`)}
              >
                <History className="w-4 h-4 mr-2" />
                View Full Transaction Logs
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Instrument"
        size="lg"
      >
        <CreateInstrumentForm
          instrument={instrument}
          onSuccess={() => {
            setShowEditModal(false)
            loadData()
          }}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      {/* Transaction Edit Modal */}
      <Modal
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false)
          setSelectedTransaction(null)
        }}
        title="Edit Transaction"
        size="lg"
      >
        <CreateTransactionForm
          transaction={selectedTransaction}
          onSuccess={() => {
            setShowTransactionModal(false)
            setSelectedTransaction(null)
            loadData()
          }}
          onCancel={() => {
            setShowTransactionModal(false)
            setSelectedTransaction(null)
          }}
        />
      </Modal>
    </div>
  )
}

export default InstrumentDetail

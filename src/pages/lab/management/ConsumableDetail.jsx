import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Package, 
  Tag, 
  Layers, 
  Calendar, 
  Clipboard, 
  AlertTriangle,
  CheckCircle,
  Truck,
  Edit,
  History,
  FileText,
  Trash2
} from 'lucide-react'
import { consumablesService, inventoryTransactionsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Badge from '../../../components/labManagement/Badge'
import Button from '../../../components/labManagement/Button'
import Modal from '../../../components/labManagement/Modal'
import CreateConsumableForm from '../../../components/labManagement/forms/CreateConsumableForm'
import CreateTransactionForm from '../../../components/labManagement/forms/CreateTransactionForm'

function ConsumableDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [consumable, setConsumable] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await consumablesService.getById(parseInt(id))
      setConsumable(data)
      
      // Load transaction history
      const txnData = await inventoryTransactionsService.getAll({ 
        item_id: id, 
        item_type: 'Consumable' 
      }).catch(() => [])
      setTransactions(txnData)
    } catch (error) {
      toast.error('Failed to load consumable details')
      navigate('/lab/management/inventory/consumables')
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
      'In Stock': 'success',
      'Low Stock': 'warning',
      'Out of Stock': 'danger',
      'Expired': 'danger',
      'Expiring Soon': 'warning'
    }
    return colors[status] || 'default'
  }

  const isLowStock = consumable?.quantityAvailable <= consumable?.lowStockThreshold

  if (loading && !consumable) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading consumable details...</p>
        </div>
      </div>
    )
  }

  if (!consumable) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          onClick={() => navigate('/lab/management/inventory/consumables')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors w-fit"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{consumable.itemName}</h1>
            <Badge variant={getStatusColor(consumable.status)}>{consumable.status}</Badge>
          </div>
          <p className="text-gray-600 mt-1">Item ID: {consumable.itemId}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/lab/management/inventory/consumables')}>Back to List</Button>
          <Button onClick={() => setShowEditModal(true)} icon={<Edit className="w-4 h-4" />}>Edit Item</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Consumable Details" icon={<Package className="w-5 h-5" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Category</p>
                  <p className="font-medium text-gray-900">{consumable.category || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Layers className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Quantity Available</p>
                  <p className={`font-medium ${isLowStock ? 'text-orange-600' : 'text-gray-900'}`}>
                    {consumable.quantityAvailable} {consumable.unit}
                    {isLowStock && <AlertTriangle className="w-4 h-4 inline ml-1" />}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Low Stock Threshold</p>
                  <p className="font-medium text-gray-900">{consumable.lowStockThreshold} {consumable.unit}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Expiry Date</p>
                  <p className="font-medium text-gray-900">
                    {consumable.expiryDate ? new Date(consumable.expiryDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clipboard className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Batch/Lot Number</p>
                  <p className="font-medium text-gray-900">{consumable.batchLotNumber || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Supplier</p>
                  <p className="font-medium text-gray-900">{consumable.supplier || 'N/A'}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Notes" icon={<FileText className="w-5 h-5" />}>
            <p className="text-gray-700 whitespace-pre-wrap">
              {consumable.notes || 'No additional notes for this item.'}
            </p>
          </Card>

          <Card title="Transaction History" icon={<History className="w-5 h-5" />}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-3 font-semibold text-gray-600">ID</th>
                    <th className="py-3 font-semibold text-gray-600">Type</th>
                    <th className="py-3 font-semibold text-gray-600">Quantity</th>
                    <th className="py-3 font-semibold text-gray-600">Date</th>
                    <th className="py-3 font-semibold text-gray-600">User</th>
                    <th className="py-3 font-semibold text-gray-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-3 text-sm font-medium text-gray-900">{txn.transactionId}</td>
                      <td className="py-3">
                        <Badge variant={txn.transactionType === 'Addition' ? 'success' : 'warning'} className="text-xs">
                          {txn.transactionType}
                        </Badge>
                      </td>
                      <td className="py-3 text-sm text-gray-700">{txn.quantity}</td>
                      <td className="py-3 text-sm text-gray-500">{new Date(txn.date).toLocaleDateString()}</td>
                      <td className="py-3 text-sm text-gray-500">{txn.usedBy}</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedTransaction(txn)
                              setShowTransactionModal(true)
                            }}
                            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-primary transition-colors"
                            title="Edit Transaction"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(txn.id)}
                            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-400 italic">
                        No transaction history found for this item.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Quick Actions" icon={<Package className="w-5 h-5" />}>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start text-left"
                onClick={() => setShowEditModal(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Update Stock/Details
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left"
                onClick={() => navigate(`/lab/management/inventory/transactions?itemId=${id}&type=Consumable`)}
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
        title="Edit Consumable Item"
        size="lg"
      >
        <CreateConsumableForm
          consumable={consumable}
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

export default ConsumableDetail

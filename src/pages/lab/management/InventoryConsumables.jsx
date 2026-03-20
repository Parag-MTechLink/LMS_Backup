import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Package, AlertTriangle, CheckCircle } from 'lucide-react'
import { consumablesService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Button from '../../../components/labManagement/Button'
import Badge from '../../../components/labManagement/Badge'
import Input from '../../../components/labManagement/Input'
import Modal from '../../../components/labManagement/Modal'
import CreateConsumableForm from '../../../components/labManagement/forms/CreateConsumableForm'

function InventoryConsumables() {
  const [consumables, setConsumables] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedConsumable, setSelectedConsumable] = useState(null)

  useEffect(() => {
    loadConsumables()
  }, [])

  const loadConsumables = async () => {
    try {
      setLoading(true)
      const data = await consumablesService.getAll()
      setConsumables(data)
    } catch (error) {
      toast.error('Failed to load consumables')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (item) => {
    if (item.status === 'Low Stock') return 'warning'
    if (item.status === 'Out of Stock') return 'danger'
    if (item.status === 'Expired') return 'danger'
    if (item.status === 'Expiring Soon') return 'warning'
    return 'success'
  }

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 && diffDays <= 30
  }

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false
    const today = new Date()
    const expiry = new Date(expiryDate)
    return expiry < today
  }

  const filteredConsumables = consumables.filter(item => {
    const matchesSearch = 
      item.itemId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batchLotNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading consumables...</p>
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            Accessories & Consumables
          </h1>
          <p className="text-gray-600 mt-1">Manage consumables, track stock levels, and expiry dates</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          icon={<Plus className="w-5 h-5" />}
        >
          Add Item
        </Button>
      </motion.div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search items..."
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
            <option value="Consumable">Consumable</option>
            <option value="Accessory">Accessory</option>
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </Card>

      {/* Consumables Grid */}
      {filteredConsumables.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No items found</p>
            <p className="text-sm text-gray-400 mt-1">Add your first consumable or accessory</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredConsumables.map((item, index) => {
            const expiringSoon = isExpiringSoon(item.expiryDate)
            const expired = isExpired(item.expiryDate)
            const isLowStock = item.quantityAvailable <= item.lowStockThreshold
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card className="h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={getStatusColor(item)}>
                        {item.status}
                      </Badge>
                      {expired && (
                        <Badge variant="danger" className="text-xs">
                          Expired
                        </Badge>
                      )}
                      {expiringSoon && !expired && (
                        <Badge variant="warning" className="text-xs">
                          Expiring Soon
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {item.itemName}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">{item.itemId}</p>
                  
                  <div className="space-y-2 mb-4 flex-1">
                    <div className="text-sm">
                      <span className="text-gray-500">Category:</span>
                      <span className="ml-2 font-medium text-gray-900">{item.category}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Quantity:</span>
                      <span className={`ml-2 font-medium ${
                        isLowStock ? 'text-orange-600' : 'text-gray-900'
                      }`}>
                        {item.quantityAvailable} {item.unit}
                        {isLowStock && (
                          <AlertTriangle className="w-4 h-4 inline ml-1 text-orange-600" />
                        )}
                      </span>
                    </div>
                    {item.batchLotNumber && (
                      <div className="text-sm">
                        <span className="text-gray-500">Batch/Lot:</span>
                        <span className="ml-2 font-medium text-gray-900">{item.batchLotNumber}</span>
                      </div>
                    )}
                    {item.expiryDate && (
                      <div className="text-sm">
                        <span className="text-gray-500">Expiry:</span>
                        <span className={`ml-2 font-medium ${
                          expired ? 'text-red-600' : expiringSoon ? 'text-orange-600' : 'text-gray-900'
                        }`}>
                          {new Date(item.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="text-sm">
                      <span className="text-gray-500">Supplier:</span>
                      <span className="ml-2 font-medium text-gray-900">{item.supplier}</span>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedConsumable(item)
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
          setSelectedConsumable(null)
        }}
        title={selectedConsumable ? 'Edit Item' : 'Add New Item'}
        size="lg"
      >
        <CreateConsumableForm
          consumable={selectedConsumable}
          onSuccess={() => {
            setShowCreateModal(false)
            setSelectedConsumable(null)
            loadConsumables()
          }}
          onCancel={() => {
            setShowCreateModal(false)
            setSelectedConsumable(null)
          }}
        />
      </Modal>
    </div>
  )
}

export default InventoryConsumables

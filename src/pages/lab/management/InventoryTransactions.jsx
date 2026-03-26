import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, ShoppingCart, ArrowDown, ArrowUp, X, ArrowLeft, Eye, Edit, Trash2 } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { inventoryTransactionsService } from '../../../services/labManagementApi'
import { useLabData } from '../../../contexts/LabDataContext'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Button from '../../../components/labManagement/Button'
import Badge from '../../../components/labManagement/Badge'
import Input from '../../../components/labManagement/Input'
import Modal from '../../../components/labManagement/Modal'
import CreateTransactionForm from '../../../components/labManagement/forms/CreateTransactionForm'

function InventoryTransactions() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const initialSearch = queryParams.get('search') || ''
  const initialCategory = queryParams.get('type') || 'all'
  const initialItemId = queryParams.get('itemId') || ''

  const { inventoryData } = useLabData()
  const { transactions, setTransactions } = inventoryData
  const [loading, setLoading] = useState(transactions.length === 0)
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [selectedType, setSelectedType] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedItemId, setSelectedItemId] = useState(initialItemId)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)

  useEffect(() => {
    loadTransactions()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('search')
    const type = params.get('type')
    const iid = params.get('itemId')
    
    if (q !== null) setSearchTerm(q)
    if (type !== null) setSelectedCategory(type)
    if (iid !== null) setSelectedItemId(iid)
    
  }, [location.search])

  const loadTransactions = async () => {
    try {
      if (transactions.length === 0) {
        setLoading(true)
      }
      const data = await inventoryTransactionsService.getAll()
      setTransactions(data)
    } catch (error) {
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'Usage':
        return ArrowDown
      case 'Addition':
        return ArrowUp
      case 'Wastage':
        return X
      default:
        return ShoppingCart
    }
  }

  const getTransactionColor = (type) => {
    switch (type) {
      case 'Usage':
        return 'text-red-600 bg-red-50'
      case 'Addition':
        return 'text-green-600 bg-green-50'
      case 'Wastage':
        return 'text-orange-600 bg-orange-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction? This will not automatically revert stock changes; you should adjust stock manually if needed.')) return
    try {
      await inventoryTransactionsService.delete(id)
      toast.success('Transaction deleted successfully')
      loadTransactions()
    } catch (error) {
      toast.error('Failed to delete transaction')
    }
  }

  const filteredTransactions = transactions.filter(txn => {
    // If we have an itemId from the URL, filter specifically by that
    if (selectedItemId && selectedCategory !== 'all') {
      return txn.itemId == selectedItemId && txn.itemType === selectedCategory
    }

    const matchesSearch = 
      txn.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.usedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || txn.transactionType === selectedType
    const matchesCategory = selectedCategory === 'all' || txn.itemType === selectedCategory
    return matchesSearch && matchesType && matchesCategory
  })

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading transactions...</p>
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
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/lab/management/inventory')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to Inventory Dashboard"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              Inventory Transactions
            </h1>
            <p className="text-gray-600 mt-1">Log stock usage, additions, and wastage with audit trail</p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          icon={<Plus className="w-5 h-5" />}
        >
          New Transaction
        </Button>
      </motion.div>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-500 mr-2">Category:</span>
            {[
              { id: 'all', label: 'All Items' },
              { id: 'Instrument', label: 'Instruments' },
              { id: 'Consumable', label: 'Accessories & Consumables' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id)
                  setSelectedItemId('') // Clear specific item filter on category change
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {selectedItemId && selectedCategory !== 'all' && (
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-blue-800">
                  Showing logs for: <span className="font-bold">{filteredTransactions[0]?.itemName}</span> 
                  <span className="text-xs ml-1 text-blue-600">({selectedCategory})</span>
                </p>
              </div>
              <button 
                onClick={() => setSelectedItemId('')}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear Item Filter
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Search by ID, Item Name, User or Purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Txn Type:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Types</option>
                <option value="Usage">Usage</option>
                <option value="Addition">Addition</option>
                <option value="Wastage">Wastage</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No transactions found</p>
            <p className="text-sm text-gray-400 mt-1">Create your first transaction</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((transaction, index) => {
            const Icon = getTransactionIcon(transaction.transactionType)
            return (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl ${getTransactionColor(transaction.transactionType)} flex items-center justify-center`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <h3 
                              className="text-lg font-bold text-gray-900 hover:text-primary hover:underline cursor-pointer transition-colors"
                              onClick={() => {
                                const path = transaction.itemType === 'Instrument' 
                                  ? `/lab/management/inventory/instruments/${transaction.itemId}`
                                  : `/lab/management/inventory/consumables/${transaction.itemId}`
                                navigate(path)
                              }}
                            >
                              {transaction.itemName || `Unknown ${transaction.itemType || 'Item'} (${transaction.itemId})`}
                            </h3>
                            <div className="flex gap-1.5">
                              <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold">
                                {transaction.itemType === 'Instrument' ? 'Instrument' : 'Acc & Cons'}
                              </Badge>
                              <Badge variant={transaction.transactionType === 'Usage' ? 'danger' : transaction.transactionType === 'Addition' ? 'success' : 'warning'}>
                                {transaction.transactionType}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedTransaction(transaction)
                                setShowCreateModal(true)
                              }}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-primary"
                              title="Edit Transaction"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(transaction.id)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-red-600"
                              title="Delete Transaction"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Transaction ID:</span>
                            <span className="ml-2 font-medium text-gray-900">{transaction.transactionId}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Quantity:</span>
                            <span className={`ml-2 font-medium ${
                              transaction.transactionType === 'Usage' || transaction.transactionType === 'Wastage' 
                                ? 'text-red-600' 
                                : 'text-green-600'
                            }`}>
                              {transaction.transactionType === 'Usage' || transaction.transactionType === 'Wastage' ? '-' : '+'}
                              {transaction.quantity} {transaction.itemType === 'Consumable' ? 'units' : ''}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Used By:</span>
                            <span className="ml-2 font-medium text-gray-900">{transaction.usedBy}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Date:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {new Date(transaction.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {transaction.purpose && (
                          <div className="mt-2 text-sm">
                            <span className="text-gray-500">Purpose:</span>
                            <span className="ml-2 text-gray-900">{transaction.purpose}</span>
                          </div>
                        )}
                        {transaction.linkedTestName && (
                          <div className="mt-1 text-sm">
                            <span className="text-gray-500">Linked Test:</span>
                            <span className="ml-2 text-primary font-medium">{transaction.linkedTestName}</span>
                          </div>
                        )}
                        {transaction.notes && (
                          <div className="mt-2 text-sm text-gray-600 italic">
                            {transaction.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setSelectedTransaction(null)
        }}
        title={selectedTransaction ? 'Edit Transaction' : 'Create New Transaction'}
        size="lg"
      >
        {showCreateModal && (
          <CreateTransactionForm
            transaction={selectedTransaction}
            onSuccess={() => {
              setShowCreateModal(false)
              setSelectedTransaction(null)
              loadTransactions()
            }}
            onCancel={() => {
              setShowCreateModal(false)
              setSelectedTransaction(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}

export default InventoryTransactions

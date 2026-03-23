import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, ShoppingCart, ArrowDown, ArrowUp, X } from 'lucide-react'
import { inventoryTransactionsService, consumablesService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Button from '../../../components/labManagement/Button'
import Badge from '../../../components/labManagement/Badge'
import Input from '../../../components/labManagement/Input'
import Modal from '../../../components/labManagement/Modal'
import CreateTransactionForm from '../../../components/labManagement/forms/CreateTransactionForm'

function InventoryTransactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      setLoading(true)
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

  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = 
      txn.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.usedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || txn.transactionType === selectedType
    return matchesSearch && matchesType
  })

  if (loading) {
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            Inventory Transactions
          </h1>
          <p className="text-gray-600 mt-1">Log stock usage, additions, and wastage with audit trail</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-5 h-5" />}
          />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Types</option>
            <option value="Usage">Usage</option>
            <option value="Addition">Addition</option>
            <option value="Wastage">Wastage</option>
          </select>
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
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {transaction.itemName}
                          </h3>
                          <Badge variant={transaction.transactionType === 'Usage' ? 'danger' : transaction.transactionType === 'Addition' ? 'success' : 'warning'}>
                            {transaction.transactionType}
                          </Badge>
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
        onClose={() => setShowCreateModal(false)}
        title="Create New Transaction"
        size="lg"
      >
        <CreateTransactionForm
          onSuccess={() => {
            setShowCreateModal(false)
            loadTransactions()
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  )
}

export default InventoryTransactions

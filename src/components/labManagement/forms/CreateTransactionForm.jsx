import { useState, useEffect } from 'react'
import { inventoryTransactionsService, consumablesService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Button from '../Button'
import Input from '../Input'

export default function CreateTransactionForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    transactionId: '',
    itemId: '',
    transactionType: 'Usage',
    quantity: 0,
    usedBy: '',
    purpose: '',
    linkedTestId: null,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [consumables, setConsumables] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingItems, setLoadingItems] = useState(true)

  useEffect(() => {
    loadConsumables()
  }, [])

  const loadConsumables = async () => {
    try {
      setLoadingItems(true)
      const data = await consumablesService.getAll()
      setConsumables(data)
    } catch (error) {
      toast.error('Failed to load items')
    } finally {
      setLoadingItems(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.transactionId.trim()) {
      toast.error('Please enter Transaction ID')
      return
    }

    if (!formData.itemId) {
      toast.error('Please select an Item')
      return
    }

    if (!formData.quantity || formData.quantity <= 0) {
      toast.error('Please enter a valid Quantity')
      return
    }

    if (!formData.usedBy.trim()) {
      toast.error('Please enter Used By')
      return
    }

    if (!formData.purpose.trim()) {
      toast.error('Please enter Purpose')
      return
    }

    if (!formData.date) {
      toast.error('Please select Date')
      return
    }

    try {
      setLoading(true)
      await inventoryTransactionsService.create(formData)
      toast.success('Transaction created successfully!')
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create transaction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-red-500">Please fill all mandatory details (*) in red</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={
            <span>
              Transaction ID <span className="text-red-500">*</span>
            </span>
          }
          value={formData.transactionId}
          onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
          placeholder="TXN-001"
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transaction Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.transactionType}
            onChange={(e) => setFormData({ ...formData, transactionType: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="Usage">Usage</option>
            <option value="Addition">Addition</option>
            <option value="Wastage">Wastage</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Item <span className="text-red-500">*</span>
          </label>
          {loadingItems ? (
            <div className="text-sm text-gray-500">Loading items...</div>
          ) : (
            <select
              value={formData.itemId}
              onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Select Item</option>
              {consumables.map(item => (
                <option key={item.id} value={item.id}>
                  {item.itemName} ({item.itemId}) - {item.quantityAvailable} {item.unit} available
                </option>
              ))}
            </select>
          )}
        </div>
        <Input
          label={
            <span>
              Quantity <span className="text-red-500">*</span>
            </span>
          }
          type="number"
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
          min="1"
          required
        />
        <Input
          label={
            <span>
              Used By <span className="text-red-500">*</span>
            </span>
          }
          value={formData.usedBy}
          onChange={(e) => setFormData({ ...formData, usedBy: e.target.value })}
          placeholder="John Doe"
          required
        />
        <Input
          label={
            <span>
              Date <span className="text-red-500">*</span>
            </span>
          }
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
        <Input
          label={
            <span>
              Purpose <span className="text-red-500">*</span>
            </span>
          }
          value={formData.purpose}
          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
          placeholder="EMC Testing - Project Alpha"
          required
        />
        <Input
          label="Linked Test ID (Optional)"
          type="number"
          value={formData.linkedTestId || ''}
          onChange={(e) => setFormData({ ...formData, linkedTestId: e.target.value ? parseInt(e.target.value) : null })}
          placeholder="123"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes about the transaction"
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={loading}
          className="flex-1"
        >
          Create Transaction
        </Button>
      </div>
    </form>
  )
}

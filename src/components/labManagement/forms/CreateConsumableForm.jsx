import { useLabManagementAuth } from '../../../contexts/LabManagementAuthContext'

export default function CreateConsumableForm({ consumable, onSuccess, onCancel }) {
  const { user } = useLabManagementAuth()
  const isReadOnly = user?.role === 'Quality Manager'
  const [formData, setFormData] = useState({
    itemId: '',
    category: 'Consumable',
    itemName: '',
    batchLotNumber: '',
    quantityAvailable: 0,
    unit: 'pieces',
    expiryDate: '',
    storageConditions: '',
    supplier: '',
    supplierContact: '',
    lowStockThreshold: 10,
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (consumable) {
      setFormData({
        itemId: consumable.itemId || '',
        category: consumable.category || 'Consumable',
        itemName: consumable.itemName || '',
        batchLotNumber: consumable.batchLotNumber || '',
        quantityAvailable: consumable.quantityAvailable || 0,
        unit: consumable.unit || 'pieces',
        expiryDate: consumable.expiryDate || '',
        storageConditions: consumable.storageConditions || '',
        supplier: consumable.supplier || '',
        supplierContact: consumable.supplierContact || '',
        lowStockThreshold: consumable.lowStockThreshold || 10,
        notes: consumable.notes || ''
      })
    }
  }, [consumable])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.itemId.trim()) {
      toast.error('Please enter Item ID')
      return
    }

    if (!formData.itemName.trim()) {
      toast.error('Please enter Item Name')
      return
    }

    if (!formData.category) {
      toast.error('Please select Category')
      return
    }

    if (!formData.batchLotNumber.trim()) {
      toast.error('Please enter Batch/Lot Number')
      return
    }

    if (formData.quantityAvailable === undefined || formData.quantityAvailable === null) {
      toast.error('Please enter Quantity Available')
      return
    }

    if (!formData.unit) {
      toast.error('Please select Unit')
      return
    }

    if (!formData.expiryDate) {
      toast.error('Please select Expiry Date')
      return
    }

    if (!formData.storageConditions.trim()) {
      toast.error('Please enter Storage Conditions')
      return
    }

    if (!formData.supplier.trim()) {
      toast.error('Please enter Supplier')
      return
    }

    if (!formData.supplierContact.trim()) {
      toast.error('Please enter Supplier Contact')
      return
    }

    if (formData.lowStockThreshold === undefined || formData.lowStockThreshold === null) {
      toast.error('Please enter Low Stock Threshold')
      return
    }

    try {
      setLoading(true)
      if (consumable) {
        await consumablesService.update(consumable.id, formData)
        toast.success('Item updated successfully!')
      } else {
        await consumablesService.create(formData)
        toast.success('Item created successfully!')
      }
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save item')
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
              Item ID <span className="text-red-500">*</span>
            </span>
          }
          value={formData.itemId}
          onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
          placeholder="CONS-001"
          required
          disabled={isReadOnly}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50 disabled:cursor-not-allowed"
            required
            disabled={isReadOnly}
          >
            <option value="Consumable">Consumable</option>
            <option value="Accessory">Accessory</option>
          </select>
        </div>
        <Input
          label={
            <span>
              Item Name <span className="text-red-500">*</span>
            </span>
          }
          value={formData.itemName}
          onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
          placeholder="EMC Test Probes"
          required
          disabled={isReadOnly}
        />
        <Input
          label={
            <span>
              Batch/Lot Number <span className="text-red-500">*</span>
            </span>
          }
          value={formData.batchLotNumber}
          onChange={(e) => setFormData({ ...formData, batchLotNumber: e.target.value })}
          placeholder="BATCH-2024-001"
          required
          disabled={isReadOnly}
        />
        <Input
          label={
            <span>
              Quantity Available <span className="text-red-500">*</span>
            </span>
          }
          type="number"
          value={formData.quantityAvailable}
          onChange={(e) => setFormData({ ...formData, quantityAvailable: parseInt(e.target.value) || 0 })}
          min="0"
          required
          disabled={isReadOnly}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Unit <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50 disabled:cursor-not-allowed"
            disabled={isReadOnly}
          >
            <option value="pieces">Pieces</option>
            <option value="kits">Kits</option>
            <option value="boxes">Boxes</option>
            <option value="liters">Liters</option>
            <option value="kg">Kilograms</option>
            <option value="meters">Meters</option>
          </select>
        </div>
        <Input
          label={
            <span>
              Expiry Date <span className="text-red-500">*</span>
            </span>
          }
          type="date"
          value={formData.expiryDate}
          onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
          required
          disabled={isReadOnly}
        />
        <Input
          label={
            <span>
              Storage Conditions <span className="text-red-500">*</span>
            </span>
          }
          value={formData.storageConditions}
          onChange={(e) => setFormData({ ...formData, storageConditions: e.target.value })}
          placeholder="Room Temperature"
          required
          disabled={isReadOnly}
        />
        <Input
          label={
            <span>
              Supplier <span className="text-red-500">*</span>
            </span>
          }
          value={formData.supplier}
          onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
          placeholder="Test Equipment Suppliers"
          required
          disabled={isReadOnly}
        />
        <Input
          label={
            <span>
              Supplier Contact <span className="text-red-500">*</span>
            </span>
          }
          type="email"
          value={formData.supplierContact}
          onChange={(e) => setFormData({ ...formData, supplierContact: e.target.value })}
          placeholder="sales@supplier.com"
          required
          disabled={isReadOnly}
        />
        <Input
          label={
            <span>
              Low Stock Threshold <span className="text-red-500">*</span>
            </span>
          }
          type="number"
          value={formData.lowStockThreshold}
          onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 0 })}
          min="0"
          placeholder="10"
          required
          disabled={isReadOnly}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes about the item"
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
          disabled={isReadOnly}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="flex-1"
        >
          {isReadOnly ? 'Close' : 'Cancel'}
        </Button>
        {!isReadOnly && (
          <Button
            type="submit"
            isLoading={loading}
            className="flex-1"
          >
            {consumable ? 'Update Item' : 'Create Item'}
          </Button>
        )}
      </div>
    </form>
  )
}

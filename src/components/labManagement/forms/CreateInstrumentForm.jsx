import { useLabManagementAuth } from '../../contexts/LabManagementAuthContext'

export default function CreateInstrumentForm({ instrument, onSuccess, onCancel }) {
  const { user } = useLabManagementAuth()
  const isReadOnly = user?.role === 'Quality Manager'
  const [formData, setFormData] = useState({
    instrumentId: '',
    name: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    labLocation: '',
    assignedDepartment: '',
    status: 'Active',
    purchaseDate: '',
    warrantyExpiry: '',
    serviceVendor: '',
    serviceVendorContact: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (instrument) {
      setFormData({
        instrumentId: instrument.instrumentId || '',
        name: instrument.name || '',
        manufacturer: instrument.manufacturer || '',
        model: instrument.model || '',
        serialNumber: instrument.serialNumber || '',
        labLocation: instrument.labLocation || '',
        assignedDepartment: instrument.assignedDepartment || '',
        status: instrument.status || 'Active',
        purchaseDate: instrument.purchaseDate || '',
        warrantyExpiry: instrument.warrantyExpiry || '',
        serviceVendor: instrument.serviceVendor || '',
        serviceVendorContact: instrument.serviceVendorContact || '',
        notes: instrument.notes || ''
      })
    }
  }, [instrument])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.instrumentId.trim()) {
      toast.error('Please enter Instrument ID')
      return
    }

    if (!formData.name.trim()) {
      toast.error('Please enter Instrument Name')
      return
    }

    if (!formData.manufacturer.trim()) {
      toast.error('Please enter Manufacturer')
      return
    }

    if (!formData.model.trim()) {
      toast.error('Please enter Model')
      return
    }

    if (!formData.serialNumber.trim()) {
      toast.error('Please enter Serial Number')
      return
    }

    if (!formData.labLocation.trim()) {
      toast.error('Please enter Lab Location')
      return
    }

    if (!formData.assignedDepartment) {
      toast.error('Please select Assigned Department')
      return
    }

    if (!formData.status) {
      toast.error('Please select Status')
      return
    }

    if (!formData.purchaseDate) {
      toast.error('Please select Purchase Date')
      return
    }

    if (!formData.warrantyExpiry) {
      toast.error('Please select Warranty Expiry')
      return
    }

    if (!formData.serviceVendor.trim()) {
      toast.error('Please enter Service Vendor')
      return
    }

    if (!formData.serviceVendorContact.trim()) {
      toast.error('Please enter Service Vendor Contact')
      return
    }

    try {
      setLoading(true)
      if (instrument) {
        await instrumentsService.update(instrument.id, formData)
        toast.success('Instrument updated successfully!')
      } else {
        await instrumentsService.create(formData)
        toast.success('Instrument created successfully!')
      }
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save instrument')
    } finally {
      setLoading(false)
    }
  }

  const departments = ['EMC Testing', 'RF Testing', 'Safety Testing', 'Environmental Testing', 'Quality Assurance']

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-red-500">Please fill all mandatory details (*) in red</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={
            <span>
              Instrument ID <span className="text-red-500">*</span>
            </span>
          }
          value={formData.instrumentId}
          onChange={(e) => setFormData({ ...formData, instrumentId: e.target.value })}
          placeholder="INST-001"
          required
          disabled={isReadOnly}
        />
        <Input
          label={
            <span>
              Name <span className="text-red-500">*</span>
            </span>
          }
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Spectrum Analyzer"
          required
          disabled={isReadOnly}
        />
        <Input
          label={
            <span>
              Manufacturer <span className="text-red-500">*</span>
            </span>
          }
          value={formData.manufacturer}
          onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
          placeholder="Keysight Technologies"
          required
          disabled={isReadOnly}
        />
        <Input
          label={
            <span>
              Model <span className="text-red-500">*</span>
            </span>
          }
          value={formData.model}
          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          placeholder="N9020B"
          required
          disabled={isReadOnly}
        />
        <Input
          label={
            <span>
              Serial Number <span className="text-red-500">*</span>
            </span>
          }
          value={formData.serialNumber}
          onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
          placeholder="US12345678"
          required
          disabled={isReadOnly}
        />
        <Input
          label={
            <span>
              Lab Location <span className="text-red-500">*</span>
            </span>
          }
          value={formData.labLocation}
          onChange={(e) => setFormData({ ...formData, labLocation: e.target.value })}
          placeholder="Lab A - Room 101"
          required
          disabled={isReadOnly}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assigned Department <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.assignedDepartment}
            onChange={(e) => setFormData({ ...formData, assignedDepartment: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50 disabled:cursor-not-allowed"
            disabled={isReadOnly}
          >
            <option value="">Select Department</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50 disabled:cursor-not-allowed"
            disabled={isReadOnly}
          >
            <option value="Active">Active</option>
            <option value="Under Maintenance">Under Maintenance</option>
            <option value="Out of Service">Out of Service</option>
          </select>
        </div>
        <Input
          label={
            <span>
              Purchase Date <span className="text-red-500">*</span>
            </span>
          }
          type="date"
          value={formData.purchaseDate}
          onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
          required
          disabled={isReadOnly}
        />
        <Input
          label={
            <span>
              Warranty Expiry <span className="text-red-500">*</span>
            </span>
          }
          type="date"
          value={formData.warrantyExpiry}
          onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
          required
          disabled={isReadOnly}
        />
        <Input
          label={
            <span>
              Service Vendor <span className="text-red-500">*</span>
            </span>
          }
          value={formData.serviceVendor}
          onChange={(e) => setFormData({ ...formData, serviceVendor: e.target.value })}
          placeholder="Keysight Service Center"
          required
          disabled={isReadOnly}
        />
        <Input
          label={
            <span>
              Service Vendor Contact <span className="text-red-500">*</span>
            </span>
          }
          type="email"
          value={formData.serviceVendorContact}
          onChange={(e) => setFormData({ ...formData, serviceVendorContact: e.target.value })}
          placeholder="service@keysight.com"
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
          placeholder="Additional notes about the instrument"
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
            {instrument ? 'Update Instrument' : 'Create Instrument'}
          </Button>
        )}
      </div>
    </form>
  )
}

import { useState } from 'react'
import { ncrsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Button from '../Button'
import Input from '../Input'

export default function CreateNCRForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    ncrNumber: '',
    description: '',
    status: 'Open',
    raisedBy: '',
    severity: 'Medium',
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.ncrNumber.trim()) {
      toast.error('Please enter NCR Number')
      return
    }

    if (!formData.raisedBy.trim()) {
      toast.error('Please enter Raised By')
      return
    }

    try {
      setLoading(true)
      await ncrsService.create(formData)
      toast.success('NCR created successfully!')
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create NCR')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-red-500">Please fill all mandatory details (*) in red</p>
      <Input
        label={
          <span>
            NCR Number <span className="text-red-500">*</span>
          </span>
        }
        value={formData.ncrNumber}
        onChange={(e) => setFormData({ ...formData, ncrNumber: e.target.value })}
        placeholder="e.g., NCR-001"
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter NCR description"
          rows={4}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="Open">Open</option>
          <option value="Under Investigation">Under Investigation</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Severity
        </label>
        <select
          value={formData.severity}
          onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>
      </div>

      <Input
        label={
          <span>
            Raised By <span className="text-red-500">*</span>
          </span>
        }
        value={formData.raisedBy}
        onChange={(e) => setFormData({ ...formData, raisedBy: e.target.value })}
        placeholder="Enter name of person who raised the NCR"
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes"
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
          Create NCR
        </Button>
      </div>
    </form>
  )
}

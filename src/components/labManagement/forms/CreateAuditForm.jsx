import { useState } from 'react'
import { auditsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Button from '../Button'
import Input from '../Input'

export default function CreateAuditForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    auditDate: new Date().toISOString().split('T')[0],
    status: 'Scheduled',
    auditorName: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('Please enter Audit Title')
      return
    }

    if (!formData.auditDate) {
      toast.error('Please select Audit Date')
      return
    }

    if (!formData.auditorName.trim()) {
      toast.error('Please enter Auditor Name')
      return
    }

    try {
      setLoading(true)
      await auditsService.create(formData)
      toast.success('Audit created successfully!')
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create audit')
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
            Audit Title <span className="text-red-500">*</span>
          </span>
        }
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Enter audit title"
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter audit description"
          rows={4}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
        />
      </div>

      <Input
        label={
          <span>
            Audit Date <span className="text-red-500">*</span>
          </span>
        }
        type="date"
        value={formData.auditDate}
        onChange={(e) => setFormData({ ...formData, auditDate: e.target.value })}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="Scheduled">Scheduled</option>
          <option value="InProgress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <Input
        label={
          <span>
            Auditor Name <span className="text-red-500">*</span>
          </span>
        }
        value={formData.auditorName}
        onChange={(e) => setFormData({ ...formData, auditorName: e.target.value })}
        placeholder="Enter auditor name"
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
          Create Audit
        </Button>
      </div>
    </form>
  )
}

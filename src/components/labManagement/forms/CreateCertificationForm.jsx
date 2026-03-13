import { useState } from 'react'
import { certificationsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Button from '../Button'
import Input from '../Input'

export default function CreateCertificationForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    certificateNumber: '',
    standard: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    status: 'Active',
    issuingBody: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.certificateNumber.trim()) {
      toast.error('Please enter Certificate Number')
      return
    }

    if (!formData.standard.trim()) {
      toast.error('Please enter Standard')
      return
    }

    if (!formData.issueDate) {
      toast.error('Please select Issue Date')
      return
    }

    if (!formData.expiryDate) {
      toast.error('Please select Expiry Date')
      return
    }

    if (!formData.status) {
      toast.error('Please select Status')
      return
    }

    if (!formData.issuingBody.trim()) {
      toast.error('Please enter Issuing Body')
      return
    }

    try {
      setLoading(true)
      await certificationsService.create(formData)
      toast.success('Certification created successfully!')
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create certification')
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
            Certificate Number <span className="text-red-500">*</span>
          </span>
        }
        value={formData.certificateNumber}
        onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
        placeholder="Enter certificate number"
        required
      />

      <Input
        label={
          <span>
            Standard <span className="text-red-500">*</span>
          </span>
        }
        value={formData.standard}
        onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
        placeholder="e.g., ISO 9001, ISO 17025"
        required
      />

      <Input
        label={
          <span>
            Issue Date <span className="text-red-500">*</span>
          </span>
        }
        type="date"
        value={formData.issueDate}
        onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
        required
      />

      <Input
        label={
          <span>
            Expiry Date <span className="text-red-500">*</span>
          </span>
        }
        type="date"
        value={formData.expiryDate}
        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
        placeholder="Enter expiry date"
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="Active">Active</option>
          <option value="Expired">Expired</option>
          <option value="Pending">Pending</option>
          <option value="Renewal">Renewal</option>
        </select>
      </div>

      <Input
        label={
          <span>
            Issuing Body <span className="text-red-500">*</span>
          </span>
        }
        value={formData.issuingBody}
        onChange={(e) => setFormData({ ...formData, issuingBody: e.target.value })}
        placeholder="Enter issuing body name"
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
          Create Certification
        </Button>
      </div>
    </form>
  )
}

import { useState } from 'react'
import { qcService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Button from '../Button'
import Input from '../Input'

export default function CreateQCForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    qcId: '',
    testName: '',
    parameter: '',
    targetValue: '',
    acceptanceRangeMin: '',
    acceptanceRangeMax: '',
    unit: '',
    frequency: 'Daily'
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.qcId.trim()) {
      toast.error('Please enter QC ID')
      return
    }

    if (!formData.testName.trim()) {
      toast.error('Please enter Test Name')
      return
    }

    if (!formData.parameter.trim()) {
      toast.error('Please enter Parameter')
      return
    }

    if (formData.targetValue === '') {
      toast.error('Please enter Target Value')
      return
    }

    if (formData.acceptanceRangeMin === '') {
      toast.error('Please enter Acceptance Range (Min)')
      return
    }

    if (formData.acceptanceRangeMax === '') {
      toast.error('Please enter Acceptance Range (Max)')
      return
    }

    if (!formData.unit.trim()) {
      toast.error('Please enter Unit')
      return
    }

    if (!formData.frequency) {
      toast.error('Please select Frequency')
      return
    }

    try {
      setLoading(true)
      const submitData = {
        ...formData,
        targetValue: parseFloat(formData.targetValue),
        acceptanceRange: {
          min: parseFloat(formData.acceptanceRangeMin),
          max: parseFloat(formData.acceptanceRangeMax)
        }
      }
      delete submitData.acceptanceRangeMin
      delete submitData.acceptanceRangeMax

      await qcService.create(submitData)
      toast.success('QC check created successfully!')
      onSuccess()
    } catch (error) {
      console.error('Error saving QC check:', error)
      console.error('Error response:', error.response?.data)

      // Handle FastAPI validation errors
      let errorMessage = 'Failed to create QC check'
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail
            .map(err => `${err.loc.join('.')}: ${err.msg}`)
            .join(', ')
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      toast.error(errorMessage)
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
              QC ID <span className="text-red-500">*</span>
            </span>
          }
          value={formData.qcId}
          onChange={(e) => setFormData({ ...formData, qcId: e.target.value })}
          placeholder="QC-001"
          required
        />
        <Input
          label={
            <span>
              Test Name <span className="text-red-500">*</span>
            </span>
          }
          value={formData.testName}
          onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
          placeholder="EMC Compliance Test"
          required
        />
        <Input
          label={
            <span>
              Parameter <span className="text-red-500">*</span>
            </span>
          }
          value={formData.parameter}
          onChange={(e) => setFormData({ ...formData, parameter: e.target.value })}
          placeholder="Emission Level"
          required
        />
        <Input
          label={
            <span>
              Target Value <span className="text-red-500">*</span>
            </span>
          }
          type="number"
          step="0.01"
          value={formData.targetValue}
          onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
          placeholder="50"
          required
        />
        <Input
          label={
            <span>
              Acceptance Range (Min) <span className="text-red-500">*</span>
            </span>
          }
          type="number"
          step="0.01"
          value={formData.acceptanceRangeMin}
          onChange={(e) => setFormData({ ...formData, acceptanceRangeMin: e.target.value })}
          placeholder="45"
          required
        />
        <Input
          label={
            <span>
              Acceptance Range (Max) <span className="text-red-500">*</span>
            </span>
          }
          type="number"
          step="0.01"
          value={formData.acceptanceRangeMax}
          onChange={(e) => setFormData({ ...formData, acceptanceRangeMax: e.target.value })}
          placeholder="55"
          required
        />
        <Input
          label={
            <span>
              Unit <span className="text-red-500">*</span>
            </span>
          }
          value={formData.unit}
          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          placeholder="dBµV/m"
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frequency <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.frequency}
            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
          </select>
        </div>
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
          Create QC Check
        </Button>
      </div>
    </form>
  )
}

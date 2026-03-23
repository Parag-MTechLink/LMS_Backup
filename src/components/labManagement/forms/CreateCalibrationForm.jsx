import { useState, useEffect } from 'react'
import { calibrationsService, filesService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Button from '../Button'
import Input from '../Input'

export default function CreateCalibrationForm({ calibration, instruments, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    calibrationId: '',
    instrumentId: '',
    lastCalibrationDate: '',
    nextDueDate: '',
    calibrationFrequency: '6 months',
    calibrationMethod: 'ISO/IEC 17025',
    certifiedBy: '',
    certificateNumber: '',
    certificateUrl: null,
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (calibration) {
      setFormData({
        calibrationId: calibration.calibrationId || '',
        instrumentId: calibration.instrumentId || '',
        lastCalibrationDate: calibration.lastCalibrationDate || '',
        nextDueDate: calibration.nextDueDate || '',
        calibrationFrequency: calibration.calibrationFrequency || '6 months',
        calibrationMethod: calibration.calibrationMethod || 'ISO/IEC 17025',
        certifiedBy: calibration.certifiedBy || '',
        certificateNumber: calibration.certificateNumber || '',
        certificateUrl: calibration.certificateUrl || null,
        notes: calibration.notes || ''
      })
    }
  }, [calibration])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.calibrationId.trim()) {
      toast.error('Please enter Calibration ID')
      return
    }

    if (!formData.instrumentId) {
      toast.error('Please select an Instrument')
      return
    }

    if (!formData.lastCalibrationDate) {
      toast.error('Please select Last Calibration Date')
      return
    }

    if (!formData.nextDueDate) {
      toast.error('Please select Next Due Date')
      return
    }

    if (!formData.calibrationFrequency) {
      toast.error('Please select Calibration Frequency')
      return
    }

    if (!formData.calibrationMethod) {
      toast.error('Please select Calibration Method')
      return
    }

    if (!formData.certifiedBy.trim()) {
      toast.error('Please enter Certified By')
      return
    }

    if (!formData.certificateNumber.trim()) {
      toast.error('Please enter Certificate Number')
      return
    }

    if (!formData.certificateUrl) {
      toast.error('Please upload Calibration Certificate')
      return
    }

    try {
      setLoading(true)
      
      let certificateUrl = formData.certificateUrl
      
      // If certificateUrl is a File object, upload it first
      if (formData.certificateUrl instanceof File) {
        const uploadRes = await filesService.uploadDocument(formData.certificateUrl, 'calibration')
        certificateUrl = uploadRes.file_url
      }

      const payload = {
        ...formData,
        certificateUrl: certificateUrl
      }

      if (calibration) {
        await calibrationsService.update(calibration.id, payload)
        toast.success('Calibration updated successfully!')
      } else {
        await calibrationsService.create(payload)
        toast.success('Calibration created successfully!')
      }
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.detail || error.response?.data?.message || 'Failed to save calibration')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size should not exceed 2MB')
        return
      }
      setFormData({ ...formData, certificateUrl: file })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-red-500">Please fill all mandatory details (*) in red</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={
            <span>
              Calibration ID <span className="text-red-500">*</span>
            </span>
          }
          value={formData.calibrationId}
          onChange={(e) => setFormData({ ...formData, calibrationId: e.target.value })}
          placeholder="CAL-001"
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instrument <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.instrumentId}
            onChange={(e) => setFormData({ ...formData, instrumentId: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">Select Instrument</option>
            {instruments?.map(inst => (
              <option key={inst.id} value={inst.id}>
                {inst.name} ({inst.instrumentId})
              </option>
            ))}
          </select>
        </div>
        <Input
          label={
            <span>
              Last Calibration Date <span className="text-red-500">*</span>
            </span>
          }
          type="date"
          value={formData.lastCalibrationDate}
          onChange={(e) => setFormData({ ...formData, lastCalibrationDate: e.target.value })}
          required
        />
        <Input
          label={
            <span>
              Next Due Date <span className="text-red-500">*</span>
            </span>
          }
          type="date"
          value={formData.nextDueDate}
          onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Calibration Frequency <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.calibrationFrequency}
            onChange={(e) => setFormData({ ...formData, calibrationFrequency: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="3 months">3 months</option>
            <option value="6 months">6 months</option>
            <option value="12 months">12 months</option>
            <option value="24 months">24 months</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Calibration Method <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.calibrationMethod}
            onChange={(e) => setFormData({ ...formData, calibrationMethod: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ISO/IEC 17025">ISO/IEC 17025</option>
            <option value="NIST Traceable">NIST Traceable</option>
            <option value="Manufacturer Standard">Manufacturer Standard</option>
            <option value="In-House">In-House</option>
          </select>
        </div>
        <Input
          label={
            <span>
              Certified By <span className="text-red-500">*</span>
            </span>
          }
          value={formData.certifiedBy}
          onChange={(e) => setFormData({ ...formData, certifiedBy: e.target.value })}
          placeholder="NIST Accredited Lab"
          required
        />
        <Input
          label={
            <span>
              Certificate Number <span className="text-red-500">*</span>
            </span>
          }
          value={formData.certificateNumber}
          onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
          placeholder="CAL-2024-001"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Certificate Upload (PDF, max 2MB) <span className="text-red-500">*</span>
        </label>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {formData.certificateUrl && (
          <p className="text-sm text-gray-500 mt-1">
            {formData.certificateUrl.name || 'File selected'}
          </p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes about the calibration"
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
          {calibration ? 'Update Calibration' : 'Create Calibration'}
        </Button>
      </div>
    </form>
  )
}

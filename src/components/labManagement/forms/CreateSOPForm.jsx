import { useState, useEffect } from 'react'
import { sopService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Button from '../Button'
import Input from '../Input'

export default function CreateSOPForm({ sop, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    sopId: '',
    title: '',
    category: 'Testing',
    version: '1.0',
    effectiveDate: '',
    approvedBy: '',
    status: 'Active',
    linkedTests: [],
    linkedInstruments: [],
    linkedDepartments: [],
    documentUrl: null,
    nextReviewDate: ''
  })
  const [loading, setLoading] = useState(false)
  const [linkedTestsInput, setLinkedTestsInput] = useState('')
  const [linkedInstrumentsInput, setLinkedInstrumentsInput] = useState('')
  const [linkedDepartmentsInput, setLinkedDepartmentsInput] = useState('')

  useEffect(() => {
    if (sop) {
      setFormData({
        sopId: sop.sopId || '',
        title: sop.title || '',
        category: sop.category || 'Testing',
        version: sop.version || '1.0',
        effectiveDate: sop.effectiveDate || '',
        approvedBy: sop.approvedBy || '',
        status: sop.status || 'Active',
        linkedTests: sop.linkedTests || [],
        linkedInstruments: sop.linkedInstruments || [],
        linkedDepartments: sop.linkedDepartments || [],
        documentUrl: sop.documentUrl || null,
        nextReviewDate: sop.nextReviewDate || ''
      })
      setLinkedTestsInput(sop.linkedTests?.join(', ') || '')
      setLinkedInstrumentsInput(sop.linkedInstruments?.join(', ') || '')
      setLinkedDepartmentsInput(sop.linkedDepartments?.join(', ') || '')
    }
  }, [sop])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.sopId.trim()) {
      toast.error('Please enter SOP ID')
      return
    }

    if (!formData.title.trim()) {
      toast.error('Please enter Title')
      return
    }

    if (!formData.category) {
      toast.error('Please select Category')
      return
    }

    if (!formData.version.trim()) {
      toast.error('Please enter Version')
      return
    }

    if (!formData.effectiveDate) {
      toast.error('Please select Effective Date')
      return
    }

    if (!formData.nextReviewDate) {
      toast.error('Please select Next Review Date')
      return
    }

    if (!formData.approvedBy.trim()) {
      toast.error('Please enter Approved By')
      return
    }

    if (!formData.documentUrl) {
      toast.error('Please upload SOP Document')
      return
    }

    try {
      setLoading(true)

      // Process linked items
      const linkedTests = linkedTestsInput.split(',').map(t => t.trim()).filter(t => t)
      const linkedInstruments = linkedInstrumentsInput.split(',').map(i => i.trim()).filter(i => i)
      const linkedDepartments = linkedDepartmentsInput.split(',').map(d => d.trim()).filter(d => d)

      // Handle file upload if it's a File object
      let uploadedUrl = formData.documentUrl
      if (formData.documentUrl instanceof File) {
        try {
          const uploadRes = await sopService.upload(formData.documentUrl)
          if (uploadRes.success && uploadRes.file_url) {
            uploadedUrl = uploadRes.file_url
          } else {
            throw new Error('Failed to get file URL from server')
          }
        } catch (uploadError) {
          console.error('File upload failed:', uploadError)
          toast.error('Failed to upload document. Please try again.')
          setLoading(false)
          return
        }
      }

      // Prepare submit data with proper null handling
      const submitData = {
        sopId: formData.sopId || undefined,
        title: formData.title,
        category: formData.category,
        version: formData.version,
        status: formData.status,
        effectiveDate: formData.effectiveDate,
        nextReviewDate: formData.nextReviewDate || null,
        approvedBy: formData.approvedBy,
        // Send the uploaded URL or existing string URL
        documentUrl: (uploadedUrl && typeof uploadedUrl === 'string') ? uploadedUrl : null,
        linkedTests: linkedTests.length > 0 ? linkedTests : null,
        linkedInstruments: linkedInstruments.length > 0 ? linkedInstruments : null,
        linkedDepartments: linkedDepartments.length > 0 ? linkedDepartments : null,
        revisionHistory: null
      }

      if (sop) {
        await sopService.update(sop.id, submitData)
        toast.success('SOP updated successfully!')
      } else {
        await sopService.create(submitData)
        toast.success('SOP created successfully!')
      }
      onSuccess()
    } catch (error) {
      console.error('Error saving SOP:', error)
      console.error('Error response:', error.response?.data)

      // Handle FastAPI validation errors
      let errorMessage = 'Failed to save SOP'
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          // FastAPI validation errors are arrays of objects
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should not exceed 10MB')
        return
      }
      setFormData({ ...formData, documentUrl: file })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-red-500">Please fill all mandatory details (*) in red</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={
            <span>
              SOP ID <span className="text-red-500">*</span>
            </span>
          }
          value={formData.sopId}
          onChange={(e) => setFormData({ ...formData, sopId: e.target.value })}
          placeholder="SOP-001"
          required
        />
        <Input
          label={
            <span>
              Title <span className="text-red-500">*</span>
            </span>
          }
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="EMC Testing Procedure"
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="Testing">Testing</option>
            <option value="Calibration">Calibration</option>
            <option value="Sample Management">Sample Management</option>
            <option value="Quality Assurance">Quality Assurance</option>
            <option value="Safety">Safety</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <Input
          label={
            <span>
              Version <span className="text-red-500">*</span>
            </span>
          }
          value={formData.version}
          onChange={(e) => setFormData({ ...formData, version: e.target.value })}
          placeholder="1.0"
          required
        />
        <Input
          label={
            <span>
              Effective Date <span className="text-red-500">*</span>
            </span>
          }
          type="date"
          value={formData.effectiveDate}
          onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
          required
        />
        <Input
          label={
            <span>
              Next Review Date <span className="text-red-500">*</span>
            </span>
          }
          type="date"
          value={formData.nextReviewDate}
          onChange={(e) => setFormData({ ...formData, nextReviewDate: e.target.value })}
          required
        />
        <Input
          label={
            <span>
              Approved By <span className="text-red-500">*</span>
            </span>
          }
          value={formData.approvedBy}
          onChange={(e) => setFormData({ ...formData, approvedBy: e.target.value })}
          placeholder="Dr. John Smith"
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
            <option value="Under Review">Under Review</option>
            <option value="Obsolete">Obsolete</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Linked Tests (comma-separated)
        </label>
        <Input
          value={linkedTestsInput}
          onChange={(e) => setLinkedTestsInput(e.target.value)}
          placeholder="EMC Compliance Test, RF Emission Test"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Linked Instruments (comma-separated)
        </label>
        <Input
          value={linkedInstrumentsInput}
          onChange={(e) => setLinkedInstrumentsInput(e.target.value)}
          placeholder="INST-001, INST-002"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Linked Departments (comma-separated)
        </label>
        <Input
          value={linkedDepartmentsInput}
          onChange={(e) => setLinkedDepartmentsInput(e.target.value)}
          placeholder="EMC Testing, Quality Assurance"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          SOP Document (PDF, max 10MB) <span className="text-red-500">*</span>
        </label>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {formData.documentUrl && (
          <p className="text-sm text-gray-500 mt-1">
            {formData.documentUrl.name || 'File selected'}
          </p>
        )}
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
          {sop ? 'Update SOP' : 'Create SOP'}
        </Button>
      </div>
    </form>
  )
}

import { useState, useEffect } from 'react'
import { documentControlService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Button from '../Button'
import Input from '../Input'

export default function CreateDocumentForm({ document, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    documentId: '',
    title: '',
    category: 'Policy',
    version: '1.0',
    documentType: 'Policy',
    effectiveDate: '',
    approvedBy: '',
    status: 'Active',
    accessLevel: 'All Staff',
    locked: false
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (document) {
      setFormData({
        documentId: document.documentId || '',
        title: document.title || '',
        category: document.category || 'Policy',
        version: document.version || '1.0',
        documentType: document.documentType || 'Policy',
        effectiveDate: document.effectiveDate || '',
        approvedBy: document.approvedBy || '',
        status: document.status || 'Active',
        accessLevel: document.accessLevel || 'All Staff',
        locked: document.locked || false
      })
    }
  }, [document])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.documentId.trim()) {
      toast.error('Please enter Document ID')
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

    if (!formData.documentType) {
      toast.error('Please select Document Type')
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

    if (!formData.approvedBy.trim()) {
      toast.error('Please enter Approved By')
      return
    }

    if (!formData.documentUrl) {
      toast.error('Please upload a Document File')
      return
    }

    try {
      setLoading(true)

      // Handle file upload if it's a File object
      let uploadedUrl = formData.documentUrl
      if (formData.documentUrl instanceof File) {
        try {
          const uploadRes = await documentControlService.upload(formData.documentUrl)
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

      // Prepare submit data - don't send File objects
      const submitData = {
        ...formData,
        // Send the uploaded URL or existing string URL
        documentUrl: (uploadedUrl && typeof uploadedUrl === 'string') ? uploadedUrl : null
      }

      if (document) {
        await documentControlService.update(document.id, submitData)
        toast.success('Document updated successfully!')
      } else {
        await documentControlService.create(submitData)
        toast.success('Document created successfully!')
      }
      onSuccess()
    } catch (error) {
      console.error('Error saving document:', error)
      console.error('Error response:', error.response?.data)

      // Handle FastAPI validation errors
      let errorMessage = 'Failed to save document'
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should not exceed 10MB')
        return
      }
      // In a real app, you would upload the file and get a URL
      setFormData({ ...formData, documentUrl: file })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-red-500 mb-4">Please fill all mandatory details (*) in red</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={
            <span>
              Document ID <span className="text-red-500">*</span>
            </span>
          }
          value={formData.documentId}
          onChange={(e) => setFormData({ ...formData, documentId: e.target.value })}
          placeholder="DOC-001"
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
          placeholder="Quality Manual"
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
            <option value="Policy">Policy</option>
            <option value="Certificate">Certificate</option>
            <option value="Report">Report</option>
            <option value="Procedure">Procedure</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.documentType}
            onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="Policy">Policy</option>
            <option value="Certificate">Certificate</option>
            <option value="Report">Report</option>
            <option value="Procedure">Procedure</option>
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
            Access Level <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.accessLevel}
            onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="All Staff">All Staff</option>
            <option value="QA Team">QA Team</option>
            <option value="Management">Management</option>
            <option value="Restricted">Restricted</option>
          </select>
        </div>
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
            <option value="Draft">Draft</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document File (PDF, max 10MB) <span className="text-red-500">*</span>
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
          {document ? 'Update Document' : 'Create Document'}
        </Button>
      </div>
    </form>
  )
}

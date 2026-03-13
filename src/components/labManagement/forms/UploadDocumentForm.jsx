import { useState } from 'react'
import { documentsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Button from '../Button'
import { Upload } from 'lucide-react'

function UploadDocumentForm({ onSuccess, onCancel }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('Report')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      if (!name) setName(selectedFile.name)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Please enter Document Name')
      return
    }

    if (!type) {
      toast.error('Please select Document Type')
      return
    }

    if (!file) {
      toast.error('Please upload a Document File')
      return
    }

    try {
      setLoading(true)

      const formData = new FormData()
      formData.append('name', name)
      formData.append('description', description)
      formData.append('type', type)
      formData.append('file', file)

      await documentsService.create(formData)

      toast.success('Document uploaded successfully')
      onSuccess()
    } catch (error) {
      console.error(error)
      toast.error('Failed to upload document')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-red-500 mb-4">Please fill all mandatory details (*) in red</p>

      {/* Document Name */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Document Name <span className="text-red-500">*</span>
        </label>
        <input
          className="w-full border rounded-lg px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      {/* Document Type */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Document Type <span className="text-red-500">*</span>
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="Report">Report</option>
          <option value="Certificate">Certificate</option>
          <option value="Manual">Manual</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          rows={3}
          className="w-full border rounded-lg px-3 py-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* File Upload */}
      <div className="border-2 border-dashed rounded-xl p-6 text-center">
        <label className="block text-sm font-medium mb-2 text-gray-700">
          Document File (PDF, max 10MB) <span className="text-red-500">*</span>
        </label>
        <Upload className="mx-auto h-10 w-10 text-gray-400" />
        <label className="cursor-pointer text-primary font-medium">
          Upload file
          <input
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            onChange={handleFileChange}
          />
        </label>

        {file && (
          <p className="mt-2 text-sm text-gray-700">{file.name}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload Document'}
        </Button>
      </div>

    </form>
  )
}

export default UploadDocumentForm

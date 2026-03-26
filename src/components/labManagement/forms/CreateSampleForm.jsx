import { useState, useEffect } from 'react'
import { samplesService } from '../../../services/labManagementApi'
import { projectsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Button from '../Button'
import Input from '../Input'

export default function CreateSampleForm({ projectId, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    projectId: projectId || 0,
    sampleNumber: '',
    receivedDate: new Date().toISOString().split('T')[0],
    condition: 'Good',
    storageLocation: '',
    notes: '',
    quantity: '',
    testDetails: ''
  })
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(!projectId)

  useEffect(() => {
    if (!projectId) {
      loadProjects()
    }
  }, [projectId])

  const loadProjects = async () => {
    try {
      setLoadingProjects(true)
      const data = await projectsService.getAll()
      setProjects(data)
    } catch (error) {
      toast.error('Failed to load projects')
    } finally {
      setLoadingProjects(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.projectId || formData.projectId === 0) {
      toast.error('Please select a Project')
      return
    }

    if (!formData.sampleNumber.trim()) {
      toast.error('Please enter Sample Number')
      return
    }

    if (!formData.receivedDate) {
      toast.error('Please select Received Date')
      return
    }

    if (!formData.condition) {
      toast.error('Please select Condition')
      return
    }

    if (!formData.storageLocation.trim()) {
      toast.error('Please enter Storage Location')
      return
    }

    try {
      setLoading(true)
      await samplesService.create(formData)
      toast.success('Sample created successfully!')
      onSuccess()
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.detail?.includes('unique')) {
        window.alert(error.response.data.detail)
      } else {
        toast.error(error.response?.data?.message || 'Failed to create sample')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-red-500">Please fill all mandatory details (*) in red</p>
      {!projectId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project <span className="text-red-500">*</span>
          </label>
          {loadingProjects ? (
            <div className="text-sm text-gray-500">Loading projects...</div>
          ) : (
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value={0}>Select a project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name} - {project.code}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <Input
        label={<>Sample Number <span className="text-red-500">*</span></>}
        value={formData.sampleNumber}
        onChange={(e) => setFormData({ ...formData, sampleNumber: e.target.value })}
        placeholder="e.g., SAMPLE-001"
        required
      />

      <Input
        label={
          <span>
            Received Date <span className="text-red-500">*</span>
          </span>
        }
        type="date"
        value={formData.receivedDate}
        onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Condition <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.condition}
          onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="Good">Good</option>
          <option value="Damaged">Damaged</option>
          <option value="Incomplete">Incomplete</option>
          <option value="Unknown">Unknown</option>
        </select>
      </div>

      <Input
        label={
          <span>
            Storage Location <span className="text-red-500">*</span>
          </span>
        }
        value={formData.storageLocation}
        onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
        placeholder="e.g., Shelf A-12"
        required
      />

      <Input
        label="Quantity"
        type="number"
        value={formData.quantity}
        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || '' })}
        placeholder="e.g., 5"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test Details
        </label>
        <textarea
          value={formData.testDetails}
          onChange={(e) => setFormData({ ...formData, testDetails: e.target.value })}
          placeholder="Details about tests for this sample"
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes about the sample"
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
          Create Sample
        </Button>
      </div>
    </form>
  )
}

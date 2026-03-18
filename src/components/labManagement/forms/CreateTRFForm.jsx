import { useState, useEffect } from 'react'
import { trfsService } from '../../../services/labManagementApi'
import { projectsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Button from '../Button'
import Input from '../Input'

export default function CreateTRFForm({ projectId, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    projectId: projectId || 0,
    trfNumber: '',
    templateData: {},
    notes: ''
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
    
    if (!formData.projectId) {
      toast.error('Please select a project')
      return
    }

    try {
      setLoading(true)
      await trfsService.create(formData)
      toast.success('TRF created successfully!')
      onSuccess()
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.detail?.includes('unique')) {
        window.alert(error.response.data.detail)
      } else {
        toast.error(error.response?.data?.message || 'Failed to create TRF')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-red-500 mb-4">Please fill all the mandatory details in the form (*)</p>
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
        label="TRF Number"
        value={formData.trfNumber}
        onChange={(e) => setFormData({ ...formData, trfNumber: e.target.value })}
        placeholder="e.g., TRF-001 (auto-generated if empty)"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes about the TRF"
          rows={4}
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
          Create TRF
        </Button>
      </div>
    </form>
  )
}

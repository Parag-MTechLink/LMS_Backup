import { useState, useEffect } from 'react'
import { testPlansService } from '../../../services/labManagementApi'
import { projectsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Button from '../Button'
import Input from '../Input'

export default function CreateTestPlanForm({ onSuccess, onCancel, projectId }) {
  const [formData, setFormData] = useState({
    projectId: projectId || 0,
    name: '',
    description: '',
    testType: 'EMC',
    assignedEngineerName: '',
    plannedStartDate: '',
    plannedEndDate: '',
  })
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
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

    if (!formData.name.trim()) {
      toast.error('Please enter Test Plan Name')
      return
    }

    if (!formData.testType) {
      toast.error('Please select Test Type')
      return
    }

    if (!formData.assignedEngineerName.trim()) {
      toast.error('Please enter Assigned Engineer')
      return
    }

    if (!formData.plannedStartDate) {
      toast.error('Please select Planned Start Date')
      return
    }

    if (!formData.plannedEndDate) {
      toast.error('Please select Planned End Date')
      return
    }

    const payload = {
      projectId: formData.projectId,
      name: formData.name,
      description: formData.description || undefined,
      testType: formData.testType,
      assignedEngineerName: formData.assignedEngineerName || undefined,
      plannedStartDate: formData.plannedStartDate ? new Date(formData.plannedStartDate).toISOString() : undefined,
      plannedEndDate: formData.plannedEndDate ? new Date(formData.plannedEndDate).toISOString() : undefined,
    }

    try {
      setLoading(true)
      await testPlansService.create(payload)
      toast.success('Test plan created successfully!')
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create test plan')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-red-500">Please fill all mandatory details (*) in red</p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.projectId}
          onChange={(e) => setFormData({ ...formData, projectId: parseInt(e.target.value) })}
          className={inputClass}
          required
          disabled={loadingProjects || !!projectId}
        >
          <option value={0}>Select a project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.code} - {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Test Plan Name */}
      <Input
        label={<>Test Plan Name <span className="text-red-500">*</span></>}
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Enter test plan name"
        required
      />

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter test plan description"
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Test Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test Type <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.testType}
          onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
          className={inputClass}
          required
        >
          <option value="EMC">EMC</option>
          <option value="RF">RF</option>
          <option value="Safety">Safety</option>
          <option value="Environmental">Environmental</option>
          <option value="Software">Software</option>
        </select>
      </div>

      {/* Assigned Engineer */}
      <Input
        label={
          <span>
            Assigned Engineer <span className="text-red-500">*</span>
          </span>
        }
        value={formData.assignedEngineerName}
        onChange={(e) => setFormData({ ...formData, assignedEngineerName: e.target.value })}
        placeholder="Enter engineer name"
        required
      />

      {/* Timeline */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Timeline</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.plannedStartDate}
              onChange={(e) => setFormData({ ...formData, plannedStartDate: e.target.value })}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.plannedEndDate}
              onChange={(e) => setFormData({ ...formData, plannedEndDate: e.target.value })}
              className={inputClass}
              required
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="button" onClick={onCancel} variant="outline" className="flex-1">
          Cancel
        </Button>
        <Button type="submit" isLoading={loading} className="flex-1">
          Create Test Plan
        </Button>
      </div>
    </form>
  )
}

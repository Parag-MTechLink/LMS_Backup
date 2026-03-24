import { useState, useEffect } from 'react'
import { projectsService, customersService, estimationsService, authService } from '../../../services/labManagementApi'
import { useLabManagementAuth } from '../../../contexts/LabManagementAuthContext'
import { Users } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../Button'
import Input from '../Input'

export default function CreateProjectForm({ onSuccess, onCancel, estimationId, customerId, project }) {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    code: project?.code || '',
    clientId: project?.clientId || customerId || 0,
    status: project?.status || 'pending',
    priority: project?.priority || 'Medium',
    startDate: project?.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
    endDate: project?.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
    progress: project?.progress || 0,
    managerId: project?.managerId || '',
    oem: project?.oem || '',
    description: project?.description || ''
  })
  const [customers, setCustomers] = useState([])
  const [managers, setManagers] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [loadingManagers, setLoadingManagers] = useState(false)
  
  const { user } = useLabManagementAuth()
  const isAdmin = user?.role === 'Admin'

  useEffect(() => {
    if (!customerId && !project?.clientId) {
      loadCustomers()
    } else {
      setLoadingCustomers(false)
    }
    
    // If coming from estimation, load estimation data
    if (estimationId && !project) {
      loadEstimationData()
    }

    if (isAdmin) {
      loadManagers()
    }
  }, [customerId, estimationId, project, isAdmin])

  const loadManagers = async () => {
    try {
      setLoadingManagers(true)
      const allUsers = await authService.getAllUsers()
      // Filter for Lab Managers only
      const labManagers = allUsers.filter(u => u.role === 'Lab Manager')
      setManagers(labManagers)
    } catch (error) {
      console.error('Failed to load managers:', error)
    } finally {
      setLoadingManagers(false)
    }
  }

  const loadCustomers = async () => {
    try {
      const data = await customersService.getAll()
      setCustomers(data)
    } catch (error) {
      toast.error('Failed to load customers')
    } finally {
      setLoadingCustomers(false)
    }
  }

  const loadEstimationData = async () => {
    try {
      const estimation = await estimationsService.getById(estimationId)
      if (estimation) {
        setFormData(prev => ({
          ...prev,
          clientId: estimation.customerId || prev.clientId,
          name: estimation.projectName || prev.name
        }))
      }
    } catch (error) {
      // Silently fail
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.clientId || formData.clientId === 0) {
      toast.error('Please select customer')
      return
    }

    if (!formData.name || !formData.code) {
      toast.error('Please fill all the mandatory details')
      return
    }

    try {
      setLoading(true)
      // Convert empty strings to null for dates
      const submitData = {
        ...formData,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      }
      
      if (project) {
        await projectsService.update(project.id, submitData)
        toast.success('Project updated successfully!')
      } else {
        await projectsService.create(submitData)
        toast.success('Project created successfully!')
      }
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data?.detail || 'Failed to save project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-red-500 mb-4">Please fill all the mandatory details in the form (*)</p>
      {(!customerId && !project?.clientId) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer <span className="text-red-500">*</span>
          </label>
          {loadingCustomers ? (
            <div className="text-sm text-gray-500">Loading customers...</div>
          ) : (
            <select
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value={0}>Select a customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.companyName}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={<>Project Name <span className="text-red-500">*</span></>}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter project name"
          required
        />

        <Input
          label={<>Project Code <span className="text-red-500">*</span></>}
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          placeholder="Enter project code"
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="OEM"
          value={formData.oem}
          onChange={(e) => setFormData({ ...formData, oem: e.target.value })}
          placeholder="Enter OEM name (optional)"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Project Manager (Lab Manager)
            </label>
            {loadingManagers ? (
              <div className="text-sm text-gray-500">Loading managers...</div>
            ) : (
              <select
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a Manager</option>
                {managers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.full_name}
                  </option>
                ))}
              </select>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Only the assigned manager will be able to see and manage this project.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="date"
          label="Start Date"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
        />
        <Input
          type="date"
          label="End Date (Deadline)"
          value={formData.endDate}
          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
        />
      </div>

      {project && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Progress ({formData.progress}%)
              </label>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter project description"
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
          {project ? 'Update Project' : 'Create Project'}
        </Button>
      </div>
    </form>
  )
}

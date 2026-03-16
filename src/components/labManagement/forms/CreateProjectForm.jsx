import { useState, useEffect } from 'react'
import { projectsService } from '../../../services/labManagementApi'
import { customersService } from '../../../services/labManagementApi'
import { estimationsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Button from '../Button'
import Input from '../Input'
import { useLabManagementAuth } from '../../contexts/LabManagementAuthContext'

export default function CreateProjectForm({ onSuccess, onCancel, estimationId, customerId }) {
  const { user } = useLabManagementAuth()
  const isReadOnly = user?.role === 'Quality Manager'
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    clientId: customerId || 0,
    status: 'pending',
    oem: '',
    description: ''
  })
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(true)

  useEffect(() => {
    if (!customerId) {
      loadCustomers()
    } else {
      setLoadingCustomers(false)
    }
    
    // If coming from estimation, load estimation data
    if (estimationId) {
      loadEstimationData()
    }
  }, [customerId, estimationId])

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
      await projectsService.create(formData)
      toast.success('Project created successfully!')
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-red-500 mb-4">Please fill all the mandatory details in the form (*)</p>
      {!customerId && (
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
              className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed`}
              required
              disabled={isReadOnly}
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

      <Input
        label={<span>Project Name <span className="text-red-500">*</span></span>}
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Enter project name"
        required
        disabled={isReadOnly}
      />

      <Input
        label={<span>Project Code <span className="text-red-500">*</span></span>}
        value={formData.code}
        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
        placeholder="Enter project code"
        required
        disabled={isReadOnly}
      />

      <Input
        label="OEM"
        value={formData.oem}
        onChange={(e) => setFormData({ ...formData, oem: e.target.value })}
        placeholder="Enter OEM name (optional)"
        disabled={isReadOnly}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed`}
          disabled={isReadOnly}
        >
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter project description"
          rows={4}
          className={`${inputClass} resize-none disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed`}
          disabled={isReadOnly}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="flex-1"
        >
          {isReadOnly ? 'Close' : 'Cancel'}
        </Button>
        {!isReadOnly && (
          <Button
            type="submit"
            isLoading={loading}
            className="flex-1"
          >
            Create Project
          </Button>
        )}
      </div>
    </form>
  )
}

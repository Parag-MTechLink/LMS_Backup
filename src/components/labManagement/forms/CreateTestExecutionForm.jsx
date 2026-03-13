import { useState, useEffect } from 'react'
import { testExecutionsService } from '../../../services/labManagementApi'
import { testPlansService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Button from '../Button'
import Input from '../Input'

export default function CreateTestExecutionForm({ testPlanId, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    testPlanId: testPlanId || 0,
    name: '',
    startTime: '',
    endTime: '',
    notes: '',
  })
  const [testPlans, setTestPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingPlans, setLoadingPlans] = useState(!testPlanId)

  useEffect(() => {
    if (!testPlanId) {
      loadTestPlans()
    }
  }, [testPlanId])

  const loadTestPlans = async () => {
    try {
      setLoadingPlans(true)
      const data = await testPlansService.getAll()
      setTestPlans(data)
    } catch (error) {
      toast.error('Failed to load test plans')
    } finally {
      setLoadingPlans(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.testPlanId || formData.testPlanId === 0) {
      toast.error('Please select a Test Plan')
      return
    }

    if (!formData.name.trim()) {
      toast.error('Please enter Execution Name')
      return
    }

    if (!formData.startTime) {
      toast.error('Please select Start Date & Time')
      return
    }

    if (!formData.endTime) {
      toast.error('Please select End Date & Time')
      return
    }

    // Encode the execution name as a tag at the front of notes for later display
    const notesStr = formData.name
      ? `[${formData.name}]${formData.notes ? ' ' + formData.notes : ''}`
      : formData.notes || undefined

    const payload = {
      testPlanId: formData.testPlanId,
      notes: notesStr,
      startTime: formData.startTime ? new Date(formData.startTime).toISOString() : undefined,
      endTime: formData.endTime ? new Date(formData.endTime).toISOString() : undefined,
    }

    try {
      setLoading(true)
      await testExecutionsService.create(payload)
      toast.success('Test execution created successfully!')
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create test execution')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-red-500">Please fill all mandatory details (*) in red</p>
      {/* Test Plan selector (only when no testPlanId is pre-set) */}
      {!testPlanId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Plan <span className="text-red-500">*</span>
          </label>
          {loadingPlans ? (
            <div className="text-sm text-gray-500">Loading test plans...</div>
          ) : (
            <select
              value={formData.testPlanId}
              onChange={(e) => setFormData({ ...formData, testPlanId: parseInt(e.target.value) })}
              className={inputClass}
              required
            >
              <option value={0}>Select a test plan</option>
              {testPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - {plan.testType}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Execution Name */}
      <Input
        label={
          <span>
            Execution Name <span className="text-red-500">*</span>
          </span>
        }
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="e.g. EMC Run #1"
        required
      />

      {/* Start Date & Time */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Start Date & Time <span className="text-red-500">*</span>
        </label>
        <input
          type="datetime-local"
          value={formData.startTime}
          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
          className={inputClass}
        />
      </div>

      {/* End Date & Time */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          End Date & Time <span className="text-red-500">*</span>
        </label>
        <input
          type="datetime-local"
          value={formData.endTime}
          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
          className={inputClass}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes about the execution"
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="button" onClick={onCancel} variant="outline" className="flex-1">
          Cancel
        </Button>
        <Button type="submit" isLoading={loading} className="flex-1">
          Create Execution
        </Button>
      </div>
    </form>
  )
}

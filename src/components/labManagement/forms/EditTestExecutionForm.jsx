import { useState, useEffect } from 'react'
import { testExecutionsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Button from '../Button'
import Input from '../Input'

export default function EditTestExecutionForm({ execution, onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        name: '',
        startTime: '',
        endTime: '',
        notes: '',
        status: '',
    })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (execution) {
            // Parse execution name from notes if it exists
            const nameMatch = execution.notes?.match(/^\[([^\]]+)\]/)
            const name = nameMatch ? nameMatch[1].trim() : ''
            const notes = nameMatch ? execution.notes.replace(/^\[[^\]]+\]\s*/, '') : execution.notes || ''

            // Format dates for datetime-local input
            const formatDateTime = (dateStr) => {
                if (!dateStr) return ''
                const date = new Date(dateStr)
                if (isNaN(date.getTime())) return ''
                return date.toISOString().slice(0, 16)
            }

            setFormData({
                name,
                notes,
                startTime: formatDateTime(execution.startTime),
                endTime: formatDateTime(execution.endTime),
                status: execution.status || 'Pending',
            })
        }
    }, [execution])

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Encode name into notes
        const notesStr = formData.name
            ? `[${formData.name}]${formData.notes ? ' ' + formData.notes : ''}`
            : formData.notes || undefined

        const payload = {
            status: formData.status,
            notes: notesStr,
            startTime: formData.startTime ? new Date(formData.startTime).toISOString() : null,
            endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null,
        }

        try {
            setLoading(true)
            await testExecutionsService.update(execution.id, payload)
            toast.success('Test execution updated successfully!')
            onSuccess()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update test execution')
        } finally {
            setLoading(false)
        }
    }

    const inputClass =
        'w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Execution Name */}
            <Input
                label="Execution Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. EMC Run #1"
            />

            {/* Status */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                </label>
                <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className={inputClass}
                    required
                >
                    <option value="Pending">Pending</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Failed">Failed</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Date & Time */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date & Time</label>
                    <input
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className={inputClass}
                    />
                </div>

                {/* End Date & Time */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date & Time</label>
                    <input
                        type="datetime-local"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className={inputClass}
                    />
                </div>
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
                    Update Execution
                </Button>
            </div>
        </form>
    )
}

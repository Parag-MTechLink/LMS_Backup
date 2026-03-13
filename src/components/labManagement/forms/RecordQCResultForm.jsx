import { useState } from 'react'
import { qcService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Button from '../Button'
import Input from '../Input'

export default function RecordQCResultForm({ qcCheck, onSuccess, onCancel }) {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!result) {
      toast.error('Please enter Result Value')
      return
    }

    const resultValue = parseFloat(result)
    const min = qcCheck.acceptanceRange.min
    const max = qcCheck.acceptanceRange.max
    const status = resultValue >= min && resultValue <= max ? 'Pass' : 'Fail'
    const deviation = !(resultValue >= min && resultValue <= max)

    try {
      setLoading(true)
      await qcService.recordResult(qcCheck.id, {
        value: resultValue,
        date: new Date().toISOString().split('T')[0],
        status,
        deviation
      })
      toast.success('QC result recorded successfully!')
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record QC result')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-red-500">Please fill all mandatory details (*) in red</p>
      <div className="p-4 bg-gray-50 rounded-lg mb-4">
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Parameter:</span>
            <span className="font-medium text-gray-900">{qcCheck?.parameter}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Target Value:</span>
            <span className="font-medium text-gray-900">{qcCheck?.targetValue} {qcCheck?.unit}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Acceptance Range:</span>
            <span className="font-medium text-gray-900">
              {qcCheck?.acceptanceRange.min} - {qcCheck?.acceptanceRange.max} {qcCheck?.unit}
            </span>
          </div>
        </div>
      </div>

      <Input
        label={
          <span>
            Result Value ({qcCheck?.unit}) <span className="text-red-500">*</span>
          </span>
        }
        type="number"
        step="0.01"
        value={result}
        onChange={(e) => setResult(e.target.value)}
        placeholder="Enter result value"
        required
      />

      {result && qcCheck && (
        <div className={`p-3 rounded-lg ${
          parseFloat(result) >= qcCheck.acceptanceRange.min && 
          parseFloat(result) <= qcCheck.acceptanceRange.max
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`text-sm font-medium ${
            parseFloat(result) >= qcCheck.acceptanceRange.min && 
            parseFloat(result) <= qcCheck.acceptanceRange.max
              ? 'text-green-700'
              : 'text-red-700'
          }`}>
            Status: {
              parseFloat(result) >= qcCheck.acceptanceRange.min && 
              parseFloat(result) <= qcCheck.acceptanceRange.max
                ? 'PASS'
                : 'FAIL - Out of acceptance range'
            }
          </p>
        </div>
      )}

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
          Record Result
        </Button>
      </div>
    </form>
  )
}

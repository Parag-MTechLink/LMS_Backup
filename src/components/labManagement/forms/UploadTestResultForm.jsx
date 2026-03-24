import { useState, useEffect } from 'react'
import { documentsService, testResultsService, testExecutionsService, testPlansService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Button from '../Button'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'

function UploadTestResultForm({ onSuccess, onCancel }) {
    const [file, setFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [executions, setExecutions] = useState([])
    const [loadingExecutions, setLoadingExecutions] = useState(true)

    // Form Fields
    const [testExecutionId, setTestExecutionId] = useState('')
    const [executionStatus, setExecutionStatus] = useState('')
    const [testParameter, setTestParameter] = useState('Test Report')
    const [passFail, setPassFail] = useState('')
    const [remarks, setRemarks] = useState('')
    const [testType, setTestType] = useState('')
    const [projectExecutedBy, setProjectExecutedBy] = useState('')

    useEffect(() => {
        loadExecutions()
    }, [])

    const loadExecutions = async () => {
        try {
            setLoadingExecutions(true)
            const [executionsData, resultsData, plansData] = await Promise.all([
                testExecutionsService.getAll(),
                testResultsService.getAll().catch(() => []),
                testPlansService.getAll().catch(() => [])
            ])
            
            let usedExecutionIds = new Set()
            if (Array.isArray(resultsData)) {
                usedExecutionIds = new Set(resultsData.map(r => r.testExecutionId))
            }
            
            let availableExecutions = []
            let plansMap = {}
            if (Array.isArray(plansData)) {
                plansData.forEach(p => plansMap[p.id] = p.name)
            }

            if (Array.isArray(executionsData)) {
                availableExecutions = executionsData.filter(exec => !usedExecutionIds.has(exec.id)).map(exec => {
                    const planName = plansMap[exec.testPlanId] || `Plan ${exec.testPlanId}`
                    let execName = null;
                    if (exec.notes) {
                        const m = exec.notes.match(/^\[([^\]]+)\]/);
                        if (m) execName = m[1].trim();
                    }
                    exec.computedName = execName ? `${planName} - ${execName} #${exec.executionNumber || exec.id}` : `${planName} #${exec.executionNumber || exec.id}`
                    return exec
                })
            }
            
            setExecutions(availableExecutions)
        } catch (error) {
            console.error('Error loading executions:', error)
            toast.error('Failed to load test executions')
        } finally {
            setLoadingExecutions(false)
        }
    }

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0]
        if (selectedFile) {
            setFile(selectedFile)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!testExecutionId) {
            toast.error('Please select a Test Execution')
            return
        }

        if (!testParameter.trim()) {
            toast.error('Please enter Test Parameter')
            return
        }

        if (!passFail) {
            toast.error('Please select Status')
            return
        }

        if (!file) {
            toast.error('Please upload a Result File')
            return
        }

        try {
            setLoading(true)

            // Step 1: Upload File as Document
            const formData = new FormData()
            formData.append('name', file.name)
            formData.append('description', `Test Result for Execution #${testExecutionId}`)
            formData.append('type', 'Report')
            formData.append('file', file)

            const doc = await documentsService.create(formData)

            // Construct download URL or path to store in attachments
            // Assuming API structure: /api/v1/documents/{id}/download
            const attachmentUrl = `/api/v1/documents/${doc.id}/download`

            // Step 2: Create Test Result linked to Execution
            const generateULR = () => {
                const date = new Date()
                const year = date.getFullYear().toString().slice(-2)
                const month = (date.getMonth() + 1).toString().padStart(2, '0')
                const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
                return `ULR/MTL/${year}${month}/${random}`
            }

            const resultData = {
                testExecutionId: parseInt(testExecutionId),
                testParameter: testParameter,
                passFail: passFail === 'true',
                attachments: [attachmentUrl], // Store as list of strings
                remarks: remarks || `Uploaded via portal. Document ID: ${doc.id}`,
                testType: testType || undefined,
                actualValue: projectExecutedBy || undefined,
                expectedValue: generateULR(),
                testDate: new Date().toISOString()
            }

            await testResultsService.create(resultData)

            if (executionStatus) {
                const exec = executions.find(e => e.id.toString() === testExecutionId);
                if (exec && exec.status !== executionStatus) {
                    await testExecutionsService.update(exec.id, { status: executionStatus });
                }
            }

            toast.success('Test result uploaded successfully')
            onSuccess()
        } catch (error) {
            console.error('Error uploading test result:', error)
            toast.error('Failed to upload test result')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-red-500 mb-4">Please fill all the mandatory details in the form (*)</p>

            {/* Test Execution Selection */}
            <div>
                <label className="block text-sm font-medium mb-1">
                    Test Execution <span className="text-red-500">*</span>
                </label>
                {loadingExecutions ? (
                    <div className="text-sm text-gray-500">Loading executions...</div>
                ) : (
                    <select
                        value={testExecutionId}
                        onChange={(e) => {
                            const val = e.target.value;
                            setTestExecutionId(val);
                            if (val) {
                                const exec = executions.find(x => x.id.toString() === val);
                                if (exec) setExecutionStatus(exec.status || 'Pending');
                            } else {
                                setExecutionStatus('');
                                setPassFail('');
                            }
                        }}
                        className="w-full border rounded-lg px-3 py-2 bg-white"
                        required
                    >
                        <option value="">Select Test Execution</option>
                        {executions.map(exec => (
                            <option key={exec.id} value={exec.id}>
                                #{exec.id} - {exec.computedName} ({exec.status})
                            </option>
                        ))}
                    </select>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Execution Status */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Execution Status
                    </label>
                    <select
                        value={executionStatus}
                        onChange={(e) => setExecutionStatus(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 bg-white disabled:bg-gray-50 disabled:text-gray-500"
                        disabled={!testExecutionId || loadingExecutions}
                    >
                        {!testExecutionId ? (
                            <option value="" disabled>Select Execution first</option>
                        ) : !executionStatus ? (
                            <option value="" disabled>Select Status</option>
                        ) : null}
                        <option value="Pending">Pending</option>
                        <option value="InProgress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Failed">Failed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
                {/* Test Parameter */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Test Parameter <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={testParameter}
                        onChange={(e) => setTestParameter(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="e.g. Test Report"
                        required
                    />
                </div>

                {/* Result Pass/Fail */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Result Status <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={passFail}
                        onChange={(e) => setPassFail(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 bg-white disabled:bg-gray-50 disabled:text-gray-500"
                        required
                        disabled={!testExecutionId}
                    >
                        {!testExecutionId ? (
                            <option value="" disabled>Select Execution first</option>
                        ) : !passFail ? (
                            <option value="" disabled>Select Result Status</option>
                        ) : null}
                        <option value="true">Pass</option>
                        <option value="false">Fail</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Standard / Reference */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Standard / Reference
                    </label>
                    <input
                        type="text"
                        value={testType}
                        onChange={(e) => setTestType(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="e.g. ISO 17025"
                    />
                </div>

                {/* Test Executed By */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Test Executed By
                    </label>
                    <input
                        type="text"
                        value={projectExecutedBy}
                        onChange={(e) => setProjectExecutedBy(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Enter Analyst/Engineer Name"
                    />
                </div>

                {/* Remarks */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                        Remarks
                    </label>
                    <textarea
                        rows={1}
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Optional remarks..."
                    />
                </div>
            </div>

            {/* File Upload */}
            <div className="border-2 border-dashed rounded-xl p-6 text-center hover:bg-gray-50 transition-colors">
                <Upload className="mx-auto h-10 w-10 text-gray-400" />
                <label className="cursor-pointer text-primary font-medium block mt-2">
                    {file ? 'Change file' : <>Upload Result File <span className="text-red-500">*</span></>}
                    <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                        onChange={handleFileChange}
                    />
                </label>

                {file ? (
                    <div className="mt-2 flex items-center justify-center text-sm text-green-600 font-medium">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {file.name}
                    </div>
                ) : (
                    <p className="mt-1 text-sm text-gray-500">
                        PDF, Word, Excel, or Images
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Uploading...' : 'Upload Result'}
                </Button>
            </div>

        </form>
    )
}

export default UploadTestResultForm

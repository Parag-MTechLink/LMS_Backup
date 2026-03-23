import React, { useState, useEffect } from 'react'
import { FileText, Download, Share2, CheckCircle, BarChart3, Calendar, User, Edit2, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../Button'
import Badge from '../Badge'
import { apiService, testExecutionsService, testPlansService, projectsService, customersService, samplesService, testResultsService, documentsService } from '../../../services/labManagementApi'

export const extendedDetailsCache = {}

export const prefetchExtendedDetails = async (testExecutionId, baseDetails = {}) => {
    if (!testExecutionId || extendedDetailsCache[testExecutionId]) return extendedDetailsCache[testExecutionId];
    
    // Bypass slow waterfall API calls if TestResults.jsx provided fully populated details
    if (baseDetails.testPlanName && baseDetails.executionName && baseDetails.companyName) {
        extendedDetailsCache[testExecutionId] = {
           customerName: baseDetails.customerName || '-',
           companyName: baseDetails.companyName || '-',
           assignedEngineerName: baseDetails.projectExe || baseDetails.assignedEngineerName || '-',
           testPlanId: baseDetails.testPlanId || null,
           testPlanName: baseDetails.testPlanName || '-',
           executionNumber: baseDetails.executionNumber || testExecutionId,
           executionName: baseDetails.executionName || '-',
        };
        return extendedDetailsCache[testExecutionId];
    }

    try {
        const exec = await testExecutionsService.getById(testExecutionId)
        let projectExe = baseDetails.projectExe || '-'
        let customerName = baseDetails.customerName || '-'
        let companyName = baseDetails.companyName || '-'
        let assignedEngineerName = baseDetails.assignedEngineerName || '-'

        let testPlanId = null;
        let testPlanName = '-';
        let executionName = null;
        if (exec?.notes) {
            const m = exec.notes.match(/^\[([^\]]+)\]/);
            if (m) executionName = m[1].trim();
        }
        let executionNumber = exec?.executionNumber || testExecutionId;
        if (exec && exec.testPlanId) {
            testPlanId = exec.testPlanId;
            const plan = await testPlansService.getById(exec.testPlanId)
            if (plan) {
                testPlanName = plan.name || '-';
                if (assignedEngineerName === '-') assignedEngineerName = plan.assignedEngineerName || '-'
                if (plan.projectId) {
                    const proj = await projectsService.getById(plan.projectId)
                    if (proj) {
                        if (proj.clientId) {
                            const cust = await customersService.getById(proj.clientId)
                            if (cust) {
                                if (customerName === '-') customerName = cust.contactPerson || cust.name || cust.companyName || '-'
                                if (companyName === '-') companyName = cust.companyName || cust.name || '-'
                            }
                        }
                    }
                }
            }
        }
        if (!executionName && testPlanName !== '-') {
            // Fallback if execution doesn't have a name
            executionName = testPlanName;
        }

        const finalDetails = { customerName, companyName, assignedEngineerName, testPlanId, testPlanName, executionNumber, executionName }
        extendedDetailsCache[testExecutionId] = finalDetails
        return finalDetails
    } catch (error) {
        console.error("Error fetching extended details:", error)
        return { customerName: '-', companyName: '-', assignedEngineerName: '-', testPlanId: null, testPlanName: '-', executionNumber: null, executionName: null }
    }
}

const SkeletonText = ({ width = "w-24" }) => <div className={`h-4 bg-gray-200 rounded animate-pulse ${width}`}></div>

function SampleTestResultModal({ isOpen, onClose, result, onUpdate }) {
    const [extendedDetails, setExtendedDetails] = useState(() => {
        if (result?.testExecutionId && extendedDetailsCache[result.testExecutionId]) {
            return extendedDetailsCache[result.testExecutionId];
        }
        return {
            customerName: '-',
            companyName: '-',
            assignedEngineerName: '-',
            testPlanId: null,
            testPlanName: '-',
            executionNumber: null,
            executionName: null
        }
    })

    const [isLoadingDetails, setIsLoadingDetails] = useState(() => !result?.testExecutionId || !extendedDetailsCache[result.testExecutionId])
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [file, setFile] = useState(null)
    const [editForm, setEditForm] = useState({
        testType: '',
        actualValue: '',
        remarks: ''
    })

    useEffect(() => {
        if (result && isOpen) {
            setEditForm({
                testType: result.testType || '',
                actualValue: result.actualValue || '',
                remarks: result.remarks || ''
            })
            setIsEditing(false)
            setFile(null)
        }
    }, [result, isOpen])

    const handleSave = async () => {
        try {
            setIsSaving(true)
            let newAttachmentUrls = result?.attachments;

            if (file) {
                const formData = new FormData()
                formData.append('name', file.name)
                formData.append('description', `Updated Test Result for Execution #${result.testExecutionId}`)
                formData.append('type', 'Report')
                formData.append('file', file)

                const doc = await documentsService.create(formData)
                newAttachmentUrls = [`/api/v1/documents/${doc.id}/download`]
            }

            const newFields = {
                testType: editForm.testType || undefined,
                actualValue: editForm.actualValue || undefined,
                remarks: editForm.remarks || undefined,
                attachments: newAttachmentUrls
            }
            await testResultsService.update(result.id, newFields)
            toast.success("Successfully updated report details")
            setIsEditing(false)
            setFile(null)
            if (onUpdate) onUpdate(newFields)
        } catch (error) {
            console.error(error)
            toast.error("Failed to update test result")
        } finally {
            setIsSaving(false)
        }
    }

    const handleShare = () => {
        const shareText = `Test Report #${result?.id || '-'}\nTest Parameter: ${result?.testParameter || '-'}\nStatus: ${result?.passFail ? 'Pass' : 'Fail'}\nULR: ${result?.ulrNumber || result?.expectedValue || '-'}\nCustomer: ${result?.customerName && result.customerName !== '-' ? result.customerName : extendedDetails.customerName}`

        if (navigator.share) {
            navigator.share({
                title: `Test Report #${result?.id}`,
                text: shareText,
                url: window.location.href
            }).catch(console.error)
        } else {
            navigator.clipboard.writeText(`${shareText}\n\nLink: ${window.location.href}`)
            toast.success("Report details copied to clipboard!")
        }
    }

    useEffect(() => {
        const fetchDetails = async () => {
            if (!result?.testExecutionId) return;

            if (extendedDetailsCache[result.testExecutionId]) {
                setExtendedDetails(extendedDetailsCache[result.testExecutionId])
                setIsLoadingDetails(false)
                return;
            }

            setIsLoadingDetails(true)
            const details = await prefetchExtendedDetails(result.testExecutionId, {
                customerName: result.customerName,
                companyName: result.companyName,
                assignedEngineerName: result.assignedEngineerName
            })
            setExtendedDetails(details)
            setIsLoadingDetails(false)
        }

        if (isOpen && result) {
            fetchDetails()
        }
    }, [isOpen, result]);

    if (!isOpen) return null

    const isPass = result?.passFail !== false // Default to pass if undefined
    const computedExecutionName = isLoadingDetails ? 'Loading...' : (extendedDetails.executionName ? `${extendedDetails.executionName} #${extendedDetails.executionNumber}` : `Execution #${result?.testExecutionId || '-'}`);

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-gray-100">
                <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center shadow-sm ${isPass ? 'bg-green-100' : 'bg-red-100'}`}>
                        <BarChart3 className={`w-8 h-8 ${isPass ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {computedExecutionName}
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`text-sm font-bold ${isPass ? 'text-green-600' : 'text-red-600'}`}>
                                {isPass ? 'PASS' : 'FAIL'}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-sm text-gray-500">{result?.testType || 'EMC Testing'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <Button variant="outline" size="sm" onClick={handleShare} icon={<Share2 className="w-4 h-4" />}>Share</Button>

                    {isEditing && (
                        <div className="relative">
                            <input
                                type="file"
                                id="replace-report-input"
                                className="hidden"
                                accept=".pdf,.doc,.docx,.xls,.xlsx"
                                onChange={(e) => setFile(e.target.files[0])}
                            />
                            <Button
                                variant={file ? "primary" : "outline"}
                                size="sm"
                                onClick={() => document.getElementById('replace-report-input').click()}
                            >
                                {file ? `Selected: ${file.name}` : 'Replace PDF'}
                            </Button>
                        </div>
                    )}

                    <Button
                        variant="default"
                        size="sm"
                        icon={<Download className="w-4 h-4" />}
                        onClick={async () => {
                            if (result?.attachments && result.attachments.length > 0) {
                                try {
                                    const url = result.attachments[0]
                                    const res = await apiService.client.get(url, { responseType: 'blob' })
                                    const blobUrl = URL.createObjectURL(res.data)
                                    const link = document.createElement('a')
                                    link.href = blobUrl

                                    const contentDisposition = res.headers['content-disposition']
                                    // Try to get extension from URL if contentDisposition is missing
                                    const urlExt = url.split('.').pop().split(/#|\?/)[0]
                                    let filename = `Report_${result?.id || 'doc'}${urlExt && urlExt.length <= 4 ? '.' + urlExt : ''}`

                                    if (contentDisposition) {
                                        const match = contentDisposition.match(/filename="?([^"]+)"?/)
                                        if (match && match[1]) filename = match[1]
                                    }

                                    link.setAttribute('download', filename)
                                    document.body.appendChild(link)
                                    link.click()
                                    link.parentNode.removeChild(link)
                                    URL.revokeObjectURL(blobUrl)
                                } catch (error) {
                                    console.error("Download failed", error)
                                    alert('Failed to download report')
                                }
                            } else {
                                alert('No report file attached')
                            }
                        }}
                    >
                        Download Result
                    </Button>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Date</div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date().toLocaleDateString()}
                    </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Engineer</div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <User className="w-4 h-4 text-gray-400" />
                        {isLoadingDetails ? <SkeletonText width="w-24" /> : (extendedDetails.assignedEngineerName !== '-' ? extendedDetails.assignedEngineerName : (result?.reviewedByName || result?.executedByName || '-'))}
                    </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Reference</div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <FileText className="w-4 h-4 text-gray-400" />
                        {isEditing ? (
                            <input
                                className="border border-gray-300 rounded px-2 py-1 w-full text-sm font-normal"
                                value={editForm.testType}
                                onChange={e => setEditForm({ ...editForm, testType: e.target.value })}
                                placeholder="Standard / Reference"
                            />
                        ) : (
                            result?.testType ? `Standard: ${result.testType}` : '-'
                        )}
                    </div>
                </div>
            </div>

            {/* Report Details Grid */}
            <div className="border border-gray-200 rounded-xl p-4">
                <h4 className="font-bold text-gray-900 mb-4">Report Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="space-y-1">
                        <div className="text-xs text-gray-500 uppercase font-bold">ULR (Unique lab report) Number</div>
                        <div className="text-sm font-medium text-gray-900">{result?.ulrNumber || result?.expectedValue || '-'}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-gray-500 uppercase font-bold">Test Plan</div>
                        <div className="text-sm font-medium text-gray-900">
                            {isLoadingDetails ? <SkeletonText width="w-32" /> : (extendedDetails.testPlanId ? `${extendedDetails.testPlanName !== '-' ? extendedDetails.testPlanName + ' ' : ''}(TP-${extendedDetails.testPlanId})` : '-')}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-gray-500 uppercase font-bold">Name of Customer</div>
                        <div className="text-sm font-medium text-gray-900">
                            {isLoadingDetails ? <SkeletonText width="w-40" /> : (result?.customerName && result.customerName !== '-' ? result.customerName : extendedDetails.customerName)}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-gray-500 uppercase font-bold">Company</div>
                        <div className="text-sm font-medium text-gray-900">
                            {isLoadingDetails ? <SkeletonText width="w-32" /> : (result?.companyName && result.companyName !== '-' ? result.companyName : extendedDetails.companyName)}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-gray-500 uppercase font-bold">Test Executed By</div>
                        {isEditing ? (
                            <input
                                className="border border-gray-300 rounded px-2 py-1 w-full text-sm font-normal"
                                value={editForm.actualValue}
                                onChange={e => setEditForm({ ...editForm, actualValue: e.target.value })}
                                placeholder="Executed By"
                            />
                        ) : (
                            <div className="text-sm font-medium text-gray-900">{result?.actualValue || '-'}</div>
                        )}
                    </div>
                </div>

                {(result?.remarks || isEditing) && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-2">Remarks</div>
                        {isEditing ? (
                            <textarea
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-normal resize-none"
                                rows={3}
                                value={editForm.remarks}
                                onChange={e => setEditForm({ ...editForm, remarks: e.target.value })}
                                placeholder="Optional remarks..."
                            />
                        ) : (
                            <div className="text-sm text-gray-700 whitespace-pre-line">{result.remarks}</div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="primary" onClick={handleSave} isLoading={isSaving} icon={<Save className="w-4 h-4" />}>
                                Save Changes
                            </Button>
                            <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={isSaving} icon={<X className="w-4 h-4" />}>
                                Cancel
                            </Button>
                        </>
                    ) : (
                        <Button variant="secondary" onClick={() => setIsEditing(true)} icon={<Edit2 className="w-4 h-4" />}>
                            Edit Details
                        </Button>
                    )}
                </div>
                <Button onClick={onClose} variant={isEditing ? 'secondary' : 'primary'} disabled={isSaving}>
                    Close Result
                </Button>
            </div>
        </div>
    )
}

export default SampleTestResultModal

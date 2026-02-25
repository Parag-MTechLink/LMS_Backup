import React from 'react'
import EditTestExecutionForm from '../forms/EditTestExecutionForm'

function SampleTestExecutionModal({ isOpen, onClose, execution, onUpdated }) {
    if (!isOpen) return null

    return (
        <div className="py-2">
            <EditTestExecutionForm
                execution={execution}
                onSuccess={() => {
                    onUpdated?.()
                    onClose()
                }}
                onCancel={onClose}
            />
        </div>
    )
}

export default SampleTestExecutionModal

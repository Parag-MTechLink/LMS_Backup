import { useState } from 'react'
import { X, Upload, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { reportsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Button from '../../labManagement/Button'
import Input from '../../labManagement/Input'

export default function UploadReportModal({ onClose }) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        file: null
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.name.trim()) {
            toast.error('Please enter Report Name')
            return
        }

        if (!formData.file) {
            toast.error('Please upload a Report File')
            return
        }

        try {
            setLoading(true)
            const data = new FormData()
            data.append('name', formData.name)
            data.append('description', formData.description)
            data.append('file', formData.file)

            await reportsService.create(data)
            toast.success('Report uploaded successfully')
            onClose()
        } catch (error) {
            console.error(error)
            toast.error('Failed to upload report')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            >
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold">Upload Report</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-sm text-red-500">Please fill all mandatory details (*) in red</p>
                    <Input
                        label={
                            <span>
                                Report Name <span className="text-red-500">*</span>
                            </span>
                        }
                        placeholder="Enter report name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors min-h-[80px]"
                            placeholder="Enter report description (optional)"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Report File <span className="text-red-500">*</span>
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors relative">
                            <input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                                accept=".pdf,.doc,.docx,.xls,.xlsx"
                            />
                            <div className="space-y-2">
                                <div className="mx-auto w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                    {formData.file ? <FileText className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                                </div>
                                {formData.file ? (
                                    <p className="text-sm font-medium text-primary break-all">
                                        {formData.file.name}
                                    </p>
                                ) : (
                                    <>
                                        <p className="text-sm text-gray-600">
                                            Click to upload or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            PDF, Word, or Excel files
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !formData.file}
                        >
                            {loading ? 'Uploading...' : 'Upload Report'}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}

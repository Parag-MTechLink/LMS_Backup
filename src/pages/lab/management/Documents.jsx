import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  FolderOpen,
  FileText,
  Download,
} from 'lucide-react'
import { documentsService, getDownloadUrl } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'

import Card from '../../../components/labManagement/Card'
import Button from '../../../components/labManagement/Button'
import Badge from '../../../components/labManagement/Badge'
import Input from '../../../components/labManagement/Input'
import Modal from '../../../components/labManagement/Modal'
import UploadDocumentForm from '../../../components/labManagement/forms/UploadDocumentForm'

function Documents() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [showUploadModal, setShowUploadModal] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    loadDocuments()
  }, [])

  // ========================
  // Load documents
  // ========================
  const loadDocuments = async () => {
    try {
      setLoading(true)
      const data = await documentsService.getAll()
      setDocuments(data)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  // ========================
  // View document
  // ========================
  const handleView = (doc) => {
    if (doc.file_path) {
      window.open(getDownloadUrl(doc.file_path), '_blank')
    } else {
      toast.error('File not found')
    }
  }

  // ========================
  // Download document
  // ========================
  const handleDownload = (doc) => {
    if (doc.file_path) {
      window.open(getDownloadUrl(doc.file_path), '_blank')
    } else {
      toast.error('File not found')
    }
  }

  // ========================
  // Filters
  // ========================
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType =
      selectedType === 'all' || doc.type === selectedType

    return matchesSearch && matchesType
  })

  // ========================
  // Loading state
  // ========================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            Documents
          </h1>
          <p className="text-gray-600 mt-1">
            Document management and repository
          </p>
        </div>

        <Button
          onClick={() => setShowUploadModal(true)}
          icon={<Plus className="w-5 h-5" />}
        >
          Upload Document
        </Button>
      </motion.div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-5 h-5" />}
          />

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Types</option>
            <option value="Report">Report</option>
            <option value="Certificate">Certificate</option>
            <option value="Manual">Manual</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </Card>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">
              No documents found
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Upload your first document to get started
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc, index) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
            >
              <Card
                className="h-full flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>

                  {doc.type && (
                    <Badge variant="info">{doc.type}</Badge>
                  )}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                  {doc.name}
                </h3>

                {doc.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {doc.description}
                  </p>
                )}

                <div className="mt-auto flex items-center gap-2 pt-4 border-t border-gray-200">

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload(doc)
                    }}
                    className="flex-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Document"
        size="lg"
      >
        {showUploadModal && (
          <UploadDocumentForm
            onSuccess={() => {
              setShowUploadModal(false)
              loadDocuments()
            }}
            onCancel={() => setShowUploadModal(false)}
          />
        )}
      </Modal>
    </div>
  )
}

export default Documents

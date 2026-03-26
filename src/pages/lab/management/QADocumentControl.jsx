import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Plus, Search, FolderOpen, Lock, Unlock, Download, Eye, Trash2, FileCheck, ArrowLeft } from 'lucide-react'
import { documentControlService, trfsService, getDownloadUrl } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Button from '../../../components/labManagement/Button'
import Badge from '../../../components/labManagement/Badge'
import Input from '../../../components/labManagement/Input'
import Modal from '../../../components/labManagement/Modal'
import CreateDocumentForm from '../../../components/labManagement/forms/CreateDocumentForm'

function QADocumentControl() {
  const [documents, setDocuments] = useState([])
  const [pendingTRFs, setPendingTRFs] = useState([])
  const [approvedTRFs, setApprovedTRFs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(location.hash === '#trfs' ? 'trfs' : 'documents') // 'documents' | 'trfs'
  const navigate = useNavigate()

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const [docData, trfData] = await Promise.all([
        documentControlService.getAll().catch(() => []),
        trfsService.getAll().catch(() => [])
      ])
      setDocuments(docData)
      
      const pending = trfData.filter(t => ['Draft', 'Pending QA', 'Under Review', 'Pending Review'].includes(t.status))
      setPendingTRFs(pending.slice(0, 5))

      const approved = trfData.filter(t => t.status === 'Approved')
      setApprovedTRFs(approved.slice(0, 5))
    } catch (error) {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  const handleLock = async (id, shouldLock) => {
    try {
      if (shouldLock) {
        await documentControlService.lock(id)
        toast.success('Document locked')
      } else {
        await documentControlService.unlock(id)
        toast.success('Document unlocked')
      }
      loadDocuments()
    } catch (error) {
      toast.error('Failed to update document lock status')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return
    try {
      await documentControlService.delete(id)
      toast.success('Document deleted successfully')
      loadDocuments()
    } catch (error) {
      toast.error('Failed to delete document')
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.documentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.approvedBy?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
    const matchesType = selectedType === 'all' || doc.documentType === selectedType
    return matchesSearch && matchesCategory && matchesType
  })

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
      <div className="mb-2">
        <Link to="/lab/management/qa" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to QA Dashboard
        </Link>
      </div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            Document Control
          </h1>
          <p className="text-gray-600 mt-1">Central repository for policies, certificates, and reports</p>
        </div>
        <div className="flex gap-3">
          {activeTab === 'documents' && (
            <Button
              onClick={() => setShowCreateModal(true)}
              icon={<Plus className="w-5 h-5" />}
            >
              Add Document
            </Button>
          )}
        </div>
      </motion.div>

      {/* Enterprise Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('documents')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'documents'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Document Library
          </button>
          <button
            onClick={() => setActiveTab('trfs')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'trfs'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            TRF Review Center
            {(pendingTRFs.length > 0) && (
              <span className="ml-1 bg-yellow-100 text-yellow-800 py-0.5 px-2 rounded-full text-xs">
                {pendingTRFs.length} Pending
              </span>
            )}
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'documents' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Filters */}
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search className="w-5 h-5" />}
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Categories</option>
                  <option value="Policy">Policy</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Report">Report</option>
                  <option value="Procedure">Procedure</option>
                </select>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Types</option>
                  <option value="Policy">Policy</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Report">Report</option>
                  <option value="Procedure">Procedure</option>
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
                  <p className="text-gray-500 font-medium">No documents found</p>
                  <p className="text-sm text-gray-400 mt-1">Add your first document</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocuments.map((doc, index) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card className="h-full flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
                          <FolderOpen className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex gap-2">
                          {doc.locked && (
                            <Badge variant="warning">
                              <Lock className="w-3 h-3 mr-1" />
                              Locked
                            </Badge>
                          )}
                          <Badge variant="success">
                            {doc.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {doc.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">{doc.documentId}</p>
                      
                      <div className="space-y-2 mb-4 flex-1">
                        <div className="text-sm">
                          <span className="text-gray-500">Version:</span>
                          <span className="ml-2 font-medium text-gray-900">{doc.version}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Category:</span>
                          <span className="ml-2 font-medium text-gray-900">{doc.category}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Effective Date:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {new Date(doc.effectiveDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Approved By:</span>
                          <span className="ml-2 font-medium text-gray-900">{doc.approvedBy}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Access Level:</span>
                          <span className="ml-2 font-medium text-gray-900">{doc.accessLevel}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Downloads:</span>
                          <span className="ml-2 font-medium text-gray-900">{doc.downloadCount}</span>
                        </div>
                      </div>
                      
                      <div className="mt-auto pt-4 border-t border-gray-200">
                        <div className="flex gap-2">
                          {doc.documentUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(getDownloadUrl(doc.documentUrl), '_blank')}
                              className="flex-1"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLock(doc.id, !doc.locked)}
                          >
                            {doc.locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(doc.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'trfs' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Pending TRF Review Section */}
      {pendingTRFs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-l-4 border-l-indigo-500">
            <div className="flex items-center gap-2 mb-4">
              <FileCheck className="w-5 h-5 text-indigo-500" />
              <h2 className="text-xl font-bold text-gray-900">Pending TRF Review</h2>
              <Badge variant="warning" className="ml-2">{pendingTRFs.length} Awaiting QA</Badge>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 text-sm font-semibold text-gray-500">TRF ID</th>
                    <th className="pb-3 text-sm font-semibold text-gray-500">Customer</th>
                    <th className="pb-3 text-sm font-semibold text-gray-500">Generation Date</th>
                    <th className="pb-3 text-sm font-semibold text-gray-500">Status</th>
                    <th className="pb-3 text-sm font-semibold text-gray-500 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingTRFs.map((trf) => (
                    <tr key={trf.id} className="hover:bg-indigo-50 transition-colors">
                      <td className="py-3 text-sm font-medium text-gray-900">{trf.trf_id || `TRF-${trf.id}`}</td>
                      <td className="py-3 text-sm text-gray-600">
                        {trf.customer?.name || trf.customer_name || 'Internal'}
                      </td>
                      <td className="py-3 text-sm text-gray-500">
                        {new Date(trf.updated_at || trf.created_at || new Date()).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-sm">
                        <Badge variant="warning">
                          {trf.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-sm text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/lab/management/trfs/${trf.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                            onClick={async () => {
                              try {
                                await trfsService.update(trf.id, { status: 'Approved' })
                                toast.success('TRF Approved & Locked successfully')
                                loadDocuments()
                              } catch (err) {
                                toast.error('Failed to update TRF status')
                              }
                            }}
                          >
                            <Lock className="w-4 h-4 mr-1" />
                            Review & Lock
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Recently Approved TRF Section */}
      {approvedTRFs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-l-4 border-l-green-500">
            <div className="flex items-center gap-2 mb-4">
              <FileCheck className="w-5 h-5 text-green-500" />
              <h2 className="text-xl font-bold text-gray-900">Recently Approved TRFs</h2>
              <Badge variant="success" className="ml-2">{approvedTRFs.length} Completed</Badge>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 text-sm font-semibold text-gray-500">TRF ID</th>
                    <th className="pb-3 text-sm font-semibold text-gray-500">Project</th>
                    <th className="pb-3 text-sm font-semibold text-gray-500">Generation Date</th>
                    <th className="pb-3 text-sm font-semibold text-gray-500">Status</th>
                    <th className="pb-3 text-sm font-semibold text-gray-500 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {approvedTRFs.map((trf) => (
                    <tr key={trf.id} className="hover:bg-green-50 transition-colors">
                      <td className="py-3 text-sm font-medium text-gray-900">{trf.trfNumber || `TRF-${trf.id}`}</td>
                      <td className="py-3 text-sm text-gray-600">
                        {trf.projectName || trf.customer?.name || 'Internal'}
                      </td>
                      <td className="py-3 text-sm text-gray-500">
                        {new Date(trf.createdAt || new Date()).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-sm">
                        <Badge variant="success">
                          {trf.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-sm text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/lab/management/trfs/${trf.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}
          </motion.div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setSelectedDocument(null)
        }}
        title={selectedDocument ? 'Edit Document' : 'Add New Document'}
        size="lg"
      >
        {showCreateModal && (
          <CreateDocumentForm
            document={selectedDocument}
            onSuccess={() => {
              setShowCreateModal(false)
              setSelectedDocument(null)
              loadDocuments()
            }}
            onCancel={() => {
              setShowCreateModal(false)
              setSelectedDocument(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}

export default QADocumentControl

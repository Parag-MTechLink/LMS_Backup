import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Plus, Search, ClipboardCheck, Eye, Download, AlertCircle, CheckCircle, Target, ArrowLeft } from 'lucide-react'
import { auditService, testExecutionsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Button from '../../../components/labManagement/Button'
import Badge from '../../../components/labManagement/Badge'
import Input from '../../../components/labManagement/Input'
import Modal from '../../../components/labManagement/Modal'
import CreateQAAuditForm from '../../../components/labManagement/forms/CreateQAAuditForm'

function QAAuditCompliance() {
  const [audits, setAudits] = useState([])
  const [completedExecutions, setCompletedExecutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedAudit, setSelectedAudit] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    loadAudits()
  }, [])

  const loadAudits = async () => {
    try {
      setLoading(true)
      const [auditData, execsData] = await Promise.all([
        auditService.getAll().catch(() => []),
        testExecutionsService.getAll().catch(() => [])
      ])
      setAudits(auditData)
      
      const recentCompletions = execsData
        .filter(e => e.status === 'Completed' || e.status === 'Done' || e.status === 'Closed')
        .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
        .slice(0, 5)
        
      setCompletedExecutions(recentCompletions)
    } catch (error) {
      toast.error('Failed to load audits')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'Completed': 'success',
      'In Progress': 'warning',
      'Scheduled': 'info'
    }
    return colors[status] || 'default'
  }

  const getSeverityColor = (severity) => {
    const colors = {
      'Major': 'danger',
      'Minor': 'warning',
      'Critical': 'danger'
    }
    return colors[severity] || 'default'
  }

  const filteredAudits = audits.filter(audit => {
    const matchesSearch = 
      audit.auditId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.auditorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.scope?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || audit.auditType === selectedType
    const matchesStatus = selectedStatus === 'all' || audit.status === selectedStatus
    return matchesSearch && matchesType && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading audits...</p>
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <ClipboardCheck className="w-6 h-6 text-white" />
            </div>
            Audit & Compliance
          </h1>
          <p className="text-gray-600 mt-1">Manage internal and external audits with findings tracking</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          icon={<Plus className="w-5 h-5" />}
        >
          New Audit
        </Button>
      </motion.div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search audits..."
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
            <option value="Internal">Internal</option>
            <option value="External">External</option>
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
            <option value="Scheduled">Scheduled</option>
          </select>
        </div>
      </Card>

      {/* Spot Audit Section */}
      {completedExecutions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-l-4 border-l-purple-500">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-bold text-gray-900">Recently Completed Executions (Spot-Audit Pool)</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 text-sm font-semibold text-gray-500">Execution ID</th>
                    <th className="pb-3 text-sm font-semibold text-gray-500">Test Plan</th>
                    <th className="pb-3 text-sm font-semibold text-gray-500">Completion Date</th>
                    <th className="pb-3 text-sm font-semibold text-gray-500 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {completedExecutions.map((exec) => (
                    <tr key={exec.id} className="hover:bg-purple-50 transition-colors">
                      <td className="py-3 text-sm font-medium text-gray-900">EXEC-{exec.id}</td>
                      <td className="py-3 text-sm text-gray-600">Plan #{exec.test_plan_id || exec.id}</td>
                      <td className="py-3 text-sm text-gray-500">
                        {new Date(exec.updated_at || exec.created_at || new Date()).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-sm text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Normally we'd pass pre-filled data to CreateQAAuditForm or router state
                            setShowCreateModal(true)
                          }}
                        >
                          Spot Audit
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

      {/* Audits Grid */}
      {filteredAudits.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <ClipboardCheck className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No audits found</p>
            <p className="text-sm text-gray-400 mt-1">Add your first audit</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAudits.map((audit, index) => (
            <motion.div
              key={audit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card className="h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <ClipboardCheck className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant={getStatusColor(audit.status)}>
                    {audit.status}
                  </Badge>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {audit.auditId}
                </h3>
                <p className="text-sm text-gray-500 mb-3">{audit.scope}</p>
                
                <div className="space-y-2 mb-4 flex-1">
                  <div className="text-sm">
                    <span className="text-gray-500">Type:</span>
                    <span className="ml-2 font-medium text-gray-900">{audit.auditType}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Date:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {new Date(audit.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Auditor:</span>
                    <span className="ml-2 font-medium text-gray-900">{audit.auditorName}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Findings:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {audit.totalFindings} ({audit.openFindings} open)
                    </span>
                  </div>
                  {audit.complianceScore !== null && (
                    <div className="text-sm">
                      <span className="text-gray-500">Compliance Score:</span>
                      <span className={`ml-2 font-medium ${
                        audit.complianceScore >= 90 ? 'text-green-600' :
                        audit.complianceScore >= 75 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {audit.complianceScore}%
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="mt-auto pt-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAudit(audit)
                        setShowDetailsModal(true)
                      }}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {audit.reportUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(audit.reportUrl, '_blank')}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="New Audit"
        size="lg"
      >
        <CreateQAAuditForm
          onSuccess={() => {
            setShowCreateModal(false)
            loadAudits()
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedAudit(null)
        }}
        title={`Audit Details - ${selectedAudit?.auditId}`}
        size="lg"
      >
        {selectedAudit && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium text-gray-900">{selectedAudit.auditType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(selectedAudit.date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Auditor</p>
                <p className="font-medium text-gray-900">{selectedAudit.auditorName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Organization</p>
                <p className="font-medium text-gray-900">{selectedAudit.auditorOrganization}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Scope</p>
                <p className="font-medium text-gray-900">{selectedAudit.scope}</p>
              </div>
            </div>

            {selectedAudit.findings && selectedAudit.findings.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Findings</h4>
                <div className="space-y-2">
                  {selectedAudit.findings.map((finding, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant={getSeverityColor(finding.severity)}>
                          {finding.severity}
                        </Badge>
                        <Badge variant={finding.status === 'Open' ? 'warning' : 'success'}>
                          {finding.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">{finding.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedAudit.complianceScore !== null && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Compliance Score</p>
                <p className={`text-2xl font-bold ${
                  selectedAudit.complianceScore >= 90 ? 'text-green-600' :
                  selectedAudit.complianceScore >= 75 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {selectedAudit.complianceScore}%
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default QAAuditCompliance

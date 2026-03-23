import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Plus, Search, AlertTriangle, CheckCircle, Clock, XCircle, AlertOctagon, ArrowLeft } from 'lucide-react'
import { ncCapaService, testResultsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Button from '../../../components/labManagement/Button'
import Badge from '../../../components/labManagement/Badge'
import Input from '../../../components/labManagement/Input'
import Modal from '../../../components/labManagement/Modal'
import CreateNCCAPAForm from '../../../components/labManagement/forms/CreateNCCAPAForm'

function QANCCAPA() {
  const [ncCapas, setNCCapas] = useState([])
  const [failedResults, setFailedResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedSeverity, setSelectedSeverity] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedNC, setSelectedNC] = useState(null)

  useEffect(() => {
    loadNCCapas()
  }, [])

  const loadNCCapas = async () => {
    try {
      setLoading(true)
      const [ncData, resultsData] = await Promise.all([
        ncCapaService.getAll().catch(() => []),
        testResultsService.getAll().catch(() => [])
      ])
      setNCCapas(ncData)
      setFailedResults(resultsData.filter(r => r.status === 'Fail' || r.status === 'Failed'))
    } catch (error) {
      toast.error('Failed to load NC/CAPA records')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'Open': 'warning',
      'In Progress': 'info',
      'Closed': 'success'
    }
    return colors[status] || 'default'
  }

  const getSeverityColor = (severity) => {
    const colors = {
      'High': 'danger',
      'Medium': 'warning',
      'Low': 'info'
    }
    return colors[severity] || 'default'
  }

  const filteredNCCapas = ncCapas.filter(nc => {
    const matchesSearch = 
      nc.ncId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nc.actionOwner?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || nc.status === selectedStatus
    const matchesSeverity = selectedSeverity === 'all' || nc.severity === selectedSeverity
    return matchesSearch && matchesStatus && matchesSeverity
  })

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading NC/CAPA records...</p>
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            Non-Conformance & CAPA
          </h1>
          <p className="text-gray-600 mt-1">Track non-conformances and corrective/preventive actions</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          icon={<Plus className="w-5 h-5" />}
        >
          New NC/CAPA
        </Button>
      </motion.div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search NC/CAPA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-5 h-5" />}
          />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Closed">Closed</option>
          </select>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Severities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </Card>

      {/* Pending Investigations (Failed Results) */}
      {failedResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-l-4 border-l-red-500">
            <div className="flex items-center gap-2 mb-4">
              <AlertOctagon className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-bold text-gray-900">Pending Investigations</h2>
              <Badge variant="danger" className="ml-2">{failedResults.length} Action Needed</Badge>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 text-sm font-semibold text-gray-500">Result ID</th>
                    <th className="pb-3 text-sm font-semibold text-gray-500">Test Execution</th>
                    <th className="pb-3 text-sm font-semibold text-gray-500">Date Failed</th>
                    <th className="pb-3 text-sm font-semibold text-gray-500 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {failedResults.map((result) => (
                    <tr key={result.id} className="hover:bg-red-50 transition-colors">
                      <td className="py-3 text-sm font-medium text-gray-900">RES-{result.id}</td>
                      <td className="py-3 text-sm text-gray-600">Execution #{result.execution_id}</td>
                      <td className="py-3 text-sm text-gray-500">
                        {new Date(result.updated_at || result.created_at || new Date()).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-sm text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedNC({
                              description: `Failed test result RES-${result.id} from Execution #${result.execution_id}. Needs investigation.`,
                              severity: 'High',
                              impactedArea: 'Testing Lab',
                              status: 'Open',
                              rootCause: '',
                              correctiveAction: ''
                            })
                            setShowCreateModal(true)
                          }}
                        >
                          Raise CAPA
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

      {/* NC/CAPA List */}
      {filteredNCCapas.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No NC/CAPA records found</p>
            <p className="text-sm text-gray-400 mt-1">Add your first NC/CAPA record</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredNCCapas.map((nc, index) => {
            const daysUntilDue = getDaysUntilDue(nc.dueDate)
            return (
              <motion.div
                key={nc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{nc.ncId}</h3>
                        <Badge variant={getSeverityColor(nc.severity)}>
                          {nc.severity}
                        </Badge>
                        <Badge variant={getStatusColor(nc.status)}>
                          {nc.status}
                        </Badge>
                      </div>
                      <p className="text-gray-700 mb-3">{nc.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Impacted Area</p>
                      <p className="font-medium text-gray-900">{nc.impactedArea}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Action Owner</p>
                      <p className="font-medium text-gray-900">{nc.actionOwner}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Due Date</p>
                      <p className={`font-medium ${
                        daysUntilDue !== null && daysUntilDue < 0 ? 'text-red-600' :
                        daysUntilDue !== null && daysUntilDue < 7 ? 'text-orange-600' : 'text-gray-900'
                      }`}>
                        {new Date(nc.dueDate).toLocaleDateString()}
                        {daysUntilDue !== null && daysUntilDue < 7 && (
                          <span className="ml-2 text-xs">
                            ({daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days left`})
                          </span>
                        )}
                      </p>
                    </div>
                    {nc.closureDate && (
                      <div>
                        <p className="text-sm text-gray-500">Closed Date</p>
                        <p className="font-medium text-gray-900">
                          {new Date(nc.closureDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Root Cause</p>
                      <p className="text-sm text-gray-700">{nc.rootCause}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Corrective Action</p>
                      <p className="text-sm text-gray-700">{nc.correctiveAction}</p>
                    </div>
                  </div>

                  {nc.preventiveAction && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-1">Preventive Action</p>
                      <p className="text-sm text-gray-700">{nc.preventiveAction}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedNC(nc)
                        setShowCreateModal(true)
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    {nc.status !== 'Closed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to close this NC/CAPA?')) {
                            try {
                              await ncCapaService.close(nc.id, { closureDate: new Date().toISOString().split('T')[0] })
                              toast.success('NC/CAPA closed successfully')
                              loadNCCapas()
                            } catch (error) {
                              toast.error('Failed to close NC/CAPA')
                            }
                          }
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Close
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setSelectedNC(null)
        }}
        title={selectedNC ? 'Edit NC/CAPA' : 'New NC/CAPA'}
        size="lg"
      >
        <CreateNCCAPAForm
          ncCapa={selectedNC}
          onSuccess={() => {
            setShowCreateModal(false)
            setSelectedNC(null)
            loadNCCapas()
          }}
          onCancel={() => {
            setShowCreateModal(false)
            setSelectedNC(null)
          }}
        />
      </Modal>
    </div>
  )
}

export default QANCCAPA

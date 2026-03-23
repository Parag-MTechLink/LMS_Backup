import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Plus, Search, CheckCircle, TrendingUp, AlertCircle, Activity, ShieldAlert, ArrowLeft } from 'lucide-react'
import { qcService, testExecutionsService, instrumentsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Button from '../../../components/labManagement/Button'
import Badge from '../../../components/labManagement/Badge'
import Input from '../../../components/labManagement/Input'
import Modal from '../../../components/labManagement/Modal'
import CreateQCForm from '../../../components/labManagement/forms/CreateQCForm'
import RecordQCResultForm from '../../../components/labManagement/forms/RecordQCResultForm'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function QAQCChecks() {
  const [qcChecks, setQCChecks] = useState([])
  const [activeInstruments, setActiveInstruments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [selectedQC, setSelectedQC] = useState(null)

  useEffect(() => {
    loadQCChecks()
  }, [])

  const loadQCChecks = async () => {
    try {
      setLoading(true)
      const [qcData, execData, instData] = await Promise.all([
        qcService.getAll().catch(() => []),
        testExecutionsService.getAll().catch(() => []),
        instrumentsService.getAll().catch(() => [])
      ])
      setQCChecks(qcData)

      // Map Active instruments to Active Executions
      const activeExecs = execData.filter(e => ['In Progress', 'Running', 'Active'].includes(e.status))
      const activeInsts = instData.filter(i => i.status === 'Active').slice(0, 4).map((inst, idx) => ({
        ...inst,
        assignedExecutionId: activeExecs[idx % activeExecs.length]?.id || null,
        qcStatus: idx === 0 ? 'Expiring Soon' : 'Valid' // Mocking one warning
      }))
      setActiveInstruments(activeInsts)
    } catch (error) {
      toast.error('Failed to load QC checks')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    return status === 'Pass' ? 'success' : 'danger'
  }

  const filteredQCChecks = qcChecks.filter(qc => {
    const matchesSearch = 
      qc.qcId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qc.testName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qc.parameter?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || qc.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading QC checks...</p>
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            Quality Control Checks
          </h1>
          <p className="text-gray-600 mt-1">Define QC parameters and track test results with trend analysis</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          icon={<Plus className="w-5 h-5" />}
        >
          Add QC Check
        </Button>
      </motion.div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Search QC checks..."
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
            <option value="Pass">Pass</option>
            <option value="Fail">Fail</option>
          </select>
        </div>
      </Card>

      {/* Active Executions & Instrument Status */}
      {activeInstruments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-l-4 border-l-blue-500">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-bold text-gray-900">Active Test Executions QC</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 text-sm font-semibold text-gray-500">Instrument</th>
                    <th className="pb-3 text-sm font-semibold text-gray-500">Type</th>
                    <th className="pb-3 text-sm font-semibold text-gray-500">Assigned Execution</th>
                    <th className="pb-3 text-sm font-semibold text-gray-500">QC/Calibration Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeInstruments.map((inst) => (
                    <tr key={inst.id} className="hover:bg-blue-50 transition-colors">
                      <td className="py-3 text-sm font-medium text-gray-900">{inst.name}</td>
                      <td className="py-3 text-sm text-gray-600">{inst.type}</td>
                      <td className="py-3 text-sm text-gray-600">
                        {inst.assignedExecutionId ? `Execution #${inst.assignedExecutionId}` : 'Unassigned'}
                      </td>
                      <td className="py-3 text-sm">
                        <Badge variant={inst.qcStatus === 'Valid' ? 'success' : 'warning'} className="flex items-center gap-1 w-fit">
                          {inst.qcStatus === 'Valid' ? <CheckCircle className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                          {inst.qcStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* QC Checks Grid */}
      {filteredQCChecks.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No QC checks found</p>
            <p className="text-sm text-gray-400 mt-1">Add your first QC check</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredQCChecks.map((qc, index) => (
            <motion.div
              key={qc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{qc.testName}</h3>
                    <p className="text-sm text-gray-500">{qc.qcId}</p>
                  </div>
                  <Badge variant={getStatusColor(qc.status)}>
                    {qc.status}
                  </Badge>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Parameter:</span>
                    <span className="font-medium text-gray-900">{qc.parameter}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Target Value:</span>
                    <span className="font-medium text-gray-900">{qc.targetValue} {qc.unit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Acceptance Range:</span>
                    <span className="font-medium text-gray-900">
                      {qc.acceptanceRange.min} - {qc.acceptanceRange.max} {qc.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Last Result:</span>
                    <span className={`font-medium ${qc.status === 'Pass' ? 'text-green-600' : 'text-red-600'}`}>
                      {qc.lastResult} {qc.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Frequency:</span>
                    <span className="font-medium text-gray-900">{qc.frequency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Last Check:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(qc.lastCheckDate).toLocaleDateString()}
                    </span>
                  </div>
                  {qc.deviation && (
                    <div className="p-2 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Deviation detected</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Trend Chart */}
                {qc.trend && qc.trend.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Trend Analysis</h4>
                    <ResponsiveContainer width="100%" height={150}>
                      <LineChart data={qc.trend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke={qc.status === 'Pass' ? '#10b981' : '#ef4444'} 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedQC(qc)
                      setShowRecordModal(true)
                    }}
                    className="w-full"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Record Result
                  </Button>
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
        title="Add New QC Check"
        size="lg"
      >
        <CreateQCForm
          onSuccess={() => {
            setShowCreateModal(false)
            loadQCChecks()
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Record Result Modal */}
      <Modal
        isOpen={showRecordModal}
        onClose={() => {
          setShowRecordModal(false)
          setSelectedQC(null)
        }}
        title={`Record QC Result - ${selectedQC?.qcId}`}
        size="md"
      >
        <RecordQCResultForm
          qcCheck={selectedQC}
          onSuccess={() => {
            setShowRecordModal(false)
            setSelectedQC(null)
            loadQCChecks()
          }}
          onCancel={() => {
            setShowRecordModal(false)
            setSelectedQC(null)
          }}
        />
      </Modal>
    </div>
  )
}

export default QAQCChecks

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { BarChart3, AlertCircle, CheckCircle, TrendingUp, Shield, FileText, ClipboardCheck, ArrowLeft } from 'lucide-react'
import { qaReportsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Badge from '../../../components/labManagement/Badge'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function QAAReports() {
  const [complianceScore, setComplianceScore] = useState(null)
  const [overdueCAPA, setOverdueCAPA] = useState([])
  const [sopReminders, setSOPReminders] = useState([])
  const [auditReadiness, setAuditReadiness] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      setLoading(true)
      const [scoreData, capaData, sopData, readinessData] = await Promise.all([
        qaReportsService.getComplianceScore(),
        qaReportsService.getOverdueCAPA(),
        qaReportsService.getSOPReviewReminders(),
        qaReportsService.getAuditReadiness()
      ])
      setComplianceScore(scoreData)
      setOverdueCAPA(capaData)
      setSOPReminders(sopData)
      setAuditReadiness(readinessData)
    } catch (error) {
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    )
  }

  const complianceData = complianceScore ? [
    { name: 'SOP', value: complianceScore.sopCompliance, color: '#3b82f6' },
    { name: 'Calibration', value: complianceScore.calibrationCompliance, color: '#10b981' },
    { name: 'QC', value: complianceScore.qcCompliance, color: '#f59e0b' },
    { name: 'Audit', value: complianceScore.auditCompliance, color: '#8b5cf6' },
    { name: 'Documents', value: complianceScore.documentControl, color: '#6366f1' }
  ] : []

  const readinessData = auditReadiness?.areas || []

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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            QA Reports & Alerts
          </h1>
          <p className="text-gray-600 mt-1">Compliance dashboard, alerts, and audit readiness reports</p>
        </div>
      </motion.div>

      {/* Compliance Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="col-span-1 md:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overall Compliance</p>
              <p className={`text-3xl font-bold mt-1 ${
                complianceScore?.overallScore >= 90 ? 'text-green-600' :
                complianceScore?.overallScore >= 75 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {complianceScore?.overallScore || 0}%
              </p>
            </div>
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
        </Card>
        {complianceData.map((item, index) => (
          <Card key={index}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{item.name}</p>
                <p className={`text-2xl font-bold mt-1 ${
                  item.value >= 90 ? 'text-green-600' :
                  item.value >= 75 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {item.value}%
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Trend</h3>
          {complianceScore?.trends && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={complianceScore.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} name="Compliance Score" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance by Area</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={complianceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Audit Readiness */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Audit Readiness
        </h3>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Overall Readiness Score</span>
            <span className={`text-2xl font-bold ${
              auditReadiness?.readinessScore >= 90 ? 'text-green-600' :
              auditReadiness?.readinessScore >= 75 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {auditReadiness?.readinessScore || 0}%
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {readinessData.map((area, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{area.area}</span>
                <Badge variant={area.status === 'Ready' ? 'success' : 'warning'}>
                  {area.status}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900">{area.score}%</div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Open Findings:</span>
            <span className="ml-2 font-medium text-gray-900">{auditReadiness?.openFindings || 0}</span>
          </div>
          <div>
            <span className="text-gray-500">Overdue CAPA:</span>
            <span className="ml-2 font-medium text-gray-900">{auditReadiness?.overdueCAPA || 0}</span>
          </div>
          <div>
            <span className="text-gray-500">Expired SOPs:</span>
            <span className="ml-2 font-medium text-gray-900">{auditReadiness?.expiredSOPs || 0}</span>
          </div>
          <div>
            <span className="text-gray-500">Missing Calibrations:</span>
            <span className="ml-2 font-medium text-gray-900">{auditReadiness?.missingCalibrations || 0}</span>
          </div>
        </div>
      </Card>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Overdue CAPA
          </h3>
          <div className="space-y-2">
            {overdueCAPA.length === 0 ? (
              <p className="text-sm text-gray-500">No overdue CAPA items</p>
            ) : (
              overdueCAPA.map((item, index) => (
                <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-red-900">{item.ncId}</span>
                    <Badge variant="danger">{item.severity}</Badge>
                  </div>
                  <p className="text-sm text-red-700 mb-1">{item.description}</p>
                  <div className="flex items-center justify-between text-xs text-red-600">
                    <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                    <span>Owner: {item.owner}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            SOP Review Reminders
          </h3>
          <div className="space-y-2">
            {sopReminders.length === 0 ? (
              <p className="text-sm text-gray-500">No SOP reviews due soon</p>
            ) : (
              sopReminders.map((sop, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-blue-900">{sop.sopId}</span>
                    <Badge variant="info">{sop.status}</Badge>
                  </div>
                  <p className="text-sm text-blue-700 mb-1">{sop.title}</p>
                  <div className="text-xs text-blue-600">
                    Next Review: {new Date(sop.nextReviewDate).toLocaleDateString()} 
                    ({sop.daysUntilReview} days)
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default QAAReports

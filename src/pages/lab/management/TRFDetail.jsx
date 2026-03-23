import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileCheck, Clock, CheckCircle, ExternalLink,
  AlertTriangle, Zap, ArrowRight, X, ArrowLeft
} from 'lucide-react'
import toast from 'react-hot-toast'
import { trfsService } from '../../../services/labManagementApi'
import { useLabManagementAuth } from '../../../contexts/LabManagementAuthContext'
import Card from '../../../components/labManagement/Card'
import Badge from '../../../components/labManagement/Badge'

const PRIORITY_CONFIG = {
  Urgent: { bg: 'bg-red-100 text-red-700', icon: <AlertTriangle className="w-4 h-4 mr-1.5 inline" /> },
  High: { bg: 'bg-orange-100 text-orange-700', icon: <Zap className="w-4 h-4 mr-1.5 inline" /> },
  Normal: { bg: 'bg-blue-100 text-blue-700', icon: null },
  Low: { bg: 'bg-gray-100 text-gray-600', icon: null },
}

const STATUS_ACTIONS = {
  Draft: { label: 'Submit TRF', next: 'Submitted', allowedRoles: ['Testing Engineer', 'Team Lead', 'Admin'] },
  Submitted: { label: 'Approve TRF', next: 'Approved', allowedRoles: ['Lab Manager', 'Quality Manager', 'Technical Manager', 'Admin'] },
}

function TRFDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useLabManagementAuth()
  const [trf, setTrf] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (id) {
      loadTRF()
    }
  }, [id])

  const loadTRF = async () => {
    try {
      setLoading(true)
      const data = await trfsService.getById(id)
      setTrf(data)
    } catch (error) {
      toast.error('Failed to load TRF details')
      navigate('/lab/management/trfs')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusAction = async (nextStatus) => {
    setActionLoading(true)
    try {
      await trfsService.updateStatus(trf.id, nextStatus, user?.full_name)
      toast.success(`TRF marked as ${nextStatus}`)
      loadTRF()
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to update status')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    setActionLoading(true)
    try {
      await trfsService.updateStatus(trf.id, 'Rejected', user?.full_name)
      toast.success('TRF rejected')
      loadTRF()
    } catch {
      toast.error('Failed to reject TRF')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusVariant = (status) => {
    const map = { Draft: 'default', Submitted: 'info', Approved: 'success', Rejected: 'danger' }
    return map[status] || 'default'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-gray-600">Loading TRF Details...</p>
        </div>
      </div>
    )
  }

  if (!trf) return null

  const status = trf.status || 'Draft'
  const action = STATUS_ACTIONS[status]
  const priorityCfg = PRIORITY_CONFIG[trf.priority] || PRIORITY_CONFIG.Normal
  const canAction = action && action.allowedRoles.includes(user?.role)
  const canReject = status === 'Submitted' && ['Lab Manager', 'Quality Manager', 'Technical Manager', 'Admin'].includes(user?.role)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back navigation */}
      <button
        onClick={() => navigate('/lab/management/trfs')}
        className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Back to TRFs
      </button>

      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="rounded-2xl border-0 ring-1 ring-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shrink-0">
                <FileCheck className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {trf.trfNumber || `TRF-${trf.id}`}
                </h1>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  {trf.test_type && (
                    <span className="font-semibold text-primary">{trf.test_type}</span>
                  )}
                  {trf.projectId && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <button
                        onClick={() => navigate(`/lab/management/projects/${trf.projectId}`)}
                        className="hover:text-primary hover:underline flex items-center gap-1 transition-colors"
                      >
                        {trf.projectName || `Project #${trf.projectId}`}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-2.5">
              <Badge variant={getStatusVariant(status)} className="px-3 py-1 text-sm shadow-sm">
                {status}
              </Badge>
              {trf.priority && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center ${priorityCfg.bg}`}>
                  {priorityCfg.icon}{trf.priority} Priority
                </span>
              )}
            </div>
          </div>

          {/* Action Ribbon */}
          {(canAction || canReject) && (
            <div className="bg-blue-50/50 px-8 py-4 border-b border-blue-100 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-blue-900 mr-2">Action Required:</span>
              {canAction && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleStatusAction(action.next)}
                  className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Processing...' : (
                    <>{action.label} <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              )}
              {canReject && (
                <button
                  disabled={actionLoading}
                  onClick={handleReject}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 border mx-1 border-red-200 text-sm font-bold rounded-xl hover:bg-red-50 hover:border-red-300 shadow-sm hover:shadow transition-all disabled:opacity-50"
                >
                  {actionLoading ? '...' : <><X className="w-4 h-4" /> Reject</>}
                </button>
              )}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="rounded-2xl border-0 ring-1 ring-gray-200 shadow-sm p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-gray-400" />
                Test Description
              </h2>
              {trf.description ? (
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {trf.description}
                </p>
              ) : (
                <p className="text-gray-400 italic">No description provided.</p>
              )}
            </Card>
          </motion.div>

          {trf.sample_description && (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
               <Card className="rounded-2xl border-0 ring-1 ring-gray-200 shadow-sm p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Sample Details</h2>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {trf.sample_description}
                  </p>
                </div>
              </Card>
            </motion.div>
          )}

          {trf.notes && (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
               <Card className="rounded-2xl border-0 ring-1 ring-amber-200 shadow-sm p-8 bg-amber-50/30">
                <h2 className="text-lg font-bold text-amber-900 mb-4">Additional Notes</h2>
                <p className="text-amber-800 whitespace-pre-wrap leading-relaxed">
                  {trf.notes}
                </p>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Right Column - Meta Timeline */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="rounded-2xl border-0 ring-1 ring-gray-200 shadow-sm p-6 sticky top-6">
              <h2 className="text-base font-bold text-gray-900 mb-5">Timeline & Status</h2>
              
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                
                {/* Created Step */}
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white bg-blue-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" />
                  <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl shadow-sm bg-white border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold text-gray-900 text-sm">Created</div>
                    </div>
                    {trf.created_at && (
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(trf.created_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Approved/Rejected Step (if completed) */}
                {(status === 'Approved' || status === 'Rejected') && (
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${status === 'Approved' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl shadow-sm bg-white border border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <div className={`font-bold text-sm ${status === 'Approved' ? 'text-green-700' : 'text-red-700'}`}>
                          {status}
                        </div>
                      </div>
                       {trf.approved_by && (
                        <div className="text-xs text-gray-600 mt-2 font-medium">
                          By: {trf.approved_by}
                        </div>
                      )}
                      {trf.updated_at && (
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-1.5">
                          <CheckCircle className="w-3 h-3" />
                         {new Date(trf.updated_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </Card>
          </motion.div>
        </div>

      </div>
    </div>
  )
}

export default TRFDetail

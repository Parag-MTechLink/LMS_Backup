import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Calendar, 
  Wrench, 
  User, 
  FileText, 
  Clock, 
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Shield,
  Download,
  Eye
} from 'lucide-react'
import { calibrationsService, instrumentsService, documentsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Badge from '../../../components/labManagement/Badge'
import Button from '../../../components/labManagement/Button'
import Modal from '../../../components/labManagement/Modal'
import CreateCalibrationForm from '../../../components/labManagement/forms/CreateCalibrationForm'

function CalibrationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [calibration, setCalibration] = useState(null)
  const [instrument, setInstrument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await calibrationsService.getById(parseInt(id))
      setCalibration(data)
      
      // Load related instrument data
      if (data.instrumentId) {
        const instData = await instrumentsService.getById(data.instrumentId).catch(() => null)
        setInstrument(instData)
      }
    } catch (error) {
      toast.error('Failed to load calibration details')
      navigate('/lab/management/inventory/calibration')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'Valid': 'success',
      'Due Soon': 'warning',
      'Overdue': 'danger'
    }
    return colors[status] || 'default'
  }

  const handleDocumentAction = async (action) => {
    if (!calibration?.certificateUrl) {
      toast.error('No certificate file available for this record')
      return
    }

    try {
      const match = calibration.certificateUrl.match(/\/documents\/(\d+)\/download/)
      if (match) {
        const docId = parseInt(match[1])
        toast.loading(action === 'download' ? 'Downloading certificate...' : 'Fetching certificate preview...')
        const blobData = await documentsService.download(docId)
        const blob = new Blob([blobData], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        
        if (action === 'download') {
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', `Certificate_${calibration.certificateNumber || 'Record'}.pdf`)
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
          toast.success('Download complete')
        } else {
          // Open in new tab
          window.open(url, '_blank')
          // Note: we can't easily revoke URL here as it's needed for the new tab
          // But it will eventually be GC'd when the page refreshes
        }
        toast.dismiss()
      } else {
        window.open(calibration.certificateUrl, '_blank')
      }
    } catch (error) {
      toast.dismiss()
      toast.error('Action failed')
      console.error('Document error:', error)
    }
  }

  if (loading && !calibration) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading calibration details...</p>
        </div>
      </div>
    )
  }

  if (!calibration) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          onClick={() => navigate('/lab/management/inventory/calibration')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors w-fit"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{calibration.calibrationId}</h1>
            <Badge variant={getStatusColor(calibration.status)}>{calibration.status}</Badge>
          </div>
          <p className="text-gray-600 mt-1">Instrument: {calibration.instrumentName || 'N/A'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
          <Button onClick={() => setShowEditModal(true)}>Edit Record</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Calibration Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Last Calibration Date</p>
                  <p className="font-medium text-gray-900">
                    {calibration.lastCalibrationDate ? new Date(calibration.lastCalibrationDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Next Due Date</p>
                  <p className={`font-medium ${calibration.status === 'Overdue' ? 'text-red-600' : 'text-gray-900'}`}>
                    {calibration.nextDueDate ? new Date(calibration.nextDueDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Calibration Frequency</p>
                  <p className="font-medium text-gray-900">{calibration.calibrationFrequency || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Certified By</p>
                  <p className="font-medium text-gray-900">{calibration.certifiedBy || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Certificate Number</p>
                  <p className="font-medium text-gray-900">{calibration.certificateNumber || 'N/A'}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Notes & Findings">
            <p className="text-gray-700 whitespace-pre-wrap">
              {calibration.notes || 'No calibration notes or findings recorded for this event.'}
            </p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Linked Instrument">
            {instrument ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Name</p>
                  <p className="font-semibold text-gray-900">{instrument.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Model</p>
                  <p className="text-sm font-medium text-gray-900">{instrument.model || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Serial Number</p>
                  <p className="text-sm font-medium text-gray-900">{instrument.serialNumber || 'N/A'}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={() => navigate(`/lab/management/inventory/instruments/${instrument.id}`)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Instrument
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No instrument information available.</p>
            )}
          </Card>

          <Card title="Documents">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Calibration Certificate</p>
                    <p className="text-xs text-gray-500">PDF • 1.2 MB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleDocumentAction('view')}
                    title="View Certificate"
                    className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors group/btn"
                  >
                    <Eye className="w-4 h-4 text-gray-400 group-hover/btn:text-blue-600" />
                  </button>
                  <button 
                    onClick={() => handleDocumentAction('download')}
                    title="Download Certificate"
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors group/btn"
                  >
                    <Download className="w-4 h-4 text-gray-400 group-hover/btn:text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Calibration Record"
        size="lg"
      >
        <CreateCalibrationForm
          calibration={calibration}
          instruments={instrument ? [instrument] : []}
          onSuccess={() => {
            setShowEditModal(false)
            loadData()
          }}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>
    </div>
  )
}

export default CalibrationDetail

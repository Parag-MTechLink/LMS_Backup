import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, Calendar, MapPin, FileText } from 'lucide-react'
import { samplesService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Badge from '../../../components/labManagement/Badge'
import Button from '../../../components/labManagement/Button'

function SampleDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [sample, setSample] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadSample(parseInt(id, 10))
    }
  }, [id])

  const loadSample = async (sampleId) => {
    try {
      setLoading(true)
      const data = await samplesService.getById(sampleId)
      setSample(data)
    } catch (error) {
      console.error('Error loading sample details:', error)
      toast.error('Failed to load sample details')
      setSample(null)
    } finally {
      setLoading(false)
    }
  }

  const getConditionColor = (condition) => {
    const colors = {
      Good: 'success',
      Damaged: 'danger',
      Incomplete: 'warning',
      Unknown: 'default',
    }
    return colors[condition] || 'default'
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-gray-600">Loading sample details...</p>
        </div>
      </div>
    )
  }

  if (!sample) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="py-12 text-center">
            <p className="text-lg font-medium text-gray-900">Sample not found</p>
            <p className="mt-2 text-sm text-gray-600">
              The requested sample does not exist or could not be loaded.
            </p>
            <Button className="mt-4" onClick={() => navigate('/lab/management/samples')}>
              Back to Samples
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-lg">
            <Package className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Sample {sample.sampleNumber || `#${sample.id}`}
            </h1>
            <p className="mt-1 text-sm text-gray-600">Detailed sample information</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={getConditionColor(sample.condition)}>{sample.condition}</Badge>
          {sample.projectId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/lab/management/projects/${sample.projectId}`)}
            >
              View Project
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/lab/management/samples')}
          >
            Back to Samples
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-gray-500">Project</p>
            <p className="text-sm font-semibold text-gray-900">
              {sample.projectName
                ? sample.projectName
                : sample.projectId
                ? `Project #${sample.projectId}`
                : 'Not linked to a project'}
            </p>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-gray-500">Received Date</p>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>
                {sample.receivedDate
                  ? new Date(sample.receivedDate).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-gray-500">Storage Location</p>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{sample.storageLocation || 'Not specified'}</span>
            </div>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-gray-500">Quantity</p>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Package className="h-4 w-4 text-gray-400" />
              <span>{sample.quantity || 'N/A'}</span>
            </div>
          </div>
        </Card>
      </div>

      {sample.testDetails && (
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Test Details</h2>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {sample.testDetails}
          </p>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Notes</h2>
        </div>
        <p className="text-sm text-gray-700">
          {sample.notes || 'No notes recorded for this sample.'}
        </p>
      </Card>
    </div>
  )
}

export default SampleDetails


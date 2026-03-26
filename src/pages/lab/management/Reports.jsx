import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, FileBarChart, Download, Calendar, Upload } from 'lucide-react'
import { reportsService, getDownloadUrl } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Badge from '../../../components/labManagement/Badge'
import Input from '../../../components/labManagement/Input'
import Button from '../../../components/labManagement/Button'
import UploadReportModal from '../../../components/labManagement/forms/UploadReportModal'

function Reports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      setLoading(true)
      const data = await reportsService.getAll()
      setReports(data)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (report) => {
    if (report.file_path) {
      window.open(getDownloadUrl(report.file_path), '_blank')
    } else {
      toast.error('File not found')
    }
  }

  const filteredReports = reports.filter(report =>
    report.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileBarChart className="w-8 h-8 text-primary" />
          Reports
        </h1>

        <Button onClick={() => setShowUploadModal(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Report
        </Button>
      </motion.div>

      {/* Search */}
      <Card>
        <Input
          placeholder="Search reports..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search className="w-5 h-5" />}
        />
      </Card>

      {/* Grid */}
      {filteredReports.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 py-10">
            No reports found
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full flex flex-col">
                <div className="flex justify-between mb-3">
                  <FileBarChart className="w-10 h-10 text-primary" />
                  <Badge variant="info">Uploaded</Badge>
                </div>

                <h3 className="font-bold text-lg">{report.name}</h3>
                {report.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {report.description}
                  </p>
                )}

                <div className="mt-auto pt-4 border-t flex items-center">
                  {report.created_at && (
                    <span className="text-sm text-gray-500 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  )}

                  <button
                    onClick={() => handleDownload(report)}
                    className="ml-auto text-primary flex items-center gap-2 hover:bg-primary/10 px-3 py-2 rounded-lg"
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

      {showUploadModal && (
        <UploadReportModal
          onClose={() => {
            setShowUploadModal(false)
            loadReports()
          }}
        />
      )}
    </div>
  )
}

export default Reports

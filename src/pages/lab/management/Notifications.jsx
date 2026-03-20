import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Trash2, 
  Check,
  Search,
  Filter,
  ArrowRight,
  Clock,
  User as UserIcon
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { notificationsService } from '../../../services/labManagementApi'
import Card from '../../../components/labManagement/Card'
import Badge from '../../../components/labManagement/Badge'
import toast, { Toaster } from 'react-hot-toast'

function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, unread, read
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const data = await notificationsService.getMyNotifications(false)
      setNotifications(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsService.markAsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (err) {
      toast.error('Failed to mark as read')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      toast.success('All notifications marked as read')
    } catch (err) {
      toast.error('Failed to mark all as read')
    }
  }

  const handleDelete = async (id) => {
    // Note: Assuming delete endpoint exists or mark as read is enough for now.
    // If backend doesn't support delete, we might just hide it locally or mark read.
    toast.success('Notification cleared')
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const filteredNotifications = notifications.filter(n => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'unread' && !n.is_read) || 
      (filter === 'read' && n.is_read)
    
    const matchesSearch = 
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'warning': return <AlertCircle className="w-5 h-5 text-amber-600" />
      case 'info': return <Info className="w-5 h-5 text-blue-600" />
      default: return <Bell className="w-5 h-5 text-blue-600" />
    }
  }

  const getBgColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-50'
      case 'warning': return 'bg-amber-50'
      case 'info': return 'bg-blue-50'
      default: return 'bg-blue-50'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">Stay updated with your project workflows and actions</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-all"
          >
            <Check className="w-4 h-4" />
            Mark all read
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl w-full md:w-auto">
            {['all', 'unread', 'read'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 text-sm font-bold rounded-lg capitalize transition-all ${
                  filter === f ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary transition-all text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))
        ) : filteredNotifications.length === 0 ? (
          <Card className="py-20 text-center">
            <Bell className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-xl font-bold text-gray-900">All caught up!</p>
            <p className="text-gray-500 mt-1">No notifications match your current filters.</p>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredNotifications.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                layout
              >
                <Card className={`group relative p-5 transition-all hover:shadow-md border-l-4 ${!n.is_read ? 'border-l-primary bg-blue-50/20' : 'border-l-transparent bg-white'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${getBgColor(n.type)}`}>
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-bold transition-colors ${!n.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {n.title}
                        </h3>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!n.is_read && (
                            <button 
                              onClick={() => handleMarkAsRead(n.id)}
                              className="p-1.5 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDelete(n.id)}
                            className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                            title="Clear"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className={`text-sm leading-relaxed mb-3 ${!n.is_read ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                        {n.message}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(n.created_at || n.createdAt).toLocaleString()}</span>
                        </div>
                        {n.triggered_by_name && (
                          <div className="flex items-center gap-1.5">
                            <UserIcon className="w-3.5 h-3.5" />
                            <span>From: {n.triggered_by_name} ({n.triggered_by_role})</span>
                          </div>
                        )}
                        {n.entity_url && (
                          <button 
                            onClick={() => {
                              handleMarkAsRead(n.id)
                              navigate(n.entity_url)
                            }}
                            className="flex items-center gap-1 text-primary font-bold hover:underline ml-auto"
                          >
                            View Details
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
      <Toaster position="top-right" />
    </div>
  )
}

export default NotificationsPage

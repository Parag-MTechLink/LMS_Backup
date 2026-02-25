import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  FileText,
  IndianRupee,
  FolderKanban,
  FlaskConical,
  TestTube,
  Play,
  BarChart3,
  Package,
  FileCheck,
  FolderOpen,
  FileBarChart,
  ClipboardCheck,
  AlertTriangle,
  Shield,
  User,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  Building2,
  Target,
  Calendar,
  TrendingUp,
} from 'lucide-react'
import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useLabManagementAuth } from '../contexts/LabManagementAuthContext'
import logo from '../assets/techlink-logo.svg'

const allNavItems = [
  { name: 'Dashboard', href: '/lab/management/dashboard', icon: LayoutDashboard },
  { name: 'Organization Details', href: '/lab/management/organization', icon: Building2, roles: ['Admin'] },
  // { name: 'Scope Management', href: '/lab/management/scope-management', icon: Target },
  { name: 'Customers', href: '/lab/management/customers', icon: Users },
  { name: 'RFQs', href: '/lab/management/rfqs', icon: FileText },
  { name: 'Estimations', href: '/lab/management/estimations', icon: IndianRupee, hideForRoles: ['Testing Engineer', 'Technician'] },
  { name: 'Projects', href: '/lab/management/projects', icon: FolderKanban },
  { name: 'Samples', href: '/lab/management/samples', icon: Package },
  { name: 'Test Plans', href: '/lab/management/test-plans', icon: FlaskConical },
  { name: 'Test Executions', href: '/lab/management/test-executions', icon: Play },
  { name: 'Test Results', href: '/lab/management/test-results', icon: BarChart3 },
  { name: 'TRFs', href: '/lab/management/trfs', icon: FileCheck },
  { name: 'Documents', href: '/lab/management/documents', icon: FolderOpen },
  { name: 'Reports', href: '/lab/management/reports', icon: FileBarChart },
  { name: 'Audits', href: '/lab/management/audits', icon: ClipboardCheck, hideForRoles: ['Testing Engineer', 'Technician', 'Sales Engineer'] },
  { name: 'NCRs', href: '/lab/management/ncrs', icon: AlertTriangle },
  { name: 'Certifications', href: '/lab/management/certifications', icon: Shield },
  { name: 'Calendar', href: '/lab/management/calendar', icon: Calendar },
  { name: 'Inventory Management', href: '/lab/management/inventory', icon: Package, hideForRoles: ['Sales Engineer'] },
  { name: 'Quality Assurance', href: '/lab/management/qa', icon: Shield, hideForRoles: ['Sales Engineer', 'Technician'] },
  { name: 'Lab Recommendations', href: '/lab/management/lab-recommendations', icon: TrendingUp },
]

function getNavigationForRole(role) {
  if (!role) return allNavItems
  return allNavItems.filter((item) => {
    if (item.roles && !item.roles.includes(role)) return false
    if (item.hideForRoles && item.hideForRoles.includes(role)) return false
    return true
  })
}

function LabManagementLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const navigate = useNavigate()
  const notificationRef = useRef(null)
  const { user, logout } = useLabManagementAuth()
  const displayName = user?.full_name || user?.name || user?.email || 'User'
  const displayRole = user?.role || ''

  const navItems = useMemo(() => getNavigationForRole(displayRole), [displayRole])

  // Mock notifications
  const notifications = [
    { id: 1, type: 'success', title: 'Test Plan Completed', message: 'Test Plan TP-001 has been completed', time: '2 hours ago', read: false },
    { id: 2, type: 'info', title: 'New RFQ Received', message: 'A new RFQ has been received from TechCorp', time: '5 hours ago', read: false },
    { id: 3, type: 'warning', title: 'Sample Review Due', message: 'Sample SAMPLE-2024-045 needs review', time: '1 day ago', read: true },
    { id: 4, type: 'info', title: 'Project Update', message: 'Project EMC-2024-001 status updated', time: '2 days ago', read: true },
  ]

  const unreadCount = notifications.filter(n => !n.read).length

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchNavigate = useCallback((term) => {
    if (term && term.trim()) {
      navigate(`/lab/management/projects?search=${encodeURIComponent(term.trim())}`)
      setSearchTerm('')
    }
  }, [navigate])

  const handleSearch = useCallback((e) => {
    e.preventDefault()
    handleSearchNavigate(searchTerm)
  }, [searchTerm, handleSearchNavigate])


  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-white shadow-lg hover:bg-gray-100 transition-all"
        >
          {sidebarOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200">
            <Link to="/lab/management/dashboard" className="flex items-center space-x-3">
              <img
                src={logo}
                alt="Techlink Logo"
                className="h-16 w-auto"
              />
            </Link>
            <span className="rounded-full border border-primary/20 px-3 py-1 text-xs font-medium text-primary bg-primary/10">
              Lab
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href ||
                location.pathname.startsWith(item.href + '/')
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `group flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-200 ${isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border ${isActive
                        ? 'border-primary-600 bg-white/20 text-white'
                        : 'border-gray-200 bg-white text-gray-500'
                        }`}
                    >
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium tracking-tight">{item.name}</span>
                  </div>

                </NavLink>
              )
            })}
          </nav>

          {/* User Profile */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white text-sm font-semibold">
                <span>{getInitials(displayName)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                <p className="text-xs text-gray-500 truncate capitalize">{displayRole || 'Role'}</p>
              </div>
              <button
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors duration-200 hover:border-primary hover:text-primary"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="relative lg:pl-72">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-xl">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search projects, customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </form>
              </div>
              <div className="flex items-center gap-4 ml-4">
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Bell className="w-5 h-5 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  <AnimatePresence>
                    {notificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden"
                      >
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">Notifications</h3>
                          {unreadCount > 0 && (
                            <span className="text-xs text-primary font-medium">{unreadCount} new</span>
                          )}
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                              <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                              <p>No notifications</p>
                            </div>
                          ) : (
                            notifications.map((notification) => (
                              <div
                                key={notification.id}
                                className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50/50' : ''
                                  }`}
                                onClick={() => {
                                  // Mark as read and handle click
                                  setNotificationsOpen(false)
                                }}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`mt-1 p-1.5 rounded-lg ${notification.type === 'success' ? 'bg-green-100 text-green-600' :
                                    notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                                      'bg-blue-100 text-blue-600'
                                    }`}>
                                    {notification.type === 'success' && <CheckCircle className="w-4 h-4" />}
                                    {notification.type === 'warning' && <AlertCircle className="w-4 h-4" />}
                                    {notification.type === 'info' && <Info className="w-4 h-4" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                      {notification.title}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {notification.time}
                                    </p>
                                  </div>
                                  {!notification.read && (
                                    <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <div className="p-3 border-t border-gray-200">
                            <button
                              onClick={() => {
                                // Mark all as read
                                setNotificationsOpen(false)
                              }}
                              className="w-full text-sm text-primary hover:text-primary-dark font-medium"
                            >
                              Mark all as read
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="min-h-screen p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-gray-900/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  )
}

export default LabManagementLayout

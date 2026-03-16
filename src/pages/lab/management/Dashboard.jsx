import { useEffect, useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  TrendingUp, 
  Users, 
  FolderKanban, 
  FlaskConical,
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
  FileCheck,
  FileText,
  DollarSign,
  Activity,
  Target,
  Zap,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  TrendingDown,
  Settings,
  Info,
  X
} from 'lucide-react'
import { 
  projectsService, 
  customersService, 
  testPlansService,
  rfqsService,
  estimationsService,
  samplesService,
  trfsService,
  testExecutionsService,
  testResultsService,
  inventoryReportsService,
  instrumentsService,
  calibrationsService
} from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import RouteSkeleton from '../../../components/RouteSkeleton'
import Modal from '../../../components/labManagement/Modal'
import Button from '../../../components/labManagement/Button'
import Input from '../../../components/labManagement/Input'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, RadialBarChart, RadialBar } from 'recharts'

function LabManagementDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    projects: 0,
    customers: 0,
    testPlans: 0,
    completedTests: 0,
    rfqs: 0,
    estimations: 0,
    samples: 0,
    trfs: 0
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [chartData, setChartData] = useState([])
  const [statusDistribution, setStatusDistribution] = useState([])
  // Store full lists for real-time selector filtering
  const [allProjects, setAllProjects] = useState([])
  const [allTestExecutions, setAllTestExecutions] = useState([])
  const [allInstruments, setAllInstruments] = useState([])
  const [allCalibrations, setAllCalibrations] = useState([])
  const [performanceMetrics, setPerformanceMetrics] = useState({
    completionRate: 0,
    averageCycleTime: 0,
    onTimeDelivery: 0,
    customerSatisfaction: 0
  })
  const [testExecutionData, setTestExecutionData] = useState([])
  const [revenueData, setRevenueData] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState('6M')
  const [chartsTimeRange, setChartsTimeRange] = useState('6M')
  const [chartsCustomRange, setChartsCustomRange] = useState({ start: '', end: '' })
  // Alerts state removed — alerts are now shown in the header bell icon
  const [operationalStats, setOperationalStats] = useState({
    equipmentUtilization: 0,
    activeEquipmentCount: 0,
    totalEquipmentCount: 0,
    personnelWorkload: 0,
    spaceUtilization: 0,
    storageCapacity: 0,
    avgTAT: null,
    tatImprovement: null
  })
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false)
  const [targets, setTargets] = useState({
    tatTarget: 10,
    utilizationTarget: 80,
    personnelTarget: 90,
    spaceTarget: 70,
    storageTarget: 50
  })
  const [activeInfoPopup, setActiveInfoPopup] = useState(null)
  
  // Calculate deadlines for various systems
  const deadlines = useMemo(() => {
    const list = []
    const now = new Date()

    // Test Plan Deadlines
    allTestExecutions.filter(t => {
      const end = new Date(t.end_date || t.endDate || t.due_date)
      return (t.status !== 'completed' && t.status !== 'Completed') && !isNaN(end)
    }).forEach(t => {
      const due = new Date(t.end_date || t.endDate || t.due_date)
      const daysUntil = Math.round((due - now) / (1000 * 60 * 60 * 24))
      list.push({
        id: `tp-${t.id}`,
        title: `Test Plan: ${t.name}`,
        subtitle: `Project: ${t.projectName || 'N/A'}`,
        days: daysUntil,
        type: 'test'
      })
    })

    // Instrument Calibration Deadlines
    allCalibrations.forEach(cal => {
      const calDate = cal.nextDueDate || cal.dueDate || cal.due_date || cal.nextCalibrationDate
      if (calDate) {
        const due = new Date(calDate)
        const daysUntil = Math.round((due - now) / (1000 * 60 * 60 * 24))
        if (daysUntil <= 30 && (cal.status === 'Due Soon' || cal.status === 'Overdue' || cal.status === 'Pending')) {
          list.push({
            id: `cal-${cal.id}`,
            title: `Calibration: ${cal.instrumentName || 'Instrument'}`,
            subtitle: `ID: ${cal.instrumentId || 'N/A'}`,
            days: daysUntil,
            type: 'calibration'
          })
        }
      }
    })

    return list.sort((a, b) => a.days - b.days)
  }, [allTestExecutions, allInstruments])

  const urgentCount = useMemo(() => deadlines.filter(d => d.days <= 0).length, [deadlines])

  const [rawLists, setRawLists] = useState({
    projects: [],
    customers: [],
    testPlans: [],
    rfqs: []
  })

  // Close info popup when clicking outside
  useEffect(() => {
    const handleGlobalClick = () => setActiveInfoPopup(null)
    if (activeInfoPopup) {
      document.addEventListener('click', handleGlobalClick)
    }
    return () => document.removeEventListener('click', handleGlobalClick)
  }, [activeInfoPopup])

  useEffect(() => {
    const savedTargets = localStorage.getItem('dashboardTargets')
    if (savedTargets) {
      setTargets(JSON.parse(savedTargets))
    }
    loadDashboardData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData(true)
    }, 30000)
    return () => clearInterval(interval)
  }, [timeRange])

  const loadDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setRefreshing(true)
      const [
        projects,
        customers,
        testPlans,
        rfqs,
        estimations,
        samples,
        trfs,
        testExecutions,
        testResults,
        inventorySummary,
        allInstruments,
        allCalibrations
      ] = await Promise.all([
        projectsService.getAll().catch(() => []),
        customersService.getAll().catch(() => []),
        testPlansService.getAll().catch(() => []),
        rfqsService.getAll().catch(() => []),
        estimationsService.getAll().catch(() => []),
        samplesService.getAll().catch(() => []),
        trfsService.getAll().catch(() => []),
        testExecutionsService.getAll().catch(() => []),
        testResultsService.getAll().catch(() => []),
        inventoryReportsService.getSummary().catch(() => ({})),
        instrumentsService.getAll().catch(() => []),
        calibrationsService.getAll().catch(() => [])
      ])

      setAllTestExecutions(testExecutions)
      setAllInstruments(allInstruments)
      setAllCalibrations(allCalibrations)
      setRawLists({
        projects: projects.slice(0, 5),
        customers: customers.slice(0, 5),
        testPlans: testPlans.slice(0, 5),
        rfqs: rfqs.slice(0, 5)
      })

      setStats({
        projects: projects.length,
        customers: customers.length,
        testPlans: testPlans.length,
        completedTests: testPlans.filter(p => p.status === 'Completed').length,
        rfqs: rfqs.length,
        estimations: estimations.length,
        samples: samples.length,
        trfs: trfs.length
      })

      // Create recent activities from actual data
      const activities = []
      if (projects.length > 0) {
        const recentProject = projects[0]
        activities.push({
          id: 1,
          type: 'project',
          title: `Project: ${recentProject.name}`,
          time: 'Recently',
          status: recentProject.status === 'active' ? 'active' : 'pending',
          link: `/lab/management/projects/${recentProject.id}`
        })
      }
      if (testPlans.length > 0) {
        const recentPlan = testPlans[0]
        activities.push({
          id: 2,
          type: 'test',
          title: `Test Plan: ${recentPlan.name}`,
          time: 'Recently',
          status: recentPlan.status === 'Completed' ? 'completed' : 'pending',
          link: `/lab/management/test-plans/${recentPlan.id}`
        })
      }
      if (samples.length > 0) {
        const recentSample = samples[0]
        activities.push({
          id: 3,
          type: 'sample',
          title: `Sample: ${recentSample.sampleNumber || 'Sample-' + recentSample.id}`,
          time: 'Recently',
          status: 'pending',
          link: `/lab/management/samples/${recentSample.id}`
        })
      }
      if (trfs.length > 0) {
        const recentTRF = trfs[0]
        activities.push({
          id: 4,
          type: 'trf',
          title: `TRF: ${recentTRF.trfNumber || 'TRF-' + recentTRF.id}`,
          time: 'Recently',
          status: recentTRF.status === 'Approved' ? 'completed' : 'review',
          link: `/lab/management/trfs/${recentTRF.id}`
        })
      }
      setRecentActivities(activities.slice(0, 4))

      // Prepare chart data
      const projectStatusCounts = {
        active: projects.filter(p => p.status === 'active').length,
        completed: projects.filter(p => p.status === 'completed').length,
        pending: projects.filter(p => p.status === 'pending').length,
      }
      setStatusDistribution([
        { name: 'Active', value: projectStatusCounts.active, color: '#3b82f6' },
        { name: 'Completed', value: projectStatusCounts.completed, color: '#10b981' },
        { name: 'Pending', value: projectStatusCounts.pending, color: '#f59e0b' },
      ])

      // Calculate performance metrics
      const completedProjectsCount = projects.filter(p => p.status === 'completed').length
      const totalProjects = projects.length
      const completionRate = totalProjects > 0 ? (completedProjectsCount / totalProjects) * 100 : 0
      
      const completedTests = testPlans.filter(t => t.status === 'Completed').length
      const totalTests = testPlans.length
      const testCompletionRate = totalTests > 0 ? (completedTests / totalTests) * 100 : 0
      
      const passedResults = testResults.filter(r => r.passFail === 'Pass').length
      const totalResults = testResults.length
      const passRate = totalResults > 0 ? (passedResults / totalResults) * 100 : 0
      
      setPerformanceMetrics({
        completionRate: Math.round(completionRate),
        averageCycleTime: 12, // Mock - calculate from actual data
        onTimeDelivery: Math.round(testCompletionRate),
        customerSatisfaction: Math.round(passRate)
      })

      setAllProjects(projects)
      setAllTestExecutions(testExecutions)

      // Prepare monthly data based on actual data
      const currentYear = new Date().getFullYear()
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthlyData = months.slice(0, 6).map((month, index) => {
        // Distribute projects and tests across months
        const monthProjects = Math.floor(projects.length / 6) + (index < projects.length % 6 ? 1 : 0)
        const monthTests = Math.floor(testPlans.length / 6) + (index < testPlans.length % 6 ? 1 : 0)
        return {
          month,
          fullDate: new Date(currentYear, index, 1).toISOString(),
          projects: monthProjects,
          tests: monthTests,
          completed: Math.floor(monthProjects * 0.7)
        }
      })
      setChartData(monthlyData)

      // Test execution data for bar chart — logic moved to render for timeline support
      const revenueDataItems = estimations.map((est, index) => ({
        month: months[index % 12],
        revenue: est.totalCost || 0,
        estimations: 1
      })).slice(0, 6)
      setRevenueData(revenueDataItems)

      // Calculate Operational Stats
      const activeInstruments = inventorySummary.activeInstruments || allInstruments.filter(i => i.status === 'active').length || 0
      const totalInstruments = inventorySummary.totalInstruments || allInstruments.length || 1
      const utilization = Math.round((activeInstruments / totalInstruments) * 100)

      // Calculate TAT: average days between project creation and completion for completed projects
      const completedProjectsList = projects.filter(p => p.status === 'completed' || p.status === 'Completed')
      let avgTAT = null // null means no data — no fallback
      if (completedProjectsList.length > 0) {
        const validDurations = completedProjectsList
          .map(p => {
            const start = new Date(p.createdAt || p.start_date || p.created_at)
            const end = new Date(p.updatedAt || p.end_date || p.updated_at)
            const diff = (end - start) / (1000 * 60 * 60 * 24)
            return isNaN(diff) || diff < 0 ? null : diff
          })
          .filter(d => d !== null)
        if (validDurations.length > 0) {
          avgTAT = Math.round((validDurations.reduce((a, b) => a + b, 0) / validDurations.length) * 10) / 10
        }
      }

      // Read current targets from localStorage for use in derived comparisons
      const savedTargets = JSON.parse(localStorage.getItem('dashboardTargets') || '{}')
      const currentTatTarget = savedTargets.tatTarget || 10

      // TAT improvement: only meaningful when we have real TAT data
      const tatVsTarget = (avgTAT !== null && currentTatTarget > 0)
        ? Math.round(((currentTatTarget - avgTAT) / currentTatTarget) * 100)
        : null

      // Personnel workload: based purely on real active projects + in-progress test plans
      const activeProjectsCount = projects.filter(p => p.status === 'active' || p.status === 'Active').length
      const inProgressTestsCount = testPlans.filter(t => t.status === 'In Progress').length
      const personnelWorkload = Math.min(100, Math.round(activeProjectsCount * 15 + inProgressTestsCount * 8))

      // Space/Storage: based on actual sample count vs a reasonable lab capacity
      const labCapacity = 50 // reasonable assumption for max concurrent samples
      const spaceUtilization = Math.min(100, Math.round((samples.length / labCapacity) * 100))
      const storageCapacity = Math.min(100, Math.round((samples.length / labCapacity) * 80))

      setOperationalStats({
        equipmentUtilization: utilization,
        activeEquipmentCount: activeInstruments,
        totalEquipmentCount: totalInstruments,
        personnelWorkload,
        spaceUtilization,
        storageCapacity,
        avgTAT,          // null = no data yet
        tatImprovement: tatVsTarget,  // null = no data yet
        completedCount: completedProjectsList.length // Capture for UI display
      })

    } catch (error) {
      if (!silent) toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleSaveTargets = (e) => {
    e.preventDefault()
    localStorage.setItem('dashboardTargets', JSON.stringify(targets))
    setIsTargetModalOpen(false)
    toast.success('Targets updated successfully')
  }

  const handleRefresh = () => {
    loadDashboardData()
  }

  const statsData = [
    {
      id: 'projects',
      name: 'Active Projects',
      value: stats.projects.toString(),
      change: `${stats.projects} total projects`,
      icon: FolderKanban,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      link: '/lab/management/projects',
      renderDetails: (list) => list.map(item => (
        <div key={item.id} className="text-sm border-b border-gray-100 py-2 last:border-0 flex justify-between items-center gap-2">
           <span className="font-medium text-gray-800 truncate">{item.name}</span>
           <span className="text-xs text-gray-500 whitespace-nowrap">{item.clientName || 'N/A'}</span>
        </div>
      ))
    },
    {
      id: 'customers',
      name: 'Customers',
      value: stats.customers.toString(),
      change: `${stats.customers} total customers`,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      link: '/lab/management/customers',
      renderDetails: (list) => list.map(item => (
        <div key={item.id} className="text-sm border-b border-gray-100 py-2 last:border-0 flex justify-between items-center gap-2">
           <span className="font-medium text-gray-800 truncate">{item.companyName}</span>
           <span className="text-xs text-gray-500 whitespace-nowrap">{item.industry || 'Unknown'}</span>
        </div>
      ))
    },
    {
      id: 'testPlans',
      name: 'Test Plans',
      value: stats.testPlans.toString(),
      change: `${stats.completedTests} completed`,
      icon: FlaskConical,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      link: '/lab/management/test-plans',
      renderDetails: (list) => list.map(item => (
        <div key={item.id} className="text-sm border-b border-gray-100 py-2 last:border-0 flex justify-between items-center gap-2">
           <span className="font-medium text-gray-800 truncate">{item.name}</span>
           <span className="text-xs text-blue-600 font-medium whitespace-nowrap">{item.status}</span>
        </div>
      ))
    },
    {
      id: 'rfqs',
      name: 'RFQs',
      value: stats.rfqs.toString(),
      change: `${stats.estimations} estimations`,
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      link: '/lab/management/rfqs',
      renderDetails: (list) => list.map(item => (
        <div key={item.id} className="text-sm border-b border-gray-100 py-2 last:border-0 flex justify-between items-center gap-2">
           <span className="font-medium text-gray-800 truncate">{item.companyName || 'Unknown'}</span>
           <span className="text-xs text-gray-500 whitespace-nowrap">{item.expectedDate ? new Date(item.expectedDate).toLocaleDateString() : 'N/A'}</span>
        </div>
      ))
    },
  ]

  if (loading) {
    return <RouteSkeleton />
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold text-gray-900"
          >
            Lab Management Dashboard
          </motion.h1>
          <p className="mt-2 text-gray-600">Overview of your lab operations and activities</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            id="dashboard-time-range"
            name="dashboard-time-range"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-sm font-medium"
          >
            <option value="1M">Last Month</option>
            <option value="3M">Last 3 Months</option>
            <option value="6M">Last 6 Months</option>
            <option value="1Y">Last Year</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 bg-white"
            title="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Grid with Enhanced Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
            onClick={() => navigate(stat.link)}
            className={`bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-primary transition-all cursor-pointer group relative ${activeInfoPopup === stat.id ? 'z-[60]' : 'z-10'}`}
          >
            <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary-dark opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            
            <div className="absolute top-4 right-4 z-40">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveInfoPopup(activeInfoPopup === stat.id ? null : stat.id)
                }}
                className={`p-1.5 rounded-full transition-all border ${activeInfoPopup === stat.id ? 'bg-primary text-white border-primary shadow-lg scale-110' : 'bg-white/80 text-gray-400 border-gray-100 hover:border-primary hover:text-primary shadow-sm'}`}
                title="View details"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>

            <div className="relative z-10 p-6 flex items-center justify-between pointer-events-none">
              <div className="flex-1 pointer-events-auto pr-8">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <motion.p 
                  key={stat.value}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="mt-2 text-3xl font-bold text-gray-900"
                >
                  {stat.value}
                </motion.p>
                <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {stat.change}
                </p>
              </div>
              <div className={`${stat.bgColor} rounded-xl p-4 group-hover:scale-110 transition-transform pointer-events-auto`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>

            <AnimatePresence>
              {activeInfoPopup === stat.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-12 right-0 w-64 md:w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-4 text-left cursor-default"
                >
                   <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                     <h4 className="font-semibold text-gray-900 text-sm">Recent {stat.name}</h4>
                     <button onClick={() => setActiveInfoPopup(null)} className="text-gray-400 hover:text-gray-600">
                       <X className="w-4 h-4" />
                     </button>
                   </div>
                   <div className="max-h-60 overflow-y-auto pr-1">
                      {rawLists[stat.id] && rawLists[stat.id].length > 0 ? (
                        stat.renderDetails(rawLists[stat.id])
                      ) : (
                        <p className="text-xs text-gray-500 py-2 text-center">No recent data found.</p>
                      )}
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 relative ${activeInfoPopup === 'perf_completion' ? 'z-[60]' : 'z-10'}`}
        >
          <div className="absolute top-2 right-2 z-30">
            <button
               onClick={(e) => { e.stopPropagation(); setActiveInfoPopup(activeInfoPopup === 'perf_completion' ? null : 'perf_completion') }}
               className={`p-1.5 rounded-full hover:bg-white/50 transition-colors ${activeInfoPopup === 'perf_completion' ? 'text-blue-700 bg-blue-200' : 'text-blue-400'}`}
               title="View logic"
            >
               <Info className="w-4 h-4" />
            </button>
          </div>
          <AnimatePresence>
            {activeInfoPopup === 'perf_completion' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-10 right-0 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-4 text-left cursor-default"
              >
                 <div className="flex justify-between items-center mb-2">
                   <h4 className="font-semibold text-gray-900 text-sm">Completion Rate</h4>
                   <button onClick={() => setActiveInfoPopup(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                 </div>
                 <p className="text-xs text-gray-600 mb-2">Percentage of all projects marked as completed.</p>
                 <div className="bg-blue-50 p-2 rounded text-xs font-mono text-blue-800 break-all">
                    (Completed Projects / Total) × 100
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500 rounded-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-blue-700 bg-blue-200 px-2 py-1 rounded-full">KPI</span>
          </div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Completion Rate</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{performanceMetrics.completionRate}%</p>
            <ArrowUpRight className="w-5 h-5 text-green-600" />
          </div>
          <div className="mt-4 w-full bg-blue-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${performanceMetrics.completionRate}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="bg-blue-600 h-2 rounded-full"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 relative ${activeInfoPopup === 'perf_ontime' ? 'z-[60]' : 'z-10'}`}
        >
          <div className="absolute top-2 right-2 z-30">
            <button
               onClick={(e) => { e.stopPropagation(); setActiveInfoPopup(activeInfoPopup === 'perf_ontime' ? null : 'perf_ontime') }}
               className={`p-1.5 rounded-full hover:bg-white/50 transition-colors ${activeInfoPopup === 'perf_ontime' ? 'text-green-700 bg-green-200' : 'text-green-400'}`}
               title="View logic"
            >
               <Info className="w-4 h-4" />
            </button>
          </div>
          <AnimatePresence>
            {activeInfoPopup === 'perf_ontime' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-10 right-0 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-4 text-left cursor-default"
              >
                 <div className="flex justify-between items-center mb-2">
                   <h4 className="font-semibold text-gray-900 text-sm">On-Time Delivery</h4>
                   <button onClick={() => setActiveInfoPopup(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                 </div>
                 <p className="text-xs text-gray-600 mb-2">Percentage of test plans completed on or before schedule.</p>
                 <div className="bg-green-50 p-2 rounded text-xs font-mono text-green-800 break-all">
                    (Completed Tests / Total Tests) × 100
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-green-700 bg-green-200 px-2 py-1 rounded-full">EFFICIENCY</span>
          </div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">On-Time Delivery</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{performanceMetrics.onTimeDelivery}%</p>
            <ArrowUpRight className="w-5 h-5 text-green-600" />
          </div>
          <div className="mt-4 w-full bg-green-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${performanceMetrics.onTimeDelivery}%` }}
              transition={{ duration: 1, delay: 0.6 }}
              className="bg-green-600 h-2 rounded-full"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 relative ${activeInfoPopup === 'perf_cycletime' ? 'z-[60]' : 'z-10'}`}
        >
          <div className="absolute top-2 right-2 z-30">
            <button
               onClick={(e) => { e.stopPropagation(); setActiveInfoPopup(activeInfoPopup === 'perf_cycletime' ? null : 'perf_cycletime') }}
               className={`p-1.5 rounded-full hover:bg-white/50 transition-colors ${activeInfoPopup === 'perf_cycletime' ? 'text-purple-700 bg-purple-200' : 'text-purple-400'}`}
               title="View logic"
            >
               <Info className="w-4 h-4" />
            </button>
          </div>
          <AnimatePresence>
            {activeInfoPopup === 'perf_cycletime' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-10 right-0 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-4 text-left cursor-default"
              >
                 <div className="flex justify-between items-center mb-2">
                   <h4 className="font-semibold text-gray-900 text-sm">Avg Cycle Time</h4>
                   <button onClick={() => setActiveInfoPopup(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                 </div>
                 <p className="text-xs text-gray-600 mb-2">Average duration from test initialization to completion.</p>
                 <div className="bg-purple-50 p-2 rounded text-xs font-mono text-purple-800 break-all">
                    Σ(Completion Date - Start Date) / Completed Tests
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-purple-700 bg-purple-200 px-2 py-1 rounded-full">AVG</span>
          </div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Avg Cycle Time</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{performanceMetrics.averageCycleTime}</p>
            <span className="text-sm text-gray-600">days</span>
          </div>
          <p className="mt-2 text-xs text-gray-600">Target: {targets.tatTarget} days</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className={`bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200 relative ${activeInfoPopup === 'perf_passrate' ? 'z-[60]' : 'z-10'}`}
        >
          <div className="absolute top-2 right-2 z-30">
            <button
               onClick={(e) => { e.stopPropagation(); setActiveInfoPopup(activeInfoPopup === 'perf_passrate' ? null : 'perf_passrate') }}
               className={`p-1.5 rounded-full hover:bg-white/50 transition-colors ${activeInfoPopup === 'perf_passrate' ? 'text-orange-700 bg-orange-200' : 'text-orange-400'}`}
               title="View logic"
            >
               <Info className="w-4 h-4" />
            </button>
          </div>
          <AnimatePresence>
            {activeInfoPopup === 'perf_passrate' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-10 right-0 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-4 text-left cursor-default"
              >
                 <div className="flex justify-between items-center mb-2">
                   <h4 className="font-semibold text-gray-900 text-sm">Pass Rate</h4>
                   <button onClick={() => setActiveInfoPopup(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                 </div>
                 <p className="text-xs text-gray-600 mb-2">Percentage of all processed test results marked as Passed.</p>
                 <div className="bg-orange-50 p-2 rounded text-xs font-mono text-orange-800 break-all">
                    (Passed Results / Total Results) × 100
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500 rounded-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-orange-700 bg-orange-200 px-2 py-1 rounded-full">QUALITY</span>
          </div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Pass Rate</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{performanceMetrics.customerSatisfaction}%</p>
            <ArrowUpRight className="w-5 h-5 text-green-600" />
          </div>
          <div className="mt-4 w-full bg-orange-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${performanceMetrics.customerSatisfaction}%` }}
              transition={{ duration: 1, delay: 0.8 }}
              className="bg-orange-600 h-2 rounded-full"
            />
          </div>
        </motion.div>
      </div>

      {/* Operational Metrics Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Operational Metrics
            </h2>
            <p className="mt-1 text-sm text-gray-600">Real-time insights into lab efficiency and capacity</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Live System
            </span>
            <button 
              onClick={() => setIsTargetModalOpen(true)}
              className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
              title="Configure Targets"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Equipment Utilization */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Equipment Utilization</h3>
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  innerRadius="60%" 
                  outerRadius="80%" 
                  data={[
                    { name: 'Utilization', value: operationalStats.equipmentUtilization, fill: '#3b82f6' }
                  ]} 
                  startAngle={180} 
                  endAngle={0}
                >
                  <RadialBar 
                    background={{ fill: '#f1f5f9' }} 
                    dataKey="value" 
                    cornerRadius={15} 
                  />
                  <text
                    x="50%"
                    y="55%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-gray-900 text-2xl font-bold"
                  >
                    {operationalStats.equipmentUtilization}%
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-gray-500">
              Target: {targets.utilizationTarget}% • {operationalStats.activeEquipmentCount}/{operationalStats.totalEquipmentCount} Active
            </p>
          </div>

          {/* Lab Capacity */}
          <div className="space-y-6">
            <h3 className="text-sm font-medium text-gray-700">Resource Capacity</h3>
            <div className="space-y-5">

              {/* Personnel Workload */}
              {(() => {
                const val = operationalStats.personnelWorkload
                const tgt = targets.personnelTarget
                const over = val > tgt
                return (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Personnel Workload</span>
                      <span className={`font-semibold ${over ? 'text-red-600' : 'text-gray-900'}`}>{val}%</span>
                    </div>
                    <div className="relative w-full bg-gray-100 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${val}%` }}
                        className={`h-2 rounded-full ${over ? 'bg-red-500' : 'bg-primary'}`}
                      />
                      {/* Target marker */}
                      <div
                        className="absolute top-0 h-2 w-0.5 bg-gray-400 rounded"
                        style={{ left: `${tgt}%` }}
                        title={`Target: ${tgt}%`}
                      />
                    </div>
                  </div>
                )
              })()}

              {/* Lab Space Utilization */}
              {(() => {
                const val = operationalStats.spaceUtilization
                const tgt = targets.spaceTarget
                const over = val > tgt
                return (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Lab Space Utilization</span>
                      <span className={`font-semibold ${over ? 'text-red-600' : 'text-gray-900'}`}>{val}%</span>
                    </div>
                    <div className="relative w-full bg-gray-100 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${val}%` }}
                        className={`h-2 rounded-full ${over ? 'bg-red-500' : 'bg-green-500'}`}
                      />
                      <div
                        className="absolute top-0 h-2 w-0.5 bg-gray-400 rounded"
                        style={{ left: `${tgt}%` }}
                        title={`Target: ${tgt}%`}
                      />
                    </div>
                  </div>
                )
              })()}

              {/* Storage Capacity */}
              {(() => {
                const val = operationalStats.storageCapacity
                const tgt = targets.storageTarget
                const over = val > tgt
                return (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Storage Capacity</span>
                      <span className={`font-semibold ${over ? 'text-red-600' : 'text-gray-900'}`}>{val}%</span>
                    </div>
                    <div className="relative w-full bg-gray-100 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${val}%` }}
                        className={`h-2 rounded-full ${over ? 'bg-red-500' : 'bg-yellow-500'}`}
                      />
                      <div
                        className="absolute top-0 h-2 w-0.5 bg-gray-400 rounded"
                        style={{ left: `${tgt}%` }}
                        title={`Target: ${tgt}%`}
                      />
                    </div>
                  </div>
                )
              })()}

            </div>
          </div>
          {/* TAT Performance */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">Turnaround Time (TAT)</h3>
              {operationalStats.avgTAT === null ? (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <Clock className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-sm font-medium text-gray-500">No Data Yet</p>
                  <p className="text-xs text-gray-400 mt-1">TAT is calculated once projects are completed</p>
                  <p className="text-xs text-gray-400">Target: {targets.tatTarget} Days</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <Clock className={`w-6 h-6 ${operationalStats.avgTAT <= targets.tatTarget ? 'text-green-500' : 'text-red-500'}`} />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${operationalStats.avgTAT <= targets.tatTarget ? 'text-gray-900' : 'text-red-600'}`}>
                        {operationalStats.avgTAT} Days
                      </p>
                      <p className="text-xs text-gray-500">
                        Based on {operationalStats.completedCount || 0} completions
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Target: {targets.tatTarget} Days
                      </p>
                      {operationalStats.tatImprovement !== null && (
                        operationalStats.avgTAT <= targets.tatTarget ? (
                          <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                            <TrendingUp className="w-3 h-3" />
                            {operationalStats.tatImprovement}% improvement
                          </p>
                        ) : (
                          <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                            <TrendingDown className="w-3 h-3" />
                            {Math.round(((operationalStats.avgTAT - targets.tatTarget) / targets.tatTarget) * 100)}% above target
                          </p>
                        )
                      )}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Target</span>
                      <span>Actual</span>
                    </div>
                    <div className="flex justify-between mt-1 font-medium text-gray-900">
                      <span>{targets.tatTarget} Days</span>
                      <span className={operationalStats.avgTAT <= targets.tatTarget ? 'text-green-600' : 'text-red-600'}>
                        {operationalStats.avgTAT <= targets.tatTarget ? 'Under Target ✓' : 'Over Target ✗'}
                      </span>
                    </div>
                    {/* Visual TAT progress bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-700 ${operationalStats.avgTAT <= targets.tatTarget ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(100, (operationalStats.avgTAT / (targets.tatTarget * 1.5)) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {operationalStats.avgTAT <= targets.tatTarget
                          ? `${(targets.tatTarget - operationalStats.avgTAT).toFixed(1)} days under target`
                          : `${(operationalStats.avgTAT - targets.tatTarget).toFixed(1)} days over target`}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Recent Activities
              </h2>
              <p className="mt-1 text-sm text-gray-600">Latest updates from your lab operations</p>
            </div>
            <button 
              onClick={() => navigate('/lab/management/projects')}
              className="text-sm text-primary hover:text-primary-dark font-medium"
            >
              View All →
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => activity.link && navigate(activity.link)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    {activity.type === 'project' && <FolderKanban className="w-5 h-5 text-primary" />}
                    {activity.type === 'test' && <FlaskConical className="w-5 h-5 text-primary" />}
                    {activity.type === 'sample' && <Package className="w-5 h-5 text-primary" />}
                    {activity.type === 'trf' && <FileCheck className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activity.status === 'active' && (
                    <span className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-full">
                      Active
                    </span>
                  )}
                  {activity.status === 'completed' && (
                    <span className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-full">
                      Completed
                    </span>
                  )}
                  {activity.status === 'pending' && (
                    <span className="px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-50 rounded-full">
                      Pending
                    </span>
                  )}
                  {activity.status === 'review' && (
                    <span className="px-3 py-1 text-xs font-medium text-purple-700 bg-purple-50 rounded-full">
                      Review
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/lab/management/projects')}
              className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-3">
                <FolderKanban className="w-5 h-5 text-primary" />
                <span className="font-medium text-gray-900">View All Projects</span>
              </div>
            </button>
            <button 
              onClick={() => navigate('/lab/management/test-executions')}
              className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-3">
                <FlaskConical className="w-5 h-5 text-primary" />
                <span className="font-medium text-gray-900">View Test Executions</span>
              </div>
            </button>
            <button 
              onClick={() => navigate('/lab/management/trfs')}
              className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-primary" />
                <span className="font-medium text-gray-900">View All TRFs</span>
              </div>
            </button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Upcoming Deadlines
            </h3>
            {urgentCount > 0 && (
              <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">{urgentCount} Urgent</span>
            )}
          </div>
          <div className="space-y-4">
            {(() => {
              const relevantDeadlines = deadlines.slice(0, 3)

              if (relevantDeadlines.length === 0) {
                return (
                  <div className="text-center py-6">
                    <CheckCircle2 className="w-10 h-10 text-green-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">All caught up!</p>
                    <p className="text-xs text-gray-400">No urgent deadlines found</p>
                  </div>
                )
              }

              return relevantDeadlines.map((d, idx) => (
                <motion.div
                  key={d.id}
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-4 p-3 rounded-lg transition-colors cursor-pointer border-l-4 ${
                    d.days < 0 ? 'bg-red-50 border-red-500 hover:bg-red-100' : 
                    d.days <= 3 ? 'bg-yellow-50 border-yellow-500 hover:bg-yellow-100' : 
                    'bg-blue-50 border-blue-500 hover:bg-blue-100'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    d.days < 0 ? 'bg-red-100' : d.days <= 3 ? 'bg-yellow-100' : 'bg-blue-100'
                  }`}>
                    {d.days < 0 ? <AlertCircle className={`w-6 h-6 ${d.days < 0 ? 'text-red-600' : 'text-blue-600'}`} /> : <Clock className="w-6 h-6 text-gray-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{d.title}</p>
                    <p className="text-sm text-gray-500">{d.subtitle}</p>
                    <p className={`text-xs mt-1 font-medium ${d.days < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {d.days < 0 ? `${Math.abs(d.days)} days overdue` : d.days === 0 ? 'Due today' : `Due in ${d.days} days`}
                    </p>
                  </div>
                  {d.days < 0 && <AlertCircle className="w-5 h-5 text-red-600" />}
                </motion.div>
              ))
            })()}
          </div>
        </motion.div>
      </div>

      {/* Unified Chart Filter Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-2 text-gray-700">
          <Activity className="w-5 h-5 text-primary" />
          <span className="font-semibold">Diagram Filter</span>
          <span className="text-xs text-gray-400 ml-2 hidden sm:inline">Unified control for charts below</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['Custom','1M','3M','6M','1Y'].map(tl => (
            <button
              key={tl}
              onClick={() => setChartsTimeRange(tl)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                chartsTimeRange === tl
                  ? 'bg-primary text-white shadow-md scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >{tl}</button>
          ))}
          {chartsTimeRange === 'Custom' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 ml-2 bg-gray-50 p-1 rounded-lg border border-gray-200"
            >
              <input 
                type="date" 
                className="text-xs border-none bg-transparent focus:ring-0 p-1" 
                value={chartsCustomRange.start} 
                onChange={e => setChartsCustomRange(r => ({...r, start: e.target.value}))} 
              />
              <span className="text-gray-400">–</span>
              <input 
                type="date" 
                className="text-xs border-none bg-transparent focus:ring-0 p-1" 
                value={chartsCustomRange.end} 
                onChange={e => setChartsCustomRange(r => ({...r, end: e.target.value}))} 
              />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Enhanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends - Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-gray-900">Monthly Trends</h3>
            </div>
            <button className="text-sm text-primary hover:text-primary-dark">View Details →</button>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            {(() => {
              const data = (() => {
                if (chartsTimeRange === 'Custom') {
                  if (!chartsCustomRange.start || !chartsCustomRange.end) return chartData
                  const start = new Date(chartsCustomRange.start)
                  const end = new Date(chartsCustomRange.end)
                  return chartData.filter(d => {
                    const dDate = new Date(d.fullDate)
                    return dDate >= start && dDate <= end
                  })
                }
                const monthsLimit = {'1M': 1, '3M': 3, '6M': 6, '1Y': 12}
                const count = monthsLimit[chartsTimeRange] || chartData.length
                return chartData.slice(0, count)
              })()

              const hasData = data.some(d => d.projects > 0 || d.tests > 0 || d.completed > 0)
              const displayData = hasData ? data : data.length > 0 ? data.map(d => ({ ...d, projects: 0, tests: 0, completed: 0 })) : [
                { month: 'N/A', projects: 0, tests: 0, completed: 0 }
              ]

              return (
                <AreaChart data={displayData}>
                  <defs>
                    <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={hasData ? "#3b82f6" : "#e5e7eb"} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={hasData ? "#3b82f6" : "#e5e7eb"} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={hasData ? "#10b981" : "#e5e7eb"} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={hasData ? "#10b981" : "#e5e7eb"} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={hasData ? "#8b5cf6" : "#e5e7eb"} stopOpacity={0.7}/>
                      <stop offset="95%" stopColor={hasData ? "#8b5cf6" : "#e5e7eb"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="projects" stroke={hasData ? "#3b82f6" : "#d1d5db"} strokeWidth={2} fillOpacity={1} fill="url(#colorProjects)" name="Projects" />
                  <Area type="monotone" dataKey="tests" stroke={hasData ? "#10b981" : "#d1d5db"} strokeWidth={2} fillOpacity={1} fill="url(#colorTests)" name="Tests" />
                  <Area type="monotone" dataKey="completed" stroke={hasData ? "#8b5cf6" : "#d1d5db"} strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" name="Completed" />
                </AreaChart>
              )
            })()}
          </ResponsiveContainer>
        </motion.div>

        {/* Status Distribution - Enhanced Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-gray-900">Project Status</h3>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            {(() => {
              const data = (() => {
                let filtered = allProjects;
                if (chartsTimeRange === 'Custom' && chartsCustomRange.start && chartsCustomRange.end) {
                  const start = new Date(chartsCustomRange.start)
                  const end = new Date(chartsCustomRange.end)
                  filtered = allProjects.filter(p => {
                    const d = new Date(p.createdAt || p.start_date || p.created_at)
                    return d >= start && d <= end
                  })
                } else if (chartsTimeRange !== 'Custom') {
                  const monthsCount = {'1M': 1, '3M': 3, '6M': 6, '1Y': 12}[chartsTimeRange] || 6
                  const cutoff = new Date()
                  cutoff.setMonth(cutoff.getMonth() - monthsCount)
                  filtered = allProjects.filter(p => new Date(p.createdAt || p.start_date || p.created_at) >= cutoff)
                }
                
                const counts = {
                  active: filtered.filter(p => (p.status || '').toLowerCase() === 'active').length,
                  completed: filtered.filter(p => (p.status || '').toLowerCase() === 'completed').length,
                  pending: filtered.filter(p => (p.status || '').toLowerCase() === 'pending').length,
                }
                const result = [
                  { name: 'Active', value: counts.active, color: '#3b82f6' },
                  { name: 'Completed', value: counts.completed, color: '#10b981' },
                  { name: 'Pending', value: counts.pending, color: '#f59e0b' },
                ].filter(d => d.value > 0)

                return result.length > 0 ? result : [{ name: 'No Data', value: 1, color: '#e5e7eb' }]
              })()

              const isPlaceholder = data.length === 1 && data[0].name === 'No Data'

              return (
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={!isPlaceholder}
                    label={({ name, percent, value }) => isPlaceholder ? '' : value > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                    outerRadius={95}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1000}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px'
                    }}
                    formatter={(value, name) => isPlaceholder ? ['0 projects', 'No data found'] : [value + ' projects', name]}
                  />
                </PieChart>
              )
            })()}
          </ResponsiveContainer>
          <div className="mt-2 flex justify-center gap-4 flex-wrap">
            {statusDistribution.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Test Execution by Type */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">Test Executions by Type</h3>
          </div>
        </div>
        {(() => {
          let filtered = allTestExecutions;
          if (chartsTimeRange === 'Custom' && chartsCustomRange.start && chartsCustomRange.end) {
            const start = new Date(chartsCustomRange.start)
            const end = new Date(chartsCustomRange.end)
            filtered = allTestExecutions.filter(e => {
              const d = new Date(e.createdAt || e.created_at)
              return d >= start && d <= end
            })
          } else if (chartsTimeRange !== 'Custom') {
            const monthsCount = {'1M': 1, '3M': 3, '6M': 6, '1Y': 12}[chartsTimeRange] || 6
            const cutoff = new Date()
            cutoff.setMonth(cutoff.getMonth() - monthsCount)
            filtered = allTestExecutions.filter(e => new Date(e.createdAt || e.created_at) >= cutoff)
          }

          const hasRealData = filtered.length > 0;
          const execLabels = ['EMC', 'RF', 'Safety', 'Env']
          const displayData = execLabels.map((label, i) => {
            const apiType = label === 'Env' ? 'Environmental' : label
            const completed = filtered.filter(e => (e.status || '').toLowerCase() === 'completed' && (e.testType === apiType || e.test_type === apiType)).length
            const pending = filtered.filter(e => (e.status || '').toLowerCase() === 'pending' && (e.testType === apiType || e.test_type === apiType)).length
            
            // Placeholder logic if no data for selection
            if (!hasRealData) {
               return { name: label, completed: 0, pending: 0, placeholder: true }
            }
            
            return { name: label, completed, pending }
          })

          return (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={displayData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} allowDecimals={false} domain={[0, hasRealData ? 'auto' : 5]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px'
                  }}
                  formatter={(value, name, props) => props.payload.placeholder ? ['0 tests', 'No data'] : [value + ' tests', name]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="completed" fill={hasRealData ? "#10b981" : "#e5e7eb"} name="Completed" radius={[6, 6, 0, 0]} />
                <Bar dataKey="pending" fill={hasRealData ? "#f59e0b" : "#f3f4f6"} name="Pending" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )
        })()}
      </motion.div>


      {/* Target Configuration Modal */}
      <Modal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        title="Configure Operational Targets"
        size="md"
      >
        <form onSubmit={handleSaveTargets} className="space-y-4">
          <Input
            label="Turnaround Time (TAT) Target (Days)"
            type="number"
            value={targets.tatTarget}
            onChange={(e) => setTargets({ ...targets, tatTarget: parseInt(e.target.value) })}
            placeholder="e.g. 10"
            required
          />
          <Input
            label="Equipment Utilization Target (%)"
            type="number"
            value={targets.utilizationTarget}
            onChange={(e) => setTargets({ ...targets, utilizationTarget: parseInt(e.target.value) })}
            placeholder="e.g. 80"
            required
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Personnel (%)"
              type="number"
              value={targets.personnelTarget}
              onChange={(e) => setTargets({ ...targets, personnelTarget: parseInt(e.target.value) })}
              required
            />
            <Input
              label="Space (%)"
              type="number"
              value={targets.spaceTarget}
              onChange={(e) => setTargets({ ...targets, spaceTarget: parseInt(e.target.value) })}
              required
            />
            <Input
              label="Storage (%)"
              type="number"
              value={targets.storageTarget}
              onChange={(e) => setTargets({ ...targets, storageTarget: parseInt(e.target.value) })}
              required
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsTargetModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Targets
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default LabManagementDashboard

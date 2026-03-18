import { useEffect, useState } from 'react'
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
  Settings
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
  instrumentsService
} from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import { useLabManagementAuth } from '../../../contexts/LabManagementAuthContext'
import RouteSkeleton from '../../../components/RouteSkeleton'
import Modal from '../../../components/labManagement/Modal'
import Button from '../../../components/labManagement/Button'
import Input from '../../../components/labManagement/Input'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, RadialBarChart, RadialBar } from 'recharts'

function LabManagementDashboard() {
  const { user } = useLabManagementAuth()
  const canCreate = user?.role !== 'Quality Manager'
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
  const [operationalStats, setOperationalStats] = useState({
    equipmentUtilization: 0,
    activeEquipmentCount: 0,
    totalEquipmentCount: 0,
    personnelWorkload: 0,
    spaceUtilization: 0,
    storageCapacity: 0,
    avgTAT: 0,
    tatImprovement: 0
  })
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false)
  const [targets, setTargets] = useState({
    tatTarget: 10,
    utilizationTarget: 80,
    personnelTarget: 90,
    spaceTarget: 70,
    storageTarget: 50
  })

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
        allInstruments
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
        instrumentsService.getAll().catch(() => [])
      ])

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

      // Create role-aware recent activities
      const activities = []
      const role = user?.role
      const isAdmin = role === 'Admin' || role === 'Project Manager'

      // RFQ Activities (Sales, Finance, Technical, PM, Admin)
      if (rfqs.length > 0 && (isAdmin || ['Sales Manager', 'Finance Manager', 'Technical Manager'].includes(role))) {
        const recentRfq = rfqs[0]
        activities.push({
          id: 'rfq-1',
          type: 'trf', // reuse trf icon for RFQ
          title: `RFQ: ${recentRfq.product || 'New Request'}`,
          time: 'Recently updated',
          status: recentRfq.status === 'approved' ? 'completed' : 'pending',
          link: '/lab/management/rfqs'
        })
      }

      // Project Activities (Available to most roles)
      if (projects.length > 0) {
        const recentProject = projects[0]
        const canSeeProject = isAdmin || 
          (role === 'Team Lead' && recentProject.teamLeadId === user?.id) ||
          ['Technical Manager', 'Quality Manager', 'Finance Manager', 'Technician'].includes(role)

        if (canSeeProject) {
          activities.push({
            id: 'proj-1',
            type: 'project',
            title: `Project: ${recentProject.name}`,
            time: 'Check status',
            status: recentProject.status === 'completed' ? 'completed' : 'active',
            link: `/lab/management/projects/${recentProject.id}`
          })
        }
      }

      // Test Plan / Technical Activities (TM, TL, Tech, PM, Admin)
      if (testPlans.length > 0 && (isAdmin || ['Technical Manager', 'Team Lead', 'Technician'].includes(role))) {
        const recentPlan = testPlans[0]
        activities.push({
          id: 'test-1',
          type: 'test',
          title: `Test: ${recentPlan.name}`,
          time: 'Execution update',
          status: recentPlan.status === 'Completed' ? 'completed' : 'pending',
          link: `/lab/management/test-plans/${recentPlan.id}`
        })
      }

      // Sample / Logistics Activities (TM, TL, Tech, PM, Admin)
      if (samples.length > 0 && (isAdmin || ['Technical Manager', 'Team Lead', 'Technician'].includes(role))) {
        const recentSample = samples[0]
        activities.push({
          id: 'sample-1',
          type: 'sample',
          title: `Sample: ${recentSample.sampleNumber || 'Sample-' + recentSample.id}`,
          time: 'Lab inventory',
          status: 'active',
          link: `/lab/management/samples/${recentSample.id}`
        })
      }

      // Finance specific activity
      if (estimations.length > 0 && (isAdmin || role === 'Finance Manager' || role === 'Sales Manager')) {
        const recentEst = estimations[0]
        activities.push({
          id: 'est-1',
          type: 'trf',
          title: `Estimation: ₹${recentEst.totalCost?.toLocaleString() || '0'}`,
          time: 'Financial update',
          status: 'completed',
          link: '/lab/management/estimations'
        })
      }

      setRecentActivities(activities.slice(0, 5))

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

      // Prepare monthly data based on actual data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthlyData = months.slice(0, 6).map((month, index) => {
        // Distribute projects and tests across months
        const monthProjects = Math.floor(projects.length / 6) + (index < projects.length % 6 ? 1 : 0)
        const monthTests = Math.floor(testPlans.length / 6) + (index < testPlans.length % 6 ? 1 : 0)
        return {
          month,
          projects: monthProjects,
          tests: monthTests,
          completed: Math.floor(monthProjects * 0.7)
        }
      })
      setChartData(monthlyData)

      // Test execution data for bar chart
      const executionData = [
        { name: 'EMC', completed: testExecutions.filter(e => e.status === 'Completed' && e.testType === 'EMC').length, pending: testExecutions.filter(e => e.status === 'Pending' && e.testType === 'EMC').length },
        { name: 'RF', completed: testExecutions.filter(e => e.status === 'Completed' && e.testType === 'RF').length, pending: testExecutions.filter(e => e.status === 'Pending' && e.testType === 'RF').length },
        { name: 'Safety', completed: testExecutions.filter(e => e.status === 'Completed' && e.testType === 'Safety').length, pending: testExecutions.filter(e => e.status === 'Pending' && e.testType === 'Safety').length },
        { name: 'Env', completed: testExecutions.filter(e => e.status === 'Completed' && e.testType === 'Environmental').length, pending: testExecutions.filter(e => e.status === 'Pending' && e.testType === 'Environmental').length },
      ]
      setTestExecutionData(executionData)

      // Revenue/Estimation data
      const revenueData = estimations.map((est, index) => ({
        month: months[index % 12],
        revenue: est.totalCost || 0,
        estimations: 1
      })).slice(0, 6)
      setRevenueData(revenueData)

      // Calculate Operational Stats
      const activeInstruments = inventorySummary.activeInstruments || allInstruments.filter(i => i.status === 'active').length || 0
      const totalInstruments = inventorySummary.totalInstruments || allInstruments.length || 1
      const utilization = Math.round((activeInstruments / totalInstruments) * 100)

      // Calculate TAT: average days between project creation and completion for completed projects
      const completedProjects = projects.filter(p => p.status === 'completed')
      let avgTAT = 8.4 // fallback
      if (completedProjects.length > 0) {
        const totalDays = completedProjects.reduce((acc, p) => {
          const start = new Date(p.createdAt || p.start_date)
          const end = new Date(p.updatedAt || p.end_date)
          return acc + (end - start) / (1000 * 60 * 60 * 24)
        }, 0)
        avgTAT = Math.round((totalDays / completedProjects.length) * 10) / 10
      }

      // Read current targets from localStorage for use in derived comparisons
      const savedTargets = JSON.parse(localStorage.getItem('dashboardTargets') || '{}')
      const currentTatTarget = savedTargets.tatTarget || 10

      // TAT improvement: % difference between actual and target (positive = better than target)
      const resolvedTAT = avgTAT || 8.4
      const tatVsTarget = currentTatTarget > 0
        ? Math.round(((currentTatTarget - resolvedTAT) / currentTatTarget) * 100)
        : 0

      setOperationalStats({
        equipmentUtilization: utilization,
        activeEquipmentCount: activeInstruments,
        totalEquipmentCount: totalInstruments,
        personnelWorkload: Math.min(95, Math.round((projects.filter(p => p.status === 'active').length * 20) + (testPlans.filter(t => t.status === 'In Progress').length * 10))) || 85,
        spaceUtilization: Math.min(80, 50 + (samples.length * 2)) || 62,
        storageCapacity: Math.min(90, 30 + (samples.length * 5)) || 45,
        avgTAT: resolvedTAT,
        tatImprovement: tatVsTarget,
        // Added for role-based counts
        feasibilityPending: rfqs.filter(r => r.status === 'pending').length,
        quotationReview: rfqs.filter(r => r.status === 'quotation_review').length,
        paymentPending: projects.filter(p => p.status === 'approved' && !p.paymentCompleted).length,
        pendingApprovals: projects.filter(p => p.status === 'tl_reviewed' || p.status === 'report_submitted').length,
        myAssignedProjects: projects.filter(p => p.teamLeadId === user?.id).length
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

  const getFilteredStats = () => {
    const role = user?.role
    const isAdmin = role === 'Admin'

    const allStats = [
      {
        id: 'projects',
        name: 'Active Projects',
        value: stats.projects.toString(),
        change: role === 'Team Lead' ? 'Assigned to you' : 'Total active tasks',
        icon: FolderKanban,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        link: '/lab/management/projects',
        roles: ['Admin', 'Project Manager', 'Technical Manager', 'Team Lead', 'Technician', 'Quality Manager']
      },
      {
        id: 'feasibility',
        name: 'Feasibility Pending',
        value: operationalStats.feasibilityPending?.toString() || '0',
        change: 'Requires technical check',
        icon: AlertCircle,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        link: '/lab/management/rfqs',
        roles: ['Technical Manager']
      },
      {
        id: 'quotations',
        name: 'Quotation Review',
        value: operationalStats.quotationReview?.toString() || '0',
        change: 'Finance team action',
        icon: FileText,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        link: '/lab/management/rfqs',
        roles: ['Finance Manager', 'Project Manager']
      },
      {
        id: 'payments',
        name: 'Payment Pending',
        value: operationalStats.paymentPending?.toString() || '0',
        change: 'Awaiting verification',
        icon: DollarSign,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        link: '/lab/management/projects',
        roles: ['Finance Manager']
      },
      {
        id: 'approvals',
        name: 'Pending Approvals',
        value: operationalStats.pendingApprovals?.toString() || '0',
        change: 'Workflow bottleneck',
        icon: CheckCircle2,
        color: 'text-rose-600',
        bgColor: 'bg-rose-50',
        link: '/lab/management/projects',
        roles: ['Quality Manager', 'Project Manager', 'Technical Manager']
      },
      {
        id: 'customers',
        name: 'Active Customers',
        value: stats.customers.toString(),
        change: 'Client base size',
        icon: Users,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        link: '/lab/management/customers',
        roles: ['Admin', 'Sales Manager']
      },
      {
        id: 'rfqs_sales',
        name: 'Total RFQs',
        value: stats.rfqs.toString(),
        change: 'In-pipeline requests',
        icon: FileCheck,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        link: '/lab/management/rfqs',
        roles: ['Sales Manager']
      },
      {
        id: 'revenue',
        name: 'Est. Revenue',
        value: `₹${revenueData.reduce((acc, curr) => acc + curr.revenue, 0).toLocaleString()}`,
        change: 'Confirmed quotations',
        icon: DollarSign,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        link: '/lab/management/estimations',
        roles: ['Admin', 'Sales Manager']
      },
      {
        id: 'samples',
        name: 'Samples',
        value: stats.samples.toString(),
        change: 'Items in lab',
        icon: Package,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        link: '/lab/management/samples',
        roles: ['Technician', 'Team Lead']
      }
    ]

    const filtered = allStats.filter(s => isAdmin || s.roles.includes(role))
    return filtered.length > 0 ? filtered.slice(0, 4) : allStats.slice(0, 4)
  }

  const statsData = getFilteredStats()

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
            className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="1M">Last Month</option>
            <option value="3M">Last 3 Months</option>
            <option value="6M">Last 6 Months</option>
            <option value="1Y">Last Year</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
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
            className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-primary transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1">
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
              <div className={`${stat.bgColor} rounded-xl p-4 group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary-dark opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </motion.div>
        ))}
      </div>

      {/* Performance Metrics */}
      {(user?.role === 'Admin' || user?.role === 'Project Manager' || user?.role === 'Technical Manager' || user?.role === 'Quality Manager') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200"
          >
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
            className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200"
          >
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
            className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200"
          >
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
            className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200"
          >
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
      )}

      {/* Operational Metrics Section */}
      {(user?.role === 'Admin' || user?.role === 'Technical Manager' || user?.role === 'Team Lead' || user?.role === 'Technician') && (
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
              {canCreate && (
                <button 
                  onClick={() => setIsTargetModalOpen(true)}
                  className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                  title="Configure Targets"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
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
                    outerRadius="100%" 
                    data={[
                      { name: 'In Use', value: operationalStats.equipmentUtilization, fill: '#3b82f6' },
                      { name: 'Idle', value: 100 - operationalStats.equipmentUtilization, fill: '#e5e7eb' }
                    ]} 
                    startAngle={180} 
                    endAngle={0}
                  >
                    <RadialBar background dataKey="value" cornerRadius={10} />
                    <text
                      x="50%"
                      y="50%"
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
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <Clock className={`w-6 h-6 ${operationalStats.avgTAT <= targets.tatTarget ? 'text-green-500' : 'text-red-500'}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${operationalStats.avgTAT <= targets.tatTarget ? 'text-gray-900' : 'text-red-600'}`}>
                      {operationalStats.avgTAT} Days
                    </p>
                    <p className="text-xs text-gray-500">
                      Target: {targets.tatTarget} Days
                    </p>
                    {operationalStats.avgTAT <= targets.tatTarget ? (
                      <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <TrendingUp className="w-3 h-3" />
                        {operationalStats.tatImprovement}% improvement
                      </p>
                    ) : (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <TrendingDown className="w-3 h-3" />
                        {Math.round(((operationalStats.avgTAT - targets.tatTarget) / targets.tatTarget) * 100)}% above target
                      </p>
                    )}
                  </div>
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
            </div>
          </div>
        </div>
      )}

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
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">2 Urgent</span>
          </div>
          <div className="space-y-4">
            <motion.div
              whileHover={{ x: 4 }}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-red-50 transition-colors cursor-pointer border-l-4 border-red-500"
            >
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Test Report Due</p>
                <p className="text-sm text-gray-500">Project: EMC-2024-001</p>
                <p className="text-xs text-red-600 mt-1 font-medium">Due in 2 days</p>
              </div>
              <AlertCircle className="w-5 h-5 text-red-600" />
            </motion.div>
            <motion.div
              whileHover={{ x: 4 }}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-yellow-50 transition-colors cursor-pointer border-l-4 border-yellow-500"
            >
              <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Sample Review</p>
                <p className="text-sm text-gray-500">Sample: SAMPLE-2024-045</p>
                <p className="text-xs text-yellow-600 mt-1 font-medium">Due in 5 days</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends - Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-gray-900">Monthly Trends</h3>
            </div>
            <button className="text-sm text-primary hover:text-primary-dark">View Details →</button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="projects" stroke="#3b82f6" fillOpacity={1} fill="url(#colorProjects)" name="Projects" />
              <Area type="monotone" dataKey="tests" stroke="#10b981" fillOpacity={1} fill="url(#colorTests)" name="Tests" />
              <Area type="monotone" dataKey="completed" stroke="#8b5cf6" fillOpacity={0.6} fill="#8b5cf6" name="Completed" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Status Distribution - Enhanced Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-gray-900">Project Status</h3>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 flex justify-center gap-4">
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">Test Executions by Type</h3>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={testExecutionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[8, 8, 0, 0]} />
            <Bar dataKey="pending" fill="#f59e0b" name="Pending" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
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

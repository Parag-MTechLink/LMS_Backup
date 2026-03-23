import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, AlertCircle, CheckCircle, TrendingUp, TrendingDown, Package, Calendar, Wrench, ArrowLeft, History, Plus, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { instrumentsService, consumablesService, calibrationsService, inventoryTransactionsService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Card from '../../../components/labManagement/Card'
import Badge from '../../../components/labManagement/Badge'
import Button from '../../../components/labManagement/Button'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

function InventoryReports() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [calibrationCompliance, setCalibrationCompliance] = useState(null)
  const [usageTrends, setUsageTrends] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [timeRange, setTimeRange] = useState('7d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReports()
  }, [timeRange])

  const loadReports = async () => {
    try {
      setLoading(true)

      // Fetch all data in parallel
      const [instruments, calibrations, consumables, transactions] = await Promise.all([
        instrumentsService.getAll(),
        calibrationsService.getAll(),
        consumablesService.getAll(),
        inventoryTransactionsService.getAll()
      ])

      // Calculate summary statistics
      const activeInstruments = instruments.filter(i => i.status === 'Active').length
      const instrumentsUnderMaintenance = instruments.filter(i => i.status === 'Under Maintenance').length
      const lowStockItems = consumables.filter(c => c.status === 'Low Stock' || c.status === 'Out of Stock').length
      const expiringItems = consumables.filter(c => c.status === 'Expiring Soon' || c.status === 'Expired').length
      const upcomingCalibrations = calibrations.filter(c => c.status === 'Due Soon').length
      const overdueCalibrations = calibrations.filter(c => c.status === 'Overdue').length
      const instrumentUtilization = instruments.length > 0 ? (activeInstruments / instruments.length) * 100 : 0

      // Calculate usage trends (based on timeRange)
      const rangeDays = timeRange === '7d' ? 7 : 30
      const trendDates = [...Array(rangeDays)].map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - i)
        return d.toISOString().split('T')[0]
      }).reverse()

      const trends = trendDates.map(date => {
        const dayTxns = transactions.filter(t => t.date.startsWith(date))
        return {
          date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          usage: dayTxns.filter(t => t.transactionType === 'Usage').reduce((sum, t) => sum + t.quantity, 0),
          addition: dayTxns.filter(t => t.transactionType === 'Addition').reduce((sum, t) => sum + t.quantity, 0),
        }
      })
      setUsageTrends(trends)

      // Get most used items
      const usageByItem = transactions
        .filter(t => t.transactionType === 'Usage')
        .reduce((acc, t) => {
          acc[t.itemName] = (acc[t.itemName] || 0) + t.quantity
          return acc
        }, {})
      const topItems = Object.entries(usageByItem)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, qty]) => ({ name, qty }))

      setSummary({
        totalInstruments: instruments.length,
        activeInstruments,
        instrumentsUnderMaintenance,
        totalConsumables: consumables.length,
        lowStockItems,
        expiringItems,
        upcomingCalibrations,
        overdueCalibrations,
        instrumentUtilization,
        topItems
      })

      setRecentTransactions(transactions.slice(0, 5))

      // Calculate calibration compliance
      const calibrated = calibrations.filter(c => c.status === 'Valid').length
      const dueSoon = calibrations.filter(c => c.status === 'Due Soon').length
      const overdue = calibrations.filter(c => c.status === 'Overdue').length
      const complianceRate = calibrations.length > 0 ? (calibrated / calibrations.length) * 100 : 0

      setCalibrationCompliance({
        calibrated,
        dueSoon,
        overdue,
        complianceRate
      })
    } catch (error) {
      console.error('Error loading reports:', error)
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

  const statusData = summary ? [
    { name: 'Active', value: summary.activeInstruments, color: '#10b981' },
    { name: 'Maintenance', value: summary.instrumentsUnderMaintenance, color: '#f59e0b' },
    { name: 'Out of Service', value: summary.totalInstruments - summary.activeInstruments - summary.instrumentsUnderMaintenance, color: '#ef4444' }
  ] : []

  const calibrationComplianceData = calibrationCompliance ? [
    { name: 'Calibrated', value: calibrationCompliance.calibrated, color: '#10b981' },
    { name: 'Due Soon', value: calibrationCompliance.dueSoon, color: '#f59e0b' },
    { name: 'Overdue', value: calibrationCompliance.overdue, color: '#ef4444' }
  ] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/lab/management/inventory')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to Inventory Dashboard"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              Inventory Reports & Dashboard
            </h1>
            <p className="text-gray-600 mt-1">View inventory summaries, compliance reports, and analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/lab/management/inventory/transactions')}
          >
            <Plus className="w-4 h-4 mr-2" /> New Transaction
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/lab/management/inventory/instruments')}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Instrument
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => navigate('/lab/management/inventory')}
          >
            <ExternalLink className="w-4 h-4 mr-2" /> Inventory List
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Instruments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary?.totalInstruments || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-gray-500">Total: {summary?.totalInstruments || 0}</span>
            <span className="text-sm text-green-600 font-medium">Active: {summary?.activeInstruments || 0}</span>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Consumables</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary?.totalConsumables || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-gray-500">Total: {summary?.totalConsumables || 0}</span>
            <span className="text-sm text-red-600 font-medium">Low Stock: {summary?.lowStockItems || 0}</span>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{summary?.lowStockItems || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-gray-500">Compliance: {calibrationCompliance?.complianceRate?.toFixed(1) || 0}%</span>
            <span className="text-sm text-purple-600 font-medium">Utilization: {summary?.instrumentUtilization?.toFixed(1) || 0}%</span>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-800 font-medium">Compliance Rate</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{calibrationCompliance?.complianceRate?.toFixed(1) || 0}%</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-2 bg-green-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full" 
                style={{ width: `${calibrationCompliance?.complianceRate || 0}%` }}
              ></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Inventory & Calibration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-500" />
              Inventory Health
            </h3>
            <Badge variant={summary?.lowStockItems === 0 ? 'success' : 'warning'}>
              {summary?.lowStockItems === 0 ? 'Optimal' : 'Needs Restock'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-gray-50 rounded-xl space-y-1">
              <p className="text-gray-500 font-medium">Availability</p>
              <p className="text-xl font-bold text-gray-900">{summary?.instrumentUtilization?.toFixed(1) || 0}%</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl space-y-1">
              <p className="text-gray-500 font-medium">Low Stock Items</p>
              <p className="text-xl font-bold text-orange-600">{summary?.lowStockItems || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl space-y-1">
              <p className="text-gray-500 font-medium">Instruments Active</p>
              <p className="text-xl font-bold text-green-600">{summary?.activeInstruments || 0}/{summary?.totalInstruments || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl space-y-1">
              <p className="text-gray-500 font-medium">Consumables Expiring</p>
              <p className="text-xl font-bold text-yellow-600">{summary?.expiringItems || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Calibration Health
            </h3>
            <Badge variant={calibrationCompliance?.complianceRate >= 90 ? 'success' : 'warning'}>
              {calibrationCompliance?.complianceRate >= 90 ? 'High Compliance' : 'Attention Needed'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-gray-50 rounded-xl space-y-1">
              <p className="text-gray-500 font-medium">Overdue</p>
              <p className="text-xl font-bold text-red-600">{calibrationCompliance?.overdue || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl space-y-1">
              <p className="text-gray-500 font-medium">Due Soon</p>
              <p className="text-xl font-bold text-orange-500">{calibrationCompliance?.dueSoon || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl space-y-1 col-span-2">
              <div className="flex justify-between items-center mb-2">
                <p className="text-gray-500 font-medium">Overall Compliance</p>
                <p className="text-lg font-bold text-green-600">{calibrationCompliance?.complianceRate?.toFixed(1) || 0}%</p>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    calibrationCompliance?.complianceRate >= 90 ? 'bg-green-500' : 
                    calibrationCompliance?.complianceRate >= 70 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${calibrationCompliance?.complianceRate || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Usage Trends & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Usage vs Additions ({timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'})
            </h3>
            <div className="flex items-center p-1 bg-gray-100 rounded-lg">
              {[
                { id: '7d', label: 'Week' },
                { id: '30d', label: 'Month' }
              ].map(range => (
                <button
                  key={range.id}
                  onClick={() => setTimeRange(range.id)}
                  className={`px-4 py-1 rounded-md text-xs font-bold transition-all ${
                    timeRange === range.id
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={usageTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  dy={10}
                  interval={timeRange === '30d' ? 4 : 0}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="usage" 
                  stroke="#4f46e5" 
                  strokeWidth={3} 
                  dot={timeRange === '7d' ? { r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' } : false}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="addition" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={timeRange === '7d' ? { r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' } : false}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            Usage by Category
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Instruments', value: summary?.activeInstruments || 0 },
                { name: 'Consumables', value: summary?.totalConsumables || 0 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  <Cell fill="#6366f1" />
                  <Cell fill="#a855f7" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-500" />
            Instrument Status Distribution
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-500" />
            Calibration Compliance
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={calibrationComplianceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {calibrationComplianceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Alerts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Critical Alerts
            </h3>
            <div className="space-y-3">
              {summary?.overdueCalibrations > 0 && (
                <button 
                  onClick={() => navigate('/lab/management/inventory/instruments?status=Overdue')}
                  className="w-full p-3 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3 hover:bg-red-100 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0 group-hover:bg-red-200">
                    <Wrench className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-900">{summary.overdueCalibrations} Overdue Calibrations</p>
                    <p className="text-xs text-red-600 mt-0.5">Instruments require immediate certification</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-red-300 group-hover:text-red-600 self-center" />
                </button>
              )}
              {summary?.lowStockItems > 0 && (
                <button 
                  onClick={() => navigate('/lab/management/inventory/consumables?status=Low%20Stock')}
                  className="w-full p-3 bg-orange-50 rounded-xl border border-orange-100 flex items-start gap-3 hover:bg-orange-100 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0 group-hover:bg-orange-200">
                    <Package className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-orange-900">{summary.lowStockItems} Low Stock Items</p>
                    <p className="text-xs text-orange-600 mt-0.5">Items falling below threshold</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-orange-300 group-hover:text-orange-600 self-center" />
                </button>
              )}
              {summary?.expiringItems > 0 && (
                <button 
                  onClick={() => navigate('/lab/management/inventory/consumables?status=Expiring%20Soon')}
                  className="w-full p-3 bg-yellow-50 rounded-xl border border-yellow-100 flex items-start gap-3 hover:bg-yellow-100 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center shrink-0 group-hover:bg-yellow-200">
                    <Calendar className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-yellow-900">{summary.expiringItems} Expiring Consumables</p>
                    <p className="text-xs text-yellow-600 mt-0.5">Check batches expiring within 30 days</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-yellow-300 group-hover:text-yellow-600 self-center" />
                </button>
              )}
              {summary?.overdueCalibrations === 0 && summary?.lowStockItems === 0 && (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">No critical alerts</p>
                </div>
              )}
            </div>
          </Card>

          <Card title="Top Used Items (All Time)">
            <div className="space-y-4">
              {summary?.topItems?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-sm">
                      {idx + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{item.name}</span>
                  </div>
                  <Badge variant="outline">{item.qty} units</Badge>
                </div>
              ))}
              {(!summary?.topItems || summary?.topItems.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">No usage data available</p>
              )}
            </div>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Recent Activity
          </h3>
          <div className="space-y-0 divide-y divide-gray-100">
            {recentTransactions.map((txn, idx) => (
              <div key={idx} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      txn.transactionType === 'Usage' ? 'bg-red-50 text-red-600' : 
                      txn.transactionType === 'Addition' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {txn.transactionType === 'Usage' ? <TrendingDown className="w-4 h-4" /> : 
                       txn.transactionType === 'Addition' ? <TrendingUp className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{txn.itemName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        <span className="font-medium text-gray-700">{txn.usedBy}</span> 
                        {txn.transactionType === 'Usage' ? ' used ' : ' added '} 
                        <span className="font-bold">{txn.quantity} units</span> for {txn.purpose}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">
                        {new Date(txn.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <Badge variant={txn.transactionType === 'Usage' ? 'danger' : txn.transactionType === 'Addition' ? 'success' : 'warning'}>
                    {txn.transactionType}
                  </Badge>
                </div>
              </div>
            ))}
            {recentTransactions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No recent transactions</p>
              </div>
            )}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/lab/management/inventory/transactions')}
            >
              View Full Transaction History
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default InventoryReports

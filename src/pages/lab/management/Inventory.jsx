import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Package,
  Wrench,
  Calendar,
  ShoppingCart,
  BarChart3,
  ChevronRight,
  ArrowLeft
} from 'lucide-react'
import Card from '../../../components/labManagement/Card'
import toast from 'react-hot-toast'
import { instrumentsService, calibrationsService, consumablesService, inventoryTransactionsService } from '../../../services/labManagementApi'

function Inventory() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    instruments: { total: 0, active: 0 },
    calibrations: { total: 0, dueSoon: 0 },
    consumables: { total: 0, lowStock: 0 },
    transactions: { today: 0, thisMonth: 0 },
    compliance: 0,
    utilization: 0
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)

      // Fetch all data in parallel
      const [instruments, calibrations, consumables, transactions] = await Promise.all([
        instrumentsService.getAll(),
        calibrationsService.getAll(),
        consumablesService.getAll(),
        inventoryTransactionsService.getAll()
      ])

      // Calculate instrument stats
      const activeInstruments = instruments.filter(i => i.status === 'Active').length

      // Calculate calibration stats
      const dueSoonCalibrations = calibrations.filter(c =>
        c.status === 'Due Soon' || c.status === 'Overdue'
      ).length

      // Calculate consumable stats
      const lowStockConsumables = consumables.filter(c =>
        c.status === 'Low Stock' || c.status === 'Out of Stock'
      ).length

      // Calculate transaction stats
      const today = new Date().toISOString().split('T')[0]
      const thisMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

      const todayTransactions = transactions.filter(t =>
        t.date && t.date.startsWith(today)
      ).length

      const thisMonthTransactions = transactions.filter(t =>
        t.date && t.date.startsWith(thisMonth)
      ).length

      // Calculate compliance (calibrations that are valid)
      const validCalibrations = calibrations.filter(c => c.status === 'Valid').length
      const compliancePercentage = calibrations.length > 0
        ? ((validCalibrations / calibrations.length) * 100).toFixed(1)
        : 0

      // Calculate utilization (active instruments / total instruments)
      const utilizationPercentage = instruments.length > 0
        ? ((activeInstruments / instruments.length) * 100).toFixed(1)
        : 0

      setStats({
        instruments: { total: instruments.length, active: activeInstruments },
        calibrations: { total: calibrations.length, dueSoon: dueSoonCalibrations },
        consumables: { total: consumables.length, lowStock: lowStockConsumables },
        transactions: { today: todayTransactions, thisMonth: thisMonthTransactions },
        compliance: compliancePercentage,
        utilization: utilizationPercentage
      })
    } catch (error) {
      console.error('Error loading inventory stats:', error)
      toast.error('Failed to load inventory statistics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    )
  }

  const sections = [
    {
      id: 'instruments',
      title: 'Instruments Management',
      description: 'Manage lab instruments, track maintenance, and warranty information',
      icon: Wrench,
      color: 'from-blue-500 to-blue-600',
      route: '/lab/management/inventory/instruments'
    },
    {
      id: 'calibration',
      title: 'Calibration Management',
      description: 'Track calibration schedules, certificates, and compliance',
      icon: Calendar,
      color: 'from-green-500 to-green-600',
      route: '/lab/management/inventory/calibration'
    },
    {
      id: 'consumables',
      title: 'Accessories & Consumables',
      description: 'Manage consumables, track stock levels, and expiry dates',
      icon: Package,
      color: 'from-purple-500 to-purple-600',
      route: '/lab/management/inventory/consumables'
    },
    {
      id: 'transactions',
      title: 'Inventory Transactions',
      description: 'Log stock usage, additions, and wastage with audit trail',
      icon: ShoppingCart,
      color: 'from-orange-500 to-orange-600',
      route: '/lab/management/inventory/transactions'
    },
    {
      id: 'reports',
      title: 'Reports & Dashboard',
      description: 'View inventory summaries, compliance reports, and analytics',
      icon: BarChart3,
      color: 'from-indigo-500 to-indigo-600',
      route: '/lab/management/inventory/reports'
    },
  ]

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
            onClick={() => navigate('/lab/management/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              Inventory Management
            </h1>
            <p className="text-gray-600 mt-1">Comprehensive inventory tracking and management system</p>
          </div>
        </div>
      </motion.div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section, index) => {
          const Icon = section.icon
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card
                hover
                className="cursor-pointer h-full flex flex-col"
                onClick={() => navigate(section.route)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {section.title}
                </h3>

                <p className="text-sm text-gray-600 mb-4 flex-1">
                  {section.description}
                </p>

                <div className="mt-auto pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    {section.id === 'instruments' && (
                      <>
                        <span className="text-gray-500">Total: <span className="font-semibold text-gray-900">{stats.instruments.total}</span></span>
                        <span className="text-green-600">Active: {stats.instruments.active}</span>
                      </>
                    )}
                    {section.id === 'calibration' && (
                      <>
                        <span className="text-gray-500">Total: <span className="font-semibold text-gray-900">{stats.calibrations.total}</span></span>
                        <span className="text-orange-600">Due Soon: {stats.calibrations.dueSoon}</span>
                      </>
                    )}
                    {section.id === 'consumables' && (
                      <>
                        <span className="text-gray-500">Total: <span className="font-semibold text-gray-900">{stats.consumables.total}</span></span>
                        <span className="text-red-600">Low Stock: {stats.consumables.lowStock}</span>
                      </>
                    )}
                    {section.id === 'transactions' && (
                      <>
                        <span className="text-gray-500">Today: <span className="font-semibold text-gray-900">{stats.transactions.today}</span></span>
                        <span className="text-blue-600">This Month: {stats.transactions.thisMonth}</span>
                      </>
                    )}
                    {section.id === 'reports' && (
                      <>
                        <span className="text-gray-500">Compliance: <span className="font-semibold text-gray-900">{stats.compliance}%</span></span>
                        <span className="text-green-600">Utilization: {stats.utilization}%</span>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default Inventory

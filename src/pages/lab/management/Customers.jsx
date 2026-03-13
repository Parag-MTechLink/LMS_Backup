import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Users, Plus, Search, ExternalLink } from 'lucide-react'
import { customersService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Modal from '../../../components/labManagement/Modal'
import CreateCustomerForm from '../../../components/labManagement/forms/CreateCustomerForm'
import CustomerProfileModal from '../../../components/labManagement/modals/CustomerProfileModal'
import ConfirmDeleteModal from '../../../components/labManagement/ConfirmDeleteModal'
import { useDebounce } from '../../../hooks/useDebounce'
import RouteSkeleton from '../../../components/RouteSkeleton'
import { useLabManagementAuth } from '../../../contexts/LabManagementAuthContext'
import { Trash2 } from 'lucide-react'

function Customers() {
  const navigate = useNavigate()
  const { user } = useLabManagementAuth()
  const isAdmin = user?.role === 'Sales Manager'
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await customersService.getAll()
      setCustomers(data)
    } catch (error) {
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer =>
      !debouncedSearchTerm ||
      customer.companyName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    )
  }, [customers, debouncedSearchTerm])

  const handleDeleteClick = (e, customer) => {
    e.stopPropagation()
    setDeleteTarget(customer)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await customersService.delete(deleteTarget.id)
      toast.success('Customer deleted successfully')
      setDeleteTarget(null)
      loadCustomers()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete customer')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <RouteSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="mt-2 text-gray-600">Manage your customer relationships</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Customers List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Projects
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer, index) => (
                <motion.tr
                  key={customer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedCustomer(customer)
                    setShowProfileModal(true)
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{customer.companyName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{customer.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">-</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 text-xs font-medium rounded-full text-green-700 bg-green-50">
                      active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/lab/management/projects?customerId=${customer.id}`)
                        }}
                        className="text-primary hover:text-primary-dark flex items-center gap-1"
                      >
                        View Projects
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCustomer(customer)
                          setShowProfileModal(true)
                        }}
                        className="text-gray-500 hover:text-gray-700 hover:underline"
                      >
                        View Profile
                      </button>
                      {isAdmin && (
                        <button
                          onClick={(e) => handleDeleteClick(e, customer)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Customer"
        size="lg"
      >
        <CreateCustomerForm
          onSuccess={() => {
            setShowCreateModal(false)
            loadCustomers()
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Customer Profile Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Customer Profile"
        size="lg"
      >
        <CustomerProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          customer={selectedCustomer}
        />
      </Modal>

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete customer"
        message="Are you sure you want to delete this customer? This action cannot be undone."
        entityName={deleteTarget ? deleteTarget.companyName : ''}
        loading={deleting}
      />
    </div>
  )
}

export default Customers

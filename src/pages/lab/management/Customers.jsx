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
  const isAdmin = user?.role === 'Admin'
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
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Customers
          </h1>
          <p className="mt-2 text-sm text-gray-500 font-medium">Manage and view your customer relationships</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="group relative px-5 py-2.5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
          <Plus className="w-5 h-5 relative z-10" />
          <span className="font-semibold relative z-10">Add Customer</span>
        </button>
      </div>

      {/* Elegant Search */}
      <div className="relative group max-w-md">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Search customers by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
        />
      </div>

      {/* Clean Minimalist Table */}
      <div className="bg-white border border-gray-100 rounded-lg overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fafafa] border-b border-gray-100">
                <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">
                  Projects
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.map((customer) => {
                const initial = customer.companyName ? customer.companyName.charAt(0).toUpperCase() : 'C'
                
                return (
                  <tr
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomer(customer)
                      setShowProfileModal(true)
                    }}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                          {initial}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">
                            {customer.companyName} {customer.id ? String(customer.id).substring(0, 4) : ''}
                          </span>
                          <span className="text-[13px] text-gray-500 mt-0.5">
                            {customer.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-[13px] font-medium text-gray-700">
                        {customer.contactPerson || 'Primary Contact'}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        Active
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/lab/management/projects?customerId=${customer.id}`)
                        }}
                        className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                      >
                        View Projects
                      </button>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      {isAdmin ? (
                        <button
                          onClick={(e) => handleDeleteClick(e, customer)}
                          className="inline-flex items-center justify-center p-2 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-[18px] h-[18px] stroke-[1.5]" />
                        </button>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          
          {filteredCustomers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No customers found</h3>
              <p className="text-gray-500 text-center max-w-sm">
                {searchTerm 
                  ? `We couldn't find any customers matching "${searchTerm}"`
                  : "Get started by adding your first customer to the system."}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-6 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Customer
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Customer"
        size="lg"
        showCloseIcon={false}
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
        title={!selectedCustomer ? "Customer Profile" : ""} // Title is handled inside now if needed, but keeping empty or standard is fine
        size="lg"
        showCloseIcon={false}
      >
        <CustomerProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          customer={selectedCustomer}
          onUpdate={() => {
            loadCustomers()
            // Optionally close the modal upon save, or leave it open to view the updated profile
            // setShowProfileModal(false) 
          }}
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

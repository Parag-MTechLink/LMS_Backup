import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, User, Mail, Shield, AlertCircle, Trash2, Edit2, RotateCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../../../services/labManagementApi'
import { useLabManagementAuth } from '../../../contexts/LabManagementAuthContext'

const ROLES = [
  { value: 'Testing Engineer', label: 'Testing Engineer' },
  { value: 'Sales Engineer', label: 'Sales Engineer' },
  { value: 'Lab Manager', label: 'Lab Manager' },
  { value: 'Technician', label: 'Technician' },
  { value: 'Admin', label: 'Admin' },
]

export default function UserManagement() {
  const { user } = useLabManagementAuth()
  const [loading, setLoading] = useState(false)
  
  // Users list state
  const [usersList, setUsersList] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [filterRole, setFilterRole] = useState('All')

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'Testing Engineer'
  })

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true)
      const data = await authService.getAllUsers()
      setUsersList(data)
    } catch (err) {
      console.error('Failed to fetch users:', err)
      toast.error('Could not load user directory.')
    } finally {
      setLoadingUsers(false)
    }
  }, [])

  useEffect(() => {
    if (user?.role === 'Admin') {
      fetchUsers()
    }
  }, [user, fetchUsers])

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete the account for ${userName || 'this user'}? This action cannot be undone.`)) {
      try {
        await authService.deleteUser(userId)
        toast.success('User deleted successfully.')
        fetchUsers() // Refresh list
      } catch (err) {
        console.error('Failed to delete user:', err)
        toast.error(err.response?.data?.detail || 'Failed to delete user.')
      }
    }
  }

  const filteredUsers = filterRole === 'All' 
    ? usersList 
    : usersList.filter(u => u.role === filterRole)

  // Basic authorization check
  if (user?.role !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-600 mt-2">Only Administrators can manage users.</p>
      </div>
    )
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.full_name.trim() || !formData.email.trim() || !formData.password) {
      toast.error('Please fill in all required fields.')
      return
    }
    
    // Strong password validation: min 8 chars, at least one letter and one number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(formData.password)) {
      toast.error('Password must be at least 8 characters and include at least one letter and one number.')
      return
    }

    setLoading(true)
    try {
      // Create user using the existing signup endpoint
      await authService.signup(formData)
      toast.success(`${formData.role} account created successfully!`)
      
      // Reset form
      setFormData({
        full_name: '',
        email: '',
        password: '',
        role: 'Testing Engineer'
      })
      
      // Refresh user list
      fetchUsers()
    } catch (error) {
       console.error('Error creating user:', error)
       
       // Improved error reporting
       const errorDetail = error.response?.data?.detail
       const errorMessage = typeof errorDetail === 'string' 
         ? errorDetail 
         : (Array.isArray(errorDetail) ? errorDetail.map(d => d.msg || d).join(', ') : 'Failed to create user.')
       
       toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage user accounts and their roles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Create User Form Section */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-indigo-600" />
                Add New User
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address *</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Role *</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-2 border bg-white"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password *</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Min 8 characters, letter + number"
                    className="block w-full sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 border"
                    required
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Existing Users Directory Section */}
        <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col"
            >
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">User Directory</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Active personnel registered in the platform.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="bg-transparent text-sm font-medium text-gray-700 border-none focus:ring-0 cursor-pointer"
                    >
                      <option value="All">All Roles</option>
                      {ROLES.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    onClick={fetchUsers}
                    disabled={loadingUsers}
                    className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-50 transition"
                  >
                    <RotateCw className={`w-5 h-5 ${loadingUsers ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loadingUsers ? (
                       // Skeleton rows
                       [...Array(3)].map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                                <div className="ml-4 space-y-2">
                                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                                  <div className="h-3 w-40 bg-gray-100 rounded"></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 w-24 bg-gray-200 rounded"></div></td>
                            <td className="px-6 py-4 whitespace-nowrap"><div className="h-6 w-16 bg-gray-200 rounded-full"></div></td>
                            <td className="px-6 py-4 whitespace-nowrap text-right"><div className="h-8 w-8 bg-gray-200 rounded ml-auto"></div></td>
                          </tr>
                       ))
                    ) : filteredUsers.length === 0 ? (
                       <tr>
                         <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                           <User className="w-12 h-12 text-gray-300 mx-auto w-full mb-3" />
                           <p>{filterRole === 'All' ? 'No users found.' : `No users found with role "${filterRole}".`}</p>
                         </td>
                       </tr>
                    ) : (
                      <AnimatePresence>
                        {filteredUsers.map((u) => (
                          <motion.tr 
                            key={u.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-semibold shadow-sm">
                                  {u.full_name?.charAt(0).toUpperCase() || u.email?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{u.full_name || 'No Name'}</div>
                                  <div className="text-sm text-gray-500">{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                {u.role === 'Admin' && <Shield className="w-3.5 h-3.5 text-indigo-500" />}
                                <span className={`text-sm font-medium ${u.role === 'Admin' ? 'text-indigo-600' : 'text-gray-700'}`}>
                                  {u.role}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {u.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                               <button
                                 onClick={() => handleDeleteUser(u.id, u.full_name)}
                                 disabled={String(user?.id) === u.id}
                                 className={`p-1.5 rounded-lg transition-colors ${
                                   String(user?.id) === u.id 
                                     ? 'text-gray-300 cursor-not-allowed' 
                                     : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                 }`}
                                 title={String(user?.id) === u.id ? "Cannot delete your own account" : "Delete user"}
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
        </div>
      </div>
    </div>
  )
}

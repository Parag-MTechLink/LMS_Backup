import React, { useState, useEffect } from 'react'
import { Mail, Phone, MapPin, FileText, Loader2, Edit2 } from 'lucide-react'
import Button from '../Button'
import Badge from '../Badge'
import { projectsService, rfqsService, estimationsService } from '../../../services/labManagementApi'
import { formatCurrencyINR } from '../../../utils/currency'
import CreateCustomerForm from '../forms/CreateCustomerForm'

function CustomerProfileModal({ isOpen, onClose, customer, onUpdate }) {
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [stats, setStats] = useState({
        totalProjects: 0,
        activeProjects: 0,
        totalSpent: 0
    })

    useEffect(() => {
        if (isOpen && customer?.id) {
            setIsEditing(false)
            loadCustomerStats()
        } else {
            setIsEditing(false)
        }
    }, [isOpen, customer?.id])

    const loadCustomerStats = async () => {
        try {
            setLoading(true)
            // Fetch relevant data
            const [projects, allRfqs, allEstimations] = await Promise.all([
                projectsService.getAll(customer.id),
                rfqsService.getAll(),
                estimationsService.getAll()
            ])

            // 1. Projects are already filtered by clientId in the API call
            const customerProjects = projects

            // 2. Filter RFQs for this customer
            const customerRfqs = allRfqs.filter(r =>
                r.customerId?.toString() === customer.id.toString() ||
                r.customerName?.toLowerCase() === customer.companyName?.toLowerCase()
            )
            const customerRfqIds = customerRfqs.map(r => r.id)

            // 3. Filter Estimations for this customer's RFQs
            const customerEstimations = allEstimations.filter(e =>
                customerRfqIds.includes(e.rfqId) ||
                e.rfqCustomerName?.toLowerCase() === customer.companyName?.toLowerCase()
            )

            // 4. Calculate Stats
            const activeProjectsCount = customerProjects.filter(p =>
                !['completed', 'cancelled', 'rejected', 'closed'].includes(p.status?.toLowerCase())
            ).length

            const totalSpentAmount = customerEstimations.reduce((sum, e) => sum + (e.totalCost || 0), 0)

            setStats({
                totalProjects: customerProjects.length,
                activeProjects: activeProjectsCount,
                totalSpent: totalSpentAmount
            })
        } catch (error) {
            console.error('Failed to load customer stats:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    const profile = {
        ...customer,
        phone: customer?.phone || 'Not provided',
        address: customer?.address || 'Address not available',
        description: customer?.description || 'No description provided.',
        companyName: customer?.companyName || 'Company Name'
    }

    if (isEditing) {
        return (
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Edit Customer Profile</h3>
                <CreateCustomerForm 
                    isEdit 
                    initialData={customer}
                    onSuccess={() => {
                        setIsEditing(false)
                        if (onUpdate) onUpdate()
                    }}
                    onCancel={() => setIsEditing(false)}
                />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header Info Banner */}
            <div className="relative bg-gradient-to-br from-indigo-50/50 to-blue-50/30 rounded-2xl p-6 border border-indigo-100/50">
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                    <div className="w-20 h-20 rounded-full bg-white shadow-sm border border-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold shrink-0">
                        {profile.companyName?.charAt(0) || 'C'}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-bold text-gray-900">{profile.companyName}</h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                Active Customer
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 max-w-2xl">{profile.description}</p>
                    </div>
                </div>

                {/* Contact Pills */}
                <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-indigo-100/50">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-100 text-sm text-gray-600 shadow-sm">
                        <Mail className="w-4 h-4 text-indigo-400" />
                        <span>{profile.email}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-100 text-sm text-gray-600 shadow-sm">
                        <Phone className="w-4 h-4 text-indigo-400" />
                        <span>{profile.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-100 text-sm text-gray-600 shadow-sm max-w-full">
                        <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="truncate">{profile.address}</span>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div>
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 px-1">Engagement Metrics</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Total Projects Card */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="text-sm font-medium text-gray-500">Total Projects</div>
                        </div>
                        {loading ? (
                            <div className="py-2"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
                        ) : (
                            <div className="text-3xl font-bold text-gray-900">{stats.totalProjects}</div>
                        )}
                    </div>

                    {/* Active Projects Card */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <Loader2 className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="text-sm font-medium text-gray-500">Active Projects</div>
                        </div>
                        {loading ? (
                            <div className="py-2"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
                        ) : (
                            <div className="text-3xl font-bold text-indigo-600">{stats.activeProjects}</div>
                        )}
                    </div>

                    {/* Total Spent Card */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="text-sm font-medium text-gray-500">Total Revenue</div>
                        </div>
                        {loading ? (
                            <div className="py-2"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
                        ) : (
                            <div className="text-2xl font-bold text-emerald-600">{formatCurrencyINR(stats.totalSpent)}</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-between pt-4 border-t border-gray-100 items-center">
                <Button 
                    onClick={() => setIsEditing(true)} 
                    variant="outline" 
                    className="flex items-center gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                >
                    <Edit2 className="w-4 h-4" /> Edit Profile
                </Button>
                <Button onClick={onClose} variant="outline" className="px-6">Close</Button>
            </div>
        </div>
    )
}

export default CustomerProfileModal

import React, { useState, useEffect } from 'react'
import { Mail, Phone, MapPin, FileText, Loader2 } from 'lucide-react'
import Button from '../Button'
import Badge from '../Badge'
import { projectsService, rfqsService, estimationsService } from '../../../services/labManagementApi'
import { formatCurrencyINR } from '../../../utils/currency'

function CustomerProfileModal({ isOpen, onClose, customer }) {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalProjects: 0,
        activeProjects: 0,
        totalSpent: 0
    })

    useEffect(() => {
        if (isOpen && customer?.id) {
            loadCustomerStats()
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

    return (
        <div className="space-y-6">
            {/* Header Info */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-3xl font-bold shadow-lg shrink-0">
                    {profile.companyName?.charAt(0) || 'C'}
                </div>
                <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900">{profile.companyName}</h3>
                    <p className="text-gray-600 mt-1">{profile.description}</p>

                    <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {profile.email}
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {profile.phone}
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            {profile.address}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
                    <div className="text-sm text-gray-500 font-medium mb-1">Total Projects</div>
                    {loading ? (
                        <div className="flex justify-center py-1"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
                    ) : (
                        <div className="text-2xl font-bold text-gray-900">{stats.totalProjects}</div>
                    )}
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
                    <div className="text-sm text-gray-500 font-medium mb-1">Active Projects</div>
                    {loading ? (
                        <div className="flex justify-center py-1"><Loader2 className="w-5 h-5 animate-spin text-primary/40" /></div>
                    ) : (
                        <div className="text-2xl font-bold text-primary">{stats.activeProjects}</div>
                    )}
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
                    <div className="text-sm text-gray-500 font-medium mb-1">Total Spent</div>
                    {loading ? (
                        <div className="flex justify-center py-1"><Loader2 className="w-5 h-5 animate-spin text-green-400" /></div>
                    ) : (
                        <div className="text-2xl font-bold text-green-600">{formatCurrencyINR(stats.totalSpent)}</div>
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
                <Button onClick={onClose}>Close Profile</Button>
            </div>
        </div>
    )
}

export default CustomerProfileModal

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'

const LabDataContext = createContext()

export const LabDataProvider = ({ children }) => {
  // Load data from localStorage or use defaults
  const loadFromStorage = (key, defaultValue) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  }

  const saveToStorage = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }

  // Lab Requests state
  const [labRequests, setLabRequests] = useState(() => loadFromStorage('techlink_lab_requests', [
    {
      id: 'LR-1001',
      productName: 'Smart Router X200',
      service: 'EMC Testing',
      date: '2024-01-15',
      status: 'In Progress',
      priority: 'Normal',
      assignedTo: 'VALOR01',
      customerId: 'BP-2024-001',
      progress: 65,
      estimatedCompletion: '2024-01-20',
      notes: 'Testing in progress, initial results look good',
    },
    {
      id: 'LR-1002',
      productName: 'Smart Router X200',
      service: 'EMC Testing',
      date: '2024-01-15',
      status: 'Completed',
      priority: 'Normal',
      assignedTo: 'VALOR01',
      customerId: 'BP-2024-001',
      progress: 100,
      completedAt: '2024-01-18',
      testResults: 'All tests passed successfully',
    },
    {
      id: 'LR-1003',
      productName: 'IoT Sensor Hub',
      service: 'Safety Testing',
      date: '2024-01-16',
      status: 'Completed',
      priority: 'High',
      assignedTo: 'VALOR02',
      customerId: 'BP-2024-002',
      progress: 100,
      completedAt: '2024-01-19',
      testResults: 'Safety standards met',
    },
    {
      id: 'LR-1004',
      productName: 'IoT Sensor Hub',
      service: 'Safety Testing',
      date: '2024-01-16',
      status: 'In Progress',
      priority: 'High',
      assignedTo: 'VALOR02',
      customerId: 'BP-2024-002',
      progress: 45,
      estimatedCompletion: '2024-01-22',
      notes: 'Thermal testing phase',
    },
    {
      id: 'LR-1005',
      productName: 'Power Adapter 65W',
      service: 'Thermal Testing',
      date: '2024-01-14',
      status: 'In Progress',
      priority: 'Normal',
      assignedTo: 'VALOR03',
      customerId: 'BP-2024-003',
      progress: 80,
      estimatedCompletion: '2024-01-21',
      notes: 'Final validation stage',
    },
    {
      id: 'LR-1006',
      productName: 'Smart Router X200',
      service: 'EMC Testing',
      date: '2024-01-15',
      status: 'Pending',
      priority: 'Normal',
      assignedTo: null,
      customerId: 'BP-2024-001',
      progress: 0,
    },
    {
      id: 'LR-1007',
      productName: 'Wi-Fi Router W7',
      service: 'EMC Testing',
      date: '2024-01-15',
      status: 'Rejected',
      priority: 'Normal',
      assignedTo: 'VALOR01',
      customerId: 'BP-2024-004',
      progress: 0,
      rejectedAt: '2024-01-16',
      rejectionReason: 'Insufficient documentation provided',
    },
    {
      id: 'LR-1008',
      productName: 'IoT Sensor Hub',
      service: 'Safety Testing',
      date: '2024-01-16',
      status: 'Pending',
      priority: 'High',
      assignedTo: null,
      customerId: 'BP-2024-002',
      progress: 0,
    },
    {
      id: 'LR-1009',
      productName: 'Smart MCB',
      service: 'Safety Testing',
      date: '2024-01-16',
      status: 'Rejected',
      priority: 'Normal',
      assignedTo: 'VALOR02',
      customerId: 'BP-2024-005',
      progress: 0,
      rejectedAt: '2024-01-17',
      rejectionReason: 'Product does not meet safety requirements',
    },
    {
      id: 'LR-1010',
      productName: 'Smart Router X300',
      service: 'EMC Testing',
      date: '2024-01-17',
      status: 'Pending',
      priority: 'High',
      assignedTo: null,
      customerId: 'BP-2024-006',
      progress: 0,
    },
    {
      id: 'LR-1011',
      productName: 'Sensor Pro',
      service: 'Safety Testing',
      date: '2024-01-17',
      status: 'Pending',
      priority: 'Normal',
      assignedTo: null,
      customerId: 'BP-2024-007',
      progress: 0,
    },
  ]))

  // Technicians state
  const [technicians, setTechnicians] = useState(() => loadFromStorage('techlink_technicians', [
    { id: 'VALOR01', name: 'John Smith', specialization: 'EMC Testing', status: 'Available' },
    { id: 'VALOR02', name: 'Sarah Johnson', specialization: 'Safety Testing', status: 'Busy' },
    { id: 'VALOR03', name: 'Mike Davis', specialization: 'Thermal Testing', status: 'Available' },
    { id: 'VALOR04', name: 'Emily Chen', specialization: 'EMC Testing', status: 'Available' },
  ]))

  // Schedule state
  const [schedule, setSchedule] = useState(() => loadFromStorage('techlink_lab_schedule', [
    {
      id: 'SCH-001',
      requestId: 'LR-1001',
      productName: 'Smart Router X200',
      service: 'EMC Testing',
      technicianId: 'VALOR01',
      technicianName: 'John Smith',
      startTime: '2024-01-17T10:00:00',
      endTime: '2024-01-17T14:00:00',
      status: 'Scheduled',
    },
    {
      id: 'SCH-002',
      requestId: 'LR-1004',
      productName: 'IoT Sensor Hub',
      service: 'Safety Testing',
      technicianId: 'VALOR02',
      technicianName: 'Sarah Johnson',
      startTime: '2024-01-17T14:00:00',
      endTime: '2024-01-17T18:00:00',
      status: 'Scheduled',
    },
    {
      id: 'SCH-003',
      requestId: 'LR-1005',
      productName: 'Power Adapter 65W',
      service: 'Thermal Testing',
      technicianId: 'VALOR03',
      technicianName: 'Mike Davis',
      startTime: '2024-01-18T09:00:00',
      endTime: '2024-01-18T13:00:00',
      status: 'Scheduled',
    },
  ]))

  // Organization data state
  const [organizationData, setOrganizationData] = useState(() => loadFromStorage('techlink_organization_data', null))

  // Scope Management data state
  const [scopeData, setScopeData] = useState(() => {
    const data = loadFromStorage('techlink_scope_data', {
      ilcProgrammes: [],
      internalAuditFrequency: '',
      lastAuditDate: '',
      managementReviewFrequency: '',
      lastReviewDate: '',
      scopes: [],
      equipments: [],
      scopeTests: [],
      facilitiesAvailable: [],
      facilitiesNotAvailable: [],
      allFacilitiesAvailable: false,
      referenceMaterials: [],
      referenceMaterialNA: false,
      exclusions: [],
      exclusionNA: false,
      testingCharges: [],
      completeTestingCharge: ''
    })
    console.log('LabDataContext: initializing scopeData', data);
    return data;
  })

  // Inventory state
  const [inventoryInstruments, setInventoryInstruments] = useState([])
  const [inventoryConsumables, setInventoryConsumables] = useState([])
  const [inventoryCalibrations, setInventoryCalibrations] = useState([])
  const [inventoryTransactions, setInventoryTransactions] = useState([])

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveToStorage('techlink_lab_requests', labRequests)
  }, [labRequests])

  useEffect(() => {
    saveToStorage('techlink_technicians', technicians)
  }, [technicians])

  useEffect(() => {
    saveToStorage('techlink_lab_schedule', schedule)
  }, [schedule])

  useEffect(() => {
    saveToStorage('techlink_organization_data', organizationData)
  }, [organizationData])

  useEffect(() => {
    saveToStorage('techlink_scope_data', scopeData)
  }, [scopeData])

  // Lab Request functions (stable callbacks to reduce re-renders)
  const updateRequest = useCallback((id, updates) => {
    setLabRequests(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
  }, [])

  const assignRequest = useCallback((requestId, technicianId) => {
    const technician = technicians.find(t => t.id === technicianId)
    if (!technician) return

    updateRequest(requestId, {
      assignedTo: technicianId,
      status: 'In Progress',
      progress: 10,
    })

    // Update technician status if needed
    if (technician.status === 'Available') {
      setTechnicians(prev => prev.map(t =>
        t.id === technicianId ? { ...t, status: 'Busy' } : t
      ))
    }
  }, [technicians, updateRequest])

  const updateRequestStatus = useCallback((id, newStatus, additionalData = {}) => {
    const updates = { status: newStatus, ...additionalData }

    if (newStatus === 'Completed') {
      updates.progress = 100
      updates.completedAt = new Date().toISOString().split('T')[0]
    } else if (newStatus === 'Rejected') {
      updates.rejectedAt = new Date().toISOString().split('T')[0]
    } else if (newStatus === 'In Progress') {
      updates.progress = Math.max(10, updates.progress || 10)
    }

    updateRequest(id, updates)
  }, [updateRequest])

  const updateRequestProgress = useCallback((id, progress) => {
    updateRequest(id, { progress: Math.min(100, Math.max(0, progress)) })
  }, [updateRequest])

  // Schedule functions
  const addScheduleItem = useCallback((item) => {
    const newItem = { ...item, id: `SCH-${String(schedule.length + 1).padStart(3, '0')}` }
    setSchedule(prev => [...prev, newItem])
    return newItem
  }, [schedule])

  const updateScheduleItem = useCallback((id, updates) => {
    setSchedule(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
  }, [])

  const deleteScheduleItem = useCallback((id) => {
    setSchedule(prev => prev.filter(s => s.id !== id))
  }, [])

  // Organization data functions
  const updateOrganizationData = useCallback((data) => setOrganizationData(data), [])
  const updateScopeData = useCallback((data) => {
    console.log('LabDataContext: updateScopeData called', data);
    setScopeData(data);
  }, [])

  // Statistics (memoized computation)
  const getStats = useCallback(() => {
    const pending = labRequests.filter(r => r.status === 'Pending').length
    const inProgress = labRequests.filter(r => r.status === 'In Progress').length
    const completedThisWeek = labRequests.filter(r => {
      if (r.status !== 'Completed' || !r.completedAt) return false
      const completedDate = new Date(r.completedAt)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return completedDate >= weekAgo
    }).length

    // Calculate average turnaround time
    const completedRequests = labRequests.filter(r => r.status === 'Completed' && r.completedAt && r.date)
    const avgTurnaround = completedRequests.length > 0
      ? completedRequests.reduce((sum, r) => {
        const start = new Date(r.date)
        const end = new Date(r.completedAt)
        const days = (end - start) / (1000 * 60 * 60 * 24)
        return sum + days
      }, 0) / completedRequests.length
      : 0

    return {
      pending,
      activeTests: inProgress,
      completedThisWeek,
      avgTurnaround: avgTurnaround.toFixed(1) + 'd',
    }
  }, [labRequests])

  const value = useMemo(() => ({
    labRequests,
    technicians,
    schedule,
    organizationData,
    scopeData,
    inventoryData: {
      instruments: inventoryInstruments,
      consumables: inventoryConsumables,
      calibrations: inventoryCalibrations,
      transactions: inventoryTransactions,
      setInstruments: setInventoryInstruments,
      setConsumables: setInventoryConsumables,
      setCalibrations: setInventoryCalibrations,
      setTransactions: setInventoryTransactions
    },
    setLabRequests,
    setTechnicians,
    setSchedule,
    updateRequest,
    assignRequest,
    updateRequestStatus,
    updateRequestProgress,
    addSchedule_item: addScheduleItem,
    updateSchedule_item: updateScheduleItem,
    deleteSchedule_item: deleteScheduleItem,
    updateOrganizationData,
    updateScopeData,
    getStats,
  }), [
    labRequests, technicians, schedule, organizationData, scopeData,
    inventoryInstruments, inventoryConsumables, inventoryCalibrations, inventoryTransactions,
    updateRequest, assignRequest, updateRequestStatus, updateRequestProgress,
    addScheduleItem, updateScheduleItem, deleteScheduleItem,
    updateOrganizationData, updateScopeData, getStats,
  ])

  return <LabDataContext.Provider value={value}>{children}</LabDataContext.Provider>
}

export const useLabData = () => {
  const context = useContext(LabDataContext)
  if (!context) {
    throw new Error('useLabData must be used within LabDataProvider')
  }
  return context
}

import axios from 'axios'
import api from './api'

// Validate environment variable
const API_URL = import.meta.env.VITE_API_URL

if (!API_URL && import.meta.env.PROD) {
  console.error('VITE_API_URL environment variable is required in production!')
  throw new Error('Missing required environment variable: VITE_API_URL')
}

// Dev: default to backend on 127.0.0.1:8000 (matches uvicorn; avoid localhost IPv6 issues). Override with VITE_API_URL.
// Prod: VITE_API_URL is required
const DEV_DEFAULT_BACKEND = 'http://127.0.0.1:8001'
const API_BASE_URL = API_URL || (import.meta.env.DEV ? DEV_DEFAULT_BACKEND : '')

/**
 * Construct a full download URL for a file stored on the backend.
 * @param {string} path - The relative path from the backend (e.g., /uploads/...)
 * @returns {string} The full absolute URL
 */
export const getDownloadUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  
  // Ensure we don't have double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${cleanPath}`
}

class ApiService {
  constructor() {
    this.client = api
  }

  setToken(token) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete this.client.defaults.headers.common['Authorization']
    }
  }

  /** In-flight GET requests: same URL returns same promise (deduplication) */
  _getPromises = new Map()

  async get(url, config = {}) {
    const key = url + (config.params ? JSON.stringify(config.params) : '')
    
    // Check cache first (ignore if it's a "no-cache" request or specific TTL is 0)
    const cachedData = getCached(key)
    if (cachedData && !config.forceRefresh) {
      return cachedData
    }

    const inFlight = this._getPromises.get(key)
    if (inFlight) return inFlight
    
    // api.js already unwraps response.data, so data is returned directly
    const promise = this.client.get(url, config).then((data) => {
      setCached(key, data)
      return data
    })
    
    this._getPromises.set(key, promise)
    promise.finally(() => this._getPromises.delete(key))
    return promise
  }

  async post(url, data, config = {}) {
    return await this.client.post(url, data, config)
  }

  async put(url, data, config = {}) {
    return await this.client.put(url, data, config)
  }

  async delete(url) {
    return await this.client.delete(url)
  }

  async patch(url, data, config = {}) {
    return await this.client.patch(url, data, config)
  }
}

export const apiService = new ApiService()

// Mock data services for now - can be replaced with real API calls
const mockDelay = (ms = 50) => new Promise(resolve => setTimeout(resolve, ms))

// Simple cache mechanism (stale-while-revalidate: return stale if within TTL)
const cache = new Map()
const CACHE_TTL = 30000 // 30 seconds default
const CACHE_TTL_LONG = 5 * 60 * 1000 // 5 min for dashboard/stats
const CACHE_TTL_USER = 2 * 60 * 1000 // 2 min for user profile

const getCached = (key, ttlMs = CACHE_TTL) => {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < ttlMs) {
    return cached.data
  }
  return null
}

const setCached = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() })
}

const clearCache = (pattern) => {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key)
      }
    }
  } else {
    cache.clear()
  }
}

// Auth Service (JWT). me() cached to avoid refetch on every nav; clear with clearCache('auth:')
export const authService = {
  login: (email, password) =>
    apiService.post('/auth/login', { email, password }),
  signup: (data) =>
    apiService.post('/auth/signup', data),
  me: async () => {
    const cached = getCached('auth:me', CACHE_TTL_USER)
    if (cached) return cached
    const data = await apiService.get('/auth/me')
    setCached('auth:me', data)
    return data
  },
  getAllUsers: () => apiService.get('/auth/users'),
  deleteUser: (userId) => apiService.delete(`/auth/users/${userId}`),
  verifyMfa: (email, code) =>
    apiService.post('/auth/verify-mfa', { email, code }),
  sendOtp: (mobile) =>
    apiService.post('/auth/send-otp', { mobile }),
  verifyOtp: (mobile, otp) =>
    apiService.post('/auth/verify-otp', { mobile, otp }),
  updateProfile: (data) => {
    clearCache('auth:me')
    return apiService.put('/auth/profile', data)
  },
  changePassword: (currentPassword, newPassword) =>
    apiService.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword }),
}

// Lab recommendations (engine under /labs; requires LAB_ENGINE_DATABASE_URL on backend)
export const labsService = {
  health: () => apiService.get('/labs/health'),
  getDomains: () => apiService.get('/labs/domains'),
  getLocations: () => apiService.get('/labs/locations'),
  getStatistics: () => apiService.get('/labs/statistics'),
  searchLabsByName: (params) => apiService.get('/labs/by-name', { params }),
  getRecommendations: (body) => apiService.post('/labs/recommend', body),
  searchLabs: (params) => apiService.get('/labs/search', { params }),
  getLabDetails: (labId) => apiService.get(`/labs/${labId}`),
  searchTests: (params) => apiService.get('/labs/tests/search', { params }),
  searchStandards: (params) => apiService.get('/labs/standards/search', { params }),
}

// Customers Service
export const customersService = {
  getAll: async () => {
    try {
      return await apiService.get('/customers')
    } catch (error) {
      console.error('Error fetching customers:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/customers/${id}`),
  create: async (data) => {
    clearCache('/customers')
    return await apiService.post('/customers', data)
  },
  update: async (id, data) => {
    clearCache('/customers')
    return await apiService.put(`/customers/${id}`, data)
  },
  delete: async (id) => {
    clearCache('/customers')
    return await apiService.delete(`/customers/${id}`)
  },
}

// RFQ Service
export const rfqsService = {
  getAll: () => apiService.get('/rfqs'),
  getById: (id) => apiService.get(`/rfqs/${id}`),
  create: async (data) => {
    clearCache('/rfqs')
    return await apiService.post('/rfqs', data)
  },
  delete: async (id) => {
    clearCache('/rfqs')
    return await apiService.delete(`/rfqs/${id}`)
  },
  updateStatus: async (id, status) => {
    clearCache('/rfqs')
    return await apiService.patch(`/rfqs/${id}/status`, { status })
  },
  upload: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return await apiService.post('/rfqs/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  downloadTemplate: async () => {
    try {
      const res = await apiService.client.get('/rfqs/template', { responseType: 'blob' })
      const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Job_Request_Form_Template.docx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download RFQ template:', error)
      throw error
    }
  },
  downloadUploadedFile: async (id, filename = 'uploaded_rfq.docx') => {
    try {
      const res = await apiService.client.get(`/rfqs/${id}/download`, { responseType: 'blob' })
      const blob = new Blob([res], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download uploaded file:', error)
      throw error
    }
  },
}

// Estimations Service
export const estimationsService = {
  getAll: () => apiService.get('/estimations'),
  getById: (id) => apiService.get(`/estimations/${id}`),
  create: async (data) => {
    clearCache('/estimations')
    return await apiService.post('/estimations', data)
  },
  getTestTypes: () => apiService.get('/estimations/test-types'),
  getTestTypesHierarchy: () => apiService.get('/estimations/test-types/hierarchy'),
  uploadRateChart: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    clearCache('/estimations')
    return await apiService.post('/estimations/rate-chart/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  review: async (id, data) => {
    clearCache('/estimations')
    return await apiService.post(`/estimations/${id}/review`, data)
  },
  delete: async (id) => {
    clearCache('/estimations')
    return await apiService.delete(`/estimations/${id}`)
  },
  downloadRateChartTemplate: async () => {
    try {
      const res = await apiService.client.get('/uploads/Standard_Rate_Chart.pdf', { responseType: 'blob' })
      const blob = new Blob([res], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Standard_Rate_Chart.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download rate chart template:', error)
      throw error
    }
  },
}

// Projects Service
export const projectsService = {
  getAll: async (clientId) => {
    try {
      const url = clientId
        ? `/projects?client_id=${clientId}`
        : '/projects'
      return await apiService.get(url)
    } catch (error) {
      console.error('Error fetching projects:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/projects/${id}`),
  getActivity: (id) => apiService.get(`/projects/${id}/activity`),
  create: async (data) => {
    clearCache('/projects')
    return await apiService.post('/projects', data)
  },
  update: async (id, data) => {
    clearCache('/projects')
    return await apiService.put(`/projects/${id}`, data)
  },
  delete: async (id) => {
    clearCache('/projects')
    return await apiService.delete(`/projects/${id}`)
  },
}

// Dashboard Service (longer cache to avoid refetch on every nav)
export const dashboardService = {
  getSummary: async () => {
    const cacheKey = 'dashboard:summary'
    const cached = getCached(cacheKey, CACHE_TTL_LONG)
    if (cached) return cached

    await mockDelay()
    const data = {
      instrumentStatuses: [
        { status: 'Active', count: 12 },
        { status: 'Maintenance', count: 2 },
        { status: 'Calibration', count: 1 },
      ],
      toDoItems: [
        { id: 1, title: 'Review Test Plan for PROJ-001', type: 'review', dueDate: '2024-01-25' },
        { id: 2, title: 'Complete Sample Analysis', type: 'analysis', dueDate: '2024-01-26' },
      ],
      billingProgress: {
        target: 5000000,
        current: 3200000,
        percentage: 64,
      },
    }
    setCached(cacheKey, data)
    return data
  },
}

// Export cache utilities for manual cache clearing
export { clearCache, setCached, getCached }

// Test Plans Service
export const testPlansService = {
  getAll: async (projectId) => {
    try {
      const url = projectId
        ? `/test-plans?project_id=${projectId}`
        : '/test-plans'
      return await apiService.get(url)
    } catch (error) {
      console.error('Error fetching test plans:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/test-plans/${id}`),
  create: async (data) => {
    clearCache('/test-plans')
    return await apiService.post('/test-plans', data)
  },
  update: async (id, data) => {
    clearCache('/test-plans')
    return await apiService.put(`/test-plans/${id}`, data)
  },
  delete: async (id) => {
    clearCache('/test-plans')
    return await apiService.delete(`/test-plans/${id}`)
  },
}

// Test Executions Service
export const testExecutionsService = {
  getAll: async () => {
    try {
      return await apiService.get('/test-executions')
    } catch (error) {
      console.error('Error fetching test executions:', error)
      throw error
    }
  },
  getByTestPlan: async (testPlanId) => {
    try {
      return await apiService.get(`/test-executions?test_plan_id=${testPlanId}`)
    } catch (error) {
      console.error('Error fetching test executions:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/test-executions/${id}`),
  create: async (data) => {
    clearCache('/test-executions')
    return await apiService.post('/test-executions', data)
  },
  update: async (id, data) => {
    clearCache('/test-executions')
    return await apiService.put(`/test-executions/${id}`, data)
  },
  start: async (id) => {
    clearCache('/test-executions')
    return await apiService.post(`/test-executions/${id}/start`, {})
  },
  complete: async (id) => {
    clearCache('/test-executions')
    return await apiService.post(`/test-executions/${id}/complete`, {})
  },
}

// Test Results Service
export const testResultsService = {
  getAll: async () => {
    try {
      return await apiService.get('/test-results')
    } catch (error) {
      console.error('Error fetching test results:', error)
      throw error
    }
  },
  getByExecution: async (executionId) => {
    try {
      return await apiService.get(`/test-results?execution_id=${executionId}`)
    } catch (error) {
      console.error('Error fetching test results:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/test-results/${id}`),
  create: async (data) => {
    clearCache('/test-results')
    return await apiService.post('/test-results', data)
  },
  update: async (id, data) => {
    clearCache('/test-results')
    return await apiService.put(`/test-results/${id}`, data)
  },
}

// Samples Service
export const samplesService = {
  getAll: async (projectId) => {
    try {
      const url = projectId
        ? `/samples?projectId=${projectId}`
        : '/samples'
      return await apiService.get(url)
    } catch (error) {
      console.error('Error fetching samples:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/samples/${id}`),
  create: async (data) => {
    clearCache('/samples')
    return await apiService.post('/samples', data)
  },
  update: async (id, data) => {
    clearCache('/samples')
    return await apiService.put(`/samples/${id}`, data)
  },
  delete: async (id) => {
    clearCache('/samples')
    return await apiService.delete(`/samples/${id}`)
  },
}

// TRFs Service
export const trfsService = {
  getAll: async (projectId) => {
    try {
      const url = projectId
        ? `/trfs?project_id=${projectId}`
        : '/trfs'
      return await apiService.get(url)
    } catch (error) {
      console.error('Error fetching TRFs:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/trfs/${id}`),
  create: async (data) => {
    clearCache('/trfs')
    return await apiService.post('/trfs', data)
  },
  update: async (id, data) => {
    clearCache('/trfs')
    return await apiService.put(`/trfs/${id}`, data)
  },
  updateStatus: async (id, status, approvedBy) => {
    clearCache('/trfs')
    return await apiService.patch(`/trfs/${id}/status`, { status, approved_by: approvedBy || null })
  },
  delete: async (id) => {
    clearCache('/trfs')
    return await apiService.delete(`/trfs/${id}`)
  },
}

// Documents Service
export const documentsService = {
  /**
   * Get all documents
   */
  getAll: async () => {
    return apiService.get('/documents')
  },

  /**
   * Upload document (multipart/form-data)
   * IMPORTANT: bypass apiService.post to avoid JSON header
   */
  create: async (formData) => {
    clearCache('/documents')
    // apiService.client.post via unified api.js will auto-inject token
    const response = await apiService.client.post('/documents/', formData, {
      headers: {
        'Content-Type': undefined
      }
    })
    return response
  },

  /**
   * Download document (binary)
   * IMPORTANT: use axios client directly
   */
  download: async (id) => {
    const response = await apiService.client.get(
      `/documents/${id}/download`,
      {
        responseType: 'blob',
      }
    )
    return response
  },

  /**
   * Delete document (future-ready)
   */
  delete: async (id) => {
    clearCache('/documents')
    return apiService.delete(`/documents/${id}`)
  },
}

// Reports Service
export const reportsService = {
  /**
   * Get all reports
   */
  getAll: async () => {
    return apiService.get('/reports')
  },

  /**
   * Upload report (multipart/form-data)
   */
  create: async (formData) => {
    clearCache('/reports')
    const response = await apiService.client.post(
      '/reports',
      formData,
      {
        headers: {
          'Content-Type': undefined,
        },
      }
    )
    return response
  },

  /**
   * Download report file
   */
  download: async (id) => {
    const response = await apiService.client.get(
      `/reports/${id}/download`,
      {
        responseType: 'blob',
      }
    )
    return response
  },

  /**
   * Delete report
   */
  delete: async (id) => {
    return apiService.delete(`/reports/${id}`)
  },
}

// Audits Service
export const auditsService = {
  getAll: () => apiService.get('/audits-section'),
  getById: (id) => apiService.get(`/audits-section/${id}`),
  create: (data) => {
    clearCache('/audits-section')
    return apiService.post('/audits-section', data)
  },
}

// NCRs Service
export const ncrsService = {
  getAll: () => apiService.get('/ncrs'),
  getById: (id) => apiService.get(`/ncrs/${id}`),
  create: (data) => {
    clearCache('/ncrs')
    return apiService.post('/ncrs', data)
  },
}

// Certifications Service
export const certificationsService = {
  getAll: () => apiService.get('/certifications'),
  getById: (id) => apiService.get(`/certifications/${id}`),
  create: (data) => {
    clearCache('/certifications')
    return apiService.post('/certifications', data)
  },
}

// Inventory Management Services

// Instruments Service
export const instrumentsService = {
  getAll: async (params) => {
    try {
      return await apiService.get('/instruments', { params })
    } catch (error) {
      console.error('Error fetching instruments:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/instruments/${id}`),
  create: async (data) => {
    clearCache('/instruments')
    return await apiService.post('/instruments', data)
  },
  update: async (id, data) => {
    clearCache('/instruments')
    return await apiService.put(`/instruments/${id}`, data)
  },
  deactivate: async (id) => {
    clearCache('/instruments')
    return await apiService.patch(`/instruments/${id}/deactivate`, {})
  },
  delete: async (id) => {
    clearCache('/instruments')
    return await apiService.delete(`/instruments/${id}`)
  },
}

// Calibration Service
export const calibrationsService = {
  getAll: async (instrumentId) => {
    try {
      const url = instrumentId
        ? `/calibrations?instrument_id=${instrumentId}`
        : '/calibrations'
      return await apiService.get(url)
    } catch (error) {
      console.error('Error fetching calibrations:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/calibrations/${id}`),
  create: async (data) => {
    clearCache('/calibrations')
    return await apiService.post('/calibrations', data)
  },
  update: async (id, data) => {
    clearCache('/calibrations')
    return await apiService.put(`/calibrations/${id}`, data)
  },
  delete: async (id) => {
    clearCache('/calibrations')
    return await apiService.delete(`/calibrations/${id}`)
  },
}



// Inventory Reports Service
export const inventoryReportsService = {
  getSummary: async () => {
    const cacheKey = 'inventory:summary'
    const cached = getCached(cacheKey)
    if (cached) return cached

    await mockDelay()
    const data = {
      totalInstruments: 12,
      activeInstruments: 10,
      instrumentsUnderMaintenance: 2,
      totalConsumables: 45,
      lowStockItems: 3,
      expiringItems: 2,
      upcomingCalibrations: 5,
      overdueCalibrations: 1,
    }
    setCached(cacheKey, data)
    return data
  },
  getCalibrationCompliance: async () => {
    const cacheKey = 'inventory:calibration:compliance'
    const cached = getCached(cacheKey)
    if (cached) return cached

    await mockDelay()
    const data = {
      totalInstruments: 12,
      calibrated: 10,
      dueSoon: 2,
      overdue: 0,
      complianceRate: 83.3,
    }
    setCached(cacheKey, data)
    return data
  },
  getInstrumentUtilization: async () => {
    const cacheKey = 'inventory:instrument:utilization'
    const cached = getCached(cacheKey)
    if (cached) return cached

    await mockDelay()
    const data = []
    setCached(cacheKey, data)
    return data
  },
}

// Quality Assurance Services

// SOP Management Service
export const sopService = {
  getAll: async () => {
    try {
      return await apiService.get('/sops')
    } catch (error) {
      console.error('Error fetching SOPs:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/sops/${id}`),
  create: async (data) => {
    clearCache('/sops')
    return await apiService.post('/sops', data)
  },
  update: async (id, data) => {
    clearCache('/sops')
    return await apiService.put(`/sops/${id}`, data)
  },
  delete: async (id) => {
    clearCache('/sops')
    return await apiService.delete(`/sops/${id}`)
  },
  upload: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('doc_type', 'sop')
    return await apiService.client.post('/files/upload/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

// Quality Control Checks Service
export const qcService = {
  getAll: async () => {
    try {
      return await apiService.get('/qc-checks')
    } catch (error) {
      console.error('Error fetching QC checks:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/qc-checks/${id}`),
  create: async (data) => {
    clearCache('/qc-checks')
    return await apiService.post('/qc-checks', data)
  },
  update: async (id, data) => {
    clearCache('/qc-checks')
    return await apiService.put(`/qc-checks/${id}`, data)
  },
  recordResult: async (id, result) => {
    clearCache('/qc-checks')
    return await apiService.post(`/qc-checks/${id}/record-result`, result)
  },
  delete: async (id) => {
    clearCache('/qc-checks')
    return await apiService.delete(`/qc-checks/${id}`)
  },
}

// Audit & Compliance Service
export const auditService = {
  getAll: async () => {
    try {
      return await apiService.get('/audits')
    } catch (error) {
      console.error('Error fetching audits:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/audits/${id}`),
  create: async (data) => {
    clearCache('/audits')
    return await apiService.post('/audits', data)
  },
  update: async (id, data) => {
    clearCache('/audits')
    return await apiService.put(`/audits/${id}`, data)
  },
  delete: async (id) => {
    clearCache('/audits')
    return await apiService.delete(`/audits/${id}`)
  },
}

// Consumables Service
export const consumablesService = {
  getAll: async () => {
    try {
      return await apiService.get('/consumables')
    } catch (error) {
      console.error('Error fetching consumables:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/consumables/${id}`),
  create: async (data) => {
    clearCache('/consumables')
    return await apiService.post('/consumables', data)
  },
  update: async (id, data) => {
    clearCache('/consumables')
    return await apiService.put(`/consumables/${id}`, data)
  },
  delete: async (id) => {
    clearCache('/consumables')
    return await apiService.delete(`/consumables/${id}`)
  },
}

// Inventory Transactions Service
export const inventoryTransactionsService = {
  getAll: async (params) => {
    try {
      return await apiService.get('/inventory-transactions', { params })
    } catch (error) {
      console.error('Error fetching transactions:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/inventory-transactions/${id}`),
  create: async (data) => {
    clearCache('/inventory-transactions')
    clearCache('/consumables')
    clearCache('/instruments')
    return await apiService.post('/inventory-transactions', data)
  },
  update: async (id, data) => {
    clearCache('/inventory-transactions')
    clearCache('/consumables')
    clearCache('/instruments')
    return await apiService.put(`/inventory-transactions/${id}`, data)
  },
  delete: async (id) => {
    clearCache('/inventory-transactions')
    clearCache('/consumables')
    clearCache('/instruments')
    return await apiService.delete(`/inventory-transactions/${id}`)
  },
}

// Non-Conformance & CAPA Service
export const ncCapaService = {
  getAll: async () => {
    try {
      return await apiService.get('/nc-capa')
    } catch (error) {
      console.error('Error fetching NC/CAPA:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/nc-capa/${id}`),
  create: async (data) => {
    clearCache('/nc-capa')
    return await apiService.post('/nc-capa', data)
  },
  update: async (id, data) => {
    clearCache('/nc-capa')
    return await apiService.put(`/nc-capa/${id}`, data)
  },
  close: async (id, closureData) => {
    clearCache('/nc-capa')
    return await apiService.patch(`/nc-capa/${id}/close`, closureData)
  },
  delete: async (id) => {
    clearCache('/nc-capa')
    return await apiService.delete(`/nc-capa/${id}`)
  },
}

// Document Control Service
// Document Control Service
export const documentControlService = {
  getAll: async () => {
    try {
      return await apiService.get('/qc-documents')
    } catch (error) {
      console.error('Error fetching documents:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/qc-documents/${id}`),
  create: async (data) => {
    clearCache('/qc-documents')
    return await apiService.post('/qc-documents', data)
  },
  update: async (id, data) => {
    clearCache('/qc-documents')
    return await apiService.put(`/qc-documents/${id}`, data)
  },
  lock: async (id) => {
    clearCache('/qc-documents')
    return await apiService.patch(`/qc-documents/${id}/lock`)
  },
  unlock: async (id) => {
    clearCache('/qc-documents')
    return await apiService.patch(`/qc-documents/${id}/unlock`)
  },
  delete: async (id) => {
    clearCache('/qc-documents')
    return await apiService.delete(`/qc-documents/${id}`)
  },
  upload: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('doc_type', 'qc-document')
    return await apiService.client.post('/files/upload/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

// QA Reports Service
export const qaReportsService = {
  getComplianceScore: async () => {
    try {
      // Fetch real data from all QA endpoints to calculate compliance
      const [sops, documents, qcChecks, audits] = await Promise.all([
        apiService.get('/sops'),
        apiService.get('/qc-documents'),
        apiService.get('/qc-checks'),
        apiService.get('/audits')
      ])

      // Calculate compliance scores based on actual data
      const sopCompliance = sops.length > 0 ? Math.min(100, (sops.filter(s => s.status === 'Active').length / sops.length) * 100) : 100
      const documentControl = documents.length > 0 ? Math.min(100, (documents.filter(d => d.status === 'Active').length / documents.length) * 100) : 100
      const qcCompliance = qcChecks.length > 0 ? Math.min(100, (qcChecks.filter(q => q.status === 'Pass' || !q.status).length / qcChecks.length) * 100) : 100
      const auditCompliance = audits.length > 0 ? Math.min(100, (audits.filter(a => a.status === 'Completed').length / audits.length) * 100) : 100

      const overallScore = (sopCompliance + documentControl + qcCompliance + auditCompliance) / 4

      return {
        overallScore: Math.round(overallScore * 10) / 10,
        sopCompliance: Math.round(sopCompliance),
        calibrationCompliance: 85, // TODO: Add calibration data
        qcCompliance: Math.round(qcCompliance),
        auditCompliance: Math.round(auditCompliance),
        documentControl: Math.round(documentControl),
        trends: [] // TODO: Implement trend tracking
      }
    } catch (error) {
      console.error('Error fetching compliance score:', error)
      // Return default values on error
      return {
        overallScore: 0,
        sopCompliance: 0,
        calibrationCompliance: 0,
        qcCompliance: 0,
        auditCompliance: 0,
        documentControl: 0,
        trends: []
      }
    }
  },
  getOverdueCAPA: async () => {
    try {
      const ncCapa = await apiService.get('/nc-capa')
      const today = new Date()

      // Filter for overdue items
      return ncCapa
        .filter(item => {
          if (item.status === 'Closed') return false
          const dueDate = new Date(item.dueDate)
          return dueDate < today
        })
        .map(item => ({
          ncId: item.ncId,
          description: item.description,
          dueDate: item.dueDate,
          daysOverdue: Math.floor((today - new Date(item.dueDate)) / (1000 * 60 * 60 * 24)),
          owner: item.actionOwner,
          severity: item.severity
        }))
    } catch (error) {
      console.error('Error fetching overdue CAPA:', error)
      return []
    }
  },
  getSOPReviewReminders: async () => {
    try {
      const sops = await apiService.get('/sops')
      const today = new Date()
      const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000))

      // Filter SOPs with review dates in the next 30 days
      return sops
        .filter(sop => {
          if (!sop.nextReviewDate) return false
          const reviewDate = new Date(sop.nextReviewDate)
          return reviewDate >= today && reviewDate <= thirtyDaysFromNow
        })
        .map(sop => {
          const reviewDate = new Date(sop.nextReviewDate)
          const daysUntilReview = Math.floor((reviewDate - today) / (1000 * 60 * 60 * 24))
          return {
            sopId: sop.sopId,
            title: sop.title,
            nextReviewDate: sop.nextReviewDate,
            daysUntilReview,
            status: sop.status
          }
        })
    } catch (error) {
      console.error('Error fetching SOP reminders:', error)
      return []
    }
  },
  getAuditReadiness: async () => {
    try {
      const [sops, qcChecks, documents, ncCapa] = await Promise.all([
        apiService.get('/sops'),
        apiService.get('/qc-checks'),
        apiService.get('/qc-documents'),
        apiService.get('/nc-capa')
      ])

      const today = new Date()

      // Calculate metrics
      const expiredSOPs = sops.filter(s => s.nextReviewDate && new Date(s.nextReviewDate) < today).length
      const overdueCAPA = ncCapa.filter(nc => nc.status !== 'Closed' && new Date(nc.dueDate) < today).length
      const openFindings = ncCapa.filter(nc => nc.status === 'Open').length

      // Calculate area scores
      const sopScore = sops.length > 0 ? Math.min(100, ((sops.length - expiredSOPs) / sops.length) * 100) : 100
      const qcScore = qcChecks.length > 0 ? Math.min(100, (qcChecks.filter(q => q.status === 'Pass' || !q.status).length / qcChecks.length) * 100) : 100
      const docScore = documents.length > 0 ? Math.min(100, (documents.filter(d => d.status === 'Active').length / documents.length) * 100) : 100

      const areas = [
        { area: 'SOP Management', status: sopScore >= 90 ? 'Ready' : 'Needs Attention', score: Math.round(sopScore) },
        { area: 'Calibration', status: 'Needs Attention', score: 75 }, // TODO: Add calibration data
        { area: 'QC Checks', status: qcScore >= 90 ? 'Ready' : 'Needs Attention', score: Math.round(qcScore) },
        { area: 'Document Control', status: docScore >= 90 ? 'Ready' : 'Needs Attention', score: Math.round(docScore) }
      ]

      const readinessScore = Math.round(areas.reduce((sum, area) => sum + area.score, 0) / areas.length)

      return {
        readinessScore,
        openFindings,
        overdueCAPA,
        expiredSOPs,
        missingCalibrations: 0, // TODO: Add calibration data
        areas
      }
    } catch (error) {
      console.error('Error fetching audit readiness:', error)
      return {
        readinessScore: 0,
        openFindings: 0,
        overdueCAPA: 0,
        expiredSOPs: 0,
        missingCalibrations: 0,
        areas: []
      }
    }
  },
}



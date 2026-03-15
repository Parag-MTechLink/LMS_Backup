import axios from 'axios'

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

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds timeout
    })

    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('labManagementAccessToken') || localStorage.getItem('accessToken')
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = localStorage.getItem('labManagementRefreshToken') || localStorage.getItem('refreshToken')
            if (refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
                refreshToken,
              })

              localStorage.setItem('labManagementAccessToken', response.data.accessToken)
              localStorage.setItem('labManagementRefreshToken', response.data.refreshToken)

              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`
              }

              return this.client(originalRequest)
            }
          } catch (refreshError) {
            localStorage.removeItem('labManagementAccessToken')
            localStorage.removeItem('labManagementRefreshToken')
            localStorage.removeItem('labManagementUser')
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        } else if (error.response?.status === 401) {
          localStorage.removeItem('labManagementAccessToken')
          localStorage.removeItem('labManagementUser')
          window.location.href = '/login'
        }

        return Promise.reject(error)
      }
    )
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
    const inFlight = this._getPromises.get(key)
    if (inFlight) return inFlight
    const promise = this.client.get(url, config).then((r) => r.data)
    this._getPromises.set(key, promise)
    promise.finally(() => this._getPromises.delete(key))
    return promise
  }

  async post(url, data, config = {}) {
    const response = await this.client.post(url, data, config)
    return response.data
  }

  async put(url, data, config = {}) {
    const response = await this.client.put(url, data, config)
    return response.data
  }

  async delete(url) {
    const response = await this.client.delete(url)
    return response.data
  }

  async patch(url, data, config = {}) {
    const response = await this.client.patch(url, data, config)
    return response.data
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
    apiService.post('/api/v1/auth/login', { email, password }),
  signup: (data) =>
    apiService.post('/api/v1/auth/signup', data),
  me: async () => {
    const cached = getCached('auth:me', CACHE_TTL_USER)
    if (cached) return cached
    const data = await apiService.get('/api/v1/auth/me')
    setCached('auth:me', data)
    return data
  },
  getAllUsers: () => apiService.get('/api/v1/auth/users'),
  deleteUser: (userId) => apiService.delete(`/api/v1/auth/users/${userId}`),
  verifyMfa: (email, code) =>
    apiService.post('/api/v1/auth/verify-mfa', { email, code }),
}

// Lab recommendations (engine under /api/v1/labs; requires LAB_ENGINE_DATABASE_URL on backend)
export const labsService = {
  health: () => apiService.get('/api/v1/labs/health'),
  getDomains: () => apiService.get('/api/v1/labs/domains'),
  getLocations: () => apiService.get('/api/v1/labs/locations'),
  getStatistics: () => apiService.get('/api/v1/labs/statistics'),
  searchLabsByName: (params) => apiService.get('/api/v1/labs/by-name', { params }),
  getRecommendations: (body) => apiService.post('/api/v1/labs/recommend', body),
  searchLabs: (params) => apiService.get('/api/v1/labs/search', { params }),
  getLabDetails: (labId) => apiService.get(`/api/v1/labs/${labId}`),
  searchTests: (params) => apiService.get('/api/v1/labs/tests/search', { params }),
  searchStandards: (params) => apiService.get('/api/v1/labs/standards/search', { params }),
}

// Customers Service
export const customersService = {
  getAll: async () => {
    try {
      return await apiService.get('/api/v1/customers')
    } catch (error) {
      console.error('Error fetching customers:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/api/v1/customers/${id}`),
  create: async (data) => {
    clearCache('customers:')
    return await apiService.post('/api/v1/customers', data)
  },
  update: async (id, data) => {
    clearCache('customers:')
    return await apiService.put(`/api/v1/customers/${id}`, data)
  },
  delete: async (id) => {
    clearCache('customers:')
    return await apiService.delete(`/api/v1/customers/${id}`)
  },
}

// RFQs Service
export const rfqsService = {
  getAll: async () => {
    try {
      return await apiService.get('/api/v1/rfqs')
    } catch (error) {
      console.error('Error fetching RFQs:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/api/v1/rfqs/${id}`),
  create: async (data) => {
    clearCache('rfqs:')
    return await apiService.post('/api/v1/rfqs', data)
  },
  /** Upload RFQ from Excel (.xlsx). Returns { status, missing_fields? } or { status, message, request_id?, rfq_id? }. */
  uploadExcel: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return await apiService.post('/api/v1/rfq/upload', formData)
  },
  /** Download RFQ Excel template (triggers file download in browser). */
  downloadTemplate: async () => {
    const res = await apiService.client.get('/api/v1/rfq/template', { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rfq_upload_template.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  },
  delete: async (id) => {
    clearCache('rfqs:')
    return await apiService.delete(`/api/v1/rfqs/${id}`)
  },
}

// Estimations Service
export const estimationsService = {
  getAll: async () => {
    try {
      return await apiService.get('/api/v1/estimations')
    } catch (error) {
      console.error('Error fetching estimations:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/api/v1/estimations/${id}`),
  create: async (data) => {
    clearCache('estimations:')
    return await apiService.post('/api/v1/estimations', data)
  },
  review: async (id, data) => {
    clearCache('estimations:')
    return await apiService.post(`/api/v1/estimations/${id}/review`, data)
  },
  getTestTypes: async () => {
    try {
      return await apiService.get('/api/v1/estimations/test-types')
    } catch (error) {
      console.error('Error fetching test types:', error)
      // Fallback for demo if API fails
      return [
        { id: 1, name: 'EMC Testing', hsnCode: '9030', defaultRate: 5000 },
        { id: 2, name: 'RF Testing', hsnCode: '9030', defaultRate: 6000 },
        { id: 3, name: 'Safety Testing', hsnCode: '9030', defaultRate: 4500 },
      ]
    }
  },
}

// Projects Service
export const projectsService = {
  getAll: async (clientId) => {
    try {
      const url = clientId
        ? `/api/v1/projects?client_id=${clientId}`
        : '/api/v1/projects'
      return await apiService.get(url)
    } catch (error) {
      console.error('Error fetching projects:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/api/v1/projects/${id}`),
  create: async (data) => {
    clearCache('projects:')
    return await apiService.post('/api/v1/projects', data)
  },
  update: async (id, data) => {
    clearCache('projects:')
    return await apiService.put(`/api/v1/projects/${id}`, data)
  },
  delete: async (id) => {
    clearCache('projects:')
    return await apiService.delete(`/api/v1/projects/${id}`)
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
        ? `/api/v1/test-plans?project_id=${projectId}`
        : '/api/v1/test-plans'
      return await apiService.get(url)
    } catch (error) {
      console.error('Error fetching test plans:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/api/v1/test-plans/${id}`),
  create: async (data) => {
    clearCache('testPlans:')
    return await apiService.post('/api/v1/test-plans', data)
  },
  update: async (id, data) => {
    clearCache('testPlans:')
    return await apiService.put(`/api/v1/test-plans/${id}`, data)
  },
  delete: async (id) => {
    clearCache('testPlans:')
    return await apiService.delete(`/api/v1/test-plans/${id}`)
  },
}

// Test Executions Service
export const testExecutionsService = {
  getAll: async () => {
    try {
      return await apiService.get('/api/v1/test-executions')
    } catch (error) {
      console.error('Error fetching test executions:', error)
      throw error
    }
  },
  getByTestPlan: async (testPlanId) => {
    try {
      return await apiService.get(`/api/v1/test-executions?test_plan_id=${testPlanId}`)
    } catch (error) {
      console.error('Error fetching test executions:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/api/v1/test-executions/${id}`),
  create: async (data) => {
    clearCache('testExecutions:')
    return await apiService.post('/api/v1/test-executions', data)
  },
  update: async (id, data) => {
    clearCache('testExecutions:')
    return await apiService.put(`/api/v1/test-executions/${id}`, data)
  },
  start: async (id) => {
    clearCache('testExecutions:')
    return await apiService.post(`/api/v1/test-executions/${id}/start`, {})
  },
  complete: async (id) => {
    clearCache('testExecutions:')
    return await apiService.post(`/api/v1/test-executions/${id}/complete`, {})
  },
}

// Test Results Service
export const testResultsService = {
  getAll: async () => {
    try {
      return await apiService.get('/api/v1/test-results')
    } catch (error) {
      console.error('Error fetching test results:', error)
      throw error
    }
  },
  getByExecution: async (executionId) => {
    try {
      return await apiService.get(`/api/v1/test-results?execution_id=${executionId}`)
    } catch (error) {
      console.error('Error fetching test results:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/api/v1/test-results/${id}`),
  create: async (data) => {
    clearCache('testResults:')
    return await apiService.post('/api/v1/test-results', data)
  },
  update: async (id, data) => {
    clearCache('testResults:')
    return await apiService.put(`/api/v1/test-results/${id}`, data)
  },
}

// Samples Service
export const samplesService = {
  getAll: async (projectId) => {
    try {
      const url = projectId
        ? `/api/v1/samples?projectId=${projectId}`
        : '/api/v1/samples'
      return await apiService.get(url)
    } catch (error) {
      console.error('Error fetching samples:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/api/v1/samples/${id}`),
  create: async (data) => {
    return await apiService.post('/api/v1/samples', data)
  },
  update: async (id, data) => {
    return await apiService.put(`/api/v1/samples/${id}`, data)
  },
  delete: async (id) => {
    return await apiService.delete(`/api/v1/samples/${id}`)
  },
}

// TRFs Service
export const trfsService = {
  getAll: async (projectId) => {
    try {
      // Backend currently doesn't support project filtering for TRFs, but passing it anyway if implemented later
      // or filtering client side if needed. For now assuming /trfs returns all.
      return await apiService.get('/api/v1/trfs')
    } catch (error) {
      console.error('Error fetching TRFs:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/api/v1/trfs/${id}`),
  create: async (data) => {
    return await apiService.post('/api/v1/trfs', data)
  },
  update: async (id, data) => {
    return await apiService.put(`/api/v1/trfs/${id}`, data)
  },
  delete: async (id) => {
    return await apiService.delete(`/api/v1/trfs/${id}`)
  },
}

// Documents Service
export const documentsService = {
  /**
   * Get all documents
   */
  getAll: async () => {
    return apiService.get('/api/v1/documents')
  },

  /**
   * Upload document (multipart/form-data)
   * IMPORTANT: bypass apiService.post to avoid JSON header
   */
  create: async (formData) => {
    const response = await apiService.client.post(
      '/api/v1/documents',
      formData,
      {
        headers: {
          'Content-Type': undefined,
        },
      }
    )
    return response.data
  },

  /**
   * Download document (binary)
   * IMPORTANT: use axios client directly
   */
  download: async (id) => {
    const response = await apiService.client.get(
      `/api/v1/documents/${id}/download`,
      {
        responseType: 'blob',
      }
    )
    return response.data
  },

  /**
   * Delete document (future-ready)
   */
  delete: async (id) => {
    return apiService.delete(`/api/v1/documents/${id}`)
  },
}

// Reports Service
export const reportsService = {
  /**
   * Get all reports
   */
  getAll: async () => {
    return apiService.get('/api/v1/reports')
  },

  /**
   * Upload report (multipart/form-data)
   */
  create: async (formData) => {
    const response = await apiService.client.post(
      '/api/v1/reports',
      formData,
      {
        headers: {
          'Content-Type': undefined,
        },
      }
    )
    return response.data
  },

  /**
   * Download report file
   */
  download: async (id) => {
    const response = await apiService.client.get(
      `/api/v1/reports/${id}/download`,
      {
        responseType: 'blob',
      }
    )
    return response.data
  },

  /**
   * Delete report
   */
  delete: async (id) => {
    return apiService.delete(`/api/v1/reports/${id}`)
  },
}

// Audits Service
export const auditsService = {
  getAll: () => apiService.get('/api/v1/audits-section'),
  getById: (id) => apiService.get(`/api/v1/audits-section/${id}`),
  create: (data) => apiService.post('/api/v1/audits-section', data),
}

// NCRs Service
export const ncrsService = {
  getAll: () => apiService.get('/api/v1/ncrs'),
  getById: (id) => apiService.get(`/api/v1/ncrs/${id}`),
  create: (data) => apiService.post('/api/v1/ncrs', data),
}

// Certifications Service
export const certificationsService = {
  getAll: () => apiService.get('/api/v1/certifications'),
  getById: (id) => apiService.get(`/api/v1/certifications/${id}`),
  create: (data) => apiService.post('/api/v1/certifications', data),
}

// Inventory Management Services

// Instruments Service
export const instrumentsService = {
  getAll: async () => {
    try {
      return await apiService.get('/api/v1/instruments')
    } catch (error) {
      console.error('Error fetching instruments:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/api/v1/instruments/${id}`),
  create: async (data) => {
    clearCache('instruments:')
    return await apiService.post('/api/v1/instruments', data)
  },
  update: async (id, data) => {
    clearCache('instruments:')
    return await apiService.put(`/api/v1/instruments/${id}`, data)
  },
  deactivate: async (id) => {
    clearCache('instruments:')
    return await apiService.patch(`/api/v1/instruments/${id}/deactivate`, {})
  },
}

// Calibration Service
export const calibrationsService = {
  getAll: async (instrumentId) => {
    try {
      const url = instrumentId
        ? `/api/v1/calibrations?instrument_id=${instrumentId}`
        : '/api/v1/calibrations'
      return await apiService.get(url)
    } catch (error) {
      console.error('Error fetching calibrations:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/api/v1/calibrations/${id}`),
  create: async (data) => {
    clearCache('calibrations:')
    return await apiService.post('/api/v1/calibrations', data)
  },
  update: async (id, data) => {
    clearCache('calibrations:')
    return await apiService.put(`/api/v1/calibrations/${id}`, data)
  },
  delete: async (id) => {
    clearCache('calibrations:')
    return await apiService.delete(`/api/v1/calibrations/${id}`)
  },
}

// Maintenance Service
export const maintenanceService = {
  getAll: async (itemId) => {
    const cacheKey = itemId ? `transactions:item:${itemId}` : 'transactions:all'
    const cached = getCached(cacheKey)
    if (cached) return cached

    await mockDelay()
    const data = [
      {
        id: 1,
        transactionId: 'TXN-001',
        itemId: 1,
        itemName: 'EMC Test Probes',
        itemType: 'Consumable',
        transactionType: 'Usage',
        quantity: 5,
        usedBy: 'John Doe',
        purpose: 'EMC Testing - Project Alpha',
        linkedTestId: 1,
        linkedTestName: 'EMC Compliance Test',
        date: '2024-01-20',
        notes: 'Used for emission testing',
        createdAt: '2024-01-20T10:00:00Z'
      },
      {
        id: 2,
        transactionId: 'TXN-002',
        itemId: 1,
        itemName: 'EMC Test Probes',
        itemType: 'Consumable',
        transactionType: 'Addition',
        quantity: 30,
        usedBy: 'Inventory Manager',
        purpose: 'Stock Replenishment',
        linkedTestId: null,
        linkedTestName: null,
        date: '2024-01-15',
        notes: 'New stock received',
        createdAt: '2024-01-15T10:00:00Z'
      },
    ]
    const filtered = itemId
      ? data.filter(txn => txn.itemId === parseInt(itemId))
      : data
    setCached(cacheKey, filtered)
    return filtered
  },
  getById: (id) => apiService.get(`/api/inventory-transactions/${id}`),
  create: (data) => {
    clearCache('transactions:')
    clearCache('consumables:')
    return apiService.post('/api/inventory-transactions', data)
  },
  getByDateRange: async (startDate, endDate) => {
    const cacheKey = `transactions:range:${startDate}:${endDate}`
    const cached = getCached(cacheKey)
    if (cached) return cached

    await mockDelay()
    const data = []
    setCached(cacheKey, data)
    return data
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
      return await apiService.get('/api/v1/sops')
    } catch (error) {
      console.error('Error fetching SOPs:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/api/v1/sops/${id}`),
  create: async (data) => {
    return await apiService.post('/api/v1/sops', data)
  },
  update: async (id, data) => {
    return await apiService.put(`/api/v1/sops/${id}`, data)
  },
  delete: async (id) => {
    return await apiService.delete(`/api/v1/sops/${id}`)
  },
}

// Quality Control Checks Service
export const qcService = {
  getAll: async () => {
    try {
      return await apiService.get('/api/v1/qc-checks')
    } catch (error) {
      console.error('Error fetching QC checks:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/api/v1/qc-checks/${id}`),
  create: async (data) => {
    return await apiService.post('/api/v1/qc-checks', data)
  },
  update: async (id, data) => {
    return await apiService.put(`/api/v1/qc-checks/${id}`, data)
  },
  recordResult: async (id, result) => {
    return await apiService.post(`/api/v1/qc-checks/${id}/record-result`, result)
  },
  delete: async (id) => {
    return await apiService.delete(`/api/v1/qc-checks/${id}`)
  },
}

// Audit & Compliance Service
export const auditService = {
  getAll: async () => {
    try {
      return await apiService.get('/api/v1/audits')
    } catch (error) {
      console.error('Error fetching audits:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/api/v1/audits/${id}`),
  create: async (data) => {
    return await apiService.post('/api/v1/audits', data)
  },
  update: async (id, data) => {
    return await apiService.put(`/api/v1/audits/${id}`, data)
  },
  delete: async (id) => {
    return await apiService.delete(`/api/v1/audits/${id}`)
  },
}

// Consumables Service
export const consumablesService = {
  getAll: async () => {
    try {
      return await apiService.get('/api/v1/consumables')
    } catch (error) {
      console.error('Error fetching consumables:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/api/v1/consumables/${id}`),
  create: async (data) => {
    clearCache('consumables:')
    return await apiService.post('/api/v1/consumables', data)
  },
  update: async (id, data) => {
    clearCache('consumables:')
    return await apiService.put('/api/v1/consumables/${id}', data)
  },
  delete: async (id) => {
    clearCache('consumables:')
    return await apiService.delete('/api/v1/consumables/${id}')
  },
}

// Inventory Transactions Service
export const inventoryTransactionsService = {
  getAll: async () => {
    try {
      return await apiService.get('/api/v1/inventory-transactions')
    } catch (error) {
      console.error('Error fetching transactions:', error)
      throw error
    }
  },
  getById: (id) => apiService.get('/api/v1/inventory-transactions/${id}'),
  create: async (data) => {
    clearCache('transactions:')
    return await apiService.post('/api/v1/inventory-transactions', data)
  },
}

// Non-Conformance & CAPA Service
export const ncCapaService = {
  getAll: async () => {
    try {
      return await apiService.get('/api/v1/nc-capa')
    } catch (error) {
      console.error('Error fetching NC/CAPA:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/api/v1/nc-capa/${id}`),
  create: async (data) => {
    return await apiService.post('/api/v1/nc-capa', data)
  },
  update: async (id, data) => {
    return await apiService.put(`/api/v1/nc-capa/${id}`, data)
  },
  close: async (id, closureData) => {
    return await apiService.patch(`/api/v1/nc-capa/${id}/close`, closureData)
  },
  delete: async (id) => {
    return await apiService.delete(`/api/v1/nc-capa/${id}`)
  },
}

// Document Control Service
// Document Control Service
export const documentControlService = {
  getAll: async () => {
    try {
      return await apiService.get('/api/v1/qc-documents')
    } catch (error) {
      console.error('Error fetching documents:', error)
      throw error
    }
  },
  getById: (id) => apiService.get(`/api/v1/qc-documents/${id}`),
  create: async (data) => {
    return await apiService.post('/api/v1/qc-documents', data)
  },
  update: async (id, data) => {
    return await apiService.put(`/api/v1/qc-documents/${id}`, data)
  },
  lock: async (id) => {
    return await apiService.patch(`/api/v1/qc-documents/${id}/lock`)
  },
  unlock: async (id) => {
    return await apiService.patch(`/api/v1/qc-documents/${id}/unlock`)
  },
  delete: async (id) => {
    return await apiService.delete(`/api/v1/qc-documents/${id}`)
  },
}

// QA Reports Service
export const qaReportsService = {
  getComplianceScore: async () => {
    try {
      // Fetch real data from all QA endpoints to calculate compliance
      const [sops, documents, qcChecks, audits] = await Promise.all([
        apiService.get('/api/v1/sops'),
        apiService.get('/api/v1/qc-documents'),
        apiService.get('/api/v1/qc-checks'),
        apiService.get('/api/v1/audits')
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
      const ncCapa = await apiService.get('/api/v1/nc-capa')
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
      const sops = await apiService.get('/api/v1/sops')
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
        apiService.get('/api/v1/sops'),
        apiService.get('/api/v1/qc-checks'),
        apiService.get('/api/v1/qc-documents'),
        apiService.get('/api/v1/nc-capa')
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



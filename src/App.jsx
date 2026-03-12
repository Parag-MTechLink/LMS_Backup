import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { lazy, Suspense } from 'react'
import { LabDataProvider } from './contexts/LabDataContext'
import { LabManagementAuthProvider, useLabManagementAuth } from './contexts/LabManagementAuthContext'
import LabManagementLayout from './layouts/LabManagementLayout'
import ErrorBoundary from './components/ErrorBoundary'
import RouteSkeleton from './components/RouteSkeleton'

const ChatbotWidget = lazy(() => import('./components/chatbot').then(m => ({ default: m.ChatbotWidget })))

const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))

// Lazy load lab management pages for better performance
const LabManagementDashboard = lazy(() => import('./pages/lab/management/Dashboard'))
const LabManagementOrganizationDetails = lazy(() => import('./pages/lab/management/OrganizationDetails'))
import LabManagementScopeManagement from './pages/lab/management/ScopeManagement'
const LabManagementCustomers = lazy(() => import('./pages/lab/management/Customers'))
const LabManagementProjects = lazy(() => import('./pages/lab/management/Projects'))
const LabManagementRFQs = lazy(() => import('./pages/lab/management/RFQs'))
const LabManagementEstimations = lazy(() => import('./pages/lab/management/Estimations'))
const LabManagementTestPlans = lazy(() => import('./pages/lab/management/TestPlans'))
const LabManagementTestPlanDetails = lazy(() => import('./pages/lab/management/TestPlanDetails'))
const LabManagementTestExecutions = lazy(() => import('./pages/lab/management/TestExecutions'))
const LabManagementTestResults = lazy(() => import('./pages/lab/management/TestResults'))
const LabManagementSamples = lazy(() => import('./pages/lab/management/Samples'))
const LabManagementSampleDetails = lazy(() => import('./pages/lab/management/SampleDetails'))
const LabManagementTRFs = lazy(() => import('./pages/lab/management/TRFs'))
const LabManagementDocuments = lazy(() => import('./pages/lab/management/Documents'))
const LabManagementReports = lazy(() => import('./pages/lab/management/Reports'))
const LabManagementAudits = lazy(() => import('./pages/lab/management/Audits'))
const LabManagementNCRs = lazy(() => import('./pages/lab/management/NCRs'))
const LabManagementCertifications = lazy(() => import('./pages/lab/management/Certifications'))
const ProjectDetail = lazy(() => import('./pages/lab/management/ProjectDetail'))
const PlaceholderPage = lazy(() => import('./pages/lab/management/PlaceholderPage'))
const LabManagementCalendar = lazy(() => import('./pages/lab/management/Calendar'))
const LabManagementRecommendations = lazy(() => import('./pages/lab/management/LabRecommendations'))
const Inventory = lazy(() => import('./pages/lab/management/Inventory'))
const InventoryInstruments = lazy(() => import('./pages/lab/management/InventoryInstruments'))
const InventoryCalibration = lazy(() => import('./pages/lab/management/InventoryCalibration'))
const InventoryConsumables = lazy(() => import('./pages/lab/management/InventoryConsumables'))
const InventoryTransactions = lazy(() => import('./pages/lab/management/InventoryTransactions'))
const InventoryReports = lazy(() => import('./pages/lab/management/InventoryReports'))
const QualityAssurance = lazy(() => import('./pages/lab/management/QualityAssurance'))
const QASOPManagement = lazy(() => import('./pages/lab/management/QASOPManagement'))
const QAQCChecks = lazy(() => import('./pages/lab/management/QAQCChecks'))
const QAAuditCompliance = lazy(() => import('./pages/lab/management/QAAuditCompliance'))
const QANCCAPA = lazy(() => import('./pages/lab/management/QANCCAPA'))
const QADocumentControl = lazy(() => import('./pages/lab/management/QADocumentControl'))
const QAAReports = lazy(() => import('./pages/lab/management/QAAReports'))
const Payment = lazy(() => import('./pages/lab/management/Payment'))
const UserManagement = lazy(() => import('./pages/lab/management/UserManagement'))

// Non-blocking skeleton for lazy routes (faster perceived load)
const RouteFallback = () => <RouteSkeleton />

function AnimatedRoutes() {
  const location = useLocation()

  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    animate: {
      opacity: 1,
      y: 0,
    },
    exit: {
      opacity: 0,
      y: -20,
    },
  }

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.4,
  }

  const { isAuthenticated, loading } = useLabManagementAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public: landing — redirect to dashboard if authenticated */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/lab/management/dashboard" replace />
            ) : (
              <Suspense fallback={<RouteFallback />}><Landing /></Suspense>
            )
          }
        />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/lab/management/dashboard" replace /> : <Suspense fallback={<RouteFallback />}><Login /></Suspense>} />
        <Route path="/signup" element={isAuthenticated ? <Navigate to="/lab/management/dashboard" replace /> : <Suspense fallback={<RouteFallback />}><Signup /></Suspense>} />

        {/* Protected: Lab Management — redirect to login if not authenticated */}
        <Route
          path="/lab/management"
          element={
            isAuthenticated ? (
              <LabManagementLayout />
            ) : (
              <Navigate to="/login" replace state={{ from: location.pathname }} />
            )
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Suspense fallback={<RouteFallback />}><LabManagementDashboard /></Suspense>} />
          <Route path="organization" element={<Suspense fallback={<RouteFallback />}><LabManagementOrganizationDetails /></Suspense>} />
          <Route path="scope-management" element={<LabManagementScopeManagement />} />
          <Route path="customers" element={<Suspense fallback={<RouteFallback />}><LabManagementCustomers /></Suspense>} />
          <Route path="rfqs" element={<Suspense fallback={<RouteFallback />}><LabManagementRFQs /></Suspense>} />
          <Route path="estimations" element={<Suspense fallback={<RouteFallback />}><LabManagementEstimations /></Suspense>} />
          <Route path="projects" element={<Suspense fallback={<RouteFallback />}><LabManagementProjects /></Suspense>} />
          <Route path="projects/:id" element={<Suspense fallback={<RouteFallback />}><ProjectDetail /></Suspense>} />
          <Route path="test-plans" element={<Suspense fallback={<RouteFallback />}><LabManagementTestPlans /></Suspense>} />
          <Route path="test-plans/:id" element={<Suspense fallback={<RouteFallback />}><LabManagementTestPlanDetails /></Suspense>} />
          <Route path="test-executions" element={<Suspense fallback={<RouteFallback />}><LabManagementTestExecutions /></Suspense>} />
          <Route path="test-executions/:id" element={<Suspense fallback={<RouteFallback />}><PlaceholderPage title="Test Execution Details" description="Detailed test execution information" /></Suspense>} />
          <Route path="test-results" element={<Suspense fallback={<RouteFallback />}><LabManagementTestResults /></Suspense>} />
          <Route path="test-results/:id" element={<Suspense fallback={<RouteFallback />}><PlaceholderPage title="Test Result Details" description="Detailed test result information" /></Suspense>} />
          <Route path="samples" element={<Suspense fallback={<RouteFallback />}><LabManagementSamples /></Suspense>} />
          <Route path="samples/:id" element={<Suspense fallback={<RouteFallback />}><LabManagementSampleDetails /></Suspense>} />
          <Route path="trfs" element={<Suspense fallback={<RouteFallback />}><LabManagementTRFs /></Suspense>} />
          <Route path="trfs/:id" element={<Suspense fallback={<RouteFallback />}><PlaceholderPage title="TRF Details" description="Detailed TRF information" /></Suspense>} />
          <Route path="documents" element={<Suspense fallback={<RouteFallback />}><LabManagementDocuments /></Suspense>} />
          <Route path="documents/:id" element={<Suspense fallback={<RouteFallback />}><PlaceholderPage title="Document Details" description="Detailed document information" /></Suspense>} />
          <Route path="reports" element={<Suspense fallback={<RouteFallback />}><LabManagementReports /></Suspense>} />
          <Route path="audits" element={<Suspense fallback={<RouteFallback />}><LabManagementAudits /></Suspense>} />
          <Route path="ncrs" element={<Suspense fallback={<RouteFallback />}><LabManagementNCRs /></Suspense>} />
          <Route path="certifications" element={<Suspense fallback={<RouteFallback />}><LabManagementCertifications /></Suspense>} />
          <Route path="calendar" element={<Suspense fallback={<RouteFallback />}><LabManagementCalendar /></Suspense>} />
          <Route path="lab-recommendations" element={<Suspense fallback={<RouteFallback />}><LabManagementRecommendations /></Suspense>} />
          <Route path="users" element={<Suspense fallback={<RouteFallback />}><UserManagement /></Suspense>} />

          {/* Inventory Management */}
          <Route path="inventory" element={<Suspense fallback={<RouteFallback />}><Inventory /></Suspense>} />
          <Route path="inventory/instruments" element={<Suspense fallback={<RouteFallback />}><InventoryInstruments /></Suspense>} />
          <Route path="inventory/calibration" element={<Suspense fallback={<RouteFallback />}><InventoryCalibration /></Suspense>} />
          <Route path="inventory/consumables" element={<Suspense fallback={<RouteFallback />}><InventoryConsumables /></Suspense>} />
          <Route path="inventory/transactions" element={<Suspense fallback={<RouteFallback />}><InventoryTransactions /></Suspense>} />
          <Route path="inventory/reports" element={<Suspense fallback={<RouteFallback />}><InventoryReports /></Suspense>} />
          <Route path="qa" element={<Suspense fallback={<RouteFallback />}><QualityAssurance /></Suspense>} />
          <Route path="qa/sop" element={<Suspense fallback={<RouteFallback />}><QASOPManagement /></Suspense>} />
          <Route path="qa/qc" element={<Suspense fallback={<RouteFallback />}><QAQCChecks /></Suspense>} />
          <Route path="qa/audit" element={<Suspense fallback={<RouteFallback />}><QAAuditCompliance /></Suspense>} />
          <Route path="qa/nc-capa" element={<Suspense fallback={<RouteFallback />}><QANCCAPA /></Suspense>} />
          <Route path="qa/documents" element={<Suspense fallback={<RouteFallback />}><QADocumentControl /></Suspense>} />
          <Route path="qa/reports" element={<Suspense fallback={<RouteFallback />}><QAAReports /></Suspense>} />
          <Route path="payment" element={<Suspense fallback={<RouteFallback />}><Payment /></Suspense>} />
        </Route>

        {/* Catch all: if authenticated go to dashboard, else landing */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/lab/management/dashboard" : "/"} replace />} />
      </Routes>
    </AnimatePresence>
  )
}

function AppContent() {
  const { user } = useLabManagementAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Chatbot configuration (use same backend as rest of app unless overridden)
  const chatbotConfig = {
    apiUrl: import.meta.env.VITE_CHATBOT_API_URL || `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/chat`,
    theme: 'light',
    position: 'bottom-right',
    enabled: import.meta.env.VITE_CHATBOT_ENABLED !== 'false',
    branding: {
      name: 'Lab Assistant',
      welcomeMessage: 'Hi! How can I help you with the Lab Management System?',
    },
  }

  const chatbotContext = {
    userId: user?.id?.toString() || '1',
    userRole: user?.role || 'engineer',
    currentPage: location.pathname,
    permissions: user?.permissions || [],
  }

  const handleChatbotAction = (action) => {
    switch (action.type) {
      case 'navigate':
        if (action.path) {
          navigate(action.path)
        }
        break
      case 'openModal':
        // Handle modal opening if needed
        console.log('Open modal:', action.modal, action.data)
        break
      case 'refresh':
        // Handle component refresh if needed
        window.location.reload()
        break
      default:
        console.log('Chatbot action:', action)
    }
  }

  const handleChatbotError = (error) => {
    console.error('Chatbot error:', error)
    // Could show toast notification here
  }

  const isPublicPage = ['/', '/login', '/signup'].includes(location.pathname)
  const showChatbot = !isPublicPage && chatbotConfig.enabled

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <AnimatedRoutes />
      </main>
      <Toaster
        position="top-right"
        containerStyle={{
          zIndex: 99999,
        }}
      />

      {/* Chatbot Widget - only on authenticated app (not landing, login, signup) */}
      {showChatbot && (
        <Suspense fallback={null}>
          <ChatbotWidget
            apiUrl={chatbotConfig.apiUrl}
            config={chatbotConfig}
            context={chatbotContext}
            onAction={handleChatbotAction}
            onError={handleChatbotError}
          />
        </Suspense>
      )}
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <LabManagementAuthProvider>
        <LabDataProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppContent />
          </Router>
        </LabDataProvider>
      </LabManagementAuthProvider>
    </ErrorBoundary>
  )
}

export default App

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  FlaskConical,
  Package,
  MessageCircle,
  TrendingUp,
  Shield,
  LogIn,
  UserPlus,
  CheckCircle2,
  Lock,
  Zap,
  Activity,
  Database,
  Server,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useLabManagementAuth } from '../contexts/LabManagementAuthContext'

const fadeUp = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } }

const features = [
  {
    icon: FileText,
    title: 'Intelligent RFQ Pipeline',
    description: 'Upload Excel RFQs and get structured quotes in minutes. Schema validation and workflow routing keep nothing falling through the cracks.',
    stat: 'Faster quotes',
  },
  {
    icon: FlaskConical,
    title: 'Test Lifecycle Management',
    description: 'Plan, execute, and report tests with full traceability. Approval workflows and audit trails built for compliance.',
    stat: 'Full traceability',
  },
  {
    icon: Package,
    title: 'Inventory & Sample Tracking',
    description: "Instruments, consumables, calibrations, and samples in one place. Usage and expiry alerts so you're never caught off guard.",
    stat: 'One source of truth',
  },
  {
    icon: MessageCircle,
    title: 'AI Lab Assistant',
    description: 'Ask procedures, calibration steps, or workflow questions in plain language. Answers are grounded in your own documentation.',
    stat: 'Instant answers',
  },
  {
    icon: TrendingUp,
    title: 'Lab Discovery & Recommendations',
    description: 'Find accredited labs by test, standard, or domain. Get ranked recommendations so you choose the right partner fast.',
    stat: 'Smarter sourcing',
  },
  {
    icon: Shield,
    title: 'Quality & Compliance',
    description: 'SOPs, QC checks, NCR/CAPA, audits, and document control. Role-based access keeps sensitive data in the right hands.',
    stat: 'Audit-ready',
  },
]

const roles = [
  { name: 'Admin', tagline: 'Full control and user management' },
  { name: 'Lab Manager', tagline: 'Approve RFQs, results, and QA' },
  { name: 'Sales Engineer', tagline: 'RFQs, estimations, customers' },
  { name: 'Team Lead', tagline: 'Plans, executions, results' },
  { name: 'Sales Engineer', tagline: 'RFQs, estimations, customers' },
]

const trustItems = [
  'Role-based access control',
  'Audit logging',
  'Secure authentication',
]

export default function Landing() {
  const navigate = useNavigate()
  const { login } = useLabManagementAuth()

  // Detect localhost — dev-only features are hidden in production
  const isLocalhost = typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname)

  // ── Health Check Modal state ─────────────────────────────────────
  const [showHealthModal, setShowHealthModal] = useState(false)
  const [healthLoading, setHealthLoading] = useState(false)
  const [healthData, setHealthData] = useState(null)

  // ── Dev Quick Login state ────────────────────────────────────────
  const [devLoginLoading, setDevLoginLoading] = useState(false)
  const [devLoginError, setDevLoginError] = useState('')

  // ── Dev Toolbar dismiss (hidden only for current page view) ──────
  const [devToolbarHidden, setDevToolbarHidden] = useState(false)
  const dismissDevToolbar = () => setDevToolbarHidden(true)

  /** Auto-login using VITE_DEV_EMAIL + VITE_DEV_PASSWORD from .env.development */
  const handleDevLogin = async () => {
    const email = import.meta.env.VITE_DEV_EMAIL
    const password = import.meta.env.VITE_DEV_PASSWORD
    if (!email || !password) {
      setDevLoginError('Set VITE_DEV_EMAIL and VITE_DEV_PASSWORD in .env.development')
      return
    }
    setDevLoginLoading(true)
    setDevLoginError('')
    try {
      await login(email, password)
      navigate('/lab/management/dashboard')
    } catch (err) {
      setDevLoginError(err?.message || 'Login failed — is the backend running?')
    } finally {
      setDevLoginLoading(false)
    }
  }

  /** Ping backend health + auth + DB endpoints and display results */
  const handleCheckNeon = async () => {
    setShowHealthModal(true)
    setHealthLoading(true)
    setHealthData(null)

    const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'
    const result = { backend: null, auth: null, ms: null, error: null, dbStatus: null }
    const start = Date.now()

    try {
      const res = await fetch(`${baseUrl}/health`, {
        signal: AbortSignal.timeout(6000),
      })
      result.ms = Date.now() - start
      if (res.ok) {
        result.backend = await res.json()            // { status, version }
        result.dbStatus = 'connected'               // if /health passes, DB is up
      } else {
        result.error = `Backend returned HTTP ${res.status}`
        result.dbStatus = 'unknown'
      }
    } catch (e) {
      result.ms = Date.now() - start
      result.error = e?.name === 'TimeoutError'
        ? 'Request timed out (>6 s). Is the backend running?'
        : `Cannot reach backend: ${e.message}`
      result.dbStatus = 'unreachable'
    }

    // Auth health check (separate, non-blocking)
    try {
      const res2 = await fetch(`${baseUrl}/api/v1/auth/health`, {
        signal: AbortSignal.timeout(5000),
      })
      if (res2.ok) result.auth = await res2.json()  // { status, service }
    } catch { /* auth health unavailable */ }

    setHealthData(result)
    setHealthLoading(false)
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 overflow-x-hidden overflow-y-auto">
      {/* Animated Soft ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ y: [0, -30, 0], scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100/60 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ y: [0, 20, 0], scale: [1, 1.02, 1], rotate: [0, -3, 3, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-100/50 rounded-full blur-[80px]"
        />
      </div>

      {/* Nav */}
      <nav className="relative z-10 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-xl font-semibold tracking-tight text-slate-800">
            LMS
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 hover:bg-slate-100 sm:px-4"
            >
              Sign in
            </Link>
            <Link
              to="/get-started"
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 sm:px-4"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero - responsive typography and spacing */}
      <header className="relative z-10 w-full px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24 lg:px-8 lg:pt-24 lg:pb-32">
        <div className="mx-auto w-full max-w-4xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-4 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 backdrop-blur-sm px-3 py-1.5 text-xs text-indigo-700 shadow-sm transition hover:shadow-md hover:border-indigo-300 sm:mb-6 sm:px-4 sm:text-sm"
          >
            <Zap className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span className="break-words font-medium">Built for testing labs and quality teams</span>
          </motion.p>
          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 drop-shadow-sm sm:text-5xl md:text-6xl lg:text-7xl"
          >
            <span className="block text-slate-900">One platform.</span>
            <span className="mt-1 block bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent">
              Entire lab operations.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mx-auto mt-6 max-w-2xl text-base text-slate-600 sm:mt-8 sm:text-lg"
          >
            RFQs, test management, inventory, quality assurance, and AI-powered support—unified,
            compliant, and ready for scale.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:mt-12"
          >
            <Link
              to="/signup"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 ease-out hover:scale-105 hover:bg-indigo-500 hover:shadow-indigo-500/50 sm:px-8 sm:py-4 sm:text-base"
            >
              <UserPlus className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-1 sm:h-5 sm:w-5" />
              Create account
            </Link>
            <Link
              to="/login"
              className="group inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/80 backdrop-blur-sm px-6 py-3.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-300 ease-out hover:scale-105 hover:bg-slate-50 hover:border-slate-400 sm:px-8 sm:py-4 sm:text-base"
            >
              <LogIn className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" />
              Sign in
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Trust bar - wraps on small screens */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 w-full border-y border-slate-200 bg-white py-6 sm:py-8"
      >
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 text-sm text-slate-600 sm:gap-x-12 sm:px-6">
          {trustItems.map((item) => (
            <span key={item} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span className="break-words">{item}</span>
            </span>
          ))}
        </div>
      </motion.section>

      {/* Features - full width container, no clip */}
      <section className="relative z-10 w-full px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <div className="mx-auto w-full max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '24px' }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              Everything your lab needs
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
              From request to report—streamlined workflows, clear ownership, and full visibility.
            </p>
          </motion.div>
          <div className="mt-12 grid w-full gap-6 sm:mt-16 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '24px' }}
                transition={{ delay: i * 0.06 }}
                className="group relative min-w-0 rounded-2xl border border-white/50 bg-white/70 backdrop-blur-md p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl hover:border-indigo-200 hover:bg-white sm:p-8"
              >
                <div className="mb-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition-transform duration-300 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white sm:mb-5 sm:h-12 sm:w-12">
                  <item.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">
                  {item.stat}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900 break-words sm:text-xl">
                  {item.title}
                </h3>
                <p className="mt-3 text-slate-600 break-words text-sm sm:text-base">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles - wrap and scale */}
      <section className="relative z-10 w-full border-t border-slate-200 bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <div className="mx-auto w-full max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '24px' }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              Built for every role
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
              Enterprise-grade RBAC. Each team member sees only what they need.
            </p>
          </motion.div>
          <div className="mt-12 flex flex-wrap justify-center gap-3 sm:mt-14 sm:gap-4">
            {roles.map((r, i) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '24px' }}
                transition={{ delay: i * 0.05 }}
                className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/80 backdrop-blur-sm px-4 py-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:bg-white hover:shadow-md cursor-default sm:px-6 sm:py-4"
              >
                <span className="font-semibold text-slate-900">{r.name}</span>
                <span className="ml-2 text-slate-500">— {r.tagline}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats - hide dividers on very small screens, wrap */}
      <section className="relative z-10 w-full border-t border-slate-200 bg-gradient-to-b from-slate-50 to-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-24">
        <div className="mx-auto w-full max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '24px' }}
            className="flex flex-wrap items-center justify-center gap-8 text-center sm:gap-12"
          >
            <div className="min-w-0 flex-1 basis-24">
              <p className="text-3xl font-bold text-slate-900 sm:text-4xl md:text-5xl">Audit-ready</p>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">Traceability & logs</p>
            </div>
            <div className="hidden h-12 w-px shrink-0 bg-slate-200 sm:block" />
            <div className="min-w-0 flex-1 basis-24">
              <p className="text-3xl font-bold text-slate-900 sm:text-4xl md:text-5xl">Secure</p>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">JWT & RBAC</p>
            </div>
            <div className="hidden h-12 w-px shrink-0 bg-slate-200 sm:block" />
            <div className="min-w-0 flex-1 basis-24">
              <p className="text-3xl font-bold text-slate-900 sm:text-4xl md:text-5xl">Scalable</p>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">From lab to enterprise</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA - responsive padding */}
      <section className="relative z-10 w-full px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '24px' }}
          className="relative mx-auto w-full max-w-4xl"
        >
          {/* Glowing background behind CTA */}
          <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-20 blur-xl transition-all duration-500 group-hover:opacity-40" />
          
          <div className="relative rounded-[2rem] border border-white/20 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-10 text-center shadow-2xl sm:p-16">
            <Lock className="mx-auto h-12 w-12 text-indigo-600 sm:h-14 sm:w-14" />
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:mt-8 sm:text-4xl md:text-5xl">
              Ready to run your lab on one platform?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
              Create an account or sign in. No credit card required.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:mt-12">
              <Link
                to="/signup"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-indigo-500/30 transition-all duration-300 ease-out hover:scale-105 hover:bg-indigo-500 hover:shadow-indigo-500/50"
              >
                <UserPlus className="h-5 w-5 shrink-0 transition-transform group-hover:-translate-x-1" />
                Create account
              </Link>
              <Link
                to="/login"
                className="group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm px-8 py-4 text-base font-bold text-slate-700 shadow-sm transition-all duration-300 ease-out hover:scale-105 hover:border-slate-300 hover:bg-slate-50"
              >
                <LogIn className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
                Sign in
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="relative z-10 w-full border-t border-slate-200 bg-white py-4 sm:py-6">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <p className="text-center text-sm text-slate-500">
              © {new Date().getFullYear()} Laboratory Management System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* ── DEV TOOLBAR (localhost only) ──────────────────────────── */}
      {isLocalhost && !devToolbarHidden && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-amber-300 bg-amber-50 px-4 py-2.5 shadow-lg">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
            {/* Badge */}
            <span className="flex items-center gap-1.5 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-900">
              <Zap className="h-3 w-3" />
              Dev Mode · Localhost
            </span>

            {/* Quick Dev Access */}
            <button
              id="dev-quick-login-btn"
              onClick={handleDevLogin}
              disabled={devLoginLoading}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {devLoginLoading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <LogIn className="h-3.5 w-3.5" />}
              {devLoginLoading ? 'Logging in…' : 'Quick Dev Access'}
            </button>

            {/* Neon Health Check */}
            <button
              id="neon-health-check-btn"
              onClick={handleCheckNeon}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
            >
              <Database className="h-3.5 w-3.5" />
              Check Neon DB
            </button>

            {/* Error message */}
            {devLoginError && (
              <span className="flex items-center gap-1 text-xs text-red-600">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {devLoginError}
              </span>
            )}

            {/* Dismiss ✕ — hides toolbar for this session */}
            <button
              id="dev-toolbar-dismiss-btn"
              onClick={dismissDevToolbar}
              title="Hide dev toolbar for this session"
              className="ml-auto flex items-center justify-center rounded-full p-1 text-amber-700 transition hover:bg-amber-200 hover:text-amber-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── NEON HEALTH CHECK MODAL ───────────────────────────────── */}
      <AnimatePresence>
        {showHealthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowHealthModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-indigo-600" />
                  <h2 className="text-base font-semibold text-slate-900">Neon DB Health Check</h2>
                </div>
                <button
                  onClick={() => setShowHealthModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                {healthLoading ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-slate-500">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    <p className="text-sm">Pinging backend services…</p>
                  </div>
                ) : healthData ? (
                  <>
                    {/* Backend API */}
                    <StatusRow
                      icon={<Server className="h-4 w-4" />}
                      label="Backend API"
                      ok={!!healthData.backend}
                      value={healthData.backend ? `v${healthData.backend.version} · ${healthData.backend.status}` : 'Unreachable'}
                    />

                    {/* Database (Neon) */}
                    <StatusRow
                      icon={<Database className="h-4 w-4" />}
                      label="Neon Database"
                      ok={healthData.dbStatus === 'connected'}
                      value={
                        healthData.dbStatus === 'connected' ? 'Connected'
                        : healthData.dbStatus === 'unreachable' ? 'Cannot reach backend'
                        : 'Unknown'
                      }
                    />

                    {/* Auth Service */}
                    <StatusRow
                      icon={<Wifi className="h-4 w-4" />}
                      label="Auth Service"
                      ok={!!healthData.auth}
                      value={healthData.auth ? `OK · ${healthData.auth.service || 'auth'}` : 'Not checked'}
                    />

                    {/* Response Time */}
                    <StatusRow
                      icon={<Clock className="h-4 w-4" />}
                      label="Response Time"
                      ok={healthData.ms !== null && healthData.ms < 3000}
                      value={healthData.ms !== null ? `${healthData.ms} ms` : '—'}
                      neutral={healthData.ms === null}
                    />

                    {/* Error banner */}
                    {healthData.error && (
                      <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{healthData.error}</span>
                      </div>
                    )}

                    {/* Offline DB hint */}
                    {healthData.dbStatus !== 'connected' && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                        <p className="font-semibold mb-1">💡 Neon unreachable? Switch to offline DB:</p>
                        <p>1. Install PostgreSQL locally or use SQLite.</p>
                        <p>2. Update <code className="rounded bg-amber-200 px-1 font-mono">DATABASE_URL</code> in <code className="rounded bg-amber-200 px-1 font-mono">backend/.env</code>.</p>
                        <p>3. Run <code className="rounded bg-amber-200 px-1 font-mono">alembic upgrade head</code> to apply schema.</p>
                      </div>
                    )}
                  </>
                ) : null}
              </div>

              {/* Footer */}
              <div className="flex justify-between border-t border-slate-100 px-6 py-3">
                <button
                  onClick={handleCheckNeon}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50"
                >
                  <Activity className="h-4 w-4" />
                  Re-check
                </button>
                <button
                  onClick={() => setShowHealthModal(false)}
                  className="rounded-lg bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Reusable status row for the health modal */
function StatusRow({ icon, label, ok, value, neutral = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-slate-600">{value}</span>
        {neutral ? (
          <span className="h-2 w-2 rounded-full bg-slate-300" />
        ) : ok ? (
          <CheckCircle className="h-4 w-4 text-emerald-500" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-red-500" />
        )}
      </div>
    </div>
  )
}


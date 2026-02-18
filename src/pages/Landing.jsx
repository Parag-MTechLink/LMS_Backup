import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
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
} from 'lucide-react'

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
  { name: 'Testing Engineer', tagline: 'Plans, executions, results' },
  { name: 'Technician', tagline: 'Samples, executions, inventory' },
]

const trustItems = [
  'Role-based access control',
  'Audit logging',
  'Secure authentication',
]

export default function Landing() {
  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 overflow-x-hidden overflow-y-auto">
      {/* Soft ambient background - no clip */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100/60 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-100/50 rounded-full blur-[80px]" />
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
              to="/signup"
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
            className="mb-4 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 sm:mb-6 sm:px-4 sm:text-sm"
          >
            <Zap className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span className="break-words">Built for testing labs and quality teams</span>
          </motion.p>
          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl"
          >
            <span className="block text-slate-900">One platform.</span>
            <span className="mt-1 block bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
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
            className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-12 sm:gap-4"
          >
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 sm:px-6 sm:py-3.5 sm:text-base"
            >
              <UserPlus className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
              Create account
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 sm:px-6 sm:py-3.5 sm:text-base"
            >
              <LogIn className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
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
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
              Everything your lab needs
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-600 sm:mt-4">
              From request to report—streamlined workflows, clear ownership, and full visibility.
            </p>
          </motion.div>
          <div className="mt-10 grid w-full gap-6 sm:mt-16 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '24px' }}
                transition={{ delay: i * 0.06 }}
                className="group relative min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-indigo-100 sm:p-8"
              >
                <div className="mb-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition group-hover:bg-indigo-200 sm:mb-5 sm:h-12 sm:w-12">
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
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
              Built for every role
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-600 sm:mt-4">
              Enterprise-grade RBAC. Each team member sees only what they need.
            </p>
          </motion.div>
          <div className="mt-10 flex flex-wrap justify-center gap-3 sm:mt-14 sm:gap-4">
            {roles.map((r, i) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '24px' }}
                transition={{ delay: i * 0.05 }}
                className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:px-6 sm:py-4"
              >
                <span className="font-semibold text-slate-900">{r.name}</span>
                <span className="ml-2 text-slate-500">— {r.tagline}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats - hide dividers on very small screens, wrap */}
      <section className="relative z-10 w-full border-t border-slate-200 bg-slate-50 px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-24">
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
          className="mx-auto w-full max-w-3xl rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-8 text-center sm:p-12"
        >
          <Lock className="mx-auto h-10 w-10 text-indigo-500 sm:h-12 sm:w-12" />
          <h2 className="mt-4 text-2xl font-bold text-slate-900 sm:mt-6 sm:text-3xl md:text-4xl">
            Ready to run your lab on one platform?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-slate-600 sm:mt-4">
            Create an account or sign in. No credit card required.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10 sm:gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500 sm:px-6 sm:py-3.5"
            >
              Create account
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-50 sm:px-6 sm:py-3.5"
            >
              Sign in
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="relative z-10 w-full border-t border-slate-200 bg-white py-8 sm:py-10">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-center text-sm text-slate-500 sm:text-left">
              © {new Date().getFullYear()} Laboratory Management System. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-slate-500 sm:gap-8">
              <Link to="/login" className="hover:text-slate-700">Sign in</Link>
              <Link to="/signup" className="hover:text-slate-700">Sign up</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

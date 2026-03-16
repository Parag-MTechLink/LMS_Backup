import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { authService } from '../services/labManagementApi'
import { getApiErrorMessage } from '../utils/apiError'
import { User, Mail, Lock, Briefcase, ArrowRight, X, Eye, EyeOff } from 'lucide-react'

const ROLES = [
  { value: 'Testing Engineer', label: 'Testing Engineer' },
  { value: 'Sales Engineer', label: 'Sales Engineer' },
  { value: 'Lab Manager', label: 'Lab Manager' },
  { value: 'Technician', label: 'Technician' },
  { value: 'Admin', label: 'Admin' },
]

export default function Signup() {
  const navigate = useNavigate()
  const [full_name, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState('Testing Engineer')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!full_name.trim() || !email.trim() || !password) {
      toast.error('Please fill in all required fields.')
      return
    }
    
    // Stricter password validation
    const hasLetter = /[a-zA-Z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasUpper = /[A-Z]/.test(password)
    const hasSpecial = /[^a-zA-Z\d]/.test(password)
    if (password.length < 8 || !hasLetter || !hasNumber || !hasUpper || !hasSpecial) {
      toast.error('Password must be at least 8 characters and include a letter, a number, an uppercase letter, and a special character.')
      return
    }
    setLoading(true)
    try {
      await authService.signup({ full_name: full_name.trim(), email: email.trim(), password, role })
      toast.success('Account created. Please sign in.')
      navigate('/login', { replace: true })
    } catch (err) {
      const status = err.response?.status
      let msg = status === 404
        ? 'Signup service not found. Ensure the backend is running and VITE_API_URL points to it.'
        : getApiErrorMessage(err) || 'Registration failed. Please try again.'
      toast.error(typeof msg === 'string' ? msg : (Array.isArray(msg) ? msg.join(' ') : 'Registration failed.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left: Branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-12 lg:flex">
        <Link to="/" className="text-xl font-semibold tracking-tight text-slate-800">
          LMS
        </Link>
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold leading-tight text-slate-900"
          >
            Create your account
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 max-w-sm text-slate-600"
          >
            Join your team on the platform for RFQs, test management, inventory, and quality assurance.
          </motion.p>
        </div>
        <p className="text-xs text-slate-500">
          Enterprise RBAC &bull; Secure signup &bull; No credit card required
        </p>
      </div>

      {/* Right: Form */}
      <div className="flex w-full flex-col justify-center bg-white px-6 py-12 lg:w-1/2 lg:px-16 lg:shadow-xl">
        <div className="mx-auto w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link to="/" className="text-lg font-semibold text-slate-800">LMS</Link>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Get started
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Enter your details to create your account.
            </p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-5">
              {/* Full name */}
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-slate-700">
                  Full name
                </label>
                <div className="relative mt-2">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="full_name"
                    type="text"
                    autoComplete="name"
                    value={full_name}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Jane Doe"
                  />
                </div>
                {/\d/.test(full_name) && (
                  <p className="mt-1.5 text-xs font-medium text-amber-600">
                    Note: Names normally do not contain numbers.
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="name@company.com"
                  />
                </div>
                {email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                  <p className="mt-1.5 text-xs font-medium text-amber-600">
                    Note: Please enter a valid email address.
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Min. 8 chars, 1 uppercase, 1 special, 1 number"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {password.length > 0 && (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password) || !/[A-Z]/.test(password) || !/[^a-zA-Z\d]/.test(password)) && (
                  <p className="mt-1.5 text-xs font-medium text-amber-600">
                    Note: Password does not meet all requirements.
                  </p>
                )}
                <p className="mt-1.5 text-xs text-slate-500">
                  Min. 8 chars, 1 letter, 1 number, 1 uppercase, &amp; 1 special.
                </p>
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-700">
                  Role
                </label>
                <div className="relative mt-2">
                  <Briefcase className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="block w-full appearance-none rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-10 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▼</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  Admin accounts can only be created by an existing administrator.
                </p>
              </div>

              {/* ── Terms & Conditions + Privacy Policy Links + Modals ── */}
              <LegalSection />

              {/* ── Mandatory Consent Checkboxes ── */}
              <ConsentBoxes />

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    Create account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign in
              </Link>
            </p>
            <p className="mt-4 text-center">
              <Link to="/" className="text-sm text-slate-500 hover:text-slate-700">
                ← Back to home
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Modal Component
───────────────────────────────────────────── */
function Modal({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-lg max-h-[80vh] rounded-2xl bg-white shadow-2xl flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto px-6 py-5 text-xs text-slate-600 space-y-4 leading-relaxed">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ─────────────────────────────────────────────
   Legal Section — blue links that open modals
───────────────────────────────────────────── */
function LegalSection() {
  const [tcOpen, setTcOpen] = useState(false)
  const [ppOpen, setPpOpen] = useState(false)

  return (
    <>
      {/* Blue link buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={() => setTcOpen(true)}
          className="text-sm font-medium text-blue-600 hover:text-blue-500 underline underline-offset-2 transition"
        >
          Terms &amp; Conditions
        </button>
        <button
          type="button"
          onClick={() => setPpOpen(true)}
          className="text-sm font-medium text-blue-600 hover:text-blue-500 underline underline-offset-2 transition"
        >
          Privacy Policy
        </button>
      </div>

      {/* Terms & Conditions Modal */}
      <Modal open={tcOpen} onClose={() => setTcOpen(false)} title="Terms & Conditions">
        <p>By accessing, registering for, or using this Software, you agree to be bound by these Terms &amp; Conditions.</p>

        <div>
          <p className="font-semibold text-slate-700">1. Account Registration</p>
          <p>Some features require account registration.</p>
          <p>You are responsible for maintaining the confidentiality of your login credentials and all activity under your account.</p>
          <p>You must notify the Company immediately of any unauthorized account use.</p>
          <p>The Company may suspend or terminate accounts that violate these Terms.</p>
        </div>

        <div>
          <p className="font-semibold text-slate-700">2. User Responsibilities</p>
          <p>Users must provide accurate and complete information when registering or using the software.</p>
          <p>Users must not upload or transmit unlawful, harmful, or unauthorized content.</p>
          <p>Users are responsible for maintaining updated account information.</p>
        </div>

        <div>
          <p className="font-semibold text-slate-700">3. Payment Terms</p>
          <p>Some features may require subscription or one-time payments.</p>
          <p>Fees must be paid in advance unless agreed otherwise.</p>
          <p>Subscriptions may automatically renew unless cancelled before the renewal date.</p>
          <p>Failure to pay may result in suspension or termination of access to the Software.</p>
        </div>

        <div>
          <p className="font-semibold text-slate-700">4. Refund Policy</p>
          <p>Payments are generally non-refundable unless otherwise agreed. Refunds may only be issued in cases such as:</p>
          <ul className="list-disc list-inside ml-2 space-y-0.5">
            <li>Duplicate payments</li>
            <li>Billing errors</li>
            <li>Service failure caused solely by the Company</li>
          </ul>
          <p>Refund requests must be submitted within the specified period.</p>
        </div>

        <div>
          <p className="font-semibold text-slate-700">5. Liability</p>
          <p>To the extent permitted by law, the Company shall not be liable for indirect, incidental, or consequential damages or loss of data arising from the use of the Software.</p>
        </div>

        <div>
          <p className="font-semibold text-slate-700">6. User-Provided Product for Testing</p>
          <p>If the User provides any product, equipment, prototype, or component for testing:</p>
          <ul className="list-disc list-inside ml-2 space-y-0.5">
            <li>The User confirms the product is safe and legally compliant.</li>
            <li>The Company will conduct testing only within the agreed scope.</li>
            <li>Any design flaws, manufacturing defects, or compliance issues remain the User's responsibility.</li>
            <li>The Company is not liable for losses arising from defects in the user-provided product.</li>
            <li>The User agrees to indemnify the Company against claims related to such defects.</li>
          </ul>
        </div>

        <div>
          <p className="font-semibold text-slate-700">7. Changes to Terms</p>
          <p>The Company reserves the right to modify these Terms at any time. Continued use of the Software after changes means you accept the updated Terms.</p>
        </div>

        <div>
          <p className="font-semibold text-slate-700">8. Governing Law</p>
          <p>These Terms shall be governed by the laws of India, and any disputes shall fall under the jurisdiction of Indian courts.</p>
        </div>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal open={ppOpen} onClose={() => setPpOpen(false)} title="Privacy Policy">
        <p>This Privacy Policy explains how the Company collects, uses, stores, and protects user information when using the Software.</p>

        <div>
          <p className="font-semibold text-slate-700">1. Information We Collect</p>
          <p>We may collect the following types of information:</p>
          <ul className="list-disc list-inside ml-2 space-y-0.5">
            <li>Personal information provided during registration</li>
            <li>Account information and contact details</li>
            <li>Usage data related to how the software is used</li>
            <li>Technical information such as device or system data</li>
          </ul>
        </div>

        <div>
          <p className="font-semibold text-slate-700">2. How We Use Your Information</p>
          <p>Your information may be used for:</p>
          <ul className="list-disc list-inside ml-2 space-y-0.5">
            <li>Account management</li>
            <li>Providing and improving Software services</li>
            <li>Customer support</li>
            <li>System monitoring and analytics</li>
            <li>Communication about updates or service notifications</li>
            <li>Legal and regulatory compliance</li>
            <li>Marketing communications where permitted by law</li>
          </ul>
        </div>

        <div>
          <p className="font-semibold text-slate-700">3. Data Storage &amp; Security</p>
          <p>User data may be stored on secure servers or cloud platforms.</p>
          <p>Reasonable security measures are implemented to protect user information.</p>
          <p>However, no digital system can guarantee complete security.</p>
        </div>

        <div>
          <p className="font-semibold text-slate-700">4. Data Sharing</p>
          <p>The Company may share information:</p>
          <ul className="list-disc list-inside ml-2 space-y-0.5">
            <li>With authorized service providers assisting in service delivery</li>
            <li>When required by law or legal authorities</li>
            <li>To protect legal rights or comply with regulatory obligations</li>
          </ul>
          <p>The Company does not sell personal information without user consent unless permitted by law.</p>
        </div>

        <div>
          <p className="font-semibold text-slate-700">5. Aggregated Data</p>
          <p>The Company may use aggregated or anonymized data for research, analytics, or service improvement.</p>
        </div>
      </Modal>
    </>
  )
}

/* ─────────────────────────────────────────────
   Mandatory Consent Checkboxes
───────────────────────────────────────────── */
function ConsentBoxes() {
  const consents = [
    { id: 'consent_accurate', label: 'The information provided is true and accurate.' },
    { id: 'consent_privacy', label: 'You consent to the collection and use of your information as described in the Privacy Policy.' },
    { id: 'consent_terms', label: 'You have read and agree to the Terms & Conditions, including the Payment and Refund Policy.' },
  ]

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 space-y-3">
      <p className="text-sm font-semibold text-slate-800">User Consent</p>
      {consents.map(({ id, label }) => (
        <label
          key={id}
          htmlFor={id}
          className="flex items-start gap-3 cursor-pointer group"
        >
          <input
            id={id}
            name={id}
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-slate-300 text-indigo-600 accent-indigo-600 cursor-pointer"
          />
          <span className="text-xs text-slate-600 leading-relaxed group-hover:text-slate-800 transition">
            {label}
          </span>
        </label>
      ))}
    </div>
  )
}
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useLabManagementAuth } from '../contexts/LabManagementAuthContext'
import { getApiErrorMessage } from '../utils/apiError'
import { LogIn, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useLabManagementAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      toast.error('Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      await login(email.trim(), password)
      toast.success('Welcome back.')
      navigate('/lab/management/dashboard', { replace: true })
    } catch (err) {
      const status = err.response?.status
      let msg =
        status === 404
          ? 'Login service not found. Ensure the backend is running and VITE_API_URL points to it.'
          : status === 503
            ? 'Database temporarily unavailable. Please try again or check backend connection.'
            : getApiErrorMessage(err) || 'Sign in failed. Please check your credentials.'
      toast.error(typeof msg === 'string' ? msg : (Array.isArray(msg) ? msg.join(' ') : 'Sign in failed.'))
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
            Laboratory Management System
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 max-w-sm text-slate-600"
          >
            Sign in to access RFQs, test management, inventory, quality assurance, and your AI lab assistant.
          </motion.p>
        </div>
        <p className="text-xs text-slate-500">
          Secure access • Role-based permissions • Audit logging
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
              Sign in to your account
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Enter your credentials to access the platform.
            </p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
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
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-12 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-600">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                Create account
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

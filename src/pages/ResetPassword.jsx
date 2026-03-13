import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../services/api'
import { Lock, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const isMatching = password && confirmPassword && password === confirmPassword
  const hasInput = password && confirmPassword

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token.')
      navigate('/login')
    }
  }, [token, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(password)) {
      toast.error('Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol.')
      return
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        token,
        password
      })
      setSuccess(true)
      toast.success('Password reset successfully.')
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      toast.error(err.message || 'Failed to reset password. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left: Branding (Matches Login) */}
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
            Almost there! Set a new password to regain access to your account.
          </motion.p>
        </div>
        <p className="text-xs text-slate-500">
          Secure access • Role-based permissions • Audit logging
        </p>
      </div>

      {/* Right: Form (Matches Login) */}
      <div className="flex w-full flex-col justify-center bg-white px-6 py-12 lg:w-1/2 lg:px-16 lg:shadow-xl">
        <div className="mx-auto w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link to="/" className="text-lg font-semibold text-slate-800">LMS</Link>
          </div>

          {!success ? (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <ShieldCheck className="h-6 w-6 text-indigo-600" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Set new password
                </h1>
              </div>
              
              <p className="text-sm text-slate-600 mb-10">
                Please enter a new secure password for your account.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    New Password
                  </label>
                  <div className="relative mt-2">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
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

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                    Confirm New Password
                  </label>
                  <div className="relative mt-2">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="••••••••"
                    />
                  </div>
                  {hasInput && (
                    <motion.div 
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${isMatching ? 'text-green-600' : 'text-rose-500'}`}
                    >
                      {isMatching ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Passwords match
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5" />
                          Passwords do not match
                        </>
                      )}
                    </motion.div>
                  )}
                </div>

                <ul className="grid grid-cols-1 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {[
                      'Minimum 8 characters',
                      'At least one Uppercase letter',
                      'At least one Lowercase letter',
                      'At least one Number',
                      'At least one Special character'
                    ].map((req, i) => (
                      <li key={i} className="flex items-center text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                        <ShieldCheck className="h-3 w-3 mr-2 text-indigo-500/50" />
                        {req}
                      </li>
                    ))}
                </ul>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      Reset password
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 mb-8">
                <ShieldCheck className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Success!</h2>
              <p className="mt-4 text-slate-600">
                Your password has been reset successfully. 
              </p>
              <p className="mt-2 text-slate-500 text-sm">
                Redirecting you to the login page...
              </p>
              <div className="mt-10">
                <Link
                  to="/login"
                  className="inline-flex items-center px-8 py-3 bg-indigo-600 text-sm font-medium rounded-xl text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 transition"
                >
                  Login now
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../services/api'
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('Please enter your email address.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/request-reset', { email: email.trim() })
      setSubmitted(true)
      toast.success('Reset link sent if account exists.')
    } catch (err) {
      toast.error(err.message || 'Failed to request password reset.')
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
            Reset your password to regain access to RFQs, test management, and your AI lab assistant.
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

          <Link to="/login" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 transition mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Link>

          {!submitted ? (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Forgot password?
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Enter your email address and we&apos;ll send you a link to reset your password.
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
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="name@company.com"
                    />
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
                      Send reset link
                      <Send className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">Check your email</h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                If an account exists for <span className="font-semibold text-slate-900 text-indigo-600">{email}</span>, 
                you will receive a password reset link shortly.
              </p>
              <div className="mt-10">
                <Link
                  to="/login"
                  className="rounded-xl px-8 py-3 bg-slate-50 text-sm font-medium text-slate-900 hover:bg-slate-100 transition border border-slate-200"
                >
                  Return to login
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

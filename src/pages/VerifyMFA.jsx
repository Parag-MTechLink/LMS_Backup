import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useLabManagementAuth } from '../contexts/LabManagementAuthContext'
import { getApiErrorMessage } from '../utils/apiError'
import { ShieldCheck, ArrowRight, RefreshCw, ArrowLeft } from 'lucide-react'

export default function VerifyMFA() {
  const location = useLocation()
  const navigate = useNavigate()
  const { verifyMfa } = useLabManagementAuth()
  const [email] = useState(location.state?.email || '')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(300) // 5 minutes
  const inputRefs = useRef([])

  useEffect(() => {
    if (!email) {
      toast.error('Session expired. Please login again.')
      navigate('/login')
    }
  }, [email, navigate])

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(countdown)
  }, [])

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)
    if (value && index < 5) {
      inputRefs.current[index + 1].focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus()
    }
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    const verificationCode = code.join('')
    if (verificationCode.length !== 6) {
      toast.error('Please enter the 6-digit code.')
      return
    }

    setLoading(true)
    try {
      await verifyMfa(email, verificationCode)
      toast.success('Successfully verified.')
      navigate('/lab/management/dashboard', { replace: true })
    } catch (err) {
      toast.error(getApiErrorMessage(err) || 'Verification failed. Please check the code.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = () => {
    toast.info('Please re-login to receive a new code.')
    navigate('/login')
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
            Verify your identity to access RFQs, test management, and your AI lab assistant.
          </motion.p>
        </div>
        <p className="text-xs text-slate-500">
          Secure access • Role-based permissions • Audit logging
        </p>
      </div>

      {/* Right: Verification Form */}
      <div className="flex w-full flex-col justify-center bg-white px-6 py-12 lg:w-1/2 lg:px-16 lg:shadow-xl">
        <div className="mx-auto w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link to="/" className="text-lg font-semibold text-slate-800">LMS</Link>
          </div>

          <Link to="/login" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 transition mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Link>

          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Check your email
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              We&apos;ve sent a 6-digit verification code to <span className="font-medium text-indigo-600">{email}</span>.
            </p>

            <form onSubmit={handleSubmit} className="mt-10">
              <div className="flex justify-between gap-2 sm:gap-4">
                {code.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-full aspect-square text-center text-2xl font-bold bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  />
                ))}
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={loading || code.some(d => !d)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Verify code
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center sm:text-left">
              <p className="text-sm text-slate-600">
                Code expires in <span className="font-semibold text-indigo-600">{formatTime(timer)}</span>
              </p>
              <button
                onClick={handleResend}
                disabled={timer > 240}
                className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:text-slate-400 disabled:cursor-not-allowed transition"
              >
                Didn&apos;t receive code? Resend
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

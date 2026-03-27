import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useLabManagementAuth } from '../contexts/LabManagementAuthContext'
import { getApiErrorMessage } from '../utils/apiError'
import { LogIn, Mail, Lock, ArrowRight, Eye, EyeOff, Phone, Smartphone, ChevronLeft, ShieldCheck, RefreshCw } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { login, sendOtp, loginWithOtp } = useLabManagementAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Mobile OTP States
  const [loginMode, setLoginMode] = useState('email') // 'email' or 'mobile'
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpStep, setOtpStep] = useState(1) // 1: Enter Mobile, 2: Enter OTP
  const [timer, setTimer] = useState(0)
  const otpInputRefs = useRef([])

  useEffect(() => {
    let interval = null
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timer])

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      toast.error('Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      const res = await login(email.trim(), password)
      
      if (res?.mfa_required) {
        toast.success(res.message || 'Verification required.')
        navigate('/verify-mfa', { state: { email: email.trim() } })
        return
      }

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

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault()
    if (!mobile.trim() || mobile.length < 10) {
      toast.error('Please enter a valid mobile number.')
      return
    }
    setLoading(true)
    try {
      await sendOtp(mobile.trim())
      toast.success('OTP sent! Check your console.')
      setOtpStep(2)
      setTimer(60) // Start 60s countdown
      setOtp(['', '', '', '', '', '']) // Reset OTP field
    } catch (err) {
      toast.error(getApiErrorMessage(err) || 'Failed to send OTP.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) {
      otpInputRefs.current[index + 1].focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1].focus()
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    const otpValue = otp.join('')
    if (otpValue.length !== 6) {
      toast.error('Please enter a 6-digit OTP.')
      return
    }
    setLoading(true)
    try {
      await loginWithOtp(mobile.trim(), otpValue)
      toast.success('Welcome back.')
      navigate('/lab/management/dashboard', { replace: true })
    } catch (err) {
      toast.error(getApiErrorMessage(err) || 'Invalid or expired OTP.')
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

            {loginMode === 'email' ? (
              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <p className="text-sm text-red-500 mb-4">Please fill all the mandatory details in the form (*)</p>
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
                      className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3.5 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                      className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3.5 pl-11 pr-12 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-slate-500">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setLoginMode('mobile')}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3.5 font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <Smartphone className="h-5 w-5 text-slate-500" />
                  Login with Mobile OTP
                </button>
              </form>
            ) : (
              <div className="mt-8">
                <button
                  onClick={() => {
                    setLoginMode('email')
                    setOtpStep(1)
                  }}
                  className="mb-6 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to email login
                </button>

                {otpStep === 1 ? (
                  <motion.form 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleSendOtp} 
                    className="space-y-6"
                  >
                    <div>
                      <label htmlFor="mobile" className="block text-sm font-medium text-slate-700">
                        Mobile Number
                      </label>
                      <div className="relative mt-2">
                        <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                          id="mobile"
                          type="tel"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3.5 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          placeholder="Enter your registered mobile number"
                        />
                      </div>
                      <p className="mt-2 text-xs text-slate-500 italic">
                        Note: This works only if you have updated your mobile number in your profile.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 disabled:opacity-50"
                    >
                      {loading ? (
                        <RefreshCw className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          Send OTP
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </motion.form>
                ) : (
                  <motion.form 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleVerifyOtp} 
                    className="space-y-8"
                  >
                    <div>
                      <div className="flex items-center justify-center mb-6">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                      </div>
                      <div className="text-center mb-8">
                        <h2 className="text-xl font-semibold text-slate-900">Verify your mobile</h2>
                        <p className="mt-2 text-sm text-slate-600">
                          Enter the 6-digit code sent to <span className="font-semibold text-slate-900">{mobile}</span>
                        </p>
                      </div>

                      <div className="flex justify-between gap-2">
                        {otp.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => (otpInputRefs.current[idx] = el)}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            className="w-full aspect-square text-center text-xl font-bold bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <button
                        type="submit"
                        disabled={loading || otp.some(d => !d)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 disabled:opacity-50"
                      >
                        {loading ? (
                          <RefreshCw className="h-5 w-5 animate-spin" />
                        ) : (
                          "Verify & Login"
                        )}
                      </button>

                      <div className="text-center">
                        {timer > 0 ? (
                          <p className="text-sm text-slate-500">
                            Resend code in <span className="font-medium text-indigo-600 font-mono">{formatTime(timer)}</span>
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                          >
                            Didn&apos;t receive code? Resend
                          </button>
                        )}
                      </div>
                      
                      <button 
                        type="button"
                        onClick={() => setOtpStep(1)}
                        className="w-full text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                      >
                        Change mobile number
                      </button>
                    </div>
                  </motion.form>
                )}
              </div>
            )}

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

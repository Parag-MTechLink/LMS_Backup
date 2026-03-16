import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, Globe, MapPin, Building2, Phone, Briefcase, Factory, Shield, Edit2, Save, X, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../../../services/labManagementApi'
import { useLabManagementAuth } from '../../../contexts/LabManagementAuthContext'

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway",
  "Oman",
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe"
]

const COUNTRY_CODES = [
  { code: "+91", label: "India (+91)" },
  { code: "+1", label: "USA (+1)" },
  { code: "+44", label: "UK (+44)" },
  { code: "+61", label: "Australia (+61)" },
  { code: "+81", label: "Japan (+81)" },
  { code: "+86", label: "China (+86)" },
  { code: "+49", label: "Germany (+49)" },
  { code: "+33", label: "France (+33)" },
  { code: "+971", label: "UAE (+971)" },
  { code: "+65", label: "Singapore (+65)" },
  { code: "+7", label: "Russia (+7)" },
  { code: "+55", label: "Brazil (+55)" },
  { code: "+27", label: "South Africa (+27)" },
  { code: "+82", label: "South Korea (+82)" },
  { code: "+39", label: "Italy (+39)" },
  { code: "+34", label: "Spain (+34)" },
  { code: "+1", label: "Canada (+1)" },
  { code: "+64", label: "New Zealand (+64)" },
  { code: "+60", label: "Malaysia (+60)" },
  { code: "+66", label: "Thailand (+66)" },
  { code: "+62", label: "Indonesia (+62)" },
  { code: "+63", label: "Philippines (+63)" },
  { code: "+84", label: "Vietnam (+84)" },
  { code: "+92", label: "Pakistan (+92)" },
  { code: "+880", label: "Bangladesh (+880)" },
  { code: "+94", label: "Sri Lanka (+94)" },
  { code: "+90", label: "Turkey (+90)" },
  { code: "+966", label: "Saudi Arabia (+966)" },
  { code: "+31", label: "Netherlands (+31)" },
  { code: "+41", label: "Switzerland (+41)" },
  { code: "+46", label: "Sweden (+46)" },
  { code: "+47", label: "Norway (+47)" },
  { code: "+45", label: "Denmark (+45)" },
].sort((a, b) => a.label.localeCompare(b.label))

export default function Profile() {
  const { user, login } = useLabManagementAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    id: '',
    gender: '',
    country: '',
    language: 'English',
    address: '',
    company_name: '',
    phone_code: '+91',
    phone_no: '',
    designation: '',
    industry: '',
    account_type: '',
  })
  const [phoneCodeOpen, setPhoneCodeOpen] = useState(false)
  const phoneCodeRef = useRef(null)

  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        email: user.email || '',
        id: user.id || '',
        gender: user.gender || '',
        country: user.country || '',
        language: user.language || 'English',
        address: user.address || '',
        company_name: user.company_name || '',
        phone_code: user.phone_no?.includes(' ') ? user.phone_no.split(' ')[0] : '+91',
        phone_no: user.phone_no?.includes(' ') ? user.phone_no.split(' ')[1] : (user.phone_no || ''),
        designation: user.designation || '',
        industry: user.industry || '',
        account_type: user.account_type || user.role || '',
      })
    }
  }, [user])

  useEffect(() => {
    const handleClickOutsidePhoneCode = (event) => {
      if (phoneCodeRef.current && !phoneCodeRef.current.contains(event.target)) {
        setPhoneCodeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutsidePhoneCode)
    return () => document.removeEventListener('mousedown', handleClickOutsidePhoneCode)
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      const { email, id, phone_code, phone_no, ...rest } = profileData

      // Basic 10-digit validation
      if (phone_no && !/^\d{10}$/.test(phone_no)) {
        toast.error('Phone number must be exactly 10 digits.')
        setLoading(false)
        return
      }

      const updateData = {
        ...rest,
        phone_no: phone_no ? `${phone_code} ${phone_no}` : ''
      }
      await authService.updateProfile(updateData)
      toast.success('Profile updated successfully!')
      setIsEditing(false)
      // Refresh user data (if needed, auth provider might need a refresh method)
      window.location.reload()
    } catch (err) {
      console.error('Failed to update profile:', err)
      toast.error('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match!')
      return
    }

    setLoading(true)
    try {
      await authService.changePassword(passwordData.current_password, passwordData.new_password)
      toast.success('Password changed successfully!')
      setPasswordModalOpen(false)
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to change password.')
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-white p-8 rounded-2xl border border-blue-100 mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Welcome, {profileData.full_name.split(' ')[0]}</h1>
        <p className="text-slate-500 mt-1 font-medium">{today}</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="h-24 w-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-blue-50 shadow-lg">
                {getInitials(profileData.full_name)}
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-slate-900">{profileData.full_name}</h2>
                <p className="text-slate-500 font-medium">{profileData.email}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPasswordModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all shadow-sm"
              >
                <Lock className="w-4 h-4" />
                Change Password
              </button>
              <button
                onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                disabled={loading}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-md ${isEditing
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                  }`}
              >
                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : isEditing ? (
                  <><Save className="w-4 h-4" /> Save Changes</>
                ) : (
                  <><Edit2 className="w-4 h-4" /> Edit Profile</>
                )}
              </button>
              {isEditing && (
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <div className="p-8 border-t border-slate-100 bg-slate-50/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {/* Name Block */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Full Name / Username</label>
                <div className="relative">
                  <input
                    type="text"
                    name="full_name"
                    value={profileData.full_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
                    placeholder="Full Name"
                  />
                </div>
              </div>

              {/* User ID Block */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">User ID</label>
                <input
                  type="text"
                  value={profileData.id}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500"
                />
              </div>

              {/* Gender Block */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Gender</label>
                <select
                  name="gender"
                  value={profileData.gender}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 transition-all font-medium text-slate-700"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Country Block */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Country</label>
                <select
                  name="country"
                  value={profileData.country}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 transition-all font-medium text-slate-700"
                >
                  <option value="">Select Country</option>
                  {COUNTRIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Language Block */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Language</label>
                <select
                  name="language"
                  value={profileData.language}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 transition-all font-medium text-slate-700"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Spanish">Spanish</option>
                </select>
              </div>

              {/* Address Block */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Address</label>
                <input
                  type="text"
                  name="address"
                  value={profileData.address}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 transition-all"
                  placeholder="Address"
                />
              </div>

              {/* Company Block */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Company Name</label>
                <input
                  type="text"
                  name="company_name"
                  value={profileData.company_name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 transition-all"
                  placeholder="Company Name"
                />
              </div>

              {/* Phone Block */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Phone No</label>
                <div className="flex gap-2 relative">
                  {/* Custom Country Code Dropdown */}
                  <div className="relative" ref={phoneCodeRef}>
                    <button
                      type="button"
                      disabled={!isEditing}
                      onClick={() => setPhoneCodeOpen(!phoneCodeOpen)}
                      className="w-32 px-4 py-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 transition-all font-medium text-slate-700"
                    >
                      <span>{profileData.phone_code}</span>
                      <span className={`transition-transform duration-200 ${phoneCodeOpen ? 'rotate-180' : ''}`}>▼</span>
                    </button>

                    <AnimatePresence>
                      {phoneCodeOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 z-[110] max-h-60 overflow-y-auto"
                        >
                          {COUNTRY_CODES.map(c => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                setProfileData(prev => ({ ...prev, phone_code: c.code }))
                                setPhoneCodeOpen(false)
                              }}
                              className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0 font-medium text-slate-700"
                            >
                              {c.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <input
                    type="text"
                    name="phone_no"
                    value={profileData.phone_no}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                      setProfileData(prev => ({ ...prev, phone_no: val }))
                    }}
                    disabled={!isEditing}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 transition-all"
                    placeholder="10-digit number"
                    maxLength={10}
                  />
                </div>
              </div>

              {/* Designation Block */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  Designation
                </label>
                <input
                  type="text"
                  name="designation"
                  value={profileData.designation}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 transition-all"
                  placeholder="Designation"
                />
              </div>

              {/* Industry Block */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Factory className="w-4 h-4 text-slate-400" />
                  Industry
                </label>
                <input
                  type="text"
                  name="industry"
                  value={profileData.industry}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 transition-all"
                  placeholder="Industry"
                />
              </div>

              {/* Account Type Block */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-400" />
                  Account Type
                </label>
                <input
                  type="text"
                  name="account_type"
                  value={profileData.account_type}
                  onChange={handleInputChange}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 transition-all"
                  placeholder="Account Type"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Email Addresses Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="px-8 py-5 border-b border-slate-100">
            <h3 className="text-xl font-bold text-slate-900">My Email Addresses</h3>
          </div>
          <div className="p-8">
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-blue-50/50 border border-blue-100 max-w-2xl">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-900">{profileData.email}</p>
                <p className="text-sm font-medium text-blue-600">Primary email</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {passwordModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPasswordModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-8"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900">Change Password</h3>
                <button
                  onClick={() => setPasswordModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData(d => ({ ...d, current_password: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData(d => ({ ...d, new_password: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData(d => ({ ...d, confirm_password: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setPasswordModalOpen(false)}
                    className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

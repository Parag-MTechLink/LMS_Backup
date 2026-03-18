import { useState, Fragment } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { Check, ChevronDown } from 'lucide-react'
import { customersService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Button from '../Button'
import Input from '../Input'

export default function CreateCustomerForm({ onSuccess, onCancel, initialData = null, isEdit = false }) {
  const [formData, setFormData] = useState({
    companyName: initialData?.companyName || '',
    email: initialData?.email || '',
    phone: initialData?.phone ? initialData.phone.replace(/^\+\d+-/, '') : '',
    address: initialData?.address || '',
    contactPerson: initialData?.contactPerson || '',
    region: initialData?.region || ''
  })
  const [errors, setErrors] = useState({})
  const [countryCode, setCountryCode] = useState(() => {
    if (initialData?.phone && initialData.phone.includes('-')) {
      return initialData.phone.split('-')[0]
    }
    return '+91'
  })
  const [loading, setLoading] = useState(false)

  // Top 20 country codes for the dropdown
  const countryCodes = [
    { code: '+91', country: 'India' },
    { code: '+1', country: 'USA/Canada' },
    { code: '+44', country: 'UK' },
    { code: '+61', country: 'Australia' },
    { code: '+81', country: 'Japan' },
    { code: '+86', country: 'China' },
    { code: '+49', country: 'Germany' },
    { code: '+33', country: 'France' },
    { code: '+39', country: 'Italy' },
    { code: '+7', country: 'Russia' },
    { code: '+55', country: 'Brazil' },
    { code: '+52', country: 'Mexico' },
    { code: '+27', country: 'South Africa' },
    { code: '+971', country: 'UAE' },
    { code: '+966', country: 'Saudi Arabia' },
    { code: '+65', country: 'Singapore' },
    { code: '+60', country: 'Malaysia' },
    { code: '+62', country: 'Indonesia' },
    { code: '+66', country: 'Thailand' },
    { code: '+82', country: 'South Korea' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const newErrors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phoneRegex = /^[0-9]{10}$/

    if (!formData.companyName?.trim()) newErrors.companyName = 'Company name is required'
    
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!phoneRegex.test(formData.phone.trim())) {
      newErrors.phone = 'Phone number must be exactly 10 digits'
    }

    if (!formData.contactPerson?.trim()) {
      newErrors.contactPerson = 'Contact person is required'
    } else if (formData.contactPerson.trim().split(/\s+/).length < 2) {
      newErrors.contactPerson = 'Please enter at least first and last name'
    }

    if (!formData.region) {
      newErrors.region = 'Region is required'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fix the validation errors')
      return
    }

    try {
      setLoading(true)
      const submitData = {
        ...formData,
        phone: `${countryCode}-${formData.phone}`
      }
      if (isEdit && initialData?.id) {
        await customersService.update(initialData.id, submitData)
        toast.success('Customer updated successfully!')
      } else {
        await customersService.create(submitData)
        toast.success('Customer created successfully!')
      }
      onSuccess()
    } catch (error) {
      // The backend returns { success: false, error: "...", details: [...] }
      const responseData = error.response?.data
      const errorMsg = responseData?.error || responseData?.details?.[0] || responseData?.detail || responseData?.message || 'Failed to create customer'
      
      const errorLower = typeof errorMsg === 'string' ? errorMsg.toLowerCase() : JSON.stringify(errorMsg).toLowerCase()
      
      if (errorLower.includes('email') && (errorLower.includes('already') || errorLower.includes('exist') || errorLower.includes('registered'))) {
        setErrors(prev => ({ ...prev, email: 'This email is already registered to another customer' }))
        toast.error('Duplicate error: This email is already registered.')
      } else if (errorLower.includes('mobile') || errorLower.includes('phone') || errorLower.includes('data')) { // The backend throws generic 'data already exists' if it hits a unique constraint other than email
        setErrors(prev => ({ ...prev, phone: 'This record might already be registered.' }))
        toast.error('Duplicate error: This mobile number/record is already registered.')
      } else if (errorLower.includes('contact person')) {
        setErrors(prev => ({ ...prev, contactPerson: 'This contact person already exists' }))
        toast.error('Duplicate error: This contact person already exists in another record.')
      } else if (errorLower.includes('company') || errorLower.includes('name')) {
        setErrors(prev => ({ ...prev, companyName: 'This company name already exists' }))
        toast.error('Duplicate error: This company name already exists.')
      } else {
        toast.error(typeof errorMsg === 'string' ? errorMsg : `Failed to ${isEdit ? 'update' : 'create'} customer. Please try again.`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50/50 px-4 py-3 rounded-xl border border-blue-100/50 text-sm text-blue-800">
        Please fill all the mandatory details in the form (<span className="text-red-500 font-bold">*</span>)
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label={<>Company Name <span className="text-red-500">*</span></>}
          value={formData.companyName}
          onChange={(e) => {
            setFormData({ ...formData, companyName: e.target.value })
            if (errors.companyName) setErrors(prev => ({ ...prev, companyName: null }))
          }}
          error={errors.companyName}
          placeholder="Enter company name"
        />

        <Input
          label={<>Contact Person <span className="text-red-500">*</span></>}
          value={formData.contactPerson}
          onChange={(e) => {
            setFormData({ ...formData, contactPerson: e.target.value })
            if (errors.contactPerson) setErrors(prev => ({ ...prev, contactPerson: null }))
          }}
          error={errors.contactPerson}
          placeholder="Enter contact person name"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <Input
          label={<>Email <span className="text-red-500">*</span></>}
          type="email"
          value={formData.email}
          onChange={(e) => {
            setFormData({ ...formData, email: e.target.value })
            if (errors.email) setErrors(prev => ({ ...prev, email: null }))
          }}
          error={errors.email}
          placeholder="Enter email address"
        />

        <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <Listbox value={countryCode} onChange={setCountryCode}>
            <div className="relative">
              <Listbox.Button className="relative w-[120px] flex items-center justify-between px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-left focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                <span className="block truncate">{countryCode}</span>
                <span className="pointer-events-none flex items-center">
                  <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-[100] mt-1 max-h-60 w-max min-w-[120px] overflow-auto rounded-xl bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                  {countryCodes.map(({ code, country }, idx) => (
                    <Listbox.Option
                      key={idx}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? 'bg-primary/10 text-primary' : 'text-gray-900'
                        }`
                      }
                      value={code}
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {code} ({country})
                          </span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                              <Check className="h-4 w-4" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
          <div className="flex-1">
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                setFormData({ ...formData, phone: val });
                if (errors.phone) setErrors(prev => ({ ...prev, phone: null }));
              }}
              placeholder="Enter 10-digit phone number"
              className={`w-full px-4 py-2.5 rounded-xl border ${errors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary focus:ring-primary'} focus:outline-none focus:ring-2 bg-white transition-colors`}
            />
          </div>
        </div>
        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
      </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Region <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={formData.region}
              onChange={(e) => {
                setFormData({ ...formData, region: e.target.value })
                if (errors.region) setErrors(prev => ({ ...prev, region: null }))
              }}
              className={`w-full px-4 py-2.5 rounded-xl border ${errors.region ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary focus:ring-primary'} focus:outline-none focus:ring-2 bg-white transition-colors appearance-none`}
            >
              <option value="" disabled>Select region</option>
              <option value="North">North</option>
              <option value="South">South</option>
              <option value="East">East</option>
              <option value="West">West</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          {errors.region && <p className="mt-1 text-sm text-red-600">{errors.region}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Enter address"
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={loading}
          className="flex-1"
        >
          {isEdit ? 'Save Changes' : 'Create Customer'}
        </Button>
      </div>
    </form>
  )
}

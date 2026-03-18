import { useState, useRef, useEffect } from 'react'
import { useLabManagementAuth } from '../../../contexts/LabManagementAuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  MapPin,
  Users2,
  Briefcase,
  Clock,
  FileText,
  Upload,
  X,
  Plus,
  Save,
  ChevronRight,
  Check,
  Zap,
  Award,
  Info,
  BookOpen,
  ClipboardList,
  CheckCircle2,
  Edit2,
  Trash2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../../../components/labManagement/Button'
import Input from '../../../components/labManagement/Input'
import Card from '../../../components/labManagement/Card'
import toast from 'react-hot-toast'
import { useLabData } from '../../../contexts/LabDataContext'
import { organizationService } from '../../../services/organizationService'
import { saveOrganizationStep, uploadFile } from '../../../services/organizationIntegration'

const steps = [
  { id: 1, name: 'Laboratory Details', icon: Building2 },
  { id: 2, name: 'Registered Office', icon: MapPin },
  { id: 3, name: 'Parent Organization', icon: Briefcase },
  { id: 4, name: 'Working Days & Type', icon: Clock },
  { id: 5, name: 'Compliance Documents', icon: FileText },
  { id: 6, name: 'Undertakings & Policies', icon: FileText },
  { id: 7, name: 'Power & Water Supply', icon: Zap },
  { id: 8, name: 'Accreditation & Other', icon: Award },
  { id: 9, name: 'Quality Manual & SOPs', icon: BookOpen },
  { id: 10, name: 'Quality Formats & Procedures', icon: ClipboardList },
  { id: 11, name: 'Checklist', icon: CheckCircle2 },
]

const proofOfLabAddressOptions = [
  'Select',
  'Premises Proof as per Government Status (For Govt. Labs)',
  'Rent Agreement (Duly Notarized)',
  'Municipal Corporation/Local Body/Central Insecticides Board or Drug Controller/ Pollution Control Board',
  'Certificates from Registrar of Firms or Directorate of Industries or Industries Centre',
  'Other'
]

const proofOfLegalIdentityOptions = [
  'Select',
  'PAN Card',
  'Cert. from CA/Notarized Affidavit & Bank Passbook / ID Proof (For Sole Proprietorship)',
  'Certificate of Registration & MOA (For Pvt. and Public Ltd.)',
  'Certificate of Registration (For Partnership Firm)',
  'Certificate of registration under Goods & Service Tax Act.',
  'Certificate of registration under shop and establishment act',
  'Government Notification / Declaration',
  'Other'
]

const complianceDocumentOptions = [
  'Select',
  'AERB Clearance',
  'Environmental Clearance',
  'Other',
  'PESO Clearance'
]

const organizationTypeOptions = [
  'Select',
  'Government',
  'Private Limited Company',
  'Public Limited Company',
  'Partnership',
  'Sole Proprietorship',
  'Trust',
  'Society',
  'Other'
]

const certificationTypeOptions = [
  'Select',
  'NABL Certificate',
  'ISO Certificate',
  'Other'
]

const waterSourceOptions = [
  'Select',
  'Municipal Supply',
  'Own Source',
  'Both'
]

export default function OrganizationDetails() {
  const navigate = useNavigate()
  const { organizationData, updateOrganizationData } = useLabData()
  const { user } = useLabManagementAuth()
  const canCreate = user?.role !== 'Quality Manager'
  const [currentStep, setCurrentStep] = useState(1)
  const [organizationId, setOrganizationId] = useState(null)  // Always start fresh
  const [loading, setLoading] = useState(false)
  const [checklist, setChecklist] = useState(null)  // Backend checklist data
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState(organizationData || {
    // Laboratory Details
    labName: '',
    labAddress: '',
    labCountry: 'India',
    labState: '',
    labDistrict: '',
    labCity: '',
    labPinCode: '',
    labLogo: null,
    labProofOfAddress: 'Select',
    labProofOfAddressOther: '',
    labDocumentId: '',
    labAddressProofDocument: null,

    // Registered Office
    sameAsLabAddress: false,
    registeredAddress: '',
    registeredCountry: 'India',
    registeredState: '',
    registeredDistrict: '',
    registeredCity: '',
    registeredPinCode: '',
    registeredMobile: '',
    registeredTelephone: '',
    registeredFax: '',

    // Top Management Details
    topManagement: [{
      id: 1,
      name: '',
      designation: '',
      mobile: '',
      telephone: '',
      fax: ''
    }],
    topManagementDocument: null,

    // Parent Organization
    sameAsLaboratory: false,
    parentName: '',
    parentAddress: '',
    parentCountry: 'India',
    parentState: '',
    parentDistrict: '',
    parentCity: '',
    parentPinCode: '',

    // Bank Details
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    gstNumber: '',
    cancelledCheque: null,

    // Working Days & Hours
    workingDays: [],
    shiftTimings: [{ from: '', to: '' }],

    // Type of Organization
    organizationType: 'Select',
    organizationTypeOther: '',
    proofOfLegalIdentity: 'Select',
    proofOfLegalIdentityOther: '',
    legalIdentityDocumentId: '',
    legalIdentityDocument: null,

    // Statutory Compliance
    complianceDocuments: [],

    // Undertakings & Policies
    impartialityDocument: null,
    termsConditionsDocument: null,
    codeOfEthicsDocument: null,
    testingChargesPolicyDocument: null,

    // Power, Electric and Water Supply
    adequacySanctionedLoad: '',
    availabilityUninterruptedPower: false,
    stabilityOfSupply: false,
    waterSource: 'Select',

    // Accreditation Documents
    accreditationDocuments: [],

    // Other Details
    otherLabDetails: '',
    otherDetailsDocument: null,
    layoutLabPremises: null,
    organizationChart: null,
    gpsLatitude: '',
    gpsLongitude: '',

    // Quality Manual / Document
    qualityManualTitle: '',
    qualityManualIssueNumber: '',
    qualityManualIssueDate: '',
    qualityManualAmendments: '',
    qualityManualDocument: null,

    // Standard Operating Procedures
    sopList: [],

    // Quality Formats
    qualityFormats: [],

    // Quality Procedures
    qualityProcedures: []
  })

  // Fetch checklist when navigating to step 11
  const fetchChecklist = async () => {
    if (!organizationId) return

    try {
      const checklistData = await organizationService.getChecklist(organizationId)
      setChecklist(checklistData)
    } catch (error) {
      console.error('Failed to fetch checklist:', error)
      toast.error('Failed to load checklist')
    }
  }

  // Use useEffect to fetch checklist when step changes to 11
  useEffect(() => {
    if (currentStep === 11 && organizationId) {
      fetchChecklist()
    }
  }, [currentStep, organizationId])  // Only re-run when these change


  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = async (field, file) => {
    if (!file) return

    // Validate file size (2MB for PDFs, 1MB for images)
    const maxSize = field === 'labLogo' ? 1 * 1024 * 1024 : 2 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error(`File size should not exceed ${field === 'labLogo' ? '1MB' : '2MB'}`)
      return
    }

    // Validate file type
    const allowedTypes = field === 'labLogo'
      ? ['image/jpeg', 'image/jpg', 'image/png']
      : ['application/pdf']

    if (!allowedTypes.includes(file.type)) {
      toast.error(`Please upload ${field === 'labLogo' ? 'JPG/PNG' : 'PDF'} files only`)
      return
    }

    // Upload file to backend
    try {
      setLoading(true)
      const fileUrl = await uploadFile(file, field)
      handleInputChange(field, fileUrl)
      toast.success('File uploaded successfully!')
    } catch (error) {
      toast.error('File upload failed: ' + error.message)
      console.error('File upload error:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTopManagement = () => {
    setFormData(prev => ({
      ...prev,
      topManagement: [...prev.topManagement, {
        id: prev.topManagement.length + 1,
        name: '',
        designation: '',
        mobile: '',
        telephone: '',
        fax: ''
      }]
    }))
  }

  const removeTopManagement = (id) => {
    if (formData.topManagement.length === 1) {
      toast.error('At least one top management member is required')
      return
    }
    setFormData(prev => ({
      ...prev,
      topManagement: prev.topManagement.filter(tm => tm.id !== id)
    }))
  }

  const updateTopManagement = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      topManagement: prev.topManagement.map(tm =>
        tm.id === id ? { ...tm, [field]: value } : tm
      )
    }))
  }

  const addShiftTiming = () => {
    if (formData.shiftTimings.length >= 4) {
      toast.error('Maximum 4 shifts are allowed')
      return
    }
    setFormData(prev => ({
      ...prev,
      shiftTimings: [...prev.shiftTimings, { from: '', to: '' }]
    }))
  }

  const removeShiftTiming = (index) => {
    if (formData.shiftTimings.length === 1) {
      toast.error('At least one shift timing is required')
      return
    }
    setFormData(prev => ({
      ...prev,
      shiftTimings: prev.shiftTimings.filter((_, i) => i !== index)
    }))
  }

  const updateShiftTiming = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      shiftTimings: prev.shiftTimings.map((shift, i) =>
        i === index ? { ...shift, [field]: value } : shift
      )
    }))
  }

  const toggleWorkingDay = (day) => {
    setFormData(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day]
    }))
  }

  const addComplianceDocument = () => {
    setFormData(prev => ({
      ...prev,
      complianceDocuments: [...prev.complianceDocuments, {
        id: Date.now(),
        type: 'Select',
        typeOther: '',
        documentId: '',
        file: null
      }]
    }))
  }

  const removeComplianceDocument = (id) => {
    setFormData(prev => ({
      ...prev,
      complianceDocuments: prev.complianceDocuments.filter(doc => doc.id !== id)
    }))
  }

  const updateComplianceDocument = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      complianceDocuments: prev.complianceDocuments.map(doc =>
        doc.id === id ? { ...doc, [field]: value } : doc
      )
    }))
  }

  const addAccreditationDocument = () => {
    setFormData(prev => ({
      ...prev,
      accreditationDocuments: [...prev.accreditationDocuments, {
        id: Date.now(),
        type: 'Select',
        typeOther: '',
        certificateNo: '',
        certificateFile: null,
        scopeFile: null
      }]
    }))
  }

  const removeAccreditationDocument = (id) => {
    setFormData(prev => ({
      ...prev,
      accreditationDocuments: prev.accreditationDocuments.filter(doc => doc.id !== id)
    }))
  }

  const updateAccreditationDocument = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      accreditationDocuments: prev.accreditationDocuments.map(doc =>
        doc.id === id ? { ...doc, [field]: value } : doc
      )
    }))
  }

  // SOP Management
  const addSOP = () => {
    setFormData(prev => ({
      ...prev,
      sopList: [...prev.sopList, {
        id: Date.now(),
        title: '',
        number: '',
        issueNumber: '',
        issueDate: '',
        amendments: ''
      }]
    }))
  }

  const removeSOP = (id) => {
    setFormData(prev => ({
      ...prev,
      sopList: prev.sopList.filter(sop => sop.id !== id)
    }))
  }

  const updateSOP = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      sopList: prev.sopList.map(sop =>
        sop.id === id ? { ...sop, [field]: value } : sop
      )
    }))
  }

  // Quality Format Management
  const addQualityFormat = () => {
    setFormData(prev => ({
      ...prev,
      qualityFormats: [...prev.qualityFormats, {
        id: Date.now(),
        title: '',
        number: '',
        issueNumber: '',
        issueDate: '',
        amendments: ''
      }]
    }))
  }

  const removeQualityFormat = (id) => {
    setFormData(prev => ({
      ...prev,
      qualityFormats: prev.qualityFormats.filter(format => format.id !== id)
    }))
  }

  const updateQualityFormat = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      qualityFormats: prev.qualityFormats.map(format =>
        format.id === id ? { ...format, [field]: value } : format
      )
    }))
  }

  // Quality Procedure Management
  const addQualityProcedure = () => {
    setFormData(prev => ({
      ...prev,
      qualityProcedures: [...prev.qualityProcedures, {
        id: Date.now(),
        title: '',
        number: '',
        file: null,
        issueNumber: '',
        issueDate: '',
        amendments: ''
      }]
    }))
  }

  const removeQualityProcedure = (id) => {
    setFormData(prev => ({
      ...prev,
      qualityProcedures: prev.qualityProcedures.filter(proc => proc.id !== id)
    }))
  }

  const updateQualityProcedure = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      qualityProcedures: prev.qualityProcedures.map(proc =>
        proc.id === id ? { ...proc, [field]: value } : proc
      )
    }))
  }

  const validateStep = (step) => {
    switch (step) {
      case 1: {
        const newErrors = {}
        if (!formData.labName?.trim()) newErrors.labName = 'Please enter laboratory name'
        if (!formData.labAddress?.trim()) newErrors.labAddress = 'Please enter complete address'
        if (!formData.labState?.trim()) newErrors.labState = 'Please enter state'
        if (!formData.labCity?.trim()) newErrors.labCity = 'Please enter city'
        if (!formData.labPinCode?.trim()) newErrors.labPinCode = 'Please enter pin code'
        
        if (formData.labProofOfAddress === 'Select') {
          newErrors.labProofOfAddress = 'Please select proof of laboratory address'
        }
        if (formData.labProofOfAddress === 'Other' && !formData.labProofOfAddressOther?.trim()) {
          newErrors.labProofOfAddressOther = 'Please specify other proof of address'
        }

        setErrors(newErrors)

        if (Object.keys(newErrors).length > 0) {
          toast.error('Please fill out all mandatory laboratory details')
          return false
        }
        break
      }
      case 2: {
        const newErrors = {}
        const phoneRegex = /^[0-9]{10}$/
        const generalPhoneRegex = /^[0-9]+$/

        if (!formData.sameAsLabAddress) {
          if (!formData.registeredAddress?.trim()) newErrors.registeredAddress = 'Please enter address'
          if (!formData.registeredState?.trim()) newErrors.registeredState = 'Please enter state'
          if (!formData.registeredDistrict?.trim()) newErrors.registeredDistrict = 'Please enter district'
          if (!formData.registeredCity?.trim()) newErrors.registeredCity = 'Please enter city'
          if (!formData.registeredPinCode?.trim()) newErrors.registeredPinCode = 'Please enter pin code'
          
          if (!formData.registeredMobile?.trim()) {
            newErrors.registeredMobile = 'Please enter mobile number'
          } else if (!phoneRegex.test(formData.registeredMobile.trim())) {
            newErrors.registeredMobile = 'Mobile must be exactly 10 digits'
          }

          if (formData.registeredTelephone?.trim() && !generalPhoneRegex.test(formData.registeredTelephone.trim())) {
            newErrors.registeredTelephone = 'Telephone must contain only digits'
          }

          if (formData.registeredFax?.trim() && !generalPhoneRegex.test(formData.registeredFax.trim())) {
            newErrors.registeredFax = 'Fax must contain only digits'
          }
        }
        
        formData.topManagement.forEach((tm, index) => {
          if (!tm.name?.trim()) newErrors[`topManagement_${index}_name`] = 'Required'
          if (!tm.designation?.trim()) newErrors[`topManagement_${index}_designation`] = 'Required'
          
          if (!tm.mobile?.trim()) {
            newErrors[`topManagement_${index}_mobile`] = 'Required'
          } else if (!phoneRegex.test(tm.mobile.trim())) {
            newErrors[`topManagement_${index}_mobile`] = 'Must be exactly 10 digits'
          }

          if (tm.telephone?.trim() && !generalPhoneRegex.test(tm.telephone.trim())) {
            newErrors[`topManagement_${index}_telephone`] = 'Must contain only digits'
          }

          if (tm.fax?.trim() && !generalPhoneRegex.test(tm.fax.trim())) {
            newErrors[`topManagement_${index}_fax`] = 'Must contain only digits'
          }
        })

        setErrors(newErrors)
        if (Object.keys(newErrors).length > 0) {
          toast.error('Please fill in all required registered office details')
          return false
        }
        break
      }
      case 3: {
        const newErrors = {}
        if (!formData.accountHolderName?.trim()) newErrors.accountHolderName = 'Please enter account holder name'
        if (!formData.accountNumber?.trim()) newErrors.accountNumber = 'Please enter account number'
        if (!formData.ifscCode?.trim()) newErrors.ifscCode = 'Please enter IFSC code'
        if (!formData.branchName?.trim()) newErrors.branchName = 'Please enter branch name'
        if (!formData.gstNumber?.trim()) newErrors.gstNumber = 'Please enter GST number'

        setErrors(newErrors)
        if (Object.keys(newErrors).length > 0) {
          toast.error('Please fill in all required bank details')
          return false
        }
        break
      }
      case 4: {
        const newErrors = {}
        if (formData.workingDays.length === 0) newErrors.workingDays = 'Please select at least one working day'
        
        formData.shiftTimings.forEach((shift, index) => {
          if (!shift.from) newErrors[`shiftTimings_${index}_from`] = 'Required'
          if (!shift.to) newErrors[`shiftTimings_${index}_to`] = 'Required'
        })
        
        if (formData.organizationType === 'Select') newErrors.organizationType = 'Please select organization type'
        if (formData.organizationType === 'Other' && !formData.organizationTypeOther?.trim()) {
          newErrors.organizationTypeOther = 'Please specify other organization type'
        }
        if (formData.proofOfLegalIdentity === 'Select') newErrors.proofOfLegalIdentity = 'Please select proof of legal identity'
        if (formData.proofOfLegalIdentity === 'Other' && !formData.proofOfLegalIdentityOther?.trim()) {
          newErrors.proofOfLegalIdentityOther = 'Please specify other proof of legal identity'
        }

        setErrors(newErrors)
        if (Object.keys(newErrors).length > 0) {
          toast.error('Please fill out all mandatory working days and organization type details')
          return false
        }
        break
      }
      case 5: {
        const newErrors = {}
        formData.complianceDocuments.forEach((doc, index) => {
          if (doc.type === 'Select') newErrors[`complianceDocuments_${index}_type`] = 'Please select document type'
          if (doc.type === 'Other' && !doc.typeOther?.trim()) newErrors[`complianceDocuments_${index}_typeOther`] = 'Required'
        })
        
        setErrors(newErrors)
        if (Object.keys(newErrors).length > 0) {
          toast.error('Please fill in all mandatory compliance document details')
          return false
        }
        break
      }
      case 6: {
        const newErrors = {}

        setErrors(newErrors)
        if (Object.keys(newErrors).length > 0) {
          toast.error('Please upload all required policy documents')
          return false
        }
        break
      }
      case 7: {
        const newErrors = {}
        if (!formData.adequacySanctionedLoad?.trim()) newErrors.adequacySanctionedLoad = 'Please fill in adequacy of sanctioned load details'
        if (formData.waterSource === 'Select') newErrors.waterSource = 'Please select water source'

        setErrors(newErrors)
        if (Object.keys(newErrors).length > 0) {
          toast.error('Please fill in required power & water supply details')
          return false
        }
        break
      }
      case 8: {
        const newErrors = {}
        if (!formData.gpsLatitude?.trim()) newErrors.gpsLatitude = 'Please enter latitude'
        if (!formData.gpsLongitude?.trim()) newErrors.gpsLongitude = 'Please enter longitude'
        
        formData.accreditationDocuments.forEach((doc, index) => {
          if (doc.type === 'Select') newErrors[`accreditationDocuments_${index}_type`] = 'Required'
          if (!doc.certificateNo?.trim()) newErrors[`accreditationDocuments_${index}_certificateNo`] = 'Required'
          if (doc.type === 'Other' && !doc.typeOther?.trim()) newErrors[`accreditationDocuments_${index}_typeOther`] = 'Required'
          if (!doc.validityDate) newErrors[`accreditationDocuments_${index}_validityDate`] = 'Required'
        })

        setErrors(newErrors)
        if (Object.keys(newErrors).length > 0) {
          toast.error('Please upload layout, organization chart and enter GPS coordinates')
          return false
        }
        break
      }
      case 9: {
        const newErrors = {}
        if (!formData.qualityManualTitle?.trim()) newErrors.qualityManualTitle = 'Required'
        if (!formData.qualityManualIssueNumber?.trim()) newErrors.qualityManualIssueNumber = 'Required'
        if (!formData.qualityManualIssueDate) newErrors.qualityManualIssueDate = 'Required'
        if (!formData.qualityManualAmendments?.trim()) newErrors.qualityManualAmendments = 'Required'
        
        formData.sopList.forEach((sop, index) => {
          if (!sop.title?.trim()) newErrors[`sopList_${index}_title`] = 'Required'
          if (!sop.number?.trim()) newErrors[`sopList_${index}_number`] = 'Required'
          if (!sop.issueNumber?.trim()) newErrors[`sopList_${index}_issueNumber`] = 'Required'
          if (!sop.issueDate) newErrors[`sopList_${index}_issueDate`] = 'Required'
          if (!sop.amendments?.trim()) newErrors[`sopList_${index}_amendments`] = 'Required'
        })

        setErrors(newErrors)
        if (Object.keys(newErrors).length > 0) {
          toast.error('Please fill in all quality manual and SOP details')
          return false
        }
        break
      }
      case 10: {
        const newErrors = {}
        formData.qualityFormats.forEach((format, index) => {
          if (!format.title?.trim()) newErrors[`qualityFormats_${index}_title`] = 'Required'
          if (!format.number?.trim()) newErrors[`qualityFormats_${index}_number`] = 'Required'
          if (!format.issueNumber?.trim()) newErrors[`qualityFormats_${index}_issueNumber`] = 'Required'
          if (!format.issueDate) newErrors[`qualityFormats_${index}_issueDate`] = 'Required'
          if (!format.amendments?.trim()) newErrors[`qualityFormats_${index}_amendments`] = 'Required'
        })

        formData.qualityProcedures.forEach((proc, index) => {
          if (!proc.title?.trim()) newErrors[`qualityProcedures_${index}_title`] = 'Required'
          if (!proc.number?.trim()) newErrors[`qualityProcedures_${index}_number`] = 'Required'
          if (!proc.issueNumber?.trim()) newErrors[`qualityProcedures_${index}_issueNumber`] = 'Required'
          if (!proc.issueDate) newErrors[`qualityProcedures_${index}_issueDate`] = 'Required'
          if (!proc.amendments?.trim()) newErrors[`qualityProcedures_${index}_amendments`] = 'Required'
        })
        
        setErrors(newErrors)
        if (Object.keys(newErrors).length > 0) {
          toast.error('Please fill in all quality formats and procedures details')
          return false
        }
        break
      }
      default:
        setErrors({})
        break
    }
    return true
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSave = async () => {
    if (!validateStep(currentStep)) return

    try {
      setLoading(true)

      // Create organization if it doesn't exist (Step 1)
      if (!organizationId && currentStep === 1) {
        const newOrg = await organizationService.createOrganization({
          lab_name: formData.labName,
          lab_address: formData.labAddress,
          lab_state: formData.labState,
          lab_district: formData.labDistrict,
          lab_city: formData.labCity,
          lab_pin_code: formData.labPinCode,
        })

        setOrganizationId(newOrg.id)
        toast.success('Organization created successfully!')
      } else if (organizationId) {
        // Update existing organization
        await saveOrganizationStep(organizationId, currentStep, formData)
        updateOrganizationData(formData)
        toast.success('Organization details saved successfully!')
      } else {
        toast.error('Please complete Step 1 first')
        return
      }

      // Move to next step
      if (currentStep < steps.length) {
        setCurrentStep(prev => prev + 1)
      }
    } catch (error) {
      toast.error('Save failed: ' + error.message)
      console.error('Save error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    if (!organizationId) {
      toast.error('Please save your data first')
      return
    }

    try {
      setLoading(true)

      // Get checklist to verify completion
      const checklistData = await organizationService.getChecklist(organizationId)
      setChecklist(checklistData)  // Update checklist state

      if (!checklistData.is_ready_for_submission) {
        const incompleteSteps = checklistData.steps
          .filter(step => !step.is_completed)
          .map(step => step.step_name)
          .join(', ')

        toast.error(`Please complete the following steps: ${incompleteSteps}`)
        return
      }

      // Submit organization
      await organizationService.submitOrganization(organizationId)
      updateOrganizationData(formData)
      toast.success('Organization details submitted successfully!')
    } catch (error) {
      toast.error('Submission failed: ' + error.message)
      console.error('Submit error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organization Details</h1>
          <p className="text-gray-600 mt-2">
            Step 1: Complete your laboratory organization information
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${currentStep === step.id
                    ? 'bg-primary border-primary text-white'
                    : currentStep > step.id
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'bg-white border-gray-300 text-gray-500'
                    }`}
                >
                  {currentStep > step.id ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-6 h-6" />
                  )}
                </div>
                <p
                  className={`text-xs mt-2 text-center font-medium ${currentStep === step.id
                    ? 'text-primary'
                    : currentStep > step.id
                      ? 'text-green-600'
                      : 'text-gray-500'
                    }`}
                >
                  {step.name}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 mb-6 ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Form Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <p className="text-sm text-red-500 mb-4 px-6 pt-4">Please fill all the mandatory details in the form (*)</p>
            {/* Step 1: Laboratory Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-primary" />
                    Laboratory Details
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Enter complete name and address of the Laboratory and submit proof of address.
                  </p>
                </div>

                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Upload Logo of your laboratory. JPG files are recommended of not more than 1 MB size.
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary transition-colors">
                        <Upload className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">
                          {formData.labLogo ? formData.labLogo.name : 'Choose file...'}
                        </span>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload('labLogo', e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {formData.labLogo && (
                      <Button
                        variant="outline"
                        onClick={() => handleInputChange('labLogo', null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label={<>Name <span className="text-red-500">*</span></>}
                      value={formData.labName}
                      onChange={(e) => {
                        handleInputChange('labName', e.target.value)
                        if (errors.labName) setErrors(prev => ({ ...prev, labName: null }))
                      }}
                      error={errors.labName}
                      placeholder="Enter laboratory name"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.labAddress}
                      onChange={(e) => {
                        handleInputChange('labAddress', e.target.value)
                        if (errors.labAddress) setErrors(prev => ({ ...prev, labAddress: null }))
                      }}
                      placeholder="Enter complete address"
                      rows={3}
                      className={`w-full px-4 py-2.5 rounded-xl border ${errors.labAddress ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary'} focus:outline-none focus:ring-2 focus:border-transparent resize-none`}
                    />
                    {errors.labAddress && <p className="mt-1 text-sm text-red-600">{errors.labAddress}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.labCountry}
                      onChange={(e) => handleInputChange('labCountry', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="India">India</option>
                    </select>
                  </div>

                  <Input
                    label={<>State <span className="text-red-500">*</span></>}
                    value={formData.labState}
                    onChange={(e) => {
                      handleInputChange('labState', e.target.value)
                      if (errors.labState) setErrors(prev => ({ ...prev, labState: null }))
                    }}
                    error={errors.labState}
                    placeholder="Enter state"
                  />

                  <Input
                    label="District"
                    value={formData.labDistrict}
                    onChange={(e) => handleInputChange('labDistrict', e.target.value)}
                    placeholder="Enter district (Optional)"
                  />

                  <Input
                    label={<>City <span className="text-red-500">*</span></>}
                    value={formData.labCity}
                    onChange={(e) => {
                      handleInputChange('labCity', e.target.value)
                      if (errors.labCity) setErrors(prev => ({ ...prev, labCity: null }))
                    }}
                    error={errors.labCity}
                    placeholder="Enter city"
                  />

                  <Input
                    label={<>Pin Code <span className="text-red-500">*</span></>}
                    value={formData.labPinCode}
                    onChange={(e) => {
                      handleInputChange('labPinCode', e.target.value)
                      if (errors.labPinCode) setErrors(prev => ({ ...prev, labPinCode: null }))
                    }}
                    error={errors.labPinCode}
                    placeholder="Enter pin code"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proof of Laboratory Address <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.labProofOfAddress}
                      onChange={(e) => {
                        handleInputChange('labProofOfAddress', e.target.value)
                        if (errors.labProofOfAddress) setErrors(prev => ({ ...prev, labProofOfAddress: null }))
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border ${errors.labProofOfAddress ? 'border-red-300 bg-red-50 text-red-900 focus:ring-red-500' : 'border-gray-300 focus:ring-primary'} focus:outline-none focus:ring-2 focus:border-transparent`}
                    >
                      {proofOfLabAddressOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    {errors.labProofOfAddress && <p className="mt-1 text-sm text-red-600">{errors.labProofOfAddress}</p>}
                  </div>

                  <Input
                    label="Document ID (Optional)"
                    value={formData.labDocumentId}
                    onChange={(e) => handleInputChange('labDocumentId', e.target.value)}
                    placeholder="e.g., Pan no. in case of PAN Card"
                  />
                </div>

                {formData.labProofOfAddress === 'Other' && (
                  <Input
                    label={<>Specify Other Proof of Address <span className="text-red-500">*</span></>}
                    value={formData.labProofOfAddressOther}
                    onChange={(e) => {
                      handleInputChange('labProofOfAddressOther', e.target.value)
                      if (errors.labProofOfAddressOther) setErrors(prev => ({ ...prev, labProofOfAddressOther: null }))
                    }}
                    error={errors.labProofOfAddressOther}
                    placeholder="Specify other proof of address"
                  />
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Proof Document
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Only PDF file of up to 2 MB size are allowed.
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 hover:border-primary rounded-xl cursor-pointer transition-colors">
                        <Upload className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">
                          {formData.labAddressProofDocument ? formData.labAddressProofDocument.name : 'Choose file...'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleFileUpload('labAddressProofDocument', e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {formData.labAddressProofDocument && (
                      <Button
                        variant="outline"
                        onClick={() => handleInputChange('labAddressProofDocument', null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Registered Office & Top Management */}
            {currentStep === 2 && (
              <div className="space-y-8">
                {/* Registered Office */}
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <MapPin className="w-6 h-6 text-primary" />
                      Address of Registered Office / Head Office
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Fill complete address of registered office (if different from the address filled above), otherwise click same as above.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sameAsLabAddress"
                      checked={formData.sameAsLabAddress}
                      onChange={(e) => handleInputChange('sameAsLabAddress', e.target.checked)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <label htmlFor="sameAsLabAddress" className="text-sm font-medium text-gray-700">
                      Same as above
                    </label>
                  </div>

                  {!formData.sameAsLabAddress && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={formData.registeredAddress}
                          onChange={(e) => {
                            handleInputChange('registeredAddress', e.target.value)
                            if (errors.registeredAddress) setErrors(prev => ({ ...prev, registeredAddress: null }))
                          }}
                          placeholder="Enter complete address"
                          rows={3}
                          className={`w-full px-4 py-2.5 rounded-xl border ${errors.registeredAddress ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary'} focus:outline-none focus:ring-2 focus:border-transparent resize-none`}
                        />
                        {errors.registeredAddress && <p className="mt-1 text-sm text-red-600">{errors.registeredAddress}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.registeredCountry}
                          onChange={(e) => handleInputChange('registeredCountry', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="India">India</option>
                        </select>
                      </div>

                      <Input
                        label={<>State <span className="text-red-500">*</span></>}
                        value={formData.registeredState}
                        onChange={(e) => {
                          handleInputChange('registeredState', e.target.value)
                          if (errors.registeredState) setErrors(prev => ({ ...prev, registeredState: null }))
                        }}
                        error={errors.registeredState}
                        placeholder="Enter state"
                      />

                      <Input
                        label={<>District <span className="text-red-500">*</span></>}
                        value={formData.registeredDistrict}
                        onChange={(e) => {
                          handleInputChange('registeredDistrict', e.target.value)
                          if (errors.registeredDistrict) setErrors(prev => ({ ...prev, registeredDistrict: null }))
                        }}
                        error={errors.registeredDistrict}
                        placeholder="Enter district"
                      />

                      <Input
                        label={<>City <span className="text-red-500">*</span></>}
                        value={formData.registeredCity}
                        onChange={(e) => {
                          handleInputChange('registeredCity', e.target.value)
                          if (errors.registeredCity) setErrors(prev => ({ ...prev, registeredCity: null }))
                        }}
                        error={errors.registeredCity}
                        placeholder="Enter city"
                      />

                      <Input
                        label={<>Pin Code <span className="text-red-500">*</span></>}
                        value={formData.registeredPinCode}
                        onChange={(e) => {
                          handleInputChange('registeredPinCode', e.target.value)
                          if (errors.registeredPinCode) setErrors(prev => ({ ...prev, registeredPinCode: null }))
                        }}
                        error={errors.registeredPinCode}
                        placeholder="Enter pin code"
                      />

                      <Input
                        label={<>Mobile Number <span className="text-red-500">*</span></>}
                        value={formData.registeredMobile}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                          handleInputChange('registeredMobile', value)
                          if (errors.registeredMobile) setErrors(prev => ({ ...prev, registeredMobile: null }))
                        }}
                        error={errors.registeredMobile}
                        placeholder="eg. +91 9818035577"
                      />

                      <Input
                        label="Telephone Number"
                        value={formData.registeredTelephone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '')
                          handleInputChange('registeredTelephone', value)
                          if (errors.registeredTelephone) setErrors(prev => ({ ...prev, registeredTelephone: null }))
                        }}
                        error={errors.registeredTelephone}
                        placeholder="Telephone number"
                      />

                      <Input
                        label="Fax"
                        value={formData.registeredFax}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '')
                          handleInputChange('registeredFax', value)
                          if (errors.registeredFax) setErrors(prev => ({ ...prev, registeredFax: null }))
                        }}
                        error={errors.registeredFax}
                        placeholder="Fax number"
                      />
                    </div>
                  )}
                </div>

                {/* Top Management Details */}
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <Users2 className="w-6 h-6 text-primary" />
                      Name & Designation of Top Management and Contact Person
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Enter the details of Top Management and Contact Person of the Laboratory.
                      To add multiple personnel details please use "Add more".
                    </p>
                  </div>

                  {formData.topManagement.map((member, index) => (
                    <div key={member.id} className="p-4 bg-gray-50 rounded-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">Person {index + 1}</h3>
                        {formData.topManagement.length > 1 && canCreate && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeTopManagement(member.id)}
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label={<>Name <span className="text-red-500">*</span></>}
                          value={member.name}
                          onChange={(e) => {
                            updateTopManagement(member.id, 'name', e.target.value)
                            if (errors[`topManagement_${index}_name`]) setErrors(prev => ({ ...prev, [`topManagement_${index}_name`]: null }))
                          }}
                          error={errors[`topManagement_${index}_name`]}
                          placeholder="Enter name"
                        />

                        <Input
                          label={<>Designation <span className="text-red-500">*</span></>}
                          value={member.designation}
                          onChange={(e) => {
                            updateTopManagement(member.id, 'designation', e.target.value)
                            if (errors[`topManagement_${index}_designation`]) setErrors(prev => ({ ...prev, [`topManagement_${index}_designation`]: null }))
                          }}
                          error={errors[`topManagement_${index}_designation`]}
                          placeholder="Enter designation"
                        />

                        <Input
                          label={<>Mobile Number <span className="text-red-500">*</span></>}
                          value={member.mobile}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                            updateTopManagement(member.id, 'mobile', value)
                            if (errors[`topManagement_${index}_mobile`]) setErrors(prev => ({ ...prev, [`topManagement_${index}_mobile`]: null }))
                          }}
                          error={errors[`topManagement_${index}_mobile`]}
                          placeholder="eg. +91 9818035577"
                        />

                        <Input
                          label="Telephone Number"
                          value={member.telephone}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '')
                            updateTopManagement(member.id, 'telephone', value)
                            if (errors[`topManagement_${index}_telephone`]) setErrors(prev => ({ ...prev, [`topManagement_${index}_telephone`]: null }))
                          }}
                          error={errors[`topManagement_${index}_telephone`]}
                          placeholder="Telephone number"
                        />

                        <Input
                          label="Fax"
                          value={member.fax}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '')
                            updateTopManagement(member.id, 'fax', value)
                            if (errors[`topManagement_${index}_fax`]) setErrors(prev => ({ ...prev, [`topManagement_${index}_fax`]: null }))
                          }}
                          error={errors[`topManagement_${index}_fax`]}
                          placeholder="Fax number"
                        />
                      </div>
                    </div>
                  ))}

                  {canCreate && (
                    <Button
                      variant="outline"
                      onClick={addTopManagement}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add more
                    </Button>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Top Management Details
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Upload all Top Management / Director details on your letter head or upload any relevant document
                      containing such details e.g., MOA. Only PDF file of up to 2 MB size are allowed.
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary transition-colors">
                          <Upload className="w-5 h-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600">
                            {formData.topManagementDocument ? formData.topManagementDocument.name : 'Choose file...'}
                          </span>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => handleFileUpload('topManagementDocument', e.target.files[0])}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {formData.topManagementDocument && canCreate && (
                        <Button
                          variant="outline"
                          onClick={() => handleInputChange('topManagementDocument', null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Parent Organization & Bank Details */}
            {currentStep === 3 && (
              <div className="space-y-8">
                {/* Parent Organization */}
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <Briefcase className="w-6 h-6 text-primary" />
                      Parent Organization
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Fill details of parent organization (in case laboratory is part of larger group), otherwise click same as above.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sameAsLaboratory"
                      checked={formData.sameAsLaboratory}
                      onChange={(e) => handleInputChange('sameAsLaboratory', e.target.checked)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <label htmlFor="sameAsLaboratory" className="text-sm font-medium text-gray-700">
                      Same as laboratory
                    </label>
                  </div>

                  {!formData.sameAsLaboratory && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Input
                          label="Name"
                          value={formData.parentName}
                          onChange={(e) => handleInputChange('parentName', e.target.value)}
                          placeholder="Enter parent organization name"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address
                        </label>
                        <textarea
                          value={formData.parentAddress}
                          onChange={(e) => handleInputChange('parentAddress', e.target.value)}
                          placeholder="Enter complete address"
                          rows={3}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <select
                          value={formData.parentCountry}
                          onChange={(e) => handleInputChange('parentCountry', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="India">India</option>
                        </select>
                      </div>

                      <Input
                        label="State"
                        value={formData.parentState}
                        onChange={(e) => handleInputChange('parentState', e.target.value)}
                        placeholder="Enter state"
                      />

                      <Input
                        label="District"
                        value={formData.parentDistrict}
                        onChange={(e) => handleInputChange('parentDistrict', e.target.value)}
                        placeholder="Enter district"
                      />

                      <Input
                        label="City"
                        value={formData.parentCity}
                        onChange={(e) => handleInputChange('parentCity', e.target.value)}
                        placeholder="Enter city"
                      />

                      <Input
                        label="Pin Code"
                        value={formData.parentPinCode}
                        onChange={(e) => handleInputChange('parentPinCode', e.target.value)}
                        placeholder="Enter pin code"
                      />
                    </div>
                  )}
                </div>

                {/* Laboratory Bank Details */}
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Laboratory Bank Details
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Enter complete name and address of the Laboratory and submit proof of address.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label={<>Account Holder Name <span className="text-red-500">*</span></>}
                      value={formData.accountHolderName}
                      onChange={(e) => {
                        handleInputChange('accountHolderName', e.target.value)
                        if (errors.accountHolderName) setErrors(prev => ({ ...prev, accountHolderName: null }))
                      }}
                      error={errors.accountHolderName}
                      placeholder="Enter account holder name"
                    />

                    <Input
                      label={<>Account Number <span className="text-red-500">*</span></>}
                      value={formData.accountNumber}
                      onChange={(e) => {
                        handleInputChange('accountNumber', e.target.value)
                        if (errors.accountNumber) setErrors(prev => ({ ...prev, accountNumber: null }))
                      }}
                      error={errors.accountNumber}
                      placeholder="Enter account number"
                    />

                    <Input
                      label={<>IFSC Code <span className="text-red-500">*</span></>}
                      value={formData.ifscCode}
                      onChange={(e) => {
                        handleInputChange('ifscCode', e.target.value)
                        if (errors.ifscCode) setErrors(prev => ({ ...prev, ifscCode: null }))
                      }}
                      error={errors.ifscCode}
                      placeholder="Enter IFSC code"
                    />

                    <Input
                      label={<>Branch Name <span className="text-red-500">*</span></>}
                      value={formData.branchName}
                      onChange={(e) => {
                        handleInputChange('branchName', e.target.value)
                        if (errors.branchName) setErrors(prev => ({ ...prev, branchName: null }))
                      }}
                      error={errors.branchName}
                      placeholder="Enter branch name"
                    />

                    <Input
                      label={<>GST Number <span className="text-red-500">*</span></>}
                      value={formData.gstNumber}
                      onChange={(e) => {
                        handleInputChange('gstNumber', e.target.value)
                        if (errors.gstNumber) setErrors(prev => ({ ...prev, gstNumber: null }))
                      }}
                      error={errors.gstNumber}
                      placeholder="Enter GST number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cancelled Cheque
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Upload a copy of cancelled cheque of the bank a/c provided. Only PDF file of up to 2 MB size are allowed.
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed ${errors.cancelledCheque ? 'border-red-400 bg-red-50 text-red-500' : 'border-gray-300 hover:border-primary'} rounded-xl cursor-pointer transition-colors`}>
                          <Upload className={`w-5 h-5 mr-2 ${errors.cancelledCheque ? 'text-red-400' : 'text-gray-400'}`} />
                          <span className={`text-sm ${errors.cancelledCheque ? 'text-red-500' : 'text-gray-600'}`}>
                            {formData.cancelledCheque ? formData.cancelledCheque.name : 'Choose file...'}
                          </span>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => {
                              handleFileUpload('cancelledCheque', e.target.files[0])
                              if (errors.cancelledCheque) setErrors(prev => ({ ...prev, cancelledCheque: null }))
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {formData.cancelledCheque && canCreate && (
                        <Button
                          variant="outline"
                          onClick={() => handleInputChange('cancelledCheque', null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {errors.cancelledCheque && <p className="mt-1 text-sm text-red-600">{errors.cancelledCheque}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Working Days & Type of Organization */}
            {currentStep === 4 && (
              <div className="space-y-8">
                {/* Normal Working Days & Hours */}
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <Clock className="w-6 h-6 text-primary" />
                      Normal Working Day(s) & Hours
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Fill in the details of Working Days and Shift Timings.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Working Day(s) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <label
                          key={day}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${formData.workingDays.includes(day)
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-gray-300 hover:border-gray-400'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.workingDays.includes(day)}
                            onChange={() => {
                              toggleWorkingDay(day)
                              if (errors.workingDays) setErrors(prev => ({ ...prev, workingDays: null }))
                            }}
                            className="sr-only"
                          />
                          <span className="text-sm font-medium">{day}</span>
                        </label>
                      ))}
                    </div>
                    {errors.workingDays && <p className="mt-2 text-sm text-red-600">{errors.workingDays}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Add Shift Timings <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      You may add multiple shift timings by using the "+" button. A maximum of 4 shifts are allowed.
                    </p>

                    <div className="space-y-3">
                      {formData.shiftTimings.map((shift, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="time"
                              value={shift.from}
                              onChange={(e) => {
                                updateShiftTiming(index, 'from', e.target.value)
                                if (errors[`shiftTimings_${index}_from`]) setErrors(prev => ({ ...prev, [`shiftTimings_${index}_from`]: null }))
                              }}
                              className={`flex-1 px-4 py-2.5 rounded-xl border ${errors[`shiftTimings_${index}_from`] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary'} focus:outline-none focus:ring-2 focus:border-transparent`}
                            />
                            <span className="text-gray-500">To</span>
                            <input
                              type="time"
                              value={shift.to}
                              onChange={(e) => {
                                updateShiftTiming(index, 'to', e.target.value)
                                if (errors[`shiftTimings_${index}_to`]) setErrors(prev => ({ ...prev, [`shiftTimings_${index}_to`]: null }))
                              }}
                              className={`flex-1 px-4 py-2.5 rounded-xl border ${errors[`shiftTimings_${index}_to`] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary'} focus:outline-none focus:ring-2 focus:border-transparent`}
                            />
                          </div>
                          <div className="flex gap-2">
                            {index === formData.shiftTimings.length - 1 && formData.shiftTimings.length < 4 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={addShiftTiming}
                              >
                                <Plus className="w-4 h-4 text-primary" />
                              </Button>
                            )}
                            {formData.shiftTimings.length > 1 && canCreate && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeShiftTiming(index)}
                              >
                                <X className="w-4 h-4 text-red-600" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Type of Organization */}
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Type of Organization
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Fill details of organization and upload the proof of its identity.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Organization Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.organizationType}
                        onChange={(e) => {
                          handleInputChange('organizationType', e.target.value)
                          if (errors.organizationType) setErrors(prev => ({ ...prev, organizationType: null }))
                        }}
                        className={`w-full px-4 py-2.5 rounded-xl border ${errors.organizationType ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary'} focus:outline-none focus:ring-2 focus:border-transparent`}
                      >
                        {organizationTypeOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      {errors.organizationType && <p className="mt-1 text-sm text-red-600">{errors.organizationType}</p>}
                    </div>

                    {formData.organizationType === 'Other' && (
                      <Input
                        label={<>Specify Other Organization Type <span className="text-red-500">*</span></>}
                        value={formData.organizationTypeOther}
                        onChange={(e) => {
                          handleInputChange('organizationTypeOther', e.target.value)
                          if (errors.organizationTypeOther) setErrors(prev => ({ ...prev, organizationTypeOther: null }))
                        }}
                        error={errors.organizationTypeOther}
                        placeholder="Specify other organization type"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Proof of Legal Identity <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.proofOfLegalIdentity}
                        onChange={(e) => {
                          handleInputChange('proofOfLegalIdentity', e.target.value)
                          if (errors.proofOfLegalIdentity) setErrors(prev => ({ ...prev, proofOfLegalIdentity: null }))
                        }}
                        className={`w-full px-4 py-2.5 rounded-xl border ${errors.proofOfLegalIdentity ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary'} focus:outline-none focus:ring-2 focus:border-transparent`}
                      >
                        {proofOfLegalIdentityOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      {errors.proofOfLegalIdentity && <p className="mt-1 text-sm text-red-600">{errors.proofOfLegalIdentity}</p>}
                    </div>

                    <Input
                      label="Document ID (Optional)"
                      value={formData.legalIdentityDocumentId}
                      onChange={(e) => handleInputChange('legalIdentityDocumentId', e.target.value)}
                      placeholder="e.g., Pan no. in case of PAN Card"
                    />
                  </div>

                  {formData.proofOfLegalIdentity === 'Other' && (
                    <Input
                      label={<>Specify Other Proof of Legal Identity <span className="text-red-500">*</span></>}
                      value={formData.proofOfLegalIdentityOther}
                      onChange={(e) => {
                        handleInputChange('proofOfLegalIdentityOther', e.target.value)
                        if (errors.proofOfLegalIdentityOther) setErrors(prev => ({ ...prev, proofOfLegalIdentityOther: null }))
                      }}
                      error={errors.proofOfLegalIdentityOther}
                      placeholder="Specify other proof of legal identity"
                    />
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Legal Identity Proof Document
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Only PDF file of up to 2 MB size are allowed.
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed ${errors.legalIdentityDocument ? 'border-red-400 bg-red-50 text-red-500' : 'border-gray-300 hover:border-primary'} rounded-xl cursor-pointer transition-colors`}>
                          <Upload className={`w-5 h-5 mr-2 ${errors.legalIdentityDocument ? 'text-red-400' : 'text-gray-400'}`} />
                          <span className={`text-sm ${errors.legalIdentityDocument ? 'text-red-500' : 'text-gray-600'}`}>
                            {formData.legalIdentityDocument ? formData.legalIdentityDocument.name : 'Choose file...'}
                          </span>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => {
                              handleFileUpload('legalIdentityDocument', e.target.files[0])
                              if (errors.legalIdentityDocument) setErrors(prev => ({ ...prev, legalIdentityDocument: null }))
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {formData.legalIdentityDocument && canCreate && (
                        <Button
                          variant="outline"
                          onClick={() => handleInputChange('legalIdentityDocument', null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {errors.legalIdentityDocument && <p className="mt-1 text-sm text-red-600">{errors.legalIdentityDocument}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Statutory Compliance Documents */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-primary" />
                    Statutory Compliance Documents
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Upload the documents related to statutory compliance (if required by the Laboratory).
                  </p>
                </div>

                {formData.complianceDocuments.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No compliance documents added yet</p>
                    <Button onClick={addComplianceDocument}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Document
                    </Button>
                  </div>
                ) : (
                  <>
                    {formData.complianceDocuments.map((doc, index) => (
                      <div key={doc.id} className="p-4 bg-gray-50 rounded-xl space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900">Document {index + 1}</h3>
                          {canCreate && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeComplianceDocument(doc.id)}
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Document Type
                            </label>
                            <select
                              value={doc.type}
                              onChange={(e) => updateComplianceDocument(doc.id, 'type', e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                              {complianceDocumentOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </div>

                          <Input
                            label="Document ID (Optional)"
                            value={doc.documentId}
                            onChange={(e) => updateComplianceDocument(doc.id, 'documentId', e.target.value)}
                            placeholder="Document ID"
                          />
                        </div>

                        {doc.type === 'Other' && (
                          <Input
                            label="Specify Document Type"
                            value={doc.typeOther}
                            onChange={(e) => updateComplianceDocument(doc.id, 'typeOther', e.target.value)}
                            placeholder="Specify document type"
                          />
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Document
                          </label>
                          <p className="text-xs text-gray-500 mb-2">
                            Upload a document to provide details of clearances received by the Lab as per document selected in the list.
                            e.g. Environmental Clearance Certificate issued by competent authority.
                            Only PDF file of up to 2 MB size are allowed.
                          </p>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary transition-colors">
                                <Upload className="w-5 h-5 text-gray-400 mr-2" />
                                <span className="text-sm text-gray-600 truncate max-w-[200px]">
                                  {doc.file ? (typeof doc.file === 'string' ? doc.file.split('/').pop() : doc.file.name) : 'Choose file...'}
                                </span>
                                <input
                                  type="file"
                                  accept=".pdf"
                                  onChange={async (e) => {
                                    const file = e.target.files[0]
                                    if (file) {
                                      const maxSize = 2 * 1024 * 1024
                                      if (file.size > maxSize) {
                                        toast.error('File size should not exceed 2MB')
                                        return
                                      }
                                      if (file.type !== 'application/pdf') {
                                        toast.error('Please upload PDF files only')
                                        return
                                      }

                                      try {
                                        setLoading(true)
                                        const fileUrl = await uploadFile(file, 'compliance')
                                        updateComplianceDocument(doc.id, 'file', fileUrl)
                                        toast.success('File uploaded successfully!')
                                      } catch (error) {
                                        toast.error('File upload failed: ' + error.message)
                                      } finally {
                                        setLoading(false)
                                      }
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                            </div>
                            {doc.file && canCreate && (
                              <Button
                                variant="outline"
                                onClick={() => updateComplianceDocument(doc.id, 'file', null)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {canCreate && (
                      <Button
                        variant="outline"
                        onClick={addComplianceDocument}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add more
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Step 6: Undertakings & Policies */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-primary" />
                    Undertakings & Policies
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Upload the undertakings as required in following fields (Signed and Stamped as per the instructions given in the forms).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Impartiality Document */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Impartiality Document
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Upload an Impartiality Document as per format provided. Only PDF file of up to 2 MB size are allowed.
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed ${errors.impartialityDocument ? 'border-red-400 bg-red-50 text-red-500' : 'border-gray-300 hover:border-primary'} rounded-xl cursor-pointer transition-colors`}>
                          <Upload className={`w-5 h-5 mr-2 ${errors.impartialityDocument ? 'text-red-400' : 'text-gray-400'}`} />
                          <span className={`text-sm ${errors.impartialityDocument ? 'text-red-500' : 'text-gray-600'}`}>
                            {formData.impartialityDocument ? formData.impartialityDocument.name : 'Choose file...'}
                          </span>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => {
                              handleFileUpload('impartialityDocument', e.target.files[0])
                              if (errors.impartialityDocument) setErrors(prev => ({ ...prev, impartialityDocument: null }))
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {formData.impartialityDocument && canCreate && (
                        <Button
                          variant="outline"
                          onClick={() => handleInputChange('impartialityDocument', null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {errors.impartialityDocument && <p className="mt-1 text-sm text-red-600">{errors.impartialityDocument}</p>}
                  </div>

                  {/* Terms & Conditions Document */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Terms & Conditions Document
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Upload a Terms & Conditions Document as per format provided. Only PDF file of up to 2 MB size are allowed.
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed ${errors.termsConditionsDocument ? 'border-red-400 bg-red-50 text-red-500' : 'border-gray-300 hover:border-primary'} rounded-xl cursor-pointer transition-colors`}>
                          <Upload className={`w-5 h-5 mr-2 ${errors.termsConditionsDocument ? 'text-red-400' : 'text-gray-400'}`} />
                          <span className={`text-sm ${errors.termsConditionsDocument ? 'text-red-500' : 'text-gray-600'}`}>
                            {formData.termsConditionsDocument ? formData.termsConditionsDocument.name : 'Choose file...'}
                          </span>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => {
                              handleFileUpload('termsConditionsDocument', e.target.files[0])
                              if (errors.termsConditionsDocument) setErrors(prev => ({ ...prev, termsConditionsDocument: null }))
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {formData.termsConditionsDocument && canCreate && (
                        <Button
                          variant="outline"
                          onClick={() => handleInputChange('termsConditionsDocument', null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {errors.termsConditionsDocument && <p className="mt-1 text-sm text-red-600">{errors.termsConditionsDocument}</p>}
                  </div>

                  {/* Code of Ethics Document */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Code of Ethics Document
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Upload a Code of Ethics Document as per format provided. Only PDF file of up to 2 MB size are allowed.
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed ${errors.codeOfEthicsDocument ? 'border-red-400 bg-red-50 text-red-500' : 'border-gray-300 hover:border-primary'} rounded-xl cursor-pointer transition-colors`}>
                          <Upload className={`w-5 h-5 mr-2 ${errors.codeOfEthicsDocument ? 'text-red-400' : 'text-gray-400'}`} />
                          <span className={`text-sm ${errors.codeOfEthicsDocument ? 'text-red-500' : 'text-gray-600'}`}>
                            {formData.codeOfEthicsDocument ? formData.codeOfEthicsDocument.name : 'Choose file...'}
                          </span>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => {
                              handleFileUpload('codeOfEthicsDocument', e.target.files[0])
                              if (errors.codeOfEthicsDocument) setErrors(prev => ({ ...prev, codeOfEthicsDocument: null }))
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {formData.codeOfEthicsDocument && canCreate && (
                        <Button
                          variant="outline"
                          onClick={() => handleInputChange('codeOfEthicsDocument', null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {errors.codeOfEthicsDocument && <p className="mt-1 text-sm text-red-600">{errors.codeOfEthicsDocument}</p>}
                  </div>

                  {/* Testing Charges Policy Document */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Testing Charges Policy Document
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Upload a Testing Charges Document as per format provided. Only PDF file of up to 2 MB size are allowed.
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed ${errors.testingChargesPolicyDocument ? 'border-red-400 bg-red-50 text-red-500' : 'border-gray-300 hover:border-primary'} rounded-xl cursor-pointer transition-colors`}>
                          <Upload className={`w-5 h-5 mr-2 ${errors.testingChargesPolicyDocument ? 'text-red-400' : 'text-gray-400'}`} />
                          <span className={`text-sm ${errors.testingChargesPolicyDocument ? 'text-red-500' : 'text-gray-600'}`}>
                            {formData.testingChargesPolicyDocument ? formData.testingChargesPolicyDocument.name : 'Choose file...'}
                          </span>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => {
                              handleFileUpload('testingChargesPolicyDocument', e.target.files[0])
                              if (errors.testingChargesPolicyDocument) setErrors(prev => ({ ...prev, testingChargesPolicyDocument: null }))
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {formData.testingChargesPolicyDocument && canCreate && (
                        <Button
                          variant="outline"
                          onClick={() => handleInputChange('testingChargesPolicyDocument', null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {errors.testingChargesPolicyDocument && <p className="mt-1 text-sm text-red-600">{errors.testingChargesPolicyDocument}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 7: Power, Electric and Water Supply */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-primary" />
                    Power / Electricity And Water Supply
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Upload documents related to Power supply, Power Backup and Water supply.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <Input
                    label={<>Adequacy of Sanctioned Load / Captive Power for Testing <span className="text-red-500">*</span></>}
                    value={formData.adequacySanctionedLoad}
                    onChange={(e) => {
                      handleInputChange('adequacySanctionedLoad', e.target.value)
                      if (errors.adequacySanctionedLoad) setErrors(prev => ({ ...prev, adequacySanctionedLoad: null }))
                    }}
                    error={errors.adequacySanctionedLoad}
                    placeholder="Enter details"
                  />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="availabilityUninterruptedPower"
                        checked={formData.availabilityUninterruptedPower}
                        onChange={(e) => handleInputChange('availabilityUninterruptedPower', e.target.checked)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <label htmlFor="availabilityUninterruptedPower" className="text-sm font-medium text-gray-700">
                        Availability of Uninterrupted Power Supply
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">
                      Check this box in case Power Backup is available in the Lab.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="stabilityOfSupply"
                        checked={formData.stabilityOfSupply}
                        onChange={(e) => handleInputChange('stabilityOfSupply', e.target.checked)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <label htmlFor="stabilityOfSupply" className="text-sm font-medium text-gray-700">
                        Stability of Supply
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">
                      Check this box in case regular Electric supply is efficient and has minimal downtime.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Water Source <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Make a selection from the List if Lab has Municipal Supply or Own Source or Both.
                    </p>
                    <select
                      value={formData.waterSource}
                      onChange={(e) => {
                        handleInputChange('waterSource', e.target.value)
                        if (errors.waterSource) setErrors(prev => ({ ...prev, waterSource: null }))
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border ${errors.waterSource ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary'} focus:outline-none focus:ring-2 focus:border-transparent`}
                    >
                      {waterSourceOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    {errors.waterSource && <p className="mt-1 text-sm text-red-600">{errors.waterSource}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 8: Accreditation & Other Details */}
            {currentStep === 8 && (
              <div className="space-y-8">
                {/* Accreditation Documents */}
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <Award className="w-6 h-6 text-primary" />
                      Accreditation Documents / Certification Details
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Upload Certificate of Accreditation / Registration and Scope as per IS/ISO/IEC 17025.
                    </p>
                  </div>

                  {formData.accreditationDocuments.length === 0 ? (
                    <div className="text-center py-8">
                      <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 mb-4">No accreditation documents added yet</p>
                      <Button onClick={addAccreditationDocument}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Document
                      </Button>
                    </div>
                  ) : (
                    <>
                      {formData.accreditationDocuments.map((doc, index) => (
                        <div key={doc.id} className="p-4 bg-gray-50 rounded-xl space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900">Accreditation {index + 1}</h3>
                            {canCreate && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeAccreditationDocument(doc.id)}
                              >
                                <X className="w-4 h-4 text-red-600" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Certification Type
                              </label>
                              <select
                                value={doc.type}
                                onChange={(e) => updateAccreditationDocument(doc.id, 'type', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              >
                                {certificationTypeOptions.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </div>

                            <Input
                              label="Certificate No."
                              value={doc.certificateNo}
                              onChange={(e) => updateAccreditationDocument(doc.id, 'certificateNo', e.target.value)}
                              placeholder="Enter certificate number"
                            />
                          </div>

                          {doc.type === 'Other' && (
                            <Input
                              label="Specify Certification Type"
                              value={doc.typeOther}
                              onChange={(e) => updateAccreditationDocument(doc.id, 'typeOther', e.target.value)}
                              placeholder="Specify certification type"
                            />
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Upload Certificate */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload Certificate
                              </label>
                              <p className="text-xs text-gray-500 mb-2">
                                Upload a document to provide details of Accreditation/Certifications received by the Lab.
                                Only PDF file of up to 2 MB size are allowed.
                              </p>
                              <div className="flex items-center gap-4">
                                <div className="flex-1">
                                  <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary transition-colors">
                                    <Upload className="w-5 h-5 text-gray-400 mr-2" />
                                    <span className="text-sm text-gray-600 truncate max-w-[200px]">
                                      {doc.certificateFile ? (typeof doc.certificateFile === 'string' ? doc.certificateFile.split('/').pop() : doc.certificateFile.name) : 'Choose file...'}
                                    </span>
                                    <input
                                      type="file"
                                      accept=".pdf"
                                      onChange={async (e) => {
                                        const file = e.target.files[0]
                                        if (file) {
                                          const maxSize = 2 * 1024 * 1024
                                          if (file.size > maxSize) {
                                            toast.error('File size should not exceed 2MB')
                                            return
                                          }
                                          if (file.type !== 'application/pdf') {
                                            toast.error('Please upload PDF files only')
                                            return
                                          }

                                          try {
                                            setLoading(true)
                                            const fileUrl = await uploadFile(file, 'accreditation')
                                            updateAccreditationDocument(doc.id, 'certificateFile', fileUrl)
                                            toast.success('Certificate uploaded successfully!')
                                          } catch (error) {
                                            toast.error('File upload failed: ' + error.message)
                                          } finally {
                                            setLoading(false)
                                          }
                                        }
                                      }}
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                                {doc.certificateFile && canCreate && (
                                  <Button
                                    variant="outline"
                                    onClick={() => updateAccreditationDocument(doc.id, 'certificateFile', null)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Upload Scope */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload Scope
                              </label>
                              <p className="text-xs text-gray-500 mb-2">
                                Upload a document to provide details of Scope for which Lab is Accredited.
                                Only PDF file of up to 2 MB size are allowed.
                              </p>
                              <div className="flex items-center gap-4">
                                <div className="flex-1">
                                  <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary transition-colors">
                                    <Upload className="w-5 h-5 text-gray-400 mr-2" />
                                    <span className="text-sm text-gray-600">
                                      {doc.scopeFile ? (typeof doc.scopeFile === 'string' ? doc.scopeFile.split('/').pop() : doc.scopeFile.name) : 'Choose file...'}
                                    </span>
                                    <input
                                      type="file"
                                      accept=".pdf"
                                      onChange={async (e) => {
                                        const file = e.target.files[0]
                                        if (file) {
                                          const maxSize = 2 * 1024 * 1024
                                          if (file.size > maxSize) {
                                            toast.error('File size should not exceed 2MB')
                                            return
                                          }
                                          if (file.type !== 'application/pdf') {
                                            toast.error('Please upload PDF files only')
                                            return
                                          }

                                          try {
                                            setLoading(true)
                                            const fileUrl = await uploadFile(file, 'accreditation')
                                            updateAccreditationDocument(doc.id, 'scopeFile', fileUrl)
                                            toast.success('Scope uploaded successfully!')
                                          } catch (error) {
                                            toast.error('File upload failed: ' + error.message)
                                          } finally {
                                            setLoading(false)
                                          }
                                        }
                                      }}
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                                {doc.scopeFile && canCreate && (
                                  <Button
                                    variant="outline"
                                    onClick={() => updateAccreditationDocument(doc.id, 'scopeFile', null)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {canCreate && (
                        <Button
                          variant="outline"
                          onClick={addAccreditationDocument}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add more
                        </Button>
                      )}
                    </>
                  )}
                </div>

                {/* Other Lab Details */}
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <Info className="w-6 h-6 text-primary" />
                      Other Lab Details
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Any other information including Recognition / Accreditation by other Govt Department / Agencies.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Other Details
                    </label>
                    <textarea
                      value={formData.otherLabDetails}
                      onChange={(e) => handleInputChange('otherLabDetails', e.target.value)}
                      placeholder="Enter any additional information related to Lab Accreditation, Recognition etc. not provided previously"
                      rows={5}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attach Document
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Upload any supporting document for validation. Only PDF file of up to 2 MB size are allowed.
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary transition-colors">
                          <Upload className="w-5 h-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600">
                            {formData.otherDetailsDocument ? formData.otherDetailsDocument.name : 'Choose file...'}
                          </span>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => handleFileUpload('otherDetailsDocument', e.target.files[0])}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {formData.otherDetailsDocument && canCreate && (
                        <Button
                          variant="outline"
                          onClick={() => handleInputChange('otherDetailsDocument', null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Other Details - Layout, Organization Chart, GPS */}
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Additional Details
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Provide the details of Lab Layout, Organization Chart and GPS Location details.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Layout of Laboratory Premises */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Layout of Laboratory Premises
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        Upload a document to provide building/floor plans of the Lab. Only PDF file of up to 2 MB size are allowed.
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed ${errors.layoutLabPremises ? 'border-red-400 bg-red-50 text-red-500' : 'border-gray-300 hover:border-primary'} rounded-xl cursor-pointer transition-colors`}>
                            <Upload className={`w-5 h-5 mr-2 ${errors.layoutLabPremises ? 'text-red-400' : 'text-gray-400'}`} />
                            <span className={`text-sm ${errors.layoutLabPremises ? 'text-red-500' : 'text-gray-600'}`}>
                              {formData.layoutLabPremises ? formData.layoutLabPremises.name : 'Choose file...'}
                            </span>
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => {
                                handleFileUpload('layoutLabPremises', e.target.files[0])
                                if (errors.layoutLabPremises) setErrors(prev => ({ ...prev, layoutLabPremises: null }))
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                        {formData.layoutLabPremises && canCreate && (
                          <Button
                            variant="outline"
                            onClick={() => handleInputChange('layoutLabPremises', null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      {errors.layoutLabPremises && <p className="mt-1 text-sm text-red-600">{errors.layoutLabPremises}</p>}
                    </div>

                    {/* Organization Chart */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Organization Chart
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        Upload a document to provide details of Organization Structure Diagram on Lab Letter Head.
                        Only PDF file of up to 2 MB size are allowed.
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed ${errors.organizationChart ? 'border-red-400 bg-red-50 text-red-500' : 'border-gray-300 hover:border-primary'} rounded-xl cursor-pointer transition-colors`}>
                            <Upload className={`w-5 h-5 mr-2 ${errors.organizationChart ? 'text-red-400' : 'text-gray-400'}`} />
                            <span className={`text-sm ${errors.organizationChart ? 'text-red-500' : 'text-gray-600'}`}>
                              {formData.organizationChart ? formData.organizationChart.name : 'Choose file...'}
                            </span>
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => {
                                handleFileUpload('organizationChart', e.target.files[0])
                                if (errors.organizationChart) setErrors(prev => ({ ...prev, organizationChart: null }))
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                        {formData.organizationChart && canCreate && (
                          <Button
                            variant="outline"
                            onClick={() => handleInputChange('organizationChart', null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      {errors.organizationChart && <p className="mt-1 text-sm text-red-600">{errors.organizationChart}</p>}
                    </div>
                  </div>

                  {/* GPS Coordinates */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GPS Coordinates <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Enter the GPS Coordinates (Latitude & Longitude) of the LAB. You may use Google Maps to ascertain these details.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label={<>Latitude <span className="text-red-500">*</span></>}
                        value={formData.gpsLatitude}
                        onChange={(e) => {
                          handleInputChange('gpsLatitude', e.target.value)
                          if (errors.gpsLatitude) setErrors(prev => ({ ...prev, gpsLatitude: null }))
                        }}
                        error={errors.gpsLatitude}
                        placeholder="Enter latitude"
                      />
                      <Input
                        label={<>Longitude <span className="text-red-500">*</span></>}
                        value={formData.gpsLongitude}
                        onChange={(e) => {
                          handleInputChange('gpsLongitude', e.target.value)
                          if (errors.gpsLongitude) setErrors(prev => ({ ...prev, gpsLongitude: null }))
                        }}
                        error={errors.gpsLongitude}
                        placeholder="Enter longitude"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 9: Quality Manual & SOPs */}
            {currentStep === 9 && (
              <div className="space-y-8">
                {/* Quality Manual / Document */}
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <BookOpen className="w-6 h-6 text-primary" />
                      Quality Manual / Document
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Enter the details of latest Quality Manual.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        label={<>Title <span className="text-red-500">*</span></>}
                        value={formData.qualityManualTitle}
                        onChange={(e) => {
                          handleInputChange('qualityManualTitle', e.target.value)
                          if (errors.qualityManualTitle) setErrors(prev => ({ ...prev, qualityManualTitle: null }))
                        }}
                        error={errors.qualityManualTitle}
                        placeholder="Enter quality manual title"
                      />
                    </div>

                    <Input
                      label={<>Issue Number <span className="text-red-500">*</span></>}
                      value={formData.qualityManualIssueNumber}
                      onChange={(e) => {
                        handleInputChange('qualityManualIssueNumber', e.target.value)
                        if (errors.qualityManualIssueNumber) setErrors(prev => ({ ...prev, qualityManualIssueNumber: null }))
                      }}
                      error={errors.qualityManualIssueNumber}
                      placeholder="Enter issue number"
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Issue Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.qualityManualIssueDate}
                        onChange={(e) => {
                          handleInputChange('qualityManualIssueDate', e.target.value)
                          if (errors.qualityManualIssueDate) setErrors(prev => ({ ...prev, qualityManualIssueDate: null }))
                        }}
                        placeholder="dd/mm/yyyy"
                        className={`w-full px-4 py-2.5 rounded-xl border ${errors.qualityManualIssueDate ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary'} focus:outline-none focus:ring-2 focus:border-transparent`}
                      />
                      {errors.qualityManualIssueDate && <p className="mt-1 text-sm text-red-600">{errors.qualityManualIssueDate}</p>}
                      <p className="text-xs text-gray-500 mt-1">
                        Enter the Date of Issue of Current Quality Manual being followed.
                      </p>
                    </div>

                    <Input
                      label={<>Amendments <span className="text-red-500">*</span></>}
                      value={formData.qualityManualAmendments}
                      onChange={(e) => {
                        handleInputChange('qualityManualAmendments', e.target.value)
                        if (errors.qualityManualAmendments) setErrors(prev => ({ ...prev, qualityManualAmendments: null }))
                      }}
                      error={errors.qualityManualAmendments}
                      placeholder="Enter number of amendments"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quality Manual / Document
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Upload the Quality Manual / Other Document followed by the Lab. Only PDF file of up to 2 MB size are allowed.
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed ${errors.qualityManualDocument ? 'border-red-400 bg-red-50 text-red-500' : 'border-gray-300 hover:border-primary'} rounded-xl cursor-pointer transition-colors`}>
                          <Upload className={`w-5 h-5 mr-2 ${errors.qualityManualDocument ? 'text-red-400' : 'text-gray-400'}`} />
                          <span className={`text-sm ${errors.qualityManualDocument ? 'text-red-500' : 'text-gray-600'}`}>
                            {formData.qualityManualDocument ? (typeof formData.qualityManualDocument === 'string' ? formData.qualityManualDocument.split('/').pop() : formData.qualityManualDocument.name) : 'Choose file...'}
                          </span>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => {
                              handleFileUpload('qualityManualDocument', e.target.files[0])
                              if (errors.qualityManualDocument) setErrors(prev => ({ ...prev, qualityManualDocument: null }))
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {formData.qualityManualDocument && canCreate && (
                        <Button
                          variant="outline"
                          onClick={() => handleInputChange('qualityManualDocument', null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {errors.qualityManualDocument && <p className="mt-1 text-sm text-red-600">{errors.qualityManualDocument}</p>}
                  </div>
                </div>

                {/* Standard Operating Procedures */}
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Standard Operating Procedures
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Enter the details of latest Standard Operating Procedures.
                    </p>
                  </div>

                  {formData.sopList.length === 0 ? (
                    <div className="text-center py-8">
                      <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 mb-4">No SOPs added yet</p>
                      <Button onClick={addSOP}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add SOP
                      </Button>
                    </div>
                  ) : (
                    <>
                      {formData.sopList.map((sop, index) => (
                        <div key={sop.id} className="p-4 bg-gray-50 rounded-xl space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900">SOP {index + 1}</h3>
                            {canCreate && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeSOP(sop.id)}
                              >
                                <X className="w-4 h-4 text-red-600" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                              label={<>SOP Title <span className="text-red-500">*</span></>}
                              value={sop.title}
                              onChange={(e) => {
                                updateSOP(sop.id, 'title', e.target.value)
                                if (errors[`sopList_${index}_title`]) setErrors(prev => ({ ...prev, [`sopList_${index}_title`]: null }))
                              }}
                              error={errors[`sopList_${index}_title`]}
                              placeholder="Enter SOP title"
                            />

                            <Input
                              label={<>SOP Number <span className="text-red-500">*</span></>}
                              value={sop.number}
                              onChange={(e) => {
                                updateSOP(sop.id, 'number', e.target.value)
                                if (errors[`sopList_${index}_number`]) setErrors(prev => ({ ...prev, [`sopList_${index}_number`]: null }))
                              }}
                              error={errors[`sopList_${index}_number`]}
                              placeholder="Enter SOP number"
                            />

                            <Input
                              label={<>SOP Issue Number <span className="text-red-500">*</span></>}
                              value={sop.issueNumber}
                              onChange={(e) => {
                                updateSOP(sop.id, 'issueNumber', e.target.value)
                                if (errors[`sopList_${index}_issueNumber`]) setErrors(prev => ({ ...prev, [`sopList_${index}_issueNumber`]: null }))
                              }}
                              error={errors[`sopList_${index}_issueNumber`]}
                              placeholder="Enter issue number"
                            />

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                SOP Issue Date <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="date"
                                value={sop.issueDate}
                                onChange={(e) => {
                                  updateSOP(sop.id, 'issueDate', e.target.value)
                                  if (errors[`sopList_${index}_issueDate`]) setErrors(prev => ({ ...prev, [`sopList_${index}_issueDate`]: null }))
                                }}
                                placeholder="dd/mm/yyyy"
                                className={`w-full px-4 py-2.5 rounded-xl border ${errors[`sopList_${index}_issueDate`] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary'} focus:outline-none focus:ring-2 focus:border-transparent`}
                              />
                              {errors[`sopList_${index}_issueDate`] && <p className="mt-1 text-sm text-red-600">{errors[`sopList_${index}_issueDate`]}</p>}
                            </div>

                            <Input
                              label={<>SOP Amendments <span className="text-red-500">*</span></>}
                              value={sop.amendments}
                              onChange={(e) => {
                                updateSOP(sop.id, 'amendments', e.target.value)
                                if (errors[`sopList_${index}_amendments`]) setErrors(prev => ({ ...prev, [`sopList_${index}_amendments`]: null }))
                              }}
                              error={errors[`sopList_${index}_amendments`]}
                              placeholder="Enter amendments"
                            />
                          </div>
                        </div>
                      ))}

                      {canCreate && (
                        <Button
                          variant="outline"
                          onClick={addSOP}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add more
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Step 10: Quality Formats & Procedures */}
            {currentStep === 10 && (
              <div className="space-y-8">
                {/* Quality Formats */}
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <ClipboardList className="w-6 h-6 text-primary" />
                      Quality Formats
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Enter the details of latest Quality Formats.
                    </p>
                  </div>

                  {formData.qualityFormats.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 mb-4">No quality formats added yet</p>
                      {canCreate && (
                        <Button onClick={addQualityFormat}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Quality Format
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      {formData.qualityFormats.map((format, index) => (
                        <div key={format.id} className="p-4 bg-gray-50 rounded-xl space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900">Quality Format {index + 1}</h3>
                            {canCreate && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeQualityFormat(format.id)}
                              >
                                <X className="w-4 h-4 text-red-600" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                              label={<>Format Title <span className="text-red-500">*</span></>}
                              value={format.title}
                              onChange={(e) => {
                                updateQualityFormat(format.id, 'title', e.target.value)
                                if (errors[`qualityFormats_${index}_title`]) setErrors(prev => ({ ...prev, [`qualityFormats_${index}_title`]: null }))
                              }}
                              error={errors[`qualityFormats_${index}_title`]}
                              placeholder="Enter format title"
                            />

                            <Input
                              label="Format Number"
                              value={format.number}
                              onChange={(e) => updateQualityFormat(format.id, 'number', e.target.value)}
                              placeholder="Enter format number"
                            />

                            <Input
                              label="Issue Number"
                              value={format.issueNumber}
                              onChange={(e) => updateQualityFormat(format.id, 'issueNumber', e.target.value)}
                              placeholder="Enter issue number"
                            />

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Issue Date
                              </label>
                              <input
                                type="date"
                                value={format.issueDate}
                                onChange={(e) => updateQualityFormat(format.id, 'issueDate', e.target.value)}
                                placeholder="dd/mm/yyyy"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                            </div>

                            <Input
                              label="Amendments"
                              value={format.amendments}
                              onChange={(e) => updateQualityFormat(format.id, 'amendments', e.target.value)}
                              placeholder="Enter amendments"
                            />
                          </div>
                        </div>
                      ))}

                      {canCreate && (
                        <Button
                          variant="outline"
                          onClick={addQualityFormat}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add more
                        </Button>
                      )}
                    </>
                  )}
                </div>

                {/* Quality Procedures */}
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Quality Procedures
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Copies of such documents of the laboratory which cover the requirements specific to this scheme which inter alia include,
                      but not limited to the following.
                    </p>
                  </div>

                  {formData.qualityProcedures.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 mb-4">No quality procedures added yet</p>
                      {canCreate && (
                        <Button onClick={addQualityProcedure}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Quality Procedure
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      {formData.qualityProcedures.map((procedure, index) => (
                        <div key={procedure.id} className="p-4 bg-gray-50 rounded-xl space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900">Quality Procedure {index + 1}</h3>
                            {canCreate && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeQualityProcedure(procedure.id)}
                              >
                                <X className="w-4 h-4 text-red-600" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                              label="Procedure Title"
                              value={procedure.title}
                              onChange={(e) => updateQualityProcedure(procedure.id, 'title', e.target.value)}
                              placeholder="Enter procedure title"
                              required
                            />

                            <Input
                              label="Procedure Number"
                              value={procedure.number}
                              onChange={(e) => updateQualityProcedure(procedure.id, 'number', e.target.value)}
                              placeholder="Enter procedure number"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Attach Quality Procedure <span className="text-red-500">*</span>
                            </label>
                            <p className="text-xs text-gray-500 mb-2">
                              Upload the Quality Procedures followed by the Lab. Only PDF file of up to 2 MB size are allowed.
                            </p>
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary transition-colors">
                                  <Upload className="w-5 h-5 text-gray-400 mr-2" />
                                  <span className="text-sm text-gray-600">
                                    {procedure.file ? (typeof procedure.file === 'string' ? procedure.file.split('/').pop() : procedure.file.name) : 'Choose file...'}
                                  </span>
                                  <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={async (e) => {
                                      const file = e.target.files[0]
                                      if (file) {
                                        const maxSize = 2 * 1024 * 1024
                                        if (file.size > maxSize) {
                                          toast.error('File size should not exceed 2MB')
                                          return
                                        }
                                        if (file.type !== 'application/pdf') {
                                          toast.error('Please upload PDF files only')
                                          return
                                        }

                                        try {
                                          setLoading(true)
                                          const fileUrl = await uploadFile(file, 'quality')
                                          updateQualityProcedure(procedure.id, 'file', fileUrl)
                                          toast.success('Document uploaded successfully!')
                                        } catch (error) {
                                          toast.error('File upload failed: ' + error.message)
                                        } finally {
                                          setLoading(false)
                                        }
                                      }
                                    }}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                              {procedure.file && canCreate && (
                                <Button
                                  variant="outline"
                                  onClick={() => updateQualityProcedure(procedure.id, 'file', null)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                              label="Issue Number"
                              value={procedure.issueNumber}
                              onChange={(e) => updateQualityProcedure(procedure.id, 'issueNumber', e.target.value)}
                              placeholder="Enter issue number"
                              required
                            />

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Issue Date <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="date"
                                value={procedure.issueDate}
                                onChange={(e) => updateQualityProcedure(procedure.id, 'issueDate', e.target.value)}
                                placeholder="dd/mm/yyyy"
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Enter the Date of Issue of Current Quality Procedures being followed.
                              </p>
                            </div>

                            <Input
                              label="Amendments"
                              value={procedure.amendments}
                              onChange={(e) => updateQualityProcedure(procedure.id, 'amendments', e.target.value)}
                              placeholder="Enter amendments"
                              required
                            />
                          </div>
                        </div>
                      ))}

                      {canCreate && (
                        <Button
                          variant="outline"
                          onClick={addQualityProcedure}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add more
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Step 11: Checklist */}
            {currentStep === 11 && (
              <div className="space-y-8">
                <div className="border-b border-gray-200 pb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                    Checklist
                  </h2>
                  <p className="text-sm text-gray-600 mt-2">
                    Validate the completeness of each section of the Lab Registration process.
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl mb-6">
                  <p className="text-sm text-gray-700">
                    Make Payment link will be enabled once all sections are completed. Lab will be able to make Payment through Bill Desk Payment Gateway by using NEFT/RTGS/Debit Card/Credit Card/Wallets.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Subject</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Edit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {checklist ? (
                        // Display backend checklist data
                        checklist.steps.map((checklistStep, index) => {
                          const isCompleted = checklistStep.is_completed
                          return (
                            <tr key={checklistStep.step_id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{checklistStep.step_id}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {checklistStep.step_name} {!isCompleted && <span className="text-red-500">*</span>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                  {isCompleted ? 'Completed' : 'Pending'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {canCreate && (
                                  <button
                                    onClick={() => setCurrentStep(checklistStep.step_id)}
                                    className="text-primary hover:text-primary-dark"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        // Loading state
                        <tr>
                          <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                            Loading checklist...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-center pt-6">
                  {canCreate && (
                    <Button
                      size="lg"
                      disabled={!checklist || !checklist.is_ready_for_submission}
                      onClick={() => navigate('/lab/management/payment', {
                        state: {
                          organizationId,
                          organizationName: formData.labName
                        }
                      })}
                      className="px-8"
                    >
                      Make Payment
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                Previous
              </Button>

              <div className="flex gap-3">
                {canCreate && (
                  <Button
                    variant="outline"
                    onClick={handleSave}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save & Next
                  </Button>
                )}

                {currentStep < steps.length ? (
                  <Button onClick={handleNext}>
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : canCreate ? (
                  <Button onClick={handleSubmit}>
                    <Check className="w-4 h-4 mr-2" />
                    Submit
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-700 font-medium">Processing...</p>
          </div>
        </div>
      )}
    </div>
  )
}



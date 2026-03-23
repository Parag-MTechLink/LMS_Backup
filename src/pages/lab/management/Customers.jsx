import { useEffect, useState, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Users, Plus, Search, Trash2, RefreshCw, Upload, Database,
  Settings, Settings2, ArrowRight, Link2, ChevronDown, CheckCircle,
  CheckCircle2, AlertCircle, AlertTriangle, ChevronLeft, ChevronRight,
  Mail, Phone, MapPin, Building2, X, Cloud, Filter, ShieldCheck
} from 'lucide-react'
import { customersService, apiService } from '../../../services/labManagementApi'
import toast from 'react-hot-toast'
import Modal from '../../../components/labManagement/Modal'
import CreateCustomerForm from '../../../components/labManagement/forms/CreateCustomerForm'
import CustomerProfileModal from '../../../components/labManagement/modals/CustomerProfileModal'
import ConfirmDeleteModal from '../../../components/labManagement/ConfirmDeleteModal'
import { useDebounce } from '../../../hooks/useDebounce'
import RouteSkeleton from '../../../components/RouteSkeleton'
import { useLabManagementAuth } from '../../../contexts/LabManagementAuthContext'
import Papa from 'papaparse'

// ─── Constants ────────────────────────────────────────────────────────────────
const LMS_FIELD_LABELS = {
  company_name: 'Company Name', email: 'Email Address', phone: 'Phone Number',
  contact_person: 'Contact Person', region: 'Region', address: 'Address',
}
const LMS_FIELDS = Object.keys(LMS_FIELD_LABELS)
const CRM_STATUS_CFG = {
  pending:  { label: 'Pending',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  mapped:   { label: 'Mapped',   cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  migrated: { label: 'Migrated', cls: 'bg-green-50 text-green-700 border-green-200' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getDisplayName = (raw) =>
  raw?.company_name || raw?.organisation || raw?.AccountName || raw?.company || raw?.name || '—'

const getDisplayEmail = (raw) =>
  raw?.email || raw?.ContactEmail || raw?.contact_email || raw?.Email || '—'

// ─── Modal Scroll Lock Manager ───────────────────────────────────────────────
let activeModals = 0;
const lockScroll = () => {
    activeModals++;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = 'var(--scrollbar-width, 0px)'; // prevent layout jump
}
const unlockScroll = () => {
    activeModals = Math.max(0, activeModals - 1);
    if (activeModals === 0) {
        document.body.style.overflow = 'unset';
        document.body.style.paddingRight = '0px';
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1: LMS Customers
// ══════════════════════════════════════════════════════════════════════════════
function LMSCustomersTab({ canManage }) {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [sourceFilter, setSourceFilter] = useState('all') // 'all', 'lms', 'crm'

  const load = useCallback(async () => {
    try { setLoading(true); setCustomers(await customersService.getAll()) }
    catch { toast.error('Failed to load customers') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const filtered = useMemo(() =>
    customers.filter(c => {
      const matchesSearch = !debouncedSearch ||
        c.companyName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        c.email?.toLowerCase().includes(debouncedSearch.toLowerCase())
      
      const matchesSource = sourceFilter === 'all' ||
        (sourceFilter === 'lms' && !c.crmCustomerId) ||
        (sourceFilter === 'crm' && c.crmCustomerId)

      return matchesSearch && matchesSource
    }), [customers, debouncedSearch, sourceFilter])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await customersService.delete(deleteTarget.id)
      toast.success('Customer deleted')
      setDeleteTarget(null)
      load()
    } catch (err) { toast.error(err?.message || 'Failed to delete') }
    finally { setDeleting(false) }
  }

  if (loading) return <RouteSkeleton />

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select 
              value={sourceFilter} 
              onChange={e => setSourceFilter(e.target.value)}
              className="text-xs font-bold text-gray-600 focus:outline-none bg-transparent cursor-pointer"
            >
              <option value="all">All Sources</option>
              <option value="lms">LMS Native</option>
              <option value="crm">CRM Migrated</option>
            </select>
          </div>
          {canManage && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-sm font-semibold"
            >
              <Plus className="w-4 h-4" /> Add Customer
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {['Name', 'Source', 'Contact', 'Region', 'Status', 'Projects', ''].map(h => (
                <th key={h} className="px-6 py-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-14 text-center text-gray-400">
                <Users className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                {searchTerm ? `No results for "${searchTerm}"` : 'No customers yet.'}
              </td></tr>
            ) : filtered.map(c => (
              <tr key={c.id}
                onClick={() => { setSelectedCustomer(c); setShowProfileModal(true) }}
                className="hover:bg-gray-50/50 cursor-pointer transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                      {c.companyName?.charAt(0).toUpperCase() || 'C'}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{c.companyName}</div>
                      <div className="text-xs text-gray-400">{c.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {c.crmCustomerId ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-600 border border-blue-100">
                      <Database className="w-2.5 h-2.5" /> CRM
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-50 text-gray-600 border border-gray-100">
                      <Users className="w-2.5 h-2.5" /> LMS
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{c.contactPerson || '—'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{c.region || '—'}</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">Active</span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/lab/management/projects?customerId=${c.id}`) }}
                    className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 border border-blue-100 font-medium"
                  >View Projects</button>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={e => { e.stopPropagation(); setDeleteTarget(c) }}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add Customer" size="lg" showCloseIcon={false}>
        <CreateCustomerForm onSuccess={() => { setShowCreateModal(false); load() }} onCancel={() => setShowCreateModal(false)} />
      </Modal>
      <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} title="" size="lg" showCloseIcon={false}>
        <CustomerProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} customer={selectedCustomer} onUpdate={load} />
      </Modal>
      <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete customer" message="Are you sure?" entityName={deleteTarget?.companyName || ''} loading={deleting} />
    </div>
  )
}


// ══════════════════════════════════════════════════════════════════════════════
// MAPPING WIZARD (used inside CRM Manager tab for single records)
// ══════════════════════════════════════════════════════════════════════════════
function MappingWizard({ crmCustomerId, onClose, onMigrated }) {
  const [step, setStep] = useState(0)
  const [fieldsData, setFieldsData] = useState(null)
  const [mappings, setMappings] = useState({})
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    lockScroll();
    return () => unlockScroll();
  }, []);

  useEffect(() => {
    if (!crmCustomerId) return
    setLoading(true)
    apiService.get(`/api/v1/crm/customers/${crmCustomerId}/fields`)
      .then(data => {
        setFieldsData(data)
        const init = {}
        for (const f of data.crm_fields) init[f.crm_field] = f.suggested_lms_field || ''
        setMappings(init)
      })
      .catch(() => toast.error('Failed to load fields'))
      .finally(() => setLoading(false))
  }, [crmCustomerId])

  const buildPayload = () =>
    Object.entries(mappings).filter(([, v]) => v).map(([crm_field, lms_field]) => ({ crm_field, lms_field }))

  const runPreview = async () => {
    setBusy(true)
    try {
      const result = await apiService.post(`/api/v1/crm/customers/${crmCustomerId}/preview`, { mappings: buildPayload() })
      setPreview(result); setStep(2)
    } catch (err) { toast.error(err?.message || 'Preview failed') }
    finally { setBusy(false) }
  }

  const doMigrate = async () => {
    setBusy(true)
    try {
      const result = await apiService.post(`/api/v1/crm/customers/${crmCustomerId}/migrate`, { mappings: buildPayload() })
      toast.success(result.message || 'Migration successful!')
      setStep(3); onMigrated(crmCustomerId)
    } catch (err) { toast.error(err?.message || 'Migration failed') }
    finally { setBusy(false) }
  }

  const handleMap = (crmField, lmsField) => {
    setMappings(prev => {
      const u = { ...prev }
      if (lmsField) for (const k of Object.keys(u)) if (k !== crmField && u[k] === lmsField) u[k] = ''
      u[crmField] = lmsField; return u
    })
  }

  const emailMapped = Object.values(mappings).includes('email')

  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xl overscroll-none">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden overscroll-contain">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white font-bold backdrop-blur-md bg-opacity-90 sticky top-0 z-10">Field Mapping Wizard</div>
        <div className="flex border-b border-gray-100">
           {['Review Fields', 'Map Fields', 'Preview', 'Done'].map((s, i) => (
             <div key={s} className={`flex-1 py-3 text-center text-[10px] font-bold uppercase tracking-wider ${i === step ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-400'}`}>{s}</div>
           ))}
        </div>
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          {loading ? <div className="py-10 text-center text-gray-400">Loading fields...</div> : 
           step === 0 ? (
            <table className="w-full text-xs">
              <thead className="bg-gray-50 uppercase text-[10px] font-bold text-gray-400"><tr className="border-b"><th className="px-4 py-2">CRM Field</th><th className="px-4 py-2">Value</th></tr></thead>
              <tbody>{fieldsData?.crm_fields.map(f => (<tr key={f.crm_field} className="border-b text-gray-600"><td className="px-4 py-2 font-mono">{f.crm_field}</td><td className="px-4 py-2 truncate max-w-[200px]">{f.sample_value}</td></tr>))}</tbody>
            </table>
           ) : step === 1 ? (
             <div className="space-y-4">
                {!emailMapped && <div className="p-2 bg-amber-50 text-amber-700 text-[10px] font-bold rounded border border-amber-100 uppercase">Email must be mapped to migrate</div>}
                <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm bg-white">
                  <table className="w-full text-left bg-white">
                    <thead className="bg-gray-50 uppercase text-[10px] font-bold text-gray-400">
                      <tr className="border-b">
                        <th className="px-5 py-3">CRM Key & Sample Value</th>
                        <th className="px-5 py-3 text-right">LMS Target</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {fieldsData?.crm_fields.map(f => (
                        <tr key={f.crm_field} className="hover:bg-blue-50/20 transition-colors">
                          <td className="px-5 py-3">
                            <div className="font-mono text-xs text-blue-700 font-bold mb-0.5">{f.crm_field}</div>
                            <div className="text-[10px] text-gray-400 truncate max-w-[280px]">
                              {f.sample_value ? String(f.sample_value) : <span className="italic text-gray-300">empty</span>}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <select value={mappings[f.crm_field]||''} onChange={e=>handleMapChange ? handleMap(f.crm_field, e.target.value) : handleMap(f.crm_field, e.target.value)} 
                              className="bg-white border border-gray-200 rounded-lg p-1.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 outline-none min-w-[150px]">
                              <option value="">— Skip —</option>
                              {LMS_FIELDS.map(lf=>(<option key={lf} value={lf}>{LMS_FIELD_LABELS[lf]}</option>))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
           ) : step === 2 ? (
             <div className="space-y-4">
                {preview?.conflicts.map((c, i) => <div key={i} className="p-2 bg-red-50 text-red-700 text-[10px] font-bold rounded border border-red-100 mb-2">{c}</div>)}
                <table className="w-full text-xs border rounded overflow-hidden">
                  <tbody className="divide-y">{Object.entries(preview?.mapped_fields || {}).map(([k,v])=>(<tr key={k}><td className="px-4 py-2 bg-gray-50 font-bold w-1/3">{LMS_FIELD_LABELS[k]}</td><td className="px-4 py-2 text-gray-600">{String(v)}</td></tr>))}</tbody>
                </table>
             </div>
           ) : (
             <div className="py-10 text-center space-y-3">
               <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto"><CheckCircle className="w-6 h-6" /></div>
               <div className="font-bold text-gray-900">Successfully Migrated!</div>
               <p className="text-xs text-gray-500">The record is now a live LMS Customer.</p>
             </div>
           )}
        </div>
        <div className="flex justify-between px-6 py-4 bg-gray-50 border-t items-center">
          {step < 3 ? (
            <>
              <button onClick={step===0 ? onClose : ()=>setStep(s=>s-1)} className="text-xs font-bold text-gray-500 hover:text-gray-900">{step===0?'Cancel':'Back'}</button>
              <button onClick={step===0?()=>setStep(1):step===1?runPreview:doMigrate} disabled={busy || (step===1 && !emailMapped)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50">
                {busy && <RefreshCw className="w-3 h-3 animate-spin mr-1 inline" />}{step===2?'Confirm Migration':'Next'}
              </button>
            </>
          ) : <button onClick={onClose} className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold">Return to Conflicts List</button>}
        </div>
      </motion.div>
    </div>,
    document.body
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATED IMPORT WIZARD (3 Steps: Data -> Map -> Results)
// ══════════════════════════════════════════════════════════════════════════════
const IMPORT_WIZARD_STEPS = ['Select Data', 'Map Fields', 'Import Results']

function CRMImportModal({ onClose, onSuccess, connections, onConnect, onSync, onSetup, syncing, onFix, onDelete, lastMigratedId }) {
  const [step, setStep] = useState(1); // 1: Source, 2: Mapping, 3: Results
  const [sourceType, setSourceType] = useState(null); // 'file', 'salesforce', 'hubspot'
  const [records, setRecords] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    lockScroll();
    return () => unlockScroll();
  }, []);

  const handleFileParsed = (data, fileName) => {
    setRecords(data);
    setSourceType(fileName); // or 'file'
    setStep(2);
  };

  const executeMigration = async (finalMappings) => {
    setProcessing(true);
    try {
      const res = await apiService.post('/api/v1/crm/import-and-migrate', {
        source_system: sourceType === 'file' ? 'manual_import' : sourceType,
        records,
        mappings: finalMappings
      });
      setResults(res);
      setStep(3);
    } catch (err) {
      toast.error('Migration failed: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xl overscroll-none">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col overscroll-contain">
        
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-xl sticky top-0 z-10">
          <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Import Customers</h3>
            <div className="flex items-center gap-2 mt-1">
              {[1, 2, 3].map(s => (
                <div key={s} className={`h-1.5 rounded-full transition-all ${step >= s ? 'w-8 bg-blue-600' : 'w-4 bg-gray-200'}`} />
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white hover:shadow-md rounded-2xl transition-all">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {step === 1 && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Method 1: Local File */}
                <button onClick={() => setSourceType('file')}
                  className={`p-8 rounded-[32px] border-2 transition-all text-left flex flex-col items-start gap-4 hover:shadow-xl ${sourceType === 'file' ? 'border-blue-500 bg-blue-50/30' : 'border-gray-100 bg-white hover:border-blue-200'}`}>
                  <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">CSV or JSON</h4>
                    <p className="text-sm text-gray-500 mt-1">Manual upload or paste raw data.</p>
                  </div>
                </button>

                {/* Method 2: Salesforce / HubSpot */}
                {['salesforce', 'hubspot'].map(p => {
                  const conn = connections.find(c => c.provider === p);
                  const isSyncing = syncing === p;
                  return (
                    <div key={p} 
                      className={`p-8 rounded-[32px] border-2 transition-all text-left flex flex-col items-start gap-4 hover:shadow-xl relative ${sourceType === p ? 'border-blue-500 bg-blue-50/30' : 'border-gray-100 bg-white hover:border-blue-200'}`}>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${p === 'salesforce' ? 'bg-sky-100 text-sky-600' : 'bg-orange-100 text-orange-600'}`}>
                        {p === 'salesforce' ? <Cloud className="w-7 h-7" /> : <Database className="w-7 h-7" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg capitalize">{p} API</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {conn?.is_active ? `Connected. Last sync: ${conn.last_sync_at ? new Date(conn.last_sync_at).toLocaleDateString() : 'Never'}` : `Pull live leads from ${p}.`}
                        </p>
                      </div>
                      
                      <div className="w-full pt-2 flex items-center">
                         {!conn?.is_configured ? (
                           <button onClick={() => onSetup(p)} className="text-xs font-bold text-blue-600 hover:underline">Setup credentials</button>
                         ) : !conn?.is_active ? (
                           <div className="flex items-center gap-3">
                             <button onClick={() => onConnect(p)} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl">Connect</button>
                             <button onClick={() => onSetup(p)} className="text-[10px] text-gray-400 hover:text-blue-600 underline">Edit config</button>
                           </div>
                         ) : (
                           <div className="flex items-center gap-3">
                             <button onClick={() => onSync(p)} disabled={isSyncing}
                               className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl">
                               {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Sync
                             </button>
                             <button onClick={() => onSetup(p)} className="text-[10px] text-gray-400 hover:text-blue-600 underline">Edit config</button>
                           </div>
                         )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {sourceType === 'file' && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                  <FileUploadSection onParsed={handleFileParsed} />
                </motion.div>
              )}
            </div>
          )}

          {step === 2 && (
            <FieldMappingStep 
              records={records} 
              onBack={() => setStep(1)} 
              onProceed={executeMigration} 
              processing={processing}
            />
          )}

          {step === 3 && (
            <ImportResultsStep 
              results={results} 
              onClose={() => { onClose(); onSuccess(); }} 
              onFix={onFix}
              onDelete={onDelete}
              lastMigratedId={lastMigratedId}
            />
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

function FileUploadSection({ onParsed }) {
  const [method, setMethod] = useState('csv');
  const [jsonText, setJsonText] = useState('');
  const [file, setFile] = useState(null);

  const handleParse = () => {
    if (method === 'json') {
      try {
        let p = JSON.parse(jsonText); if (!Array.isArray(p)) p = [p];
        onParsed(p, 'manual_import');
      } catch { toast.error('Invalid JSON'); }
    } else {
      if (!file) { toast.error('Select a CSV file'); return; }
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: (r) => {
          if (r.errors.length > 0) toast.error('CSV Parsing Error');
          else onParsed(r.data, file.name);
        }
      });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto border-t border-gray-100 pt-8">
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mx-auto">
        <button onClick={() => setMethod('csv')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${method === 'csv' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>CSV Upload</button>
        <button onClick={() => setMethod('json')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${method === 'json' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>JSON Paste</button>
      </div>

      {method === 'csv' ? (
        <div className="border-2 border-dashed border-blue-100 rounded-3xl p-12 text-center bg-blue-50/20 hover:bg-blue-50/40 transition-colors group cursor-pointer"
          onClick={() => document.getElementById('csv-file').click()}>
          <Upload className="w-12 h-12 text-blue-300 mx-auto mb-4 group-hover:-translate-y-1 transition-transform" />
          <p className="text-gray-500 text-sm font-medium">Click to select or drag your CSV file here</p>
          <input type="file" id="csv-file" accept=".csv" className="hidden" onChange={e => setFile(e.target.files[0])} />
          {file && <div className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-full text-xs font-bold inline-flex items-center gap-2">{file.name}</div>}
        </div>
      ) : (
        <textarea value={jsonText} onChange={e => setJsonText(e.target.value)} rows={6} placeholder='Paste your JSON array here...'
          className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs font-mono focus:ring-2 focus:ring-blue-500/20 outline-none resize-none" />
      )}

      <button onClick={handleParse} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-100 hover:shadow-2xl transition-all">
        Continue to Mapping <ArrowRight className="w-4 h-4 ml-2 inline" />
      </button>
    </div>
  );
}

function FieldMappingStep({ records, onBack, onProceed, processing }) {
  const [mappings, setMappings] = useState({});

  useEffect(() => {
    if (records.length > 0) {
      const first = records[0];
      const init = {};
      Object.keys(first).forEach(k => {
        const lower = k.toLowerCase();
        if (lower.includes('email')) init[k] = 'email';
        else if (lower.includes('company') || lower.includes('organisation') || lower.includes('account')) init[k] = 'company_name';
        else if (lower.includes('phone')) init[k] = 'phone';
        else if (lower.includes('contact')) init[k] = 'contact_person';
        else if (lower.includes('region')) init[k] = 'region';
        else if (lower.includes('address')) init[k] = 'address';
        else init[k] = '';
      });
      setMappings(init);
    }
  }, [records]);

  const handleMapChange = (crm, lms) => setMappings(prev => ({ ...prev, [crm]: lms }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold text-gray-900">Map your CRM columns to LMS fields</h4>
        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded uppercase">{records.length} records detected</span>
      </div>
      <div className="max-h-[400px] overflow-y-auto rounded-[32px] border border-gray-100 shadow-sm bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase sticky top-0 backdrop-blur-md">
            <tr className="border-b border-gray-100">
              <th className="px-8 py-4">CRM Key & Sample Value</th>
              <th className="px-8 py-4 text-right">Target LMS Field</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {Object.keys(records[0] || {}).map(key => (
              <tr key={key} className="hover:bg-blue-50/10 transition-colors">
                <td className="px-8 py-4">
                  <div className="font-mono text-xs text-blue-700 font-bold mb-0.5">{key}</div>
                  <div className="text-[10px] text-gray-400 truncate max-w-[280px]">
                    {records[0][key] ? String(records[0][key]) : <span className="italic text-gray-300">empty</span>}
                  </div>
                </td>
                <td className="px-8 py-4 text-right">
                  <select value={mappings[key] || ''} onChange={e => handleMapChange(key, e.target.value)}
                    className="bg-white border-2 border-gray-100 rounded-xl py-1.5 px-3 text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer min-w-[200px]">
                    <option value="">— Skip —</option>
                    {LMS_FIELDS.map(f => <option key={f} value={f}>{LMS_FIELD_LABELS[f]}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center pt-4">
        <button onClick={onBack} className="text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors">Back to Source</button>
        <button onClick={() => onProceed(Object.entries(mappings).filter(([, v]) => v).map(([crm, lms]) => ({ crm_field: crm, lms_field: lms })))}
          disabled={processing || !Object.values(mappings).includes('email')}
          className="px-12 py-4 bg-green-600 text-white rounded-2xl font-bold shadow-xl shadow-green-100 hover:shadow-2xl transition-all disabled:opacity-50">
          {processing ? <RefreshCw className="w-4 h-4 animate-spin mr-2 inline" /> : <Database className="w-4 h-4 mr-2 inline" />} Import & Migrate All
        </button>
      </div>
    </div>
  );
}

function ImportResultsStep({ results, onClose, onFix, onDelete, lastMigratedId }) {
  const [localConflicts, setLocalConflicts] = useState(results?.conflicts || []);

  useEffect(() => {
    if (lastMigratedId) {
      setLocalConflicts(prev => prev.filter(c => c.id !== lastMigratedId));
    }
  }, [lastMigratedId]);

  const handleAction = async (id, action) => {
    if (action === 'delete') {
      if (!window.confirm('Discard this conflict?')) return;
      await onDelete(id);
      setLocalConflicts(prev => prev.filter(c => c.id !== id));
    } else {
      // Open fix wizard - NO LONGER optimisticly removing here
      onFix(id);
    }
  };

  return (
    <div className="space-y-8 text-center py-6">
      <div className="flex items-center justify-center gap-12">
        <div className="text-center group">
          <div className="text-6xl font-black text-blue-600 mb-1">{results?.migrated}</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">New Migrations</div>
        </div>

        {results?.already_migrated > 0 && (
          <>
            <div className="w-px h-16 bg-gray-100" />
            <div className="text-center group">
              <div className="text-6xl font-black text-emerald-500 mb-1">{results?.already_migrated}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Already Synced</div>
            </div>
          </>
        )}

        <div className="w-px h-16 bg-gray-100" />
        <div className="text-center group">
          <div className={`text-6xl font-black mb-1 ${localConflicts.length > 0 ? 'text-amber-500' : 'text-green-500'}`}>{localConflicts.length}</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Conflicts</div>
        </div>
      </div>

      {localConflicts.length > 0 ? (
        <div className="bg-amber-50 rounded-[32px] p-8 border border-amber-100 text-left max-w-2xl mx-auto shadow-inner">
          <div className="flex items-center justify-between mb-6">
             <h4 className="flex items-center gap-2 text-amber-800 font-bold text-lg">
               <AlertTriangle className="w-5 h-5" /> Conflicts Found
             </h4>
             <span className="text-[10px] font-black text-amber-600 bg-white px-3 py-1 rounded-full border border-amber-100">ACTION REQUIRED</span>
          </div>
          
          <div className="max-h-[280px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {localConflicts.map((c, i) => (
              <div key={c.id || i} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-amber-100 shadow-sm transition-all hover:border-amber-300">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-gray-900">{getDisplayEmail(c.raw_data)}</span>
                  <span className="text-[10px] text-amber-600 font-bold uppercase tracking-tight">{c.reason}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleAction(c.id, 'fix')}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-all">
                    Fix & Migrate
                  </button>
                  <button onClick={() => handleAction(c.id, 'delete')}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Discard">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[11px] text-amber-700 leading-relaxed font-medium">
            Fixing a conflict opens the mapping wizard. Remaining conflicts will stay as <b>'Pending'</b> in your CRM manager list.
          </p>
        </div>
      ) : (
        <div className="py-12">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${results?.migrated > 0 ? 'bg-green-100 text-green-600' : 'bg-emerald-100 text-emerald-600'}`}>
            <CheckCircle className="w-12 h-12" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 leading-tight">
            {results?.migrated > 0 ? 'Import Successful!' : 'Data Already Up-to-Date'}
          </h3>
          <p className="text-gray-500 mt-2">
            {results?.migrated > 0 
              ? 'All new records have been successfully processed and migrated to the LMS.' 
              : 'No new records were found; all data matches existing synced customers.'}
          </p>
        </div>
      )}

      <button onClick={onClose} className="px-12 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-gray-200">
        {localConflicts.length > 0 ? 'Process Conflicts Later' : 'Finish & Refresh'}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAPPING SETTINGS SECTION (integrated into CRM Manager)
// ══════════════════════════════════════════════════════════════════════════════
function MappingSettingsSection() {
  const [mappingsBySource, setMappingsBySource] = useState({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const allCrm = await apiService.get('/api/v1/crm/customers')
      const sources = Array.from(new Set(allCrm.map(c => c.source_system)))
      const results = await Promise.allSettled(
        sources.map(s => apiService.get(`/api/v1/crm/mappings/${s}`).then(d => ({ s, d: d || [] })))
      )
      const m = {}
      for (const r of results) if (r.status === 'fulfilled') m[r.value.s] = r.value.d
      setMappingsBySource(m)
    } catch { toast.error('Failed to load mappings') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const handleDelete = async (mappingId, source) => {
    try {
      await apiService.delete(`/api/v1/crm/mappings/${mappingId}`)
      setMappingsBySource(prev => ({ ...prev, [source]: prev[source].filter(m => m.id !== mappingId) }))
      toast.success('Mapping removed')
    } catch (err) { toast.error(err?.message || 'Failed') }
  }

  const sources = Object.keys(mappingsBySource).sort()

  if (loading) return <div className="py-10 text-center text-gray-400">Loading settings...</div>
  if (sources.length === 0) return <div className="py-10 text-center text-gray-400">No rule presets detected. Perform an import to create some.</div>

  return (
    <div className="space-y-4">
      {sources.map(source => {
        const maps = mappingsBySource[source] || []
        const isOpen = expanded[source]
        return (
          <div key={source} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <button onClick={() => setExpanded(e => ({ ...e, [source]: !isOpen }))}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold text-gray-700 truncate max-w-[200px]">{source}</span>
                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold">{maps.length} rules</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="border-t border-gray-100">
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-gray-50">
                      {maps.map(m => (
                        <tr key={m.id} className="group hover:bg-gray-50/50">
                          <td className="px-4 py-2 font-mono text-gray-600">{m.crm_field}</td>
                          <td className="px-2 py-2 text-gray-300">→</td>
                          <td className="px-4 py-2 font-semibold text-gray-700">{LMS_FIELD_LABELS[m.lms_field] || m.lms_field}</td>
                          <td className="px-4 py-2 text-right">
                            <button onClick={() => handleDelete(m.id, source)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}


// ══════════════════════════════════════════════════════════════════════════════
// TAB 2: CRM Manager
// ══════════════════════════════════════════════════════════════════════════════
function CRMManagerTab({ canManage }) {
  const [crmCustomers, setCrmCustomers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(null); // 'salesforce' or 'hubspot'
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [wizardId, setWizardId] = useState(null)
  const [bulkPreview, setBulkPreview] = useState(null)
  const [lastMigratedId, setLastMigratedId] = useState(null)

  const load = useCallback(async () => {
    try {
      const [crmRes, connRes] = await Promise.all([
        apiService.get('/api/v1/crm/customers'),
        apiService.get('/api/v1/crm/connections')
      ]);
      setCrmCustomers(Array.isArray(crmRes) ? crmRes : []);
      setConnections(Array.isArray(connRes) ? connRes : []);
    } catch (error) {
      toast.error('Failed to load CRM data');
      console.error('Failed to load CRM data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleConnect = async (provider) => {
    const conn = connections.find(c => c.provider === provider);
    if (!conn?.is_configured) {
      setShowConfigModal(provider);
      return;
    }
    try {
      const res = await apiService.get(`/api/v1/crm/auth/${provider}`);
      window.location.href = res.url;
    } catch (error) {
      toast.error(`Failed to start ${provider} authentication`);
    }
  };

  const handleSync = async (provider) => {
    setSyncing(provider);
    try {
      const res = await apiService.post(`/api/v1/crm/sync/${provider}`);
      toast.success(res.message);
      load();
    } catch (error) {
      toast.error(`Sync failed for ${provider}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleBulkMigrate = async () => {
    setLoading(true);
    try {
      const res = await apiService.post('/api/v1/crm/bulk-preview');
      setBulkPreview(res);
    } catch (err) {
      toast.error('Failed to generate bulk preview');
    } finally {
      setLoading(false);
    }
  };

  const executeBulkMigrate = async () => {
    const pendingSources = [...new Set(crmCustomers
      .filter(c => c.migration_status === 'pending')
      .map(c => c.source_system))];
    
    setLoading(true);
    let totalSuccess = 0;
    try {
      for (const source of pendingSources) {
        const res = await apiService.post(`/api/v1/crm/migrate-all?source_system=${encodeURIComponent(source)}`);
        totalSuccess += res.success;
      }
      toast.success(`Bulk migration complete! ${totalSuccess} records migrated.`);
      setBulkPreview(null);
      load();
    } catch (err) {
      toast.error('Bulk migration failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load() }, [load])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this CRM record?')) return
    try {
      await apiService.delete(`/api/v1/crm/customers/${id}`)
      setCrmCustomers(prev => prev.filter(c => c.id !== id))
      toast.success('Record deleted')
    } catch (err) { toast.error(err?.message || 'Delete failed') }
  }

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return crmCustomers.filter(c => {
      const str = JSON.stringify(c.raw_data || {}).toLowerCase()
      return (!term || str.includes(term) || c.source_system?.toLowerCase().includes(term))
        && (!statusFilter || c.migration_status === statusFilter)
    })
  }, [crmCustomers, searchTerm, statusFilter])

  if (loading) return <RouteSkeleton />

  return (
    <div className="space-y-5">
      {/* Search & Bulk Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input placeholder="Search records, source or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="py-3 px-4 bg-white border border-gray-200 rounded-2xl shadow-sm text-sm focus:outline-none font-medium text-gray-600">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="migrated">Migrated</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm">
          {canManage && crmCustomers.some(c => c.migration_status === 'pending') && (
            <button onClick={handleBulkMigrate}
              className="flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl hover:bg-emerald-100 transition-all text-sm font-bold shadow-sm">
              <CheckCircle2 className="w-4 h-4" /> Bulk Migrate All
            </button>
          )}

          {canManage && (
            <button onClick={() => setShowSettings(!showSettings)}
              className={`p-3 rounded-2xl border transition-all ${
                showSettings ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}>
              <Settings2 className="w-5 h-5" />
            </button>
          )}
          
          {canManage && (
            <button onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-100 hover:shadow-2xl hover:-translate-y-0.5 transition-all text-sm font-bold">
              <Upload className="w-4 h-4" /> Import Customers
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-gray-100 pb-2">
            <div className="bg-gradient-to-br from-indigo-50/50 to-blue-50/50 p-6 rounded-2xl border border-indigo-100/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                  <Settings2 className="w-4 h-4" /> Import Rule Presets
                </h3>
                <p className="text-xs text-indigo-600 font-medium">Automatic mappings detected from previous imports</p>
              </div>
              <MappingSettingsSection />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImportModal && (
          <CRMImportModal 
            onClose={() => setShowImportModal(false)} 
            onSuccess={load} 
            connections={connections}
            onConnect={handleConnect}
            onSync={handleSync}
            onSetup={p => setShowConfigModal(p)}
            syncing={syncing}
            onFix={(id) => setWizardId(id)}
            onDelete={handleDelete}
            lastMigratedId={lastMigratedId}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfigModal && (
          <ConnectionConfigModal 
            provider={showConfigModal} 
            onClose={() => setShowConfigModal(null)} 
            onSave={(config) => handleSaveConfig(showConfigModal, config)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bulkPreview && (
          <BulkMigratePreviewModal 
            data={bulkPreview} 
            onClose={() => setBulkPreview(null)} 
            onConfirm={executeBulkMigrate}
            onFix={(id) => { setBulkPreview(null); setWizardId(id); }}
          />
        )}
      </AnimatePresence>

      {/* CRM Search & Filters */}
      {!showSettings && (
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          {Object.entries(CRM_STATUS_CFG).filter(([k])=>k!=='mapped').map(([key, cfg]) => (
            <button key={key} onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
              className={`rounded-xl border p-3 text-left transition-all ${statusFilter === key ? cfg.cls + ' ring-2 ring-blue-300 shadow-md' : 'bg-white border-gray-100 hover:border-blue-100 hover:shadow-sm'}`}>
              <div className="text-2xl font-bold text-gray-800">{crmCustomers.filter(c => c.migration_status === key).length}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">{cfg.label}</div>
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-5 py-4">Company</th>
              <th className="px-5 py-4">Email</th>
              <th className="px-5 py-4">Source</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="py-14 text-center text-gray-400">
                <Database className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                {searchTerm || statusFilter ? 'No matching records.' : 'No CRM records. Click Import Data to begin.'}
              </td></tr>
            ) : filtered.map(c => {
              const cfg = CRM_STATUS_CFG[c.migration_status] || CRM_STATUS_CFG.pending
              const displayName = c.mapped_company_name || getDisplayName(c.raw_data)
              const displayEmail = c.mapped_email || getDisplayEmail(c.raw_data)
              
              return (
                <tr key={c.id} className="hover:bg-blue-50/10 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0 border border-blue-100">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-900 line-clamp-1">{displayName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-300 shrink-0" />{displayEmail}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="capitalize text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded border border-indigo-100 truncate max-w-[120px] inline-block">{c.source_system}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${cfg.cls}`}>{cfg.label}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {canManage && c.migration_status !== 'migrated' && (
                         <>
                           <button onClick={() => setWizardId(c.id)}
                             className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                             Fix & Migrate <ArrowRight className="w-3 h-3" />
                           </button>
                           <button onClick={() => handleDelete(c.id)} title="Discard Record"
                             className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </>
                       )}
                       {c.migration_status === 'migrated' && (
                         <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                           <CheckCircle className="w-3 h-3" /> Migrated
                         </span>
                       )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>


      {/* Mapping Wizard (for fixing individual records) */}
      <AnimatePresence>
        {wizardId && <MappingWizard crmCustomerId={wizardId} onClose={() => setWizardId(null)} onMigrated={(id) => { load(); setWizardId(null); setLastMigratedId(id); }} />}
      </AnimatePresence>
    </div>
  )
}


// ══════════════════════════════════════════════════════════════════════════════
// ROOT: Customers Page with 2 Tabs
// ══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { key: 'lms', label: 'LMS Customers', icon: Users },
  { key: 'crm', label: 'CRM Leads',   icon: Database },
]

function ConnectionConfigModal({ provider, onClose, onSave }) {
  const [config, setConfig] = useState({ client_id: '', client_secret: '' });

  return createPortal(
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xl overscroll-none">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 capitalize">{provider} Configuration</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                Enter your <b>Consumer Key</b> and <b>Consumer Secret</b> from the {provider} Connected App settings.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Client ID (Consumer Key)</label>
                <input type="text" value={config.client_id} onChange={e => setConfig({ ...config, client_id: e.target.value })}
                  placeholder="Paste Key here..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Client Secret</label>
                <input type="password" value={config.client_secret} onChange={e => setConfig({ ...config, client_secret: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 px-6 py-3 border border-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all text-sm">
                Cancel
              </button>
              <button onClick={() => onSave(config)} disabled={!config.client_id || !config.client_secret}
                className="flex-[2] px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-100 hover:shadow-xl transition-all text-sm disabled:opacity-50">
                Save & Proceed
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

export default function Customers() {
  const { user } = useLabManagementAuth()
  const canManage = ['Admin', 'Sales Engineer'].includes(user?.role)
  const [activeTab, setActiveTab] = useState('lms')

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Customers
          </h1>
          <p className="mt-1 text-sm text-gray-500">LMS customers and CRM lead imports — all in one place.</p>
        </div>
        {/* Simple Tab bar */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                activeTab === key ? 'bg-white text-blue-600 shadow-md ring-1 ring-blue-50' : 'text-gray-500 hover:text-gray-700'}`}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" />

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, x: activeTab === 'lms' ? -10 : 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: activeTab === 'lms' ? 10 : -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'lms' && <LMSCustomersTab canManage={canManage} />}
          {activeTab === 'crm' && <CRMManagerTab canManage={canManage} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ─── Bulk Migrate Preview Modal ────────────────────────────────────────────────
function BulkMigratePreviewModal({ data, onClose, onConfirm, onFix }) {
  const [tab, setTab] = useState('ready'); // 'ready' or 'attention'

  useEffect(() => {
    lockScroll();
    return () => unlockScroll();
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xl overscroll-none">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20 overscroll-contain">
        
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-xl sticky top-0 z-10">
          <div>
            <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <ShieldCheck className="w-7 h-7 text-emerald-600" /> Bulk Migration Preview
            </h3>
            <p className="text-gray-500 text-sm mt-1">Found {data.total_found} pending records across all sources.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Summary Tabs */}
          <div className="p-6 flex gap-4 border-b border-gray-100">
            <button onClick={() => setTab('ready')}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all text-left ${
                tab === 'ready' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-emerald-200'
              }`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-black uppercase tracking-widest ${tab === 'ready' ? 'text-emerald-600' : 'text-gray-400'}`}>Ready to Migrate</span>
                <CheckCircle2 className={`w-4 h-4 ${tab === 'ready' ? 'text-emerald-600' : 'text-gray-300'}`} />
              </div>
              <div className="text-3xl font-black text-gray-900">{data.ready.length}</div>
              <p className="text-xs text-gray-500 mt-1">Mapping rules fully applied. No conflicts.</p>
            </button>

            <button onClick={() => setTab('attention')}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all text-left ${
                tab === 'attention' ? 'border-amber-500 bg-amber-50' : 'border-gray-100 hover:border-amber-200'
              }`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-black uppercase tracking-widest ${tab === 'attention' ? 'text-amber-600' : 'text-gray-400'}`}>Needs Attention</span>
                <AlertTriangle className={`w-4 h-4 ${tab === 'attention' ? 'text-amber-600' : 'text-gray-300'}`} />
              </div>
              <div className="text-3xl font-black text-gray-900">{data.needs_attention.length}</div>
              <p className="text-xs text-gray-500 mt-1">Issues found (missing fields or conflicts).</p>
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-6 text-sm">
            <div className="space-y-3">
              {(tab === 'ready' ? data.ready : data.needs_attention).map(rec => (
                <div key={rec.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      tab === 'ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {rec.company_name.charAt(0)}
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-900">{rec.company_name}</h5>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{rec.email}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span className="capitalize">{rec.source_system}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {rec.reason && (
                      <span className="text-[10px] font-bold text-amber-600 bg-white px-3 py-1 rounded-full border border-amber-100">
                        {rec.reason}
                      </span>
                    )}
                    <button onClick={() => onFix(rec.id)}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                      <Settings2 className="w-3.5 h-3.5" /> Fix
                    </button>
                  </div>
                </div>
              ))}
              
              {(tab === 'ready' ? data.ready : data.needs_attention).length === 0 && (
                <div className="py-20 text-center text-gray-400">
                  <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  No records to display in this category.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <p className="text-xs text-gray-500 font-medium max-w-sm">
            {tab === 'ready' 
              ? "All 'Ready' records will be migrated using their respective rule presets. Conflicts and missing mappings will be skipped."
              : "Review the issues above. You can fix them individually or proceed with just the ready records."
            }
          </p>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-6 py-3 text-gray-500 font-bold text-sm hover:underline">Cancel</button>
            <button 
              disabled={data.ready.length === 0}
              onClick={onConfirm}
              className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-black shadow-xl transition-all ${
                data.ready.length > 0 ? 'bg-emerald-600 shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-1' : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              <RefreshCw className="w-5 h-5" /> Migrate {data.ready.length} Records
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

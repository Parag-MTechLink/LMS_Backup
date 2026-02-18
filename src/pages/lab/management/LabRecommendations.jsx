import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { TrendingUp, Search, FlaskConical, Loader2, MapPin, BarChart3, FileText, Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { labsService } from '../../../services/labManagementApi'
import { getApiErrorMessage } from '../../../utils/apiError'

const TABS = [
  { id: 'recommendations', label: 'Recommendations', icon: TrendingUp },
  { id: 'lab-details', label: 'Lab Details', icon: FileText },
  { id: 'statistics', label: 'Statistics', icon: BarChart3 },
]

export default function LabRecommendationsPage() {
  const [domains, setDomains] = useState([])
  const [locations, setLocations] = useState({}) // { state: [city, ...] }
  const [loadingDomains, setLoadingDomains] = useState(true)
  const [testName, setTestName] = useState('')
  const [standard, setStandard] = useState('')
  const [domain, setDomain] = useState('')
  const [state, setState] = useState('')
  const [city, setCity] = useState('')
  const [mode, setMode] = useState('recommend') // 'recommend' | 'search'
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedLab, setSelectedLab] = useState(null)
  const [labDetail, setLabDetail] = useState(null)
  const [engineAvailable, setEngineAvailable] = useState(true)
  const [activeTab, setActiveTab] = useState('recommendations')
  const [labNameSearch, setLabNameSearch] = useState('')
  const [labNameLimit, setLabNameLimit] = useState(100)
  const [labsByName, setLabsByName] = useState([])
  const [loadingLabsByName, setLoadingLabsByName] = useState(false)
  const [selectedLabIdForDetails, setSelectedLabIdForDetails] = useState(null)
  const [labDetailsFull, setLabDetailsFull] = useState(null)
  const [loadingLabDetailsFull, setLoadingLabDetailsFull] = useState(false)
  const [statistics, setStatistics] = useState(null)
  const [loadingStatistics, setLoadingStatistics] = useState(false)

  const stateList = useMemo(() => Object.keys(locations).filter(Boolean).sort(), [locations])
  const cityList = useMemo(
    () => (state ? (locations[state] || []).filter(Boolean).sort() : []),
    [locations, state]
  )

  const loadDomainsAndLocations = useCallback(async () => {
    setLoadingDomains(true)
    try {
      const [domainsRes, locationsRes] = await Promise.all([
        labsService.getDomains(),
        labsService.getLocations(),
      ])
      setDomains(domainsRes.domains || [])
      setLocations(locationsRes.locations || {})
    } catch (err) {
      if (err.response?.status === 503) {
        setEngineAvailable(false)
        toast.error('Lab recommendation engine is not configured.')
      } else {
        toast.error(getApiErrorMessage(err) || 'Failed to load filters')
      }
    } finally {
      setLoadingDomains(false)
    }
  }, [])

  useEffect(() => {
    loadDomainsAndLocations()
  }, [loadDomainsAndLocations])

  useEffect(() => {
    if (state && !cityList.includes(city)) setCity('')
  }, [state, cityList, city])

  const hasAnyFilter = testName.trim() || standard.trim() || domain.trim() || state || city

  const handleRecommend = async () => {
    if (!hasAnyFilter) {
      toast.error('Enter at least one filter: test name, standard, domain, state, or city.')
      return
    }
    setLoading(true)
    setResults([])
    try {
      const data = await labsService.getRecommendations({
        test_name: testName.trim(),
        standard: standard.trim(),
        domain: domain.trim(),
        state: state || undefined,
        city: city || undefined,
        limit: 20,
      })
      setResults(data.results || [])
      setMode('recommend')
      if ((data.results || []).length === 0) toast('No labs found for the given criteria.')
    } catch (err) {
      if (err.response?.status === 503) {
        setEngineAvailable(false)
        toast.error('Lab recommendation engine is not configured.')
      } else {
        toast.error(getApiErrorMessage(err) || 'Failed to get recommendations')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!hasAnyFilter) {
      toast.error('Enter at least one filter: test name, standard, domain, state, or city.')
      return
    }
    setLoading(true)
    setResults([])
    try {
      const data = await labsService.searchLabs({
        test_name: testName.trim(),
        standard: standard.trim(),
        domain: domain.trim(),
        state: state || undefined,
        city: city || undefined,
        limit: 50,
      })
      setResults(data.results || [])
      setMode('search')
      if ((data.results || []).length === 0) toast('No labs found.')
    } catch (err) {
      if (err.response?.status === 503) {
        setEngineAvailable(false)
        toast.error('Lab recommendation engine is not configured.')
      } else {
        toast.error(getApiErrorMessage(err) || 'Failed to search labs')
      }
    } finally {
      setLoading(false)
    }
  }

  const openLabDetail = async (labId) => {
    try {
      const data = await labsService.getLabDetails(labId)
      setLabDetail(data)
      setSelectedLab(labId)
    } catch (err) {
      toast.error(getApiErrorMessage(err) || 'Failed to load lab details')
    }
  }

  const fetchLabsByName = useCallback(async () => {
    setLoadingLabsByName(true)
    try {
      const data = await labsService.searchLabsByName({ q: labNameSearch, limit: labNameLimit })
      setLabsByName(data.results || [])
    } catch (err) {
      if (err.response?.status === 503) setEngineAvailable(false)
      toast.error(getApiErrorMessage(err) || 'Failed to search labs')
    } finally {
      setLoadingLabsByName(false)
    }
  }, [labNameSearch, labNameLimit])

  useEffect(() => {
    if (activeTab === 'lab-details') fetchLabsByName()
  }, [activeTab, fetchLabsByName])

  const loadLabDetailsForPanel = useCallback(async (labId) => {
    setSelectedLabIdForDetails(labId)
    setLoadingLabDetailsFull(true)
    setLabDetailsFull(null)
    try {
      const data = await labsService.getLabDetails(labId)
      setLabDetailsFull(data)
    } catch (err) {
      toast.error(getApiErrorMessage(err) || 'Failed to load lab details')
    } finally {
      setLoadingLabDetailsFull(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'statistics') {
      setLoadingStatistics(true)
      labsService.getStatistics()
        .then(setStatistics)
        .catch((err) => {
          if (err.response?.status === 503) setEngineAvailable(false)
          toast.error(getApiErrorMessage(err) || 'Failed to load statistics')
        })
        .finally(() => setLoadingStatistics(false))
    }
  }, [activeTab])

  const downloadCapabilitiesCsv = useCallback((details) => {
    if (!details?.capabilities?.length) return
    const headers = ['Test Name', 'Standard Code', 'Full Code', 'Standard Body', 'Domain']
    const rows = details.capabilities.map((c) => [
      c.test_name ?? '',
      c.standard_code ?? '',
      c.full_code ?? '',
      c.standard_body ?? '',
      c.domain_name ?? '',
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lab_${details.lab?.lab_id ?? 'unknown'}_capabilities.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  if (!engineAvailable) {
    return (
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800"
        >
          <h2 className="text-lg font-semibold">Lab recommendations unavailable</h2>
          <p className="mt-2 text-sm">
            The lab recommendation engine is not configured. Set <code className="rounded bg-amber-100 px-1">LAB_ENGINE_DATABASE_URL</code> in the backend and ensure the lab database (labs, tests, standards, domains) is available.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <TrendingUp className="h-5 w-5" />
          </span>
          Lab recommendations
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Find and rank testing labs by test name, standard, domain, state, or city.
        </p>
      </motion.div>

      <div className="mb-6 flex gap-0 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <tab.icon className="h-4 w-4 shrink-0" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'recommendations' && (
      <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="block text-sm font-medium text-slate-700">Test name</label>
            <input
              type="text"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="e.g. Voltage Test"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Standard</label>
            <input
              type="text"
              value={standard}
              onChange={(e) => setStandard(e.target.value)}
              placeholder="e.g. IEC 60068"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Domain</label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All domains</option>
              {domains.map((d) => (
                <option key={d.domain_id} value={d.domain_name}>
                  {d.domain_name} ({d.lab_count ?? 0})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">State</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All states</option>
              {stateList.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">City</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={!state}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 disabled:text-slate-500"
            >
              <option value="">All cities</option>
              {cityList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={handleRecommend}
            disabled={loading || loadingDomains}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
            Recommend
          </button>
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading || loadingDomains}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>
      </motion.div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        </div>
      )}

      {!loading && results.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">Lab</th>
                  {mode === 'recommend' && (
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">Relevance</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">Test / Standard</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {results.map((row) => (
                  <tr
                    key={`${row.lab_id}-${row.test_name || ''}-${row.standard_code || ''}`}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-900">{row.lab_name}</span>
                    </td>
                    {mode === 'recommend' && (
                      <td className="px-6 py-4 text-slate-600">
                        {row.relevance_score != null ? row.relevance_score : '—'}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {(row.city || row.state) ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {[row.city, row.state].filter(Boolean).join(', ')}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {row.test_name || row.sample_tests?.[0] || '—'} / {row.standard_code || row.sample_standards?.[0] || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openLabDetail(row.lab_id)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
      </div>
      )}

      {activeTab === 'lab-details' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Find a lab</h2>
            <p className="mt-1 text-sm text-slate-600">Search by lab name and select to view full details.</p>
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <div className="min-w-[200px] flex-1">
                <label className="block text-sm font-medium text-slate-700">Search by lab name</label>
                <input
                  type="text"
                  value={labNameSearch}
                  onChange={(e) => setLabNameSearch(e.target.value)}
                  placeholder="e.g. National Test House, Bureau of Indian Standards..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium text-slate-700">Max results</label>
                <input
                  type="number"
                  min={10}
                  max={500}
                  value={labNameLimit}
                  onChange={(e) => setLabNameLimit(Number(e.target.value) || 100)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
              <button
                type="button"
                onClick={fetchLabsByName}
                disabled={loadingLabsByName}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {loadingLabsByName ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </button>
            </div>
            {labsByName.length > 0 && (
              <>
                <p className="mt-3 text-sm text-slate-600">Found {labsByName.length} lab(s)</p>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-slate-700">Select a lab to view details</label>
                  <select
                    value={selectedLabIdForDetails ?? ''}
                    onChange={(e) => loadLabDetailsForPanel(Number(e.target.value) || null)}
                    className="mt-1 w-full max-w-xl rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                  >
                    <option value="">— Select —</option>
                    {labsByName.map((lab) => (
                      <option key={lab.lab_id} value={lab.lab_id}>
                        {lab.lab_name} (ID: {lab.lab_id}, {lab.capability_count} capabilities)
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          {loadingLabDetailsFull && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
          )}

          {!loadingLabDetailsFull && labDetailsFull && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-indigo-600" />
                {labDetailsFull.lab?.lab_name}
              </h2>
              {(labDetailsFull.lab?.city || labDetailsFull.lab?.state) && (
                <p className="flex items-center gap-2 text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {[labDetailsFull.lab.city, labDetailsFull.lab.state].filter(Boolean).join(', ')}
                </p>
              )}
              <p className="text-sm text-slate-500">Lab ID: {labDetailsFull.lab?.lab_id}</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-2xl font-bold text-slate-900">{labDetailsFull.total_capabilities ?? 0}</p>
                  <p className="text-sm text-slate-600">Total Capabilities</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-2xl font-bold text-slate-900">{labDetailsFull.domain_summary?.length ?? 0}</p>
                  <p className="text-sm text-slate-600">Unique Domains</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-2xl font-bold text-slate-900">
                    {labDetailsFull.capabilities ? new Set(labDetailsFull.capabilities.map((c) => c.test_name)).size : 0}
                  </p>
                  <p className="text-sm text-slate-600">Unique Tests</p>
                </div>
              </div>
              {labDetailsFull.domain_summary?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Domain Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={labDetailsFull.domain_summary}>
                        <XAxis dataKey="domain_name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="capability_count" fill="#4f46e5" name="Capabilities" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-700">All Capabilities</h3>
                  <button
                    type="button"
                    onClick={() => downloadCapabilitiesCsv(labDetailsFull)}
                    className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="h-4 w-4" />
                    Download as CSV
                  </button>
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-96 overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-slate-700">Test Name</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-700">Standard Code</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-700">Full Code</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-700">Standard Body</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-700">Domain</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {labDetailsFull.capabilities?.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-2 text-slate-900 max-w-xs truncate" title={c.test_name}>{c.test_name ?? '—'}</td>
                          <td className="px-4 py-2 text-slate-600">{c.standard_code ?? '—'}</td>
                          <td className="px-4 py-2 text-slate-600 max-w-xs truncate" title={c.full_code}>{c.full_code ?? '—'}</td>
                          <td className="px-4 py-2 text-slate-600 max-w-xs truncate" title={c.standard_body}>{c.standard_body ?? '—'}</td>
                          <td className="px-4 py-2 text-slate-600">{c.domain_name ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'statistics' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {loadingStatistics && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
          )}
          {!loadingStatistics && statistics && (
            <>
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Database Statistics</h2>
                <p className="text-sm text-slate-600 mb-4">Overview of the lab recommendation engine database.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-lg bg-indigo-50 p-4">
                    <p className="text-2xl font-bold text-indigo-700">{statistics.active_labs?.toLocaleString() ?? 0}</p>
                    <p className="text-sm text-slate-600">Active Labs</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-2xl font-bold text-slate-900">{statistics.total_capabilities?.toLocaleString() ?? 0}</p>
                    <p className="text-sm text-slate-600">Total Capabilities</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-2xl font-bold text-slate-900">{statistics.unique_tests?.toLocaleString() ?? 0}</p>
                    <p className="text-sm text-slate-600">Unique Tests</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-2xl font-bold text-slate-900">{statistics.unique_standards?.toLocaleString() ?? 0}</p>
                    <p className="text-sm text-slate-600">Unique Standards</p>
                  </div>
                </div>
              </div>
              {statistics.domain_distribution?.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Domain Distribution</h3>
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statistics.domain_distribution}>
                          <XAxis dataKey="domain_name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="capability_count" fill="#4f46e5" name="Capabilities" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="px-4 py-2 text-left font-medium text-slate-700">Domain</th>
                            <th className="px-4 py-2 text-right font-medium text-slate-700">Capabilities</th>
                            <th className="px-4 py-2 text-right font-medium text-slate-700">Labs</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statistics.domain_distribution.map((d, i) => (
                            <tr key={i} className="border-b border-slate-100">
                              <td className="px-4 py-2 text-slate-900">{d.domain_name}</td>
                              <td className="px-4 py-2 text-right text-slate-600">{d.capability_count?.toLocaleString()}</td>
                              <td className="px-4 py-2 text-right text-slate-600">{d.lab_count?.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              {statistics.top_labs?.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Labs by Capability Count</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-4 py-3 text-left font-medium text-slate-700">Lab ID</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-700">Lab Name</th>
                          <th className="px-4 py-3 text-right font-medium text-slate-700">Total Capabilities</th>
                          <th className="px-4 py-3 text-right font-medium text-slate-700">Unique Tests</th>
                          <th className="px-4 py-3 text-right font-medium text-slate-700">Unique Standards</th>
                          <th className="px-4 py-3 text-right font-medium text-slate-700">Unique Domains</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statistics.top_labs.map((lab) => (
                          <tr key={lab.lab_id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3 text-slate-600">{lab.lab_id}</td>
                            <td className="px-4 py-3 font-medium text-slate-900">{lab.lab_name}</td>
                            <td className="px-4 py-3 text-right text-slate-600">{lab.total_capabilities?.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-slate-600">{lab.unique_tests?.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-slate-600">{lab.unique_standards?.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-slate-600">{lab.unique_domains?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      {labDetail && selectedLab !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => { setLabDetail(null); setSelectedLab(null) }}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-indigo-600" />
                {labDetail.lab?.lab_name}
              </h3>
              <button
                type="button"
                onClick={() => { setLabDetail(null); setSelectedLab(null) }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ×
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {(labDetail.lab?.city || labDetail.lab?.state) && (
                <p className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {[labDetail.lab.city, labDetail.lab.state].filter(Boolean).join(', ')}
                </p>
              )}
              <p className="text-sm text-slate-600">
                Total capabilities: {labDetail.total_capabilities ?? 0}
              </p>
              {labDetail.domain_summary?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700">Domains</h4>
                  <ul className="mt-1 list-inside list-disc text-sm text-slate-600">
                    {labDetail.domain_summary.map((d, i) => (
                      <li key={i}>{d.domain_name}: {d.capability_count}</li>
                    ))}
                  </ul>
                </div>
              )}
              {labDetail.capabilities?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700">Sample capabilities</h4>
                  <ul className="mt-1 space-y-1 text-sm text-slate-600">
                    {labDetail.capabilities.slice(0, 10).map((c, i) => (
                      <li key={i}>{c.test_name} — {c.standard_code} ({c.domain_name})</li>
                    ))}
                    {labDetail.capabilities.length > 10 && (
                      <li>… and {labDetail.capabilities.length - 10} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

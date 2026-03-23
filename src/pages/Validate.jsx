import { useState, useEffect, useCallback } from 'react'

// ── helpers ──────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

async function pingBackend() {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(`${API_BASE}/api/health-check`, { signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) return { ok: false, data: null, error: `HTTP ${res.status}` }
    const data = await res.json()
    return { ok: true, data, error: null }
  } catch (err) {
    clearTimeout(timeout)
    const msg = err.name === 'AbortError' ? 'Request timed out (8 s).' : err.message
    return { ok: false, data: null, error: msg }
  }
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatusIcon({ state }) {
  if (state === 'loading') {
    return (
      <span className="val-spinner" aria-label="Checking…" />
    )
  }
  if (state === 'ok') {
    return (
      <svg className="val-icon val-icon--ok" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    )
  }
  return (
    <svg className="val-icon val-icon--err" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function ServiceCard({ icon, label, state, detail, suggestion }) {
  const borderColor =
    state === 'loading' ? 'var(--val-border)' :
    state === 'ok'      ? 'var(--val-green)' :
                          'var(--val-red)'
  return (
    <div className="val-card" style={{ borderColor }}>
      <div className="val-card-header">
        <span className="val-card-icon">{icon}</span>
        <span className="val-card-label">{label}</span>
        <StatusIcon state={state} />
      </div>
      {detail && <p className="val-card-detail">{detail}</p>}
      {state === 'error' && suggestion && (
        <div className="val-suggestion">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="val-suggestion-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
          </svg>
          <span>{suggestion}</span>
        </div>
      )}
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function Validate() {
  const [status, setStatus] = useState({
    frontend:  { state: 'ok',      detail: 'React app is running.',   suggestion: null },
    backend:   { state: 'loading', detail: null,                      suggestion: null },
    database:  { state: 'loading', detail: null,                      suggestion: null },
  })
  const [lastChecked, setLastChecked] = useState(null)
  const [checking, setChecking] = useState(false)
  const [countdown, setCountdown] = useState(30)

  const runChecks = useCallback(async () => {
    setChecking(true)
    setCountdown(30)
    setStatus(s => ({
      ...s,
      backend:  { state: 'loading', detail: null, suggestion: null },
      database: { state: 'loading', detail: null, suggestion: null },
    }))

    const { ok, data, error } = await pingBackend()

    setStatus(s => ({
      ...s,
      backend: ok
        ? { state: 'ok',    detail: `Version ${data.version} — responded successfully.`, suggestion: null }
        : { state: 'error', detail: error || 'No response from server.',
            suggestion: 'Make sure the backend is running. Activate the Python venv and run: uvicorn app.main:app --reload --port 8000 (or 8001). Check the VITE_API_URL in .env.development.' },
      database: !ok
        ? { state: 'error', detail: 'Could not reach backend to verify database.',
            suggestion: 'Start the backend first; the database status will be re-checked automatically.' }
        : data.database
          ? { state: 'ok',    detail: 'Neon PostgreSQL — connected and responding.', suggestion: null }
          : { state: 'error', detail: data.database_error || 'Database unreachable.',
              suggestion: 'Check your DATABASE_URL in backend/.env. If using Neon, the database project may be paused — log in to console.neon.tech and resume it. Also verify your network can reach neon.tech.' },
    }))

    setLastChecked(new Date())
    setChecking(false)
  }, [])

  // initial check
  useEffect(() => { runChecks() }, [runChecks])

  // auto-refresh countdown every 1 s
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { runChecks(); return 30 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [runChecks])

  const allOk = Object.values(status).every(s => s.state === 'ok')

  const services = [
    {
      key: 'frontend',
      icon: '🖥️',
      label: 'Frontend Server',
      ...status.frontend,
    },
    {
      key: 'backend',
      icon: '⚙️',
      label: 'Backend Server',
      ...status.backend,
    },
    {
      key: 'database',
      icon: '🗄️',
      label: 'Neon Database',
      ...status.database,
    },
  ]

  return (
    <>
      <style>{CSS}</style>
      <div className="val-root">
        {/* Header */}
        <div className="val-header">
          <div className="val-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="val-logo-svg">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="val-title">System Health Check</h1>
          <p className="val-subtitle">
            Real-time status of all services powering the <strong>AI Digital LMS</strong>.
          </p>
        </div>

        {/* Overall banner */}
        <div className={`val-banner ${allOk ? 'val-banner--ok' : 'val-banner--warn'}`}>
          {checking
            ? '⏳  Running checks…'
            : allOk
              ? '✅  All systems are operational.'
              : '⚠️  One or more services need attention — see suggestions below.'}
        </div>

        {/* Service cards */}
        <div className="val-cards">
          {services.map(s => (
            <ServiceCard key={s.key} {...s} />
          ))}
        </div>

        {/* Footer actions */}
        <div className="val-footer">
          <p className="val-timestamp">
            {lastChecked
              ? `Last checked: ${lastChecked.toLocaleTimeString()}`
              : 'Checking…'}
            {!checking && <span className="val-countdown"> — auto-refresh in {countdown}s</span>}
          </p>
          <button
            className="val-btn"
            onClick={runChecks}
            disabled={checking}
            id="recheck-btn"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="val-btn-icon">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 4v5h.582m0 0A7.959 7.959 0 0112 4c4.418 0 8 3.582 8 8s-3.582 8-8 8a7.96 7.96 0 01-5.418-2.11M4 9H9" />
            </svg>
            {checking ? 'Checking…' : 'Re-check Now'}
          </button>
        </div>

        {/* Back link */}
        <p className="val-back">
          <a href="/" className="val-back-link">← Back to Home</a>
        </p>
      </div>
    </>
  )
}

// ── styles (scoped) ──────────────────────────────────────────────────────────

const CSS = `
  :root {
    --val-bg: #0d1117;
    --val-surface: rgba(255,255,255,0.04);
    --val-surface-hover: rgba(255,255,255,0.07);
    --val-border: rgba(255,255,255,0.10);
    --val-text: #e6edf3;
    --val-muted: #8b949e;
    --val-green: #3fb950;
    --val-red: #f85149;
    --val-amber: #d29922;
    --val-accent: #7c3aed;
    --val-accent-glow: rgba(124,58,237,0.35);
  }

  .val-root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    background: var(--val-bg);
    background-image:
      radial-gradient(ellipse at 20% 10%, rgba(124,58,237,0.15) 0%, transparent 55%),
      radial-gradient(ellipse at 80% 90%, rgba(63,185,80,0.07) 0%, transparent 50%);
    font-family: 'Inter', system-ui, sans-serif;
    color: var(--val-text);
  }

  /* ── Header ── */
  .val-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  .val-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--val-accent), #a855f7);
    box-shadow: 0 0 24px var(--val-accent-glow);
    margin: 0 auto 1.25rem;
  }
  .val-logo-svg {
    width: 32px;
    height: 32px;
    color: #fff;
  }
  .val-title {
    font-size: 1.875rem;
    font-weight: 700;
    letter-spacing: -0.5px;
    margin: 0 0 0.5rem;
  }
  .val-subtitle {
    color: var(--val-muted);
    font-size: 0.95rem;
    margin: 0;
  }

  /* ── Banner ── */
  .val-banner {
    width: 100%;
    max-width: 640px;
    border-radius: 10px;
    padding: 0.85rem 1.25rem;
    font-size: 0.9rem;
    font-weight: 600;
    text-align: center;
    margin-bottom: 1.75rem;
    border: 1px solid transparent;
  }
  .val-banner--ok {
    background: rgba(63,185,80,0.12);
    border-color: rgba(63,185,80,0.3);
    color: #3fb950;
  }
  .val-banner--warn {
    background: rgba(216,153,34,0.12);
    border-color: rgba(216,153,34,0.3);
    color: #d29922;
  }

  /* ── Cards ── */
  .val-cards {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    max-width: 640px;
  }
  .val-card {
    background: var(--val-surface);
    border: 1px solid var(--val-border);
    border-left-width: 3px;
    border-radius: 12px;
    padding: 1.1rem 1.25rem;
    transition: background 0.2s;
  }
  .val-card:hover {
    background: var(--val-surface-hover);
  }
  .val-card-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .val-card-icon {
    font-size: 1.35rem;
    line-height: 1;
  }
  .val-card-label {
    font-weight: 600;
    font-size: 1rem;
    flex: 1;
  }
  .val-card-detail {
    margin: 0.6rem 0 0;
    font-size: 0.82rem;
    color: var(--val-muted);
    padding-left: calc(1.35rem + 0.75rem);
  }

  /* ── Status icons ── */
  .val-icon {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
  }
  .val-icon--ok  { color: var(--val-green); }
  .val-icon--err { color: var(--val-red); }
  .val-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2.5px solid rgba(255,255,255,0.15);
    border-top-color: var(--val-accent);
    border-radius: 50%;
    animation: val-spin 0.8s linear infinite;
    flex-shrink: 0;
  }
  @keyframes val-spin { to { transform: rotate(360deg); } }

  /* ── Suggestion box ── */
  .val-suggestion {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin-top: 0.75rem;
    padding: 0.7rem 0.9rem;
    background: rgba(248,81,73,0.08);
    border: 1px solid rgba(248,81,73,0.2);
    border-radius: 8px;
    font-size: 0.8rem;
    color: #ffa198;
    line-height: 1.5;
  }
  .val-suggestion-icon {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
    margin-top: 1px;
    color: var(--val-red);
  }

  /* ── Footer ── */
  .val-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.85rem;
    margin-top: 2rem;
    width: 100%;
    max-width: 640px;
  }
  .val-timestamp {
    font-size: 0.8rem;
    color: var(--val-muted);
    margin: 0;
  }
  .val-countdown {
    opacity: 0.7;
  }
  .val-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.4rem;
    background: linear-gradient(135deg, var(--val-accent), #a855f7);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 0 16px var(--val-accent-glow);
    transition: opacity 0.2s, transform 0.15s;
  }
  .val-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .val-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .val-btn-icon {
    width: 16px;
    height: 16px;
  }

  /* ── Back link ── */
  .val-back {
    margin-top: 1.5rem;
    font-size: 0.82rem;
  }
  .val-back-link {
    color: var(--val-muted);
    text-decoration: none;
    transition: color 0.15s;
  }
  .val-back-link:hover { color: var(--val-text); }
`

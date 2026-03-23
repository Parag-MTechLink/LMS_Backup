import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLabManagementAuth } from '../contexts/LabManagementAuthContext'

// ── Constants (dev-only) ─────────────────────────────────────────────────────
const QUICK_EMAIL    = 'parag@millenniumtechlink.com'
const QUICK_PASSWORD = 'Parag@11'
const BYPASS_KEY     = 'mtl-quick-access-2026'
const API_BASE       = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

// ── Helpers ──────────────────────────────────────────────────────────────────
const STORAGE_TOKEN = 'labManagementAccessToken'
const STORAGE_USER  = 'labManagementUser'

async function doQuickLogin() {
  const res = await fetch(`${API_BASE}/api/v1/auth/quick-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: QUICK_EMAIL,
      password: QUICK_PASSWORD,
      bypass_key: BYPASS_KEY,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function QuickAuth() {
  const navigate   = useNavigate()
  const { isAuthenticated, loading } = useLabManagementAuth()
  const attempted  = useRef(false)

  // If already logged in, skip straight to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/lab/management/dashboard', { replace: true })
    }
  }, [loading, isAuthenticated, navigate])

  // Fire quick-login once on mount (avoid double-fire in strict mode)
  useEffect(() => {
    if (loading || isAuthenticated || attempted.current) return
    attempted.current = true

    doQuickLogin()
      .then(data => {
        // Persist token + user exactly like the normal login flow
        localStorage.setItem(STORAGE_TOKEN, data.access_token)
        const u = { ...data.user, name: data.user.full_name }
        localStorage.setItem(STORAGE_USER, JSON.stringify(u))
        // Let the auth context re-read from storage, then hard-redirect
        window.location.replace('/lab/management/dashboard')
      })
      .catch(err => {
        console.error('[QuickAuth] Login failed:', err)
        // Fall back to the normal login page with a hint
        navigate('/login', {
          replace: true,
          state: { quickAuthError: err.message },
        })
      })
  }, [loading, isAuthenticated, navigate])

  return (
    <>
      <style>{CSS}</style>
      <div className="qa-root">
        <div className="qa-card">
          <div className="qa-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="qa-logo-svg">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="qa-title">Quick Access</h1>
          <p className="qa-sub">Signing you in automatically…</p>
          <div className="qa-spinner-wrap">
            <span className="qa-spinner" />
          </div>
          <p className="qa-hint">Bypassing MFA — redirecting to dashboard</p>
        </div>
      </div>
    </>
  )
}

// ── Styles (scoped) ──────────────────────────────────────────────────────────
const CSS = `
  :root {
    --qa-bg: #0d1117;
    --qa-card: rgba(255,255,255,0.04);
    --qa-border: rgba(255,255,255,0.10);
    --qa-accent: #7c3aed;
    --qa-accent-glow: rgba(124,58,237,0.4);
    --qa-text: #e6edf3;
    --qa-muted: #8b949e;
  }

  .qa-root {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--qa-bg);
    background-image:
      radial-gradient(ellipse at 30% 20%, rgba(124,58,237,0.18) 0%, transparent 60%),
      radial-gradient(ellipse at 75% 80%, rgba(99,102,241,0.10) 0%, transparent 55%);
    font-family: 'Inter', system-ui, sans-serif;
    color: var(--qa-text);
    padding: 1.5rem;
  }

  .qa-card {
    background: var(--qa-card);
    border: 1px solid var(--qa-border);
    border-radius: 20px;
    padding: 3rem 2.5rem;
    text-align: center;
    max-width: 380px;
    width: 100%;
    box-shadow: 0 0 60px rgba(124,58,237,0.08);
    animation: qa-fade 0.4s ease;
  }
  @keyframes qa-fade { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

  .qa-logo {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--qa-accent), #a855f7);
    box-shadow: 0 0 28px var(--qa-accent-glow);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
  }
  .qa-logo-svg {
    width: 30px;
    height: 30px;
    color: #fff;
  }

  .qa-title {
    font-size: 1.6rem;
    font-weight: 700;
    letter-spacing: -0.4px;
    margin: 0 0 0.4rem;
  }
  .qa-sub {
    color: var(--qa-muted);
    font-size: 0.9rem;
    margin: 0 0 2rem;
  }

  .qa-spinner-wrap {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
  }
  .qa-spinner {
    display: block;
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255,255,255,0.10);
    border-top-color: var(--qa-accent);
    border-radius: 50%;
    animation: qa-spin 0.8s linear infinite;
  }
  @keyframes qa-spin { to { transform: rotate(360deg); } }

  .qa-hint {
    font-size: 0.75rem;
    color: var(--qa-muted);
    margin: 0;
    opacity: 0.7;
  }
`

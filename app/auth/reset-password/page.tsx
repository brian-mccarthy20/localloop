'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // Supabase exchanges the recovery link for a session automatically when the
  // page loads. Wait for that auth event so updateUser() has something to update.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true)
    })
    // Also check for existing session in case the event already fired.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    return () => { sub.subscription.unsubscribe() }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError('')

    const { error: updateErr } = await supabase.auth.updateUser({ password })
    if (updateErr) {
      setError(updateErr.message || 'Could not update your password. Try the link again.')
      setLoading(false)
      return
    }
    setDone(true)
    setLoading(false)
    setTimeout(() => router.push('/'), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ backgroundColor: '#2d6a4f', padding: '16px 24px' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 700, margin: 0 }}>🌿 Local Loop</h1>
        </a>
      </header>

      <main style={{ maxWidth: '440px', margin: '64px auto', padding: '0 24px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {done ? (
            <>
              <div style={{ fontSize: '36px', marginBottom: '12px', textAlign: 'center' }}>✅</div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111', textAlign: 'center', marginBottom: '8px' }}>
                Password updated
              </h2>
              <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center' }}>
                Redirecting you to Local Loop...
              </p>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111', marginBottom: '8px' }}>Set a new password</h2>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '28px' }}>
                Pick something at least 8 characters. You&apos;ll be signed in once it&apos;s saved.
              </p>

              {error && (
                <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
                  {error}
                </div>
              )}

              {!ready && (
                <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '20px' }}>
                  Verifying your reset link...
                </p>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>New password</label>
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="At least 8 characters"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Confirm password</label>
                  <input
                    type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                    placeholder="Re-enter password"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <button
                  type="submit" disabled={loading || !ready}
                  style={{
                    width: '100%', padding: '12px',
                    backgroundColor: loading || !ready ? '#6b9e87' : '#2d6a4f',
                    color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600,
                    cursor: loading || !ready ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Saving...' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

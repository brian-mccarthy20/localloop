'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/reset-password`
      : undefined

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    })

    if (resetError) {
      setError(resetError.message || 'Could not send reset email. Try again.')
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ backgroundColor: '#2d6a4f', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 700, margin: 0 }}>🌿 Local Loop</h1>
        </a>
        <a href="/auth/login" style={{ color: 'white', fontSize: '14px', textDecoration: 'underline' }}>
          Back to log in
        </a>
      </header>

      <main style={{ maxWidth: '440px', margin: '64px auto', padding: '0 24px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {sent ? (
            <>
              <div style={{ fontSize: '36px', marginBottom: '12px', textAlign: 'center' }}>📬</div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111', marginBottom: '8px', textAlign: 'center' }}>
                Check your email
              </h2>
              <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', lineHeight: 1.6 }}>
                If an account exists for <strong>{email}</strong>, we just sent a link to reset your password. The link expires in an hour.
              </p>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111', marginBottom: '8px' }}>Reset your password</h2>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '28px' }}>
                Enter your email and we&apos;ll send you a link to set a new password.
              </p>

              {error && (
                <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Email</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="jane@example.com"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <button
                  type="submit" disabled={loading || !email.trim()}
                  style={{
                    width: '100%', padding: '12px',
                    backgroundColor: loading || !email.trim() ? '#6b9e87' : '#2d6a4f',
                    color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600,
                    cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

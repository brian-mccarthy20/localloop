'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface PendingUser {
  id: string
  full_name: string
  neighborhood: string
  cross_street: string
  zip_code: string
  verification_photo_url: string | null
  created_at: string
}

export default function AdminPage() {
  const router = useRouter()
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  const checkAdminAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') { router.push('/'); return }

    setIsAdmin(true)
    loadPendingUsers()
  }

  const loadPendingUsers = async () => {
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (fetchError) setError('Failed to load pending users.')
    else setPendingUsers(data || [])
    setLoading(false)
  }

  const handleAction = async (userId: string, action: 'approved' | 'rejected') => {
    setActionLoading(userId)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ status: action })
      .eq('id', userId)

    if (updateError) {
      setError(`Failed to ${action === 'approved' ? 'approve' : 'reject'} user.`)
    } else {
      setPendingUsers(prev => prev.filter(u => u.id !== userId))
      // Fire approval/rejection email (best-effort — won't block UI)
      fetch('/api/send-approval-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      }).catch(() => {/* silent fail if email service is down */})
    }
    setActionLoading(null)
  }

  if (!isAdmin && !loading) return null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ backgroundColor: '#2d6a4f', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 700, margin: 0 }}>🌿 Local Loop</h1>
        </a>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Admin</span>
      </header>

      <main style={{ maxWidth: '800px', margin: '40px auto', padding: '0 24px' }}>
        <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111', marginBottom: '4px' }}>Member Approvals</h2>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              {loading ? 'Loading...' : `${pendingUsers.length} account${pendingUsers.length !== 1 ? 's' : ''} awaiting review`}
            </p>
          </div>
          <button
            onClick={loadPendingUsers}
            style={{ padding: '8px 16px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: '#374151' }}
          >
            Refresh
          </button>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>{error}</div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px', color: '#9ca3af', fontSize: '15px' }}>Loading pending users...</div>
        ) : pendingUsers.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '64px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>All caught up — no pending approvals.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pendingUsers.map(user => (
              <div
                key={user.id}
                style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', gap: '24px', alignItems: 'flex-start' }}
              >
                {/* Verification Photo */}
                <div style={{ flexShrink: 0 }}>
                  {user.verification_photo_url ? (
                    <img
                      src={user.verification_photo_url}
                      alt="Verification"
                      style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                  ) : (
                    <div style={{ width: '96px', height: '96px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', border: '1px solid #e5e7eb' }}>
                      👤
                    </div>
                  )}
                  {!user.verification_photo_url && (
                    <p style={{ fontSize: '10px', color: '#ef4444', textAlign: 'center', marginTop: '4px' }}>No photo</p>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: '6px' }}>{user.full_name}</h3>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>📍 {user.neighborhood}</span>
                    {user.cross_street && <span style={{ fontSize: '13px', color: '#6b7280' }}>🏘 {user.cross_street}</span>}
                    {user.zip_code && <span style={{ fontSize: '13px', color: '#6b7280' }}>📮 {user.zip_code}</span>}
                  </div>
                  <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px' }}>
                    Submitted {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleAction(user.id, 'approved')}
                      disabled={actionLoading === user.id}
                      style={{
                        padding: '8px 20px', backgroundColor: '#2d6a4f', color: 'white',
                        border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                        cursor: actionLoading === user.id ? 'not-allowed' : 'pointer',
                        opacity: actionLoading === user.id ? 0.7 : 1,
                      }}
                    >
                      {actionLoading === user.id ? '...' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => handleAction(user.id, 'rejected')}
                      disabled={actionLoading === user.id}
                      style={{
                        padding: '8px 20px', backgroundColor: 'white', color: '#b91c1c',
                        border: '1px solid #fca5a5', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                        cursor: actionLoading === user.id ? 'not-allowed' : 'pointer',
                        opacity: actionLoading === user.id ? 0.7 : 1,
                      }}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

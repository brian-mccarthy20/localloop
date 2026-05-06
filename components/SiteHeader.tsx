'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface ProfileSummary {
  full_name: string
  status: 'pending' | 'approved' | 'rejected' | string
  role: 'admin' | 'member' | string
}

export default function SiteHeader() {
  const router = useRouter()
  const [loaded, setLoaded] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileSummary | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let active = true

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!active) return

      if (!user) {
        setLoaded(true)
        return
      }

      setUserId(user.id)

      const [{ data: profileData }, { count }] = await Promise.all([
        supabase.from('profiles').select('full_name, status, role').eq('id', user.id).single(),
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_id', user.id)
          .eq('read', false),
      ])

      if (!active) return
      if (profileData) setProfile(profileData as ProfileSummary)
      setUnreadCount(count ?? 0)
      setLoaded(true)
    }

    load()
    return () => { active = false }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isLoggedIn = !!userId
  const isApproved = profile?.status === 'approved'
  const isAdmin = profile?.role === 'admin'
  const firstName = profile?.full_name?.split(' ')[0] || ''

  const linkStyle: React.CSSProperties = {
    color: 'white', fontSize: '14px', textDecoration: 'none', fontWeight: 500,
    padding: '6px 0',
  }

  const ctaPrimary: React.CSSProperties = {
    ...linkStyle,
    backgroundColor: 'white', color: '#2d6a4f',
    padding: '8px 16px', borderRadius: '8px', fontWeight: 600,
  }

  const ctaSecondary: React.CSSProperties = {
    ...linkStyle,
    border: '1px solid rgba(255,255,255,0.4)',
    padding: '8px 16px', borderRadius: '8px',
  }

  return (
    <header style={{
      backgroundColor: '#2d6a4f', padding: '14px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '16px', flexWrap: 'wrap',
    }}>
      <a href="/" style={{ textDecoration: 'none' }}>
        <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>
          🌿 Local Loop
        </h1>
      </a>

      <nav style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <a href="/" style={linkStyle}>Browse</a>

        {/* Always render the right-hand cluster, but only after we know the auth state, to avoid flicker */}
        {!loaded ? (
          <span style={{ ...linkStyle, opacity: 0.5 }}>Loading…</span>
        ) : isLoggedIn ? (
          <>
            {isApproved && <a href="/listings/new" style={linkStyle}>Post</a>}
            {isApproved && (
              <a href="/messages" style={{ ...linkStyle, position: 'relative' }}>
                Messages
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-4px', right: '-14px',
                    backgroundColor: '#fbbf24', color: '#111',
                    borderRadius: '10px', padding: '0 6px',
                    fontSize: '10px', fontWeight: 700, minWidth: '16px', textAlign: 'center',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </a>
            )}
            {isAdmin && <a href="/admin" style={linkStyle}>Admin</a>}
            {firstName && (
              <span style={{ ...linkStyle, opacity: 0.85 }}>Hi, {firstName}</span>
            )}
            <button
              onClick={handleSignOut}
              style={{
                ...linkStyle,
                background: 'transparent', border: '1px solid rgba(255,255,255,0.4)',
                padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <a href="/auth/login" style={ctaSecondary}>Log in</a>
            <a href="/auth/signup" style={ctaPrimary}>Join Local Loop</a>
          </>
        )}
      </nav>
    </header>
  )
}

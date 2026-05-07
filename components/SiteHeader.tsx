'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useIsMobile } from '@/lib/useIsMobile'

interface ProfileSummary {
  full_name: string
  status: 'pending' | 'approved' | 'rejected' | string
  role: 'admin' | 'member' | string
  neighborhood: string | null
  zip_code: string | null
}

export default function SiteHeader() {
  const isMobile = useIsMobile()
  const [loaded, setLoaded] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileSummary | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

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
        supabase.from('profiles').select('full_name, status, role, neighborhood, zip_code').eq('id', user.id).single(),
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

  // Close the mobile menu whenever we cross the breakpoint
  useEffect(() => {
    if (!isMobile) setMenuOpen(false)
  }, [isMobile])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    if (typeof window !== 'undefined') window.location.href = '/'
  }

  const isLoggedIn = !!userId
  const isApproved = profile?.status === 'approved'
  const isAdmin = profile?.role === 'admin'
  const firstName = profile?.full_name?.split(' ')[0] || ''
  // Approved members whose profile is missing critical fields see a prompt
  // to finish setting up. We treat full_name (or its email-prefix placeholder),
  // neighborhood, and zip_code as the minimum required to participate.
  const needsProfile =
    isApproved &&
    (!profile?.neighborhood ||
      !profile?.zip_code ||
      !profile?.full_name ||
      /^[a-z0-9_.+-]+$/i.test(profile.full_name)) // raw email-local-part = unset

  const linkStyle: React.CSSProperties = {
    color: 'white', fontSize: '14px', textDecoration: 'none', fontWeight: 500,
    padding: isMobile ? '12px 0' : '6px 0',
    display: isMobile ? 'block' : 'inline-block',
  }

  const ctaPrimary: React.CSSProperties = {
    ...linkStyle,
    backgroundColor: 'white', color: '#2d6a4f',
    padding: isMobile ? '12px 16px' : '8px 16px', borderRadius: '8px', fontWeight: 600,
    textAlign: 'center',
  }

  const ctaSecondary: React.CSSProperties = {
    ...linkStyle,
    border: '1px solid rgba(255,255,255,0.4)',
    padding: isMobile ? '12px 16px' : '8px 16px', borderRadius: '8px',
    textAlign: 'center',
  }

  const renderNav = () => (
    <>
      <a href="/" style={linkStyle} onClick={() => setMenuOpen(false)}>Browse</a>

      {!loaded ? (
        <span style={{ ...linkStyle, opacity: 0.5 }}>Loading…</span>
      ) : isLoggedIn ? (
        <>
          {isApproved && <a href="/listings/new" style={linkStyle} onClick={() => setMenuOpen(false)}>Post</a>}
          {isApproved && <a href="/me/listings" style={linkStyle} onClick={() => setMenuOpen(false)}>My Listings</a>}
          {isApproved && (
            <a href="/messages" style={{ ...linkStyle, position: 'relative' }} onClick={() => setMenuOpen(false)}>
              Messages
              {unreadCount > 0 && (
                <span style={{
                  display: 'inline-block', marginLeft: '6px',
                  backgroundColor: '#fbbf24', color: '#111',
                  borderRadius: '10px', padding: '0 6px',
                  fontSize: '10px', fontWeight: 700, minWidth: '16px', textAlign: 'center',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </a>
          )}
          {isAdmin && <a href="/admin" style={linkStyle} onClick={() => setMenuOpen(false)}>Admin</a>}
          {firstName && (
            <span style={{ ...linkStyle, opacity: 0.85 }}>Hi, {firstName}</span>
          )}
          <button
            onClick={handleSignOut}
            style={{
              ...linkStyle,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.4)',
              padding: isMobile ? '12px 16px' : '6px 14px',
              borderRadius: '8px', cursor: 'pointer',
              width: isMobile ? '100%' : 'auto',
            }}
          >
            Log out
          </button>
        </>
      ) : (
        <>
          <a href="/auth/login" style={ctaSecondary} onClick={() => setMenuOpen(false)}>Log in</a>
          <a href="/auth/signup" style={ctaPrimary} onClick={() => setMenuOpen(false)}>Join Local Loop</a>
        </>
      )}
    </>
  )

  return (
    <>
    <header style={{
      backgroundColor: '#2d6a4f', padding: isMobile ? '14px 16px' : '14px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '16px', flexWrap: 'wrap', position: 'relative',
    }}>
      <a href="/" style={{ textDecoration: 'none' }}>
        <h1 style={{ color: 'white', fontSize: isMobile ? '19px' : '22px', fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>
          🌿 Local Loop
        </h1>
      </a>

      {isMobile ? (
        <>
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
            style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: '8px', color: 'white', padding: '8px 12px',
              fontSize: '16px', cursor: 'pointer', lineHeight: 1,
            }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>

          {menuOpen && (
            <nav style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              backgroundColor: '#2d6a4f', padding: '8px 16px 16px',
              display: 'flex', flexDirection: 'column', gap: '4px',
              borderTop: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 50,
            }}>
              {renderNav()}
            </nav>
          )}
        </>
      ) : (
        <nav style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {renderNav()}
        </nav>
      )}
    </header>

    {needsProfile && (
      <div style={{
        backgroundColor: '#fef3c7',
        borderBottom: '1px solid #fcd34d',
        padding: isMobile ? '12px 16px' : '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '12px', flexWrap: 'wrap',
      }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#854d0e', lineHeight: 1.5 }}>
          <strong>Welcome!</strong> Finish setting up your profile so neighbors know who they&apos;re dealing with.
        </p>
        <a
          href="/me/profile?complete=1"
          style={{
            padding: '7px 14px', backgroundColor: '#2d6a4f', color: 'white',
            borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Complete profile →
        </a>
      </div>
    )}
    </>
  )
}

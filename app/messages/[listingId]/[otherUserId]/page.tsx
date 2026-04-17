'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  body: string
  created_at: string
  read: boolean
  sender_id: string
  recipient_id: string
  listing_id: string
}

interface ListingSummary {
  id: string
  title: string
  price: number
  is_free: boolean
  user_id: string
  listing_photos: { photo_url: string; sort_order: number }[]
}

interface OtherProfile {
  id: string
  full_name: string
}

export default function ThreadPage() {
  const router = useRouter()
  const params = useParams()
  const listingId = params?.listingId as string
  const otherUserId = params?.otherUserId as string

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [listing, setListing] = useState<ListingSummary | null>(null)
  const [otherProfile, setOtherProfile] = useState<OtherProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadThread()
  }, [listingId, otherUserId])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const loadThread = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    setCurrentUserId(user.id)

    // Pull all messages on this listing between me and the other party
    const { data: msgs, error: msgErr } = await supabase
      .from('messages')
      .select('*')
      .eq('listing_id', listingId)
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),` +
        `and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true })

    if (msgErr) {
      setError('Failed to load conversation.')
      setLoading(false)
      return
    }

    setMessages(msgs || [])

    // Mark any unread messages TO me as read
    const unreadIds = (msgs || [])
      .filter(m => m.recipient_id === user.id && !m.read)
      .map(m => m.id)
    if (unreadIds.length > 0) {
      await supabase.from('messages').update({ read: true }).in('id', unreadIds)
    }

    // Load the listing for the header (title, photo, price)
    const { data: listingData } = await supabase
      .from('listings')
      .select('id, title, price, is_free, user_id, listing_photos (photo_url, sort_order)')
      .eq('id', listingId)
      .single()

    if (listingData) {
      setListing({
        ...listingData,
        listing_photos: (listingData.listing_photos || []).sort(
          (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
        ),
      })
    }

    // Load the other party's profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', otherUserId)
      .single()

    if (profileData) setOtherProfile(profileData)

    setLoading(false)
  }

  const handleSend = async () => {
    const body = reply.trim()
    if (!body || !currentUserId) return

    setSending(true)
    setError('')

    const { data, error: insertErr } = await supabase
      .from('messages')
      .insert({
        listing_id: listingId,
        sender_id: currentUserId,
        recipient_id: otherUserId,
        body,
      })
      .select()
      .single()

    if (insertErr || !data) {
      setError('Failed to send. Please try again.')
    } else {
      setMessages(prev => [...prev, data as Message])
      setReply('')
    }
    setSending(false)
  }

  const coverPhoto = listing?.listing_photos?.[0]?.photo_url
  const priceDisplay = listing ? (listing.is_free ? 'Free' : `$${Number(listing.price).toFixed(2)}`) : ''

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ backgroundColor: '#2d6a4f', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 700, margin: 0 }}>🌿 Local Loop</h1>
        </a>
        <a href="/messages" style={{ color: 'white', fontSize: '14px', textDecoration: 'underline' }}>← Back to messages</a>
      </header>

      <main style={{ maxWidth: '680px', margin: '32px auto', padding: '0 24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>Loading conversation...</div>
        ) : (
          <>
            {/* Listing header */}
            {listing && (
              <div
                onClick={() => router.push(`/listings/${listing.id}`)}
                style={{
                  backgroundColor: 'white', borderRadius: '12px', padding: '14px 16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', gap: '14px', alignItems: 'center',
                  marginBottom: '16px', cursor: 'pointer',
                }}
              >
                <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#e5e7eb', flexShrink: 0 }}>
                  {coverPhoto ? (
                    <img src={coverPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📦</div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                    {otherProfile?.full_name ? `Conversation with ${otherProfile.full_name}` : 'Conversation'}
                  </p>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#111', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {listing.title}
                  </p>
                  <p style={{ fontSize: '13px', color: '#2d6a4f', fontWeight: 600 }}>{priceDisplay}</p>
                </div>
              </div>
            )}

            {/* Messages */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '16px', minHeight: '240px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: '14px' }}>
                  No messages yet.
                </div>
              ) : (
                messages.map(m => {
                  const mine = m.sender_id === currentUserId
                  return (
                    <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '75%' }}>
                        <div style={{
                          backgroundColor: mine ? '#2d6a4f' : '#f3f4f6',
                          color: mine ? 'white' : '#111',
                          padding: '10px 14px', borderRadius: '16px',
                          borderBottomRightRadius: mine ? '4px' : '16px',
                          borderBottomLeftRadius: mine ? '16px' : '4px',
                          fontSize: '14px', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        }}>
                          {m.body}
                        </div>
                        <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px', textAlign: mine ? 'right' : 'left' }}>
                          {new Date(m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Reply form */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                rows={3}
                placeholder="Write a reply..."
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical', marginBottom: '10px', fontFamily: 'inherit' }}
              />
              {error && (
                <p style={{ fontSize: '13px', color: '#b91c1c', marginBottom: '8px' }}>{error}</p>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '11px', color: '#9ca3af' }}>⌘/Ctrl + Enter to send</p>
                <button
                  onClick={handleSend}
                  disabled={sending || !reply.trim()}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: sending || !reply.trim() ? '#6b9e87' : '#2d6a4f',
                    color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                    cursor: sending || !reply.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

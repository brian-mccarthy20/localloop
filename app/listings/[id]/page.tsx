'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Listing {
  id: string
  title: string
  description: string
  price: number
  is_free: boolean
  category: string
  size: string
  condition: string
  gender: string
  neighborhood: string
  created_at: string
  user_id: string
  profiles: {
    full_name: string
    neighborhood: string
  }
  listing_photos: {
    photo_url: string
    sort_order: number
  }[]
}

export default function ListingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [activePhoto, setActivePhoto] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [messageSent, setMessageSent] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messageError, setMessageError] = useState('')

  useEffect(() => {
    loadListing()
    loadCurrentUser()
  }, [id])

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id ?? null)
  }

  const loadListing = async () => {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        profiles (full_name, neighborhood),
        listing_photos (photo_url, sort_order)
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      router.push('/')
      return
    }

    const sorted = {
      ...data,
      listing_photos: (data.listing_photos || []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
      ),
    }
    setListing(sorted)
    setLoading(false)
  }

  const handleSendMessage = async () => {
    if (!messageText.trim()) return
    if (!currentUserId) { router.push('/auth/login'); return }

    setSendingMessage(true)
    setMessageError('')

    const { error } = await supabase.from('messages').insert({
      listing_id: listing!.id,
      sender_id: currentUserId,
      recipient_id: listing!.user_id,
      body: messageText.trim(),
    })

    if (error) {
      setMessageError('Failed to send message. Please try again.')
    } else {
      setMessageSent(true)
      setMessageText('')
    }
    setSendingMessage(false)
  }

  const isOwner = currentUserId === listing?.user_id

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <p style={{ color: '#9ca3af' }}>Loading listing...</p>
      </div>
    )
  }

  if (!listing) return null

  const photos = listing.listing_photos
  const priceDisplay = listing.is_free ? 'Free' : `$${Number(listing.price).toFixed(2)}`

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ backgroundColor: '#2d6a4f', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 700, margin: 0 }}>🌿 Local Loop</h1>
        </a>
        <a href="/" style={{ color: 'white', fontSize: '14px', textDecoration: 'underline' }}>← Back to listings</a>
      </header>

      <main style={{ maxWidth: '900px', margin: '40px auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>

          {/* Photo Gallery */}
          <div>
            <div style={{ borderRadius: '12px', overflow: 'hidden', backgroundColor: '#e5e7eb', aspectRatio: '1', marginBottom: '12px' }}>
              {photos.length > 0 ? (
                <img
                  src={photos[activePhoto]?.photo_url}
                  alt={listing.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
                  📦
                </div>
              )}
            </div>
            {photos.length > 1 && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {photos.map((photo, i) => (
                  <div
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    style={{
                      width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer',
                      border: activePhoto === i ? '2px solid #2d6a4f' : '2px solid transparent', flexShrink: 0,
                    }}
                  >
                    <img src={photo.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Listing Info */}
          <div>
            <div style={{ marginBottom: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {listing.category && (
                <span style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                  {listing.category}
                </span>
              )}
              {listing.condition && (
                <span style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                  {listing.condition}
                </span>
              )}
            </div>

            <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#111', marginBottom: '8px', lineHeight: 1.2 }}>
              {listing.title}
            </h2>

            <p style={{ fontSize: '28px', fontWeight: 700, color: listing.is_free ? '#2d6a4f' : '#111', marginBottom: '20px' }}>
              {priceDisplay}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {listing.size && listing.size !== 'N/A' && (
                <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px' }}>
                  <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Size</p>
                  <p style={{ fontSize: '14px', color: '#111', fontWeight: 600 }}>{listing.size}</p>
                </div>
              )}
              {listing.gender && (
                <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px' }}>
                  <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Gender</p>
                  <p style={{ fontSize: '14px', color: '#111', fontWeight: 600 }}>{listing.gender}</p>
                </div>
              )}
              <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px' }}>
                <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Location</p>
                <p style={{ fontSize: '14px', color: '#111', fontWeight: 600 }}>{listing.neighborhood}</p>
              </div>
              <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px' }}>
                <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Posted by</p>
                <p style={{ fontSize: '14px', color: '#111', fontWeight: 600 }}>{listing.profiles?.full_name ?? 'Local seller'}</p>
              </div>
            </div>

            {listing.description && (
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '13px', color: '#6b7280', fontWeight: 600, marginBottom: '6px' }}>Description</p>
                <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{listing.description}</p>
              </div>
            )}

            {/* Message / Owner Actions */}
            {isOwner ? (
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px', fontSize: '14px', color: '#166534' }}>
                This is your listing.
              </div>
            ) : (
              <div>
                {messageSent ? (
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>✉️</div>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: '#166534', margin: 0 }}>Message sent!</p>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>The seller will get back to you soon.</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '13px', color: '#6b7280', fontWeight: 600, marginBottom: '8px' }}>Message the seller</p>
                    <textarea
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      rows={3}
                      placeholder="Hi! Is this still available?"
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical', marginBottom: '10px' }}
                    />
                    {messageError && (
                      <p style={{ fontSize: '13px', color: '#b91c1c', marginBottom: '8px' }}>{messageError}</p>
                    )}
                    <button
                      onClick={handleSendMessage}
                      disabled={sendingMessage || !messageText.trim()}
                      style={{
                        width: '100%', padding: '12px',
                        backgroundColor: sendingMessage || !messageText.trim() ? '#6b9e87' : '#2d6a4f',
                        color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600,
                        cursor: sendingMessage || !messageText.trim() ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {sendingMessage ? 'Sending...' : 'Send Message'}
                    </button>
                    {!currentUserId && (
                      <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginTop: '8px' }}>
                        <a href="/auth/login" style={{ color: '#2d6a4f' }}>Log in</a> to message the seller
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <p style={{ fontSize: '12px', color: '#d1d5db', marginTop: '20px', textAlign: 'center' }}>
              Posted {new Date(listing.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

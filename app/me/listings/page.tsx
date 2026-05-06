'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import SiteHeader from '@/components/SiteHeader'

interface MyListing {
  id: string
  title: string
  price: number
  is_free: boolean
  is_sold: boolean
  category: string | null
  size: string | null
  neighborhood: string | null
  created_at: string
  listing_photos: { photo_url: string; sort_order: number }[]
}

export default function MyListingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState<MyListing[]>([])
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single()
    if (!profile || profile.status !== 'approved') {
      router.push('/auth/pending')
      return
    }

    const { data, error: fetchError } = await supabase
      .from('listings')
      .select('id, title, price, is_free, is_sold, category, size, neighborhood, created_at, listing_photos(photo_url, sort_order)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError('Could not load your listings.')
      setLoading(false)
      return
    }

    const sorted = (data || []).map(l => ({
      ...l,
      listing_photos: (l.listing_photos || []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
      ),
    })) as MyListing[]
    setListings(sorted)
    setLoading(false)
  }

  const toggleSold = async (id: string, current: boolean) => {
    setActionId(id)
    const { error: updateError } = await supabase
      .from('listings')
      .update({ is_sold: !current, sold_at: !current ? new Date().toISOString() : null })
      .eq('id', id)
    if (updateError) {
      setError('Could not update listing.')
    } else {
      setListings(prev => prev.map(l => l.id === id ? { ...l, is_sold: !current } : l))
    }
    setActionId(null)
  }

  const deleteListing = async (id: string) => {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    setActionId(id)
    // Delete photos first (FK constraint), then the listing
    await supabase.from('listing_photos').delete().eq('listing_id', id)
    const { error: deleteError } = await supabase.from('listings').delete().eq('id', id)
    if (deleteError) {
      setError('Could not delete listing.')
      setActionId(null)
      return
    }
    setListings(prev => prev.filter(l => l.id !== id))
    setActionId(null)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <SiteHeader />

      <main style={{ maxWidth: '900px', margin: '40px auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111', marginBottom: '4px' }}>My Listings</h2>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              {loading ? 'Loading...' : `${listings.length} listing${listings.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <a
            href="/listings/new"
            style={{
              padding: '10px 18px', backgroundColor: '#2d6a4f', color: 'white',
              borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none',
            }}
          >
            + Post a new listing
          </a>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>{error}</div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px', color: '#9ca3af' }}>Loading...</div>
        ) : listings.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '64px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
            <p style={{ color: '#6b7280', fontSize: '15px', marginBottom: '20px' }}>You haven&apos;t posted anything yet.</p>
            <a
              href="/listings/new"
              style={{ padding: '10px 24px', backgroundColor: '#2d6a4f', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}
            >
              Post your first listing
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {listings.map(l => {
              const cover = l.listing_photos?.[0]?.photo_url
              const priceLabel = l.is_free ? 'Free' : `$${Number(l.price).toFixed(0)}`
              return (
                <div
                  key={l.id}
                  style={{
                    backgroundColor: 'white', borderRadius: '12px', padding: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    display: 'flex', gap: '16px', alignItems: 'center',
                    opacity: l.is_sold ? 0.7 : 1,
                  }}
                >
                  <a
                    href={`/listings/${l.id}`}
                    style={{ flexShrink: 0, width: '88px', height: '88px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#e5e7eb', display: 'block' }}
                  >
                    {cover ? (
                      <img src={cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>📦</div>
                    )}
                  </a>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                      <a
                        href={`/listings/${l.id}`}
                        style={{ fontSize: '15px', fontWeight: 700, color: '#111', textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {l.title}
                      </a>
                      {l.is_sold && (
                        <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '12px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Sold
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      <span style={{ color: '#2d6a4f', fontWeight: 600 }}>{priceLabel}</span>
                      {l.category && <span> · {l.category}</span>}
                      {l.size && l.size !== 'N/A' && <span> · Size {l.size}</span>}
                    </div>
                    <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                      Posted {new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <a
                      href={`/listings/${l.id}/edit`}
                      style={{ padding: '8px 14px', backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}
                    >
                      Edit
                    </a>
                    <button
                      onClick={() => toggleSold(l.id, l.is_sold)}
                      disabled={actionId === l.id}
                      style={{
                        padding: '8px 14px', backgroundColor: l.is_sold ? '#fbbf24' : '#2d6a4f',
                        color: l.is_sold ? '#111' : 'white',
                        border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                        cursor: actionId === l.id ? 'wait' : 'pointer',
                      }}
                    >
                      {l.is_sold ? 'Mark available' : 'Mark sold'}
                    </button>
                    <button
                      onClick={() => deleteListing(l.id)}
                      disabled={actionId === l.id}
                      style={{
                        padding: '8px 14px', backgroundColor: 'white', color: '#b91c1c',
                        border: '1px solid #fca5a5', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                        cursor: actionId === l.id ? 'wait' : 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

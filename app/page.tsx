'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Search, MapPin, Tag, Shirt, Bike, BookOpen, Baby } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const NEIGHBORHOODS = [
  'All Neighborhoods',
  'Hoboken',
  'Jersey City - Downtown',
  'Jersey City - Journal Square',
  'Jersey City - Heights',
  'Jersey City - Bergen-Lafayette',
  'Jersey City - Greenville',
]

const CATEGORIES = [
  { label: 'All', value: 'all', icon: Tag },
  { label: 'Clothing', value: 'clothing', icon: Shirt },
  { label: 'Shoes', value: 'shoes', icon: Baby },
  { label: 'Gear', value: 'gear', icon: Bike },
  { label: 'Toys & Books', value: 'toys', icon: BookOpen },
]

const SIZES = ['All Sizes', 'Newborn', '0-3M', '3-6M', '6-12M', '12-18M', '18-24M', '2T', '3T', '4T', '5T', '6', '7', '8', '10', '12', '14', '16']
const CONDITIONS = ['All Conditions', 'New', 'Like New', 'Good', 'Fair']
const GENDERS = ['All', 'Boy', 'Girl', 'Unisex']

export default function Home() {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [neighborhood, setNeighborhood] = useState('All Neighborhoods')
  const [size, setSize] = useState('All Sizes')
  const [condition, setCondition] = useState('All Conditions')
  const [gender, setGender] = useState('All')
  const [listingType, setListingType] = useState('all')

  useEffect(() => {
    fetchListings()
  }, [category, neighborhood, size, condition, gender, listingType])

  async function fetchListings() {
    setLoading(true)
    let query = supabase
      .from('listings')
      .select(`*, listing_photos(*), profiles(full_name, neighborhood)`)
      .eq('is_available', true)
      .order('created_at', { ascending: false })

    if (category !== 'all') query = query.eq('category', category)
    if (neighborhood !== 'All Neighborhoods') query = query.eq('neighborhood', neighborhood)
    if (size !== 'All Sizes') query = query.eq('size', size)
    if (condition !== 'All Conditions') query = query.eq('condition', condition.toLowerCase().replace(' ', '_'))
    if (gender !== 'All') query = query.eq('gender', gender.toLowerCase())
    if (listingType !== 'all') query = query.eq('listing_type', listingType)

    const { data } = await query
    setListings(data || [])
    setLoading(false)
  }

  const filtered = listings.filter(l =>
    l.title?.toLowerCase().includes(search.toLowerCase()) ||
    l.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f7f4', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <header style={{ backgroundColor: '#fff', borderBottom: '1px solid #e8e0d8', padding: '0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#2d6a4f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 16 }}>↻</span>
            </div>
            <span style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.3px' }}>Local Loop</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <a href="/auth/login" style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d4c9be', backgroundColor: '#fff', color: '#1a1a1a', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Log in</a>
            <a href="/auth/signup" style={{ padding: '8px 16px', borderRadius: 8, backgroundColor: '#2d6a4f', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Join Local Loop</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div style={{ backgroundColor: '#2d6a4f', padding: '48px 24px', textAlign: 'center' }}>
        <h1 style={{ color: '#fff', fontSize: 36, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
          Kids' stuff, passed forward.
        </h1>
        <p style={{ color: '#b7e4c7', fontSize: 18, margin: '0 0 32px' }}>
          Free & affordable kids' clothing, shoes, and gear — right here in Hoboken & Jersey City.
        </p>
        <div style={{ maxWidth: 560, margin: '0 auto', position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#888', width: 18, height: 18 }} />
          <input
            type="text"
            placeholder="Search listings..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 12, border: 'none', fontSize: 16, boxSizing: 'border-box', outline: 'none' }}
          />
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              style={{
                padding: '8px 16px', borderRadius: 99, border: '1px solid', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                backgroundColor: category === cat.value ? '#2d6a4f' : '#fff',
                borderColor: category === cat.value ? '#2d6a4f' : '#d4c9be',
                color: category === cat.value ? '#fff' : '#555'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 32 }}>

          {/* Filters sidebar */}
          <div>
            <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e8e0d8', padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>Filters</h3>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 6 }}>Neighborhood</label>
                <select value={neighborhood} onChange={e => setNeighborhood(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d4c9be', fontSize: 13, backgroundColor: '#fff' }}>
                  {NEIGHBORHOODS.map(n => <option key={n}>{n}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 6 }}>Size</label>
                <select value={size} onChange={e => setSize(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d4c9be', fontSize: 13, backgroundColor: '#fff' }}>
                  {SIZES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 6 }}>Condition</label>
                <select value={condition} onChange={e => setCondition(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d4c9be', fontSize: 13, backgroundColor: '#fff' }}>
                  {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 6 }}>Gender</label>
                <select value={gender} onChange={e => setGender(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d4c9be', fontSize: 13, backgroundColor: '#fff' }}>
                  {GENDERS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 6 }}>Listing type</label>
                <select value={listingType} onChange={e => setListingType(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d4c9be', fontSize: 13, backgroundColor: '#fff' }}>
                  <option value="all">All</option>
                  <option value="free">Free only</option>
                  <option value="for_sale">For sale</option>
                </select>
              </div>
            </div>
          </div>

          {/* Listings grid */}
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 80, color: '#888' }}>Loading listings...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 80 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>👕</div>
                <h3 style={{ color: '#1a1a1a', marginBottom: 8 }}>No listings yet</h3>
                <p style={{ color: '#888', marginBottom: 24 }}>Be the first to post something in your neighborhood.</p>
                <a href="/auth/signup" style={{ padding: '12px 24px', borderRadius: 8, backgroundColor: '#2d6a4f', color: '#fff', textDecoration: 'none', fontWeight: 500 }}>
                  Join & Post a Listing
                </a>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {filtered.map(listing => (
                  <a key={listing.id} href={`/listings/${listing.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e8e0d8', overflow: 'hidden', transition: 'transform 0.15s', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                      <div style={{ aspectRatio: '4/3', backgroundColor: '#f0ebe4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {listing.listing_photos?.[0] ? (
                          <img src={listing.listing_photos[0].photo_url} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: 40 }}>👕</span>
                        )}
                      </div>
                      <div style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.3 }}>{listing.title}</h4>
                          <span style={{
                            fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 99, marginLeft: 8, whiteSpace: 'nowrap',
                            backgroundColor: listing.listing_type === 'free' ? '#d8f3dc' : '#fff3cd',
                            color: listing.listing_type === 'free' ? '#2d6a4f' : '#856404'
                          }}>
                            {listing.listing_type === 'free' ? 'Free' : `$${listing.price}`}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                          {listing.size && <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, backgroundColor: '#f0ebe4', color: '#666' }}>Size {listing.size}</span>}
                          {listing.condition && <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, backgroundColor: '#f0ebe4', color: '#666' }}>{listing.condition.replace('_', ' ')}</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                          <MapPin style={{ width: 11, height: 11, color: '#999' }} />
                          <span style={{ fontSize: 11, color: '#999' }}>{listing.neighborhood}</span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
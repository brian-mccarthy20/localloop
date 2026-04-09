'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const CATEGORIES = ['Clothing', 'Shoes', 'Gear', 'Toys & Books']
const SIZES = ['Newborn', '0-3M', '3-6M', '6-9M', '9-12M', '12-18M', '18-24M', '2T', '3T', '4T', '5T', 'Size 4', 'Size 5', 'Size 6', 'Size 7', 'Size 8', 'Size 10', 'Size 12', 'Size 14', 'Size 16', 'N/A']
const CONDITIONS = ['New with tags', 'Like new', 'Good', 'Fair']
const GENDERS = ['Boy', 'Girl', 'Unisex']
const NEIGHBORHOODS = [
  'Hoboken - Downtown', 'Hoboken - Uptown', 'Hoboken - Midtown',
  'Jersey City - Downtown / Newport', 'Jersey City - Heights',
  'Jersey City - Journal Square', 'Jersey City - Bergen-Lafayette',
  'Jersey City - Greenville', 'Jersey City - West Side',
]
const MAX_PHOTOS = 5

export default function NewListingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  // Gate: only approved members can post
  useEffect(() => {
    const checkAccess = async () => {
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
      setChecking(false)
    }
    checkAccess()
  }, [router])

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <p style={{ color: '#9ca3af' }}>Checking your account...</p>
      </div>
    )
  }
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    isFree: false,
    category: '',
    size: '',
    condition: '',
    gender: '',
    neighborhood: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value })
  }

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const toAdd = files.slice(0, MAX_PHOTOS - photos.length)
    toAdd.forEach(file => {
      const reader = new FileReader()
      reader.onload = () => setPhotoPreviews(prev => [...prev, reader.result as string])
      reader.readAsDataURL(file)
    })
    setPhotos(prev => [...prev, ...toAdd])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (photos.length === 0) { setError('Please add at least one photo.'); return }
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert({
          user_id: user.id,
          title: form.title,
          description: form.description,
          price: form.isFree ? 0 : parseFloat(form.price) || 0,
          is_free: form.isFree,
          category: form.category,
          size: form.size,
          condition: form.condition,
          gender: form.gender,
          neighborhood: form.neighborhood,
        })
        .select()
        .single()

      if (listingError) throw listingError

      await Promise.all(
        photos.map(async (photo, index) => {
          const ext = photo.name.split('.').pop()
          const path = `listings/${listing.id}/${index}.${ext}`
          const { error: uploadError } = await supabase.storage.from('listing-photos').upload(path, photo)
          if (uploadError) throw uploadError
          const { data: urlData } = supabase.storage.from('listing-photos').getPublicUrl(path)
          await supabase.from('listing_photos').insert({ listing_id: listing.id, photo_url: urlData.publicUrl, sort_order: index })
        })
      )

      router.push(`/listings/${listing.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ backgroundColor: '#2d6a4f', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 700, margin: 0 }}>🌿 Local Loop</h1>
        </a>
        <a href="/" style={{ color: 'white', fontSize: '14px', textDecoration: 'underline' }}>← Back to listings</a>
      </header>

      <main style={{ maxWidth: '640px', margin: '40px auto', padding: '0 24px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111', marginBottom: '8px' }}>Post a Listing</h2>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '32px' }}>Help another local family find exactly what they need.</p>

          {error && (
            <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Photos */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                  Photos ({photos.length}/{MAX_PHOTOS}) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                  {photoPreviews.map((preview, i) => (
                    <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden' }}>
                      <img src={preview} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button" onClick={() => removePhoto(i)}
                        style={{ position: 'absolute', top: '4px', right: '4px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >×</button>
                    </div>
                  ))}
                  {photos.length < MAX_PHOTOS && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{ aspectRatio: '1', borderRadius: '8px', border: '2px dashed #d1d5db', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#f9fafb' }}
                    >
                      <span style={{ fontSize: '22px' }}>+</span>
                      <span style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>Add</span>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoAdd} style={{ display: 'none' }} />
                <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>Up to 5 photos. First photo will be the cover image.</p>
              </div>

              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Title <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text" name="title" value={form.title} onChange={handleChange} required
                  placeholder="e.g. Gap toddler jeans, size 2T"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Description</label>
                <textarea
                  name="description" value={form.description} onChange={handleChange} rows={3}
                  placeholder="Any details about the item — brand, fit, why you're selling, etc."
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              {/* Price */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Price</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                    <input type="checkbox" name="isFree" checked={form.isFree} onChange={handleChange} />
                    This item is free
                  </label>
                  {!form.isFree && (
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontSize: '14px' }}>$</span>
                      <input
                        type="number" name="price" value={form.price} onChange={handleChange}
                        min="0" step="0.50" placeholder="0.00"
                        style={{ width: '100%', padding: '10px 14px 10px 28px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Category + Size */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Category <span style={{ color: '#ef4444' }}>*</span></label>
                  <select name="category" value={form.category} onChange={handleChange} required
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', backgroundColor: 'white', boxSizing: 'border-box' }}>
                    <option value="">Select</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Size <span style={{ color: '#ef4444' }}>*</span></label>
                  <select name="size" value={form.size} onChange={handleChange} required
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', backgroundColor: 'white', boxSizing: 'border-box' }}>
                    <option value="">Select</option>
                    {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Condition + Gender */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Condition <span style={{ color: '#ef4444' }}>*</span></label>
                  <select name="condition" value={form.condition} onChange={handleChange} required
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', backgroundColor: 'white', boxSizing: 'border-box' }}>
                    <option value="">Select</option>
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Gender</label>
                  <select name="gender" value={form.gender} onChange={handleChange}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', backgroundColor: 'white', boxSizing: 'border-box' }}>
                    <option value="">Select</option>
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              {/* Neighborhood */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Your Neighborhood <span style={{ color: '#ef4444' }}>*</span></label>
                <select name="neighborhood" value={form.neighborhood} onChange={handleChange} required
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', backgroundColor: 'white', boxSizing: 'border-box' }}>
                  <option value="">Select neighborhood</option>
                  {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '13px',
                  backgroundColor: loading ? '#6b9e87' : '#2d6a4f',
                  color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Publishing listing...' : 'Post Listing'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

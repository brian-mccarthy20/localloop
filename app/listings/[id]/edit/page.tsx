'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import SiteHeader from '@/components/SiteHeader'

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

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
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

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: listing, error: fetchError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !listing) {
        router.push('/me/listings')
        return
      }

      // Only the owner can edit
      if (listing.user_id !== user.id) {
        router.push(`/listings/${id}`)
        return
      }

      setForm({
        title: listing.title || '',
        description: listing.description || '',
        price: listing.price ? String(listing.price) : '',
        isFree: !!listing.is_free,
        category: listing.category || '',
        size: listing.size || '',
        condition: listing.condition || '',
        gender: listing.gender || '',
        neighborhood: listing.neighborhood || '',
      })
      setLoading(false)
    }
    load()
  }, [id, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('listings')
      .update({
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
      .eq('id', id)

    if (updateError) {
      setError(updateError.message || 'Could not save changes.')
      setSaving(false)
      return
    }
    router.push(`/listings/${id}`)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <SiteHeader />
        <div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <SiteHeader />

      <main style={{ maxWidth: '640px', margin: '40px auto', padding: '0 24px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111', marginBottom: '8px' }}>Edit Listing</h2>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '32px' }}>
            Update the details below. Need to change photos? Delete this listing and re-post.
          </p>

          {error && (
            <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Title</label>
                <input
                  type="text" name="title" value={form.title} onChange={handleChange} required
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Description</label>
                <textarea
                  name="description" value={form.description} onChange={handleChange} rows={3}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Category</label>
                  <select name="category" value={form.category} onChange={handleChange} required
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', backgroundColor: 'white', boxSizing: 'border-box' }}>
                    <option value="">Select</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Size</label>
                  <select name="size" value={form.size} onChange={handleChange} required
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', backgroundColor: 'white', boxSizing: 'border-box' }}>
                    <option value="">Select</option>
                    {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Condition</label>
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

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Neighborhood</label>
                <select name="neighborhood" value={form.neighborhood} onChange={handleChange} required
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', backgroundColor: 'white', boxSizing: 'border-box' }}>
                  <option value="">Select neighborhood</option>
                  {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit" disabled={saving}
                  style={{
                    flex: 1, padding: '13px',
                    backgroundColor: saving ? '#6b9e87' : '#2d6a4f',
                    color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
                <a
                  href="/me/listings"
                  style={{
                    padding: '13px 24px', backgroundColor: 'white', color: '#374151',
                    border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px', fontWeight: 600,
                    textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
                  }}
                >
                  Cancel
                </a>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

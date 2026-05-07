'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import SiteHeader from '@/components/SiteHeader'

const NEIGHBORHOODS = [
  'Hoboken - Downtown', 'Hoboken - Uptown', 'Hoboken - Midtown',
  'Jersey City - Downtown / Newport', 'Jersey City - Heights',
  'Jersey City - Journal Square', 'Jersey City - Bergen-Lafayette',
  'Jersey City - Greenville', 'Jersey City - West Side',
]

export default function EditProfilePage() {
  const router = useRouter()
  // Read the ?complete=1 flag directly from the browser URL so we don't
  // need useSearchParams (which requires a Suspense boundary in Next.js 16).
  const [showCompletePrompt, setShowCompletePrompt] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShowCompletePrompt(new URLSearchParams(window.location.search).get('complete') === '1')
    }
  }, [])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    neighborhood: '',
    cross_street: '',
    zip_code: '',
  })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('full_name, neighborhood, cross_street, zip_code')
        .eq('id', user.id)
        .single()
      if (fetchError || !data) {
        setError('Could not load your profile.')
        setLoading(false)
        return
      }
      setForm({
        full_name: data.full_name || '',
        neighborhood: data.neighborhood || '',
        cross_street: data.cross_street || '',
        zip_code: data.zip_code || '',
      })
      setLoading(false)
    }
    load()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name.trim(),
        neighborhood: form.neighborhood,
        cross_street: form.cross_street.trim() || null,
        zip_code: form.zip_code.trim() || null,
      })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message || 'Could not save your profile.')
      setSaving(false)
      return
    }
    setSaved(true)
    setSaving(false)
    if (showCompletePrompt) {
      // After completing required fields, send them to the home page.
      setTimeout(() => router.push('/'), 1200)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <SiteHeader />

      <main style={{ maxWidth: '520px', margin: '40px auto', padding: '0 16px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111', marginBottom: '6px' }}>
            {showCompletePrompt ? 'Welcome! Finish setting up your profile' : 'Edit your profile'}
          </h2>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
            {showCompletePrompt
              ? 'These details help neighbors trust the marketplace. They\'re only visible to other approved members.'
              : 'Update your details below.'}
          </p>

          {error && (
            <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>{error}</div>
          )}
          {saved && (
            <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>Saved.</div>
          )}

          {loading ? (
            <p style={{ color: '#9ca3af' }}>Loading...</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Full name</label>
                  <input
                    type="text" name="full_name" value={form.full_name} onChange={handleChange} required
                    placeholder="Jane Smith"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Neighborhood</label>
                  <select
                    name="neighborhood" value={form.neighborhood} onChange={handleChange} required
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', backgroundColor: 'white', boxSizing: 'border-box' }}
                  >
                    <option value="">Select your neighborhood</option>
                    {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Cross street</label>
                    <input
                      type="text" name="cross_street" value={form.cross_street} onChange={handleChange}
                      placeholder="e.g. 5th & Park"
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Zip code</label>
                    <input
                      type="text" name="zip_code" value={form.zip_code} onChange={handleChange} required
                      placeholder="07030" maxLength={5}
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <button
                  type="submit" disabled={saving}
                  style={{
                    width: '100%', padding: '13px',
                    backgroundColor: saving ? '#6b9e87' : '#2d6a4f',
                    color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Saving...' : showCompletePrompt ? 'Save and continue' : 'Save changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}

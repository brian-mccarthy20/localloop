'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const NEIGHBORHOODS = [
  'Hoboken - Downtown',
  'Hoboken - Uptown',
  'Hoboken - Midtown',
  'Jersey City - Downtown / Newport',
  'Jersey City - Heights',
  'Jersey City - Journal Square',
  'Jersey City - Bergen-Lafayette',
  'Jersey City - Greenville',
  'Jersey City - West Side',
]

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [verificationPhoto, setVerificationPhoto] = useState<File | null>(null)
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    neighborhood: '',
    crossStreet: '',
    zipCode: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVerificationPhoto(file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })
      if (authError) throw authError
      if (!authData.user) throw new Error('Signup failed')

      let verificationPhotoUrl = null
      if (verificationPhoto) {
        const ext = verificationPhoto.name.split('.').pop()
        const path = `verifications/${authData.user.id}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('verifications')
          .upload(path, verificationPhoto)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('verifications').getPublicUrl(path)
          verificationPhotoUrl = urlData.publicUrl
        }
      }

      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        full_name: form.fullName,
        neighborhood: form.neighborhood,
        cross_street: form.crossStreet,
        zip_code: form.zipCode,
        verification_photo_url: verificationPhotoUrl,
        status: 'pending',
      })
      if (profileError) throw profileError

      router.push('/auth/pending')
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
        <a href="/auth/login" style={{ color: 'white', fontSize: '14px', textDecoration: 'underline' }}>
          Already have an account? Log in
        </a>
      </header>

      <main style={{ maxWidth: '520px', margin: '48px auto', padding: '0 24px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111', marginBottom: '8px' }}>Join Local Loop</h2>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '32px' }}>
            Buy and sell kids&apos; clothing &amp; gear in Hoboken and Jersey City. We verify all members to keep the community safe.
          </p>

          {error && (
            <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Full Name</label>
                <input
                  type="text" name="fullName" value={form.fullName} onChange={handleChange} required
                  placeholder="Jane Smith"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Email</label>
                <input
                  type="email" name="email" value={form.email} onChange={handleChange} required
                  placeholder="jane@example.com"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Password</label>
                <input
                  type="password" name="password" value={form.password} onChange={handleChange} required
                  placeholder="At least 8 characters"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Cross Street</label>
                  <input
                    type="text" name="crossStreet" value={form.crossStreet} onChange={handleChange}
                    placeholder="e.g. 5th & Park"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Zip Code</label>
                  <input
                    type="text" name="zipCode" value={form.zipCode} onChange={handleChange} required
                    placeholder="07030" maxLength={5}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Verification Photo</label>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>
                  Upload a photo of your ID or a selfie holding your ID. This helps us verify you&apos;re a local parent — your photo is only seen by admins and never shared publicly.
                </p>
                <div style={{ border: '2px dashed #d1d5db', borderRadius: '8px', padding: '24px', textAlign: 'center', backgroundColor: '#f9fafb', cursor: 'pointer', position: 'relative' }}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" style={{ maxHeight: '120px', borderRadius: '6px', objectFit: 'cover' }} />
                  ) : (
                    <div>
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>📷</div>
                      <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Click to upload or drag &amp; drop</p>
                      <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0' }}>JPG, PNG up to 10MB</p>
                    </div>
                  )}
                  <input
                    type="file" accept="image/*" onChange={handlePhotoChange}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '12px',
                  backgroundColor: loading ? '#6b9e87' : '#2d6a4f',
                  color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s',
                }}
              >
                {loading ? 'Creating your account...' : 'Request to Join'}
              </button>

              <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
                Your account will be reviewed within 24 hours. We&apos;ll email you once you&apos;re approved.
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

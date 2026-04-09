export default function PendingPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ backgroundColor: '#2d6a4f', padding: '16px 24px' }}>
        <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 700, margin: 0 }}>🌿 Local Loop</h1>
      </header>

      <main style={{ maxWidth: '480px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '48px 40px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '52px', marginBottom: '20px' }}>🌿</div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111', marginBottom: '12px' }}>
            You&apos;re on the list!
          </h2>
          <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: 1.6, marginBottom: '8px' }}>
            Thanks for joining Local Loop. We&apos;re reviewing your account and will send you an email within 24 hours once you&apos;re approved.
          </p>
          <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.6 }}>
            In the meantime, you can browse listings — you&apos;ll be able to post and message sellers once your account is approved.
          </p>
          <a
            href="/"
            style={{
              display: 'inline-block', marginTop: '28px', padding: '11px 28px',
              backgroundColor: '#2d6a4f', color: 'white', borderRadius: '8px',
              fontSize: '14px', fontWeight: 600, textDecoration: 'none',
            }}
          >
            Browse Listings
          </a>
        </div>
      </main>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  body: string
  created_at: string
  read: boolean
  sender_id: string
  recipient_id: string
  listing_id: string
  listings: { title: string; id: string }
  sender: { full_name: string }
  recipient: { full_name: string }
}

export default function MessagesPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox')

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    setCurrentUserId(user.id)

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        listings (id, title),
        sender:profiles!messages_sender_id_fkey (full_name),
        recipient:profiles!messages_recipient_id_fkey (full_name)
      `)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (!error) setMessages(data || [])
    setLoading(false)
  }

  const markRead = async (messageId: string) => {
    await supabase.from('messages').update({ read: true }).eq('id', messageId)
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, read: true } : m))
  }

  const inbox = messages.filter(m => m.recipient_id === currentUserId)
  const sent = messages.filter(m => m.sender_id === currentUserId)
  const displayed = tab === 'inbox' ? inbox : sent
  const unreadCount = inbox.filter(m => !m.read).length

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ backgroundColor: '#2d6a4f', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 700, margin: 0 }}>🌿 Local Loop</h1>
        </a>
        <a href="/" style={{ color: 'white', fontSize: '14px', textDecoration: 'underline' }}>← Back to listings</a>
      </header>

      <main style={{ maxWidth: '680px', margin: '40px auto', padding: '0 24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111', marginBottom: '24px' }}>Messages</h2>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '2px solid #e5e7eb' }}>
          {(['inbox', 'sent'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '10px 20px', border: 'none', backgroundColor: 'transparent',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                color: tab === t ? '#2d6a4f' : '#9ca3af',
                borderBottom: tab === t ? '2px solid #2d6a4f' : '2px solid transparent',
                marginBottom: '-2px',
                textTransform: 'capitalize',
              }}
            >
              {t} {t === 'inbox' && unreadCount > 0 && (
                <span style={{ backgroundColor: '#2d6a4f', color: 'white', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', marginLeft: '4px' }}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>Loading messages...</div>
        ) : displayed.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '48px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✉️</div>
            <p style={{ color: '#6b7280', fontSize: '15px' }}>
              {tab === 'inbox' ? 'No messages yet.' : 'You haven\'t sent any messages yet.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {displayed.map(message => (
              <div
                key={message.id}
                onClick={() => {
                  if (tab === 'inbox' && !message.read) markRead(message.id)
                  router.push(`/listings/${message.listing_id}`)
                }}
                style={{
                  backgroundColor: 'white', borderRadius: '12px', padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer',
                  borderLeft: tab === 'inbox' && !message.read ? '4px solid #2d6a4f' : '4px solid transparent',
                  transition: 'box-shadow 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '2px' }}>
                      {tab === 'inbox' ? message.sender?.full_name : `To: ${message.recipient?.full_name}`}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>
                      Re: <span style={{ color: '#2d6a4f', fontWeight: 600 }}>{message.listings?.title}</span>
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {tab === 'inbox' && !message.read && (
                      <span style={{ width: '8px', height: '8px', backgroundColor: '#2d6a4f', borderRadius: '50%', display: 'inline-block' }} />
                    )}
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {new Date(message.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.5, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {message.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

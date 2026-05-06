'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import SiteHeader from '@/components/SiteHeader'

interface Message {
  id: string
  body: string
  created_at: string
  read: boolean
  sender_id: string
  recipient_id: string
  listing_id: string
  listings: { title: string; id: string } | null
  sender: { full_name: string } | null
  recipient: { full_name: string } | null
}

interface Thread {
  key: string
  listingId: string
  listingTitle: string
  otherUserId: string
  otherUserName: string
  lastMessage: Message
  unreadCount: number
}

export default function MessagesPage() {
  const router = useRouter()
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

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

    if (error) {
      setLoading(false)
      return
    }

    // Group into threads keyed by (listing_id, other_user_id)
    const map = new Map<string, Thread>()
    for (const m of (data || []) as Message[]) {
      const otherUserId = m.sender_id === user.id ? m.recipient_id : m.sender_id
      const otherUserName = m.sender_id === user.id
        ? (m.recipient?.full_name ?? 'Unknown')
        : (m.sender?.full_name ?? 'Unknown')
      const key = `${m.listing_id}:${otherUserId}`

      const existing = map.get(key)
      const isUnreadToMe = m.recipient_id === user.id && !m.read

      if (!existing) {
        map.set(key, {
          key,
          listingId: m.listing_id,
          listingTitle: m.listings?.title ?? 'Listing',
          otherUserId,
          otherUserName,
          lastMessage: m,
          unreadCount: isUnreadToMe ? 1 : 0,
        })
      } else {
        // Messages are ordered DESC so the first one we see is the latest
        if (isUnreadToMe) existing.unreadCount += 1
      }
    }

    const sorted = Array.from(map.values()).sort(
      (a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    )
    setThreads(sorted)
    setLoading(false)
  }

  const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <SiteHeader />

      <main style={{ maxWidth: '680px', margin: '40px auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111', margin: 0 }}>Messages</h2>
          {totalUnread > 0 && (
            <span style={{ backgroundColor: '#2d6a4f', color: 'white', borderRadius: '12px', padding: '2px 10px', fontSize: '12px', fontWeight: 600 }}>
              {totalUnread} unread
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>Loading messages...</div>
        ) : threads.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '48px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✉️</div>
            <p style={{ color: '#6b7280', fontSize: '15px' }}>No conversations yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {threads.map(t => {
              const preview = t.lastMessage.body
              const isUnread = t.unreadCount > 0
              const isFromMe = t.lastMessage.sender_id === currentUserId
              return (
                <div
                  key={t.key}
                  onClick={() => router.push(`/messages/${t.listingId}/${t.otherUserId}`)}
                  style={{
                    backgroundColor: 'white', borderRadius: '12px', padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer',
                    borderLeft: isUnread ? '4px solid #2d6a4f' : '4px solid transparent',
                    transition: 'box-shadow 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: '#111', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.otherUserName}
                      </p>
                      <p style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Re: <span style={{ color: '#2d6a4f', fontWeight: 600 }}>{t.listingTitle}</span>
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
                      {isUnread && (
                        <span style={{ backgroundColor: '#2d6a4f', color: 'white', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', fontWeight: 600 }}>
                          {t.unreadCount}
                        </span>
                      )}
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {new Date(t.lastMessage.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.5, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {isFromMe && <span style={{ color: '#9ca3af', fontWeight: 600 }}>You: </span>}
                    {preview}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

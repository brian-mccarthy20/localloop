import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side only — uses service role key to look up user emails
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId, action } = await req.json()

    if (!userId || !['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Look up user's email from auth.users (requires service role)
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (userError || !userData?.user?.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Look up their name from profiles
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single()

    const email = userData.user.email
    const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
    const isApproved = action === 'approved'

    const subject = isApproved
      ? '🌿 You\'re in! Welcome to Local Loop'
      : 'Your Local Loop application'

    const html = isApproved
      ? `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
          <h1 style="color: #2d6a4f; font-size: 24px; margin-bottom: 8px;">Welcome to Local Loop, ${firstName}! 🌿</h1>
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Great news — your account has been approved. You're now a verified member of the Local Loop community in Hoboken and Jersey City.
          </p>
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            You can now browse listings, post your own items for sale or giveaway, and message other members directly.
          </p>
          <a href="https://localloop-delta.vercel.app" style="display: inline-block; margin-top: 24px; padding: 12px 28px; background-color: #2d6a4f; color: white; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
            Start Browsing
          </a>
          <p style="color: #9ca3af; font-size: 13px; margin-top: 32px;">
            Local Loop · Hoboken & Jersey City
          </p>
        </div>
      `
      : `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
          <h1 style="color: #111; font-size: 22px; margin-bottom: 8px;">Hi ${firstName},</h1>
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Thank you for applying to join Local Loop. After reviewing your application, we weren't able to approve your account at this time.
          </p>
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            If you believe this is a mistake, or if you'd like to reapply with additional verification, please reply to this email and we'll be happy to help.
          </p>
          <p style="color: #9ca3af; font-size: 13px; margin-top: 32px;">
            Local Loop · Hoboken & Jersey City
          </p>
        </div>
      `

    // Send via Resend
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Resend's shared sandbox sender — works without DNS verification.
        // Swap to a verified custom domain (e.g. hello@localloop.app) once
        // the domain is registered and added to Resend.
        from: 'Local Loop <onboarding@resend.dev>',
        to: [email],
        subject,
        html,
      }),
    })

    if (!resendRes.ok) {
      const err = await resendRes.text()
      console.error('Resend error:', err)
      return NextResponse.json({ error: 'Email send failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

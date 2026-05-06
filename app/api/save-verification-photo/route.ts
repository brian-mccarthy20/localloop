import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service-role client so we can update the profile row right after signup,
// before the user has a session (e.g. when email confirmation is required).
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId, photoUrl } = await req.json()

    if (!userId || typeof photoUrl !== 'string' || !photoUrl.startsWith('http')) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Sanity check: confirm this auth user actually exists.
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ verification_photo_url: photoUrl })
      .eq('id', userId)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json({ error: 'Failed to save photo' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('save-verification-photo error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

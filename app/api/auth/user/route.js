import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(req) {
  const supabase = createRouteHandlerClient({ cookies })

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 })
  }

  return NextResponse.json({ user })
}
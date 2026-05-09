/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { providerSwitchSchema } from '@/lib/validations'
import { invalidateProviderCache } from '@/lib/providers/factory'
import type { UserProfile } from '@/lib/supabase/query-types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  const profile = data as UserProfile | null

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = providerSwitchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { providerId, setAsFallback } = parsed.data
  const admin = createAdminClient()

  if (setAsFallback) {
    await (admin.from('serp_provider_configs') as any).update({ is_fallback: false }).neq('id', providerId)
    await (admin.from('serp_provider_configs') as any).update({ is_fallback: true }).eq('id', providerId)
  } else {
    await (admin.from('serp_provider_configs') as any).update({ is_active: false }).neq('id', providerId)
    await (admin.from('serp_provider_configs') as any).update({ is_active: true }).eq('id', providerId)
  }

  invalidateProviderCache()
  return NextResponse.json({ success: true })
}

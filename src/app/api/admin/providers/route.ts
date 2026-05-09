/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { UserProfile, ProviderConfig, ProviderLog } from '@/lib/supabase/query-types'

async function requireAdmin(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  const profile = data as UserProfile | null
  return profile?.role === 'admin' ? user : null
}

export async function GET(request: NextRequest) {
  const user = await requireAdmin(request)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await (admin.from('serp_provider_configs') as any)
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const providers = (data ?? []) as ProviderConfig[]

  const providersWithStats = await Promise.all(
    providers.map(async (p) => {
      const { data: logsData } = await (admin.from('serp_provider_logs') as any)
        .select('status, latency_ms, created_at')
        .eq('provider_key', p.provider_key)
        .order('created_at', { ascending: false })
        .limit(100)

      const logs = (logsData ?? []) as ProviderLog[]
      const total = logs.length
      const success = logs.filter((l) => l.status === 'success').length
      const avgLatency =
        total > 0
          ? Math.round(
              logs.filter((l) => l.latency_ms).reduce((sum, l) => sum + (l.latency_ms ?? 0), 0) /
                Math.max(1, total)
            )
          : 0

      return {
        ...p,
        stats: {
          totalQueries: total,
          successRate: total > 0 ? Math.round((success / total) * 100) : 0,
          avgLatencyMs: avgLatency,
          errorCount: total - success,
          lastUsed: logs[0]?.created_at ?? null,
        },
      }
    })
  )

  return NextResponse.json({ providers: providersWithStats })
}

export async function POST(request: NextRequest) {
  const user = await requireAdmin(request)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { name, providerKey, apiKey, config } = body

  if (!name || !providerKey) {
    return NextResponse.json({ error: 'name and providerKey required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await (admin.from('serp_provider_configs') as any)
    .insert({
      name,
      provider_key: providerKey,
      api_key_encrypted: apiKey ?? null,
      config: config ?? null,
      is_active: false,
      is_fallback: false,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ id: (data as any)?.id })
}

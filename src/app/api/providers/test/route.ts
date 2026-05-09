/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { providerTestSchema } from '@/lib/validations'
import { createProvider } from '@/lib/providers/factory'
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
  const parsed = providerTestSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { providerKey, query } = parsed.data
  const provider = createProvider(providerKey)
  const start = Date.now()

  try {
    const result = await provider.getSerpAnalysis(query)
    return NextResponse.json({
      success: true,
      provider: providerKey,
      latencyMs: Date.now() - start,
      resultsCount: result.results.length,
      sample: result.results.slice(0, 3),
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      provider: providerKey,
      latencyMs: Date.now() - start,
      error: String(err),
    })
  }
}

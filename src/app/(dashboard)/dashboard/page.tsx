/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { AnalysisForm } from '@/components/dashboard/analysis-form'
import { UsageCard } from '@/components/dashboard/usage-card'
import { RecentAnalyses } from '@/components/dashboard/recent-analyses'
import { PLAN_LIMITS } from '@/types/analysis'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const currentMonth = new Date().toISOString().slice(0, 7)

  const [subscriptionRes, usageRes, analysesRes] = await Promise.all([
    supabase.from('subscriptions').select('plan, status').eq('user_id', user!.id).single(),
    supabase.from('usage').select('analyses_count').eq('user_id', user!.id).eq('month', currentMonth).single(),
    supabase
      .from('keyword_analyses')
      .select('id, seed_keyword, status, provider_used, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const sub = subscriptionRes.data as any
  const usage = usageRes.data as any
  const analyses = (analysesRes.data ?? []) as any[]

  const plan: string = sub?.plan ?? 'free'
  const usedCount: number = usage?.analyses_count ?? 0
  const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Analyze keywords and find ranking opportunities.</p>
      </div>

      <UsageCard used={usedCount} limit={limit} plan={plan} />

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">New Keyword Analysis</h2>
        <AnalysisForm disabled={usedCount >= limit} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Analyses</h2>
        <RecentAnalyses analyses={analyses} />
      </div>
    </div>
  )
}

import { createAdminClient } from '@/lib/supabase/admin'
import { Users, Activity, BarChart2, TrendingUp } from 'lucide-react'

interface UsageRow { analyses_count: number }
interface AnalysisRow {
  id: string
  seed_keyword: string
  status: string
  created_at: string
}

export default async function AdminOverviewPage() {
  const admin = createAdminClient()
  const currentMonth = new Date().toISOString().slice(0, 7)

  const [usersRes, subsRes, analysesRes, usageRes] = await Promise.all([
    admin.from('users').select('id', { count: 'exact', head: true }),
    admin.from('subscriptions').select('plan').neq('plan', 'free'),
    admin.from('keyword_analyses').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    admin.from('usage').select('analyses_count').eq('month', currentMonth),
  ])

  const totalUsers = usersRes.count ?? 0
  const paidSubs = (subsRes.data ?? []).length
  const completedAnalyses = analysesRes.count ?? 0
  const monthlyAnalyses = ((usageRes.data as UsageRow[]) ?? []).reduce(
    (s, u) => s + u.analyses_count,
    0
  )

  const stats = [
    { label: 'Total Users', value: totalUsers, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Paid Subscribers', value: paidSubs, icon: TrendingUp, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Total Analyses', value: completedAnalyses, icon: BarChart2, color: 'bg-purple-100 text-purple-600' },
    { label: 'This Month', value: monthlyAnalyses, icon: Activity, color: 'bg-orange-100 text-orange-600' },
  ]

  const { data: recentRaw } = await admin
    .from('keyword_analyses')
    .select('id, seed_keyword, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  const recentAnalyses = (recentRaw ?? []) as AnalysisRow[]

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
        <p className="text-gray-500 mt-1">System stats and recent activity.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className={`inline-flex p-2.5 rounded-xl ${color} mb-3`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Recent Analyses</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {recentAnalyses.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-6 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{a.seed_keyword}</p>
                <p className="text-xs text-gray-400">{new Date(a.created_at).toLocaleString()}</p>
              </div>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  a.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-700'
                    : a.status === 'failed'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {a.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

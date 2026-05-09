import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'

interface SubWithUser {
  id: string
  plan: string
  status: string
  stripe_subscription_id: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  users: { email: string; full_name: string | null }[] | { email: string; full_name: string | null } | null
}

export default async function AdminSubscriptionsPage() {
  const admin = createAdminClient()

  const { data } = await admin
    .from('subscriptions')
    .select('id, plan, status, stripe_subscription_id, current_period_end, cancel_at_period_end, users(email, full_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  const subscriptions = (data ?? []) as SubWithUser[]

  const planBadge = (plan: string) => {
    if (plan === 'business') return 'border-blue-200 text-blue-700'
    if (plan === 'pro') return 'border-emerald-200 text-emerald-700'
    return 'border-gray-200 text-gray-500'
  }

  const statusBadge = (status: string) => {
    if (status === 'active') return 'border-emerald-200 text-emerald-700'
    if (status === 'past_due') return 'border-amber-200 text-amber-700'
    if (status === 'canceled') return 'border-red-200 text-red-600'
    return 'border-gray-200 text-gray-500'
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <p className="text-gray-500 mt-1">{subscriptions.length} subscriptions</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-6 py-3 text-left">User</th>
              <th className="px-6 py-3 text-left">Plan</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Renews</th>
              <th className="px-6 py-3 text-left">Stripe ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {subscriptions.map((s) => {
              const u = Array.isArray(s.users) ? s.users[0] : s.users
              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="font-medium text-gray-900">{u?.full_name ?? '—'}</div>
                    <div className="text-gray-400 text-xs">{u?.email}</div>
                  </td>
                  <td className="px-6 py-3">
                    <Badge variant="outline" className={planBadge(s.plan)}>
                      {s.plan}
                    </Badge>
                  </td>
                  <td className="px-6 py-3">
                    <Badge variant="outline" className={statusBadge(s.status)}>
                      {s.status}
                    </Badge>
                    {s.cancel_at_period_end && (
                      <span className="ml-1 text-xs text-amber-600">cancels</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-400">
                    {s.current_period_end
                      ? new Date(s.current_period_end).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-6 py-3">
                    {s.stripe_subscription_id ? (
                      <span className="text-xs font-mono text-gray-400">
                        {s.stripe_subscription_id.slice(0, 20)}...
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

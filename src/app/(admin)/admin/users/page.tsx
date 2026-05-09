import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'

interface UserWithSub {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
  subscriptions: { plan: string; status: string }[] | { plan: string; status: string } | null
}

export default async function AdminUsersPage() {
  const admin = createAdminClient()

  const { data } = await admin
    .from('users')
    .select('id, email, full_name, role, created_at, subscriptions(plan, status)')
    .order('created_at', { ascending: false })
    .limit(100)

  const users = (data ?? []) as UserWithSub[]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 mt-1">{users.length} registered users</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-6 py-3 text-left">User</th>
              <th className="px-6 py-3 text-left">Role</th>
              <th className="px-6 py-3 text-left">Plan</th>
              <th className="px-6 py-3 text-left">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => {
              const sub = Array.isArray(u.subscriptions) ? u.subscriptions[0] : u.subscriptions
              return (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="font-medium text-gray-900">{u.full_name ?? '—'}</div>
                    <div className="text-gray-400 text-xs">{u.email}</div>
                  </td>
                  <td className="px-6 py-3">
                    <Badge
                      variant="outline"
                      className={
                        u.role === 'admin'
                          ? 'border-purple-200 text-purple-700'
                          : 'border-gray-200 text-gray-500'
                      }
                    >
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-3">
                    <Badge
                      variant="outline"
                      className={
                        sub?.plan === 'business'
                          ? 'border-blue-200 text-blue-700'
                          : sub?.plan === 'pro'
                          ? 'border-emerald-200 text-emerald-700'
                          : 'border-gray-200 text-gray-500'
                      }
                    >
                      {sub?.plan ?? 'free'}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-gray-400">
                    {new Date(u.created_at).toLocaleDateString()}
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

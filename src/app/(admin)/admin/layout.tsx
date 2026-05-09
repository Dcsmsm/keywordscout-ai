import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminNav } from '@/components/admin/nav'
import { ROUTES } from '@/lib/constants'
import type { UserProfile } from '@/lib/supabase/query-types'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.login)

  const { data } = await supabase
    .from('users')
    .select('role, email, full_name')
    .eq('id', user.id)
    .single()

  const profile = data as UserProfile | null
  if (!profile || profile.role !== 'admin') redirect(ROUTES.dashboard)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminNav user={{ email: user.email ?? '', full_name: profile.full_name }} />
      <main className="flex-1 min-w-0 p-6 md:p-8">{children}</main>
    </div>
  )
}

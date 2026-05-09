import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/dashboard/nav'
import { ROUTES } from '@/lib/constants'
import type { UserProfile } from '@/lib/supabase/query-types'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.login)
  const { data } = await supabase.from('users').select('full_name, email, role').eq('id', user.id).single()
  const profile = data as UserProfile | null
  const navUser = { email: user.email ?? '', full_name: profile?.full_name ?? null, role: profile?.role ?? 'user' }
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardNav user={navUser} />
      <main className="flex-1 min-w-0 p-6 md:p-8">{children}</main>
    </div>
  )
}

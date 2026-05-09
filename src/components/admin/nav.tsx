'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Compass,
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Activity,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { APP_NAME, ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface AdminUser {
  email: string
  full_name?: string | null
}

const navLinks = [
  { href: ROUTES.admin, icon: LayoutDashboard, label: 'Overview', exact: true },
  { href: ROUTES.adminUsers, icon: Users, label: 'Users' },
  { href: ROUTES.adminSubscriptions, icon: CreditCard, label: 'Subscriptions' },
  { href: ROUTES.adminProviders, icon: Activity, label: 'SERP Providers' },
]

export function AdminNav({ user }: { user: AdminUser }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-gray-900">
          <Compass className="h-5 w-5 text-emerald-500" />
          {APP_NAME}
        </Link>
        <span className="text-xs text-emerald-600 font-medium mt-0.5 block">Admin Panel</span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navLinks.map(({ href, icon: Icon, label, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              (exact ? pathname === href : pathname.startsWith(href))
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}

        <Link
          href={ROUTES.dashboard}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors mt-4"
        >
          <Settings className="h-4 w-4" />
          User Dashboard
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 mb-2 truncate">{user.email}</p>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-500 hover:text-red-500"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}

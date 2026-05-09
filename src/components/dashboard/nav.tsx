'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Compass,
  LayoutDashboard,
  History,
  CreditCard,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { APP_NAME, ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface NavUser {
  email: string
  full_name?: string | null
  role?: string
}

const navLinks = [
  { href: ROUTES.dashboard, icon: LayoutDashboard, label: 'Dashboard' },
  { href: ROUTES.analyses, icon: History, label: 'History' },
  { href: ROUTES.billing, icon: CreditCard, label: 'Billing' },
  { href: ROUTES.settings, icon: Settings, label: 'Settings' },
]

export function DashboardNav({ user }: { user: NavUser }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const initials = user.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? user.email[0].toUpperCase()

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-gray-900">
          <Compass className="h-5 w-5 text-emerald-500" />
          {APP_NAME}
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navLinks.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === href || (href !== ROUTES.dashboard && pathname.startsWith(href))
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}

        {user.role === 'admin' && (
          <Link
            href={ROUTES.admin}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-4',
              pathname.startsWith('/admin')
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <Shield className="h-4 w-4" />
            Admin
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.full_name ?? 'User'}
            </p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
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

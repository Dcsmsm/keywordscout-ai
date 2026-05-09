'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { APP_NAME, ROUTES } from '@/lib/constants'
import { Menu, X, Compass } from 'lucide-react'

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-900">
          <Compass className="h-6 w-6 text-emerald-500" />
          {APP_NAME}
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-gray-600">
          <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
          <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={ROUTES.login}>Log in</Link>
          </Button>
          <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" asChild>
            <Link href={ROUTES.signup}>Get started free</Link>
          </Button>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
          <a href="#features" className="block text-sm text-gray-600 py-2" onClick={() => setOpen(false)}>Features</a>
          <a href="#pricing" className="block text-sm text-gray-600 py-2" onClick={() => setOpen(false)}>Pricing</a>
          <a href="#faq" className="block text-sm text-gray-600 py-2" onClick={() => setOpen(false)}>FAQ</a>
          <div className="pt-2 flex flex-col gap-2">
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={ROUTES.login}>Log in</Link>
            </Button>
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white w-full" asChild>
              <Link href={ROUTES.signup}>Get started free</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}

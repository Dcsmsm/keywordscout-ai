import Link from 'next/link'
import { Compass } from 'lucide-react'
import { APP_NAME, ROUTES } from '@/lib/constants'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl mb-3">
              <Compass className="h-5 w-5 text-emerald-400" />
              {APP_NAME}
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              AI-native keyword research for bloggers and creators. Find keywords you can actually rank for.
            </p>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4 text-sm">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4 text-sm">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href={ROUTES.login} className="hover:text-white transition-colors">Log in</Link></li>
              <li><Link href={ROUTES.signup} className="hover:text-white transition-colors">Sign up</Link></li>
              <li><Link href={ROUTES.dashboard} className="hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

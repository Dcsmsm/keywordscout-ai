/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, CheckCircle, XCircle, Loader2, Clock } from 'lucide-react'
import { ROUTES } from '@/lib/constants'

export default async function AnalysesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.login)

  const { data } = await supabase
    .from('keyword_analyses')
    .select('id, seed_keyword, status, provider_used, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const analyses = (data ?? []) as any[]

  const statusConfig: Record<string, { icon: React.ElementType; color: string; badge: string }> = {
    completed: { icon: CheckCircle, color: 'text-emerald-500', badge: 'border-emerald-200 text-emerald-700' },
    failed: { icon: XCircle, color: 'text-red-400', badge: 'border-red-200 text-red-600' },
    processing: { icon: Loader2, color: 'text-blue-400', badge: 'border-blue-200 text-blue-600' },
    pending: { icon: Clock, color: 'text-gray-400', badge: 'border-gray-200 text-gray-500' },
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analysis History</h1>
        <p className="text-gray-500 mt-1">All your keyword analyses — past and present.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {!analyses.length ? (
          <div className="text-center py-16 text-gray-400">
            <p className="font-medium">No analyses yet</p>
            <p className="text-sm mt-1">
              <Link href={ROUTES.dashboard} className="text-emerald-500 hover:underline">
                Run your first analysis
              </Link>
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {analyses.map((a) => {
              const cfg = statusConfig[a.status] ?? statusConfig.pending
              const StatusIcon = cfg.icon
              return (
                <Link
                  key={a.id}
                  href={ROUTES.analysis(a.id)}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group"
                >
                  <StatusIcon className={`h-4 w-4 shrink-0 ${cfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{a.seed_keyword}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(a.created_at).toLocaleString()} · {a.provider_used ?? 'mock'}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-xs shrink-0 ${cfg.badge}`}>
                    {a.status}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 shrink-0" />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

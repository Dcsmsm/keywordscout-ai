import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { ROUTES } from '@/lib/constants'

interface Analysis {
  id: string
  seed_keyword: string
  status: string
  provider_used: string | null
  created_at: string
}

const statusConfig = {
  completed: { icon: CheckCircle, className: 'text-emerald-500', label: 'Completed' },
  failed: { icon: XCircle, className: 'text-red-400', label: 'Failed' },
  processing: { icon: Loader2, className: 'text-blue-400 animate-spin', label: 'Processing' },
  pending: { icon: Clock, className: 'text-gray-400', label: 'Pending' },
}

export function RecentAnalyses({ analyses }: { analyses: Analysis[] }) {
  if (!analyses.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-gray-500 font-medium">No analyses yet</p>
        <p className="text-sm text-gray-400 mt-1">Enter a keyword above to get started.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="divide-y divide-gray-50">
        {analyses.map((analysis) => {
          const status = statusConfig[analysis.status as keyof typeof statusConfig] ?? statusConfig.pending
          const StatusIcon = status.icon

          return (
            <Link
              key={analysis.id}
              href={ROUTES.analysis(analysis.id)}
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <StatusIcon className={`h-4 w-4 shrink-0 ${status.className}`} />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{analysis.seed_keyword}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(analysis.created_at).toLocaleDateString()} ·{' '}
                    {analysis.provider_used ?? 'mock'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    analysis.status === 'completed'
                      ? 'border-emerald-200 text-emerald-700'
                      : analysis.status === 'failed'
                      ? 'border-red-200 text-red-600'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >
                  {status.label}
                </Badge>
                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

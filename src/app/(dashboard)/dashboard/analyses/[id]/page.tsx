import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, CheckCircle, XCircle, Loader2, Clock } from 'lucide-react'
import Link from 'next/link'
import { ROUTES } from '@/lib/constants'
import { Tables } from '@/types/database'
import { KeywordResultsTable } from '@/components/dashboard/keyword-results-table'

type Analysis = Tables<'keyword_analyses'> & {
  keyword_results: Tables<'keyword_results'>[]
}

const STATUS_ICON = {
  completed: CheckCircle,
  failed:    XCircle,
  processing: Loader2,
  pending:   Clock,
} as const

const STATUS_COLOR = {
  completed:  'border-emerald-200 text-emerald-700 bg-emerald-50',
  failed:     'border-red-200 text-red-600',
  processing: 'border-blue-200 text-blue-600',
  pending:    'border-gray-200 text-gray-500',
} as const

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(ROUTES.login)

  const { data } = await supabase
    .from('keyword_analyses')
    .select('*, keyword_results(*)')
    .eq('id', id)
    .single()

  const analysis = data as Analysis | null
  if (!analysis) notFound()

  const results = analysis.keyword_results ?? []

  const StatusIcon  = STATUS_ICON[analysis.status as keyof typeof STATUS_ICON]  ?? Clock
  const statusColor = STATUS_COLOR[analysis.status as keyof typeof STATUS_COLOR] ?? STATUS_COLOR.pending

  const withVolume    = results.filter(r => r.estimated_volume != null).length
  const avgOpportunity = results.length
    ? Math.round(results.reduce((s, r) => s + (r.opportunity_score ?? 0), 0) / results.length)
    : null
  const topOpportunity = results.reduce(
    (best, r) => (r.opportunity_score ?? 0) > (best?.opportunity_score ?? 0) ? r : best,
    null as Tables<'keyword_results'> | null,
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href={ROUTES.analyses}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to history
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">
              &ldquo;{analysis.seed_keyword}&rdquo;
            </h1>
            <Badge variant="outline" className={`flex items-center gap-1 ${statusColor}`}>
              <StatusIcon className="h-3 w-3" />
              {analysis.status}
            </Badge>
          </div>
          <p className="text-sm text-gray-400">
            {new Date(analysis.created_at).toLocaleString()} · Provider: {analysis.provider_used ?? 'mock'}
          </p>
        </div>

        {/* Summary stats */}
        {results.length > 0 && (
          <div className="flex gap-6 shrink-0 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{results.length}</p>
              <p className="text-xs text-gray-400">keywords</p>
            </div>
            {withVolume > 0 && (
              <div>
                <p className="text-2xl font-bold text-gray-900">{withVolume}</p>
                <p className="text-xs text-gray-400">with volume</p>
              </div>
            )}
            {avgOpportunity != null && (
              <div>
                <p className={`text-2xl font-bold ${avgOpportunity >= 50 ? 'text-emerald-500' : 'text-gray-900'}`}>
                  {avgOpportunity}
                </p>
                <p className="text-xs text-gray-400">avg opportunity</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Best opportunity callout */}
      {topOpportunity && (topOpportunity.opportunity_score ?? 0) >= 50 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500 text-white text-sm font-bold shrink-0">
            {topOpportunity.opportunity_score}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-800">Best opportunity: &ldquo;{topOpportunity.keyword}&rdquo;</p>
            {topOpportunity.suggested_title && (
              <p className="text-xs text-emerald-600 truncate">{topOpportunity.suggested_title}</p>
            )}
          </div>
        </div>
      )}

      <Separator />

      {results.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No results found for this analysis.</p>
        </div>
      ) : (
        <KeywordResultsTable results={results} />
      )}
    </div>
  )
}

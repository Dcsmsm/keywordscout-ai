import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Target, TrendingUp, Lightbulb, Tag } from 'lucide-react'
import Link from 'next/link'
import { ROUTES } from '@/lib/constants'
import { Tables } from '@/types/database'

type Analysis = Tables<'keyword_analyses'> & {
  keyword_results: Tables<'keyword_results'>[]
}

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
    .eq('user_id', user.id)
    .single()

  const analysis = data as Analysis | null

  if (!analysis) notFound()

  const results = analysis.keyword_results ?? []

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={ROUTES.analyses}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to history
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">
            &ldquo;{analysis.seed_keyword}&rdquo;
          </h1>
          <Badge
            variant="outline"
            className={
              analysis.status === 'completed'
                ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                : 'border-gray-200'
            }
          >
            {analysis.status}
          </Badge>
        </div>
        <p className="text-sm text-gray-400">
          {new Date(analysis.created_at).toLocaleString()} · Provider: {analysis.provider_used ?? 'mock'}
        </p>
      </div>

      <Separator />

      {results.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p>No results found for this analysis.</p>
        </div>
      )}

      <div className="space-y-4">
        {results.map((result) => (
          <div key={result.id} className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{result.keyword}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {result.intent && (
                    <Badge variant="outline" className="text-xs capitalize border-gray-200">
                      {result.intent}
                    </Badge>
                  )}
                  {result.estimated_volume != null && (
                    <span className="text-xs text-gray-400">
                      ~{result.estimated_volume.toLocaleString()} searches/mo
                    </span>
                  )}
                  {result.topic_cluster && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Tag className="h-3 w-3" />
                      {result.topic_cluster}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-6 shrink-0">
                <ScoreDisplay label="Weakness" value={result.serp_weakness_score} icon={Target} />
                <ScoreDisplay label="Opportunity" value={result.opportunity_score} icon={TrendingUp} highlight />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {result.suggested_title && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2">
                    <Lightbulb className="h-3.5 w-3.5" />
                    Suggested Title
                  </div>
                  <p className="text-sm text-gray-900 font-medium">{result.suggested_title}</p>
                </div>
              )}
              {result.content_angle && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2">
                    <Target className="h-3.5 w-3.5" />
                    Content Angle
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{result.content_angle}</p>
                </div>
              )}
            </div>

            {result.difficulty_estimate != null && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Keyword Difficulty</span>
                  <span className="font-medium">{result.difficulty_estimate}/100</span>
                </div>
                <Progress value={result.difficulty_estimate} className="h-1.5" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ScoreDisplay({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string
  value: number | null
  icon: React.ElementType
  highlight?: boolean
}) {
  const score = value ?? 0
  const color =
    score >= 70 ? 'text-emerald-500' : score >= 40 ? 'text-yellow-500' : 'text-red-400'

  return (
    <div className="text-center">
      <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className={`text-2xl font-bold ${highlight ? color : 'text-gray-700'}`}>
        {value ?? '—'}
      </div>
    </div>
  )
}

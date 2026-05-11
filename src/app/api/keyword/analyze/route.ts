/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { analyzeKeywordSchema } from '@/lib/validations'
import {
  getActiveProvider,
  getFallbackProvider,
  withFallback,
  logProviderCall,
} from '@/lib/providers/factory'
import {
  analyzeSerpFeatures,
  calculateSerpWeaknessScore,
  calculateOpportunityScore,
  estimateDifficulty,
} from '@/lib/ai/scoring'
import { generateIdeationBatch, generateTopicCluster, expandKeywords } from '@/lib/ai/ideation'
import { enrichWithVolume } from '@/lib/providers/volume'
import { expandKeywordsPipeline } from '@/lib/keyword-expansion'
import { PLAN_LIMITS } from '@/types/analysis'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = analyzeKeywordSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { keyword, country, language, miningDepth, maxSuggestions } = parsed.data
  const adminSupabase = createAdminClient()
  const currentMonth = new Date().toISOString().slice(0, 7)

  const [subRes, usageRes] = await Promise.all([
    adminSupabase.from('subscriptions').select('plan').eq('user_id', user.id).single(),
    adminSupabase.from('usage').select('analyses_count').eq('user_id', user.id).eq('month', currentMonth).single(),
  ])

  const subData = subRes.data as any
  const usageData = usageRes.data as any

  const plan: string = subData?.plan ?? 'free'
  const used: number = usageData?.analyses_count ?? 0
  const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free

  if (used >= limit) {
    return NextResponse.json(
      { error: `Monthly limit reached (${limit} analyses). Upgrade your plan.` },
      { status: 429 }
    )
  }

  const { data: analysisData, error: analysisError } = await (adminSupabase
    .from('keyword_analyses') as any)
    .insert({ user_id: user.id, seed_keyword: keyword, status: 'processing', language, country, mining_depth: miningDepth })
    .select('id')
    .single()

  if (analysisError || !analysisData) {
    return NextResponse.json({ error: 'Failed to create analysis' }, { status: 500 })
  }

  const analysisId = (analysisData as any).id

  try {
    const provider = await getActiveProvider()
    const fallback = await getFallbackProvider()
    const options = { country, language }

    const [ideas, serpData] = await Promise.all([
      withFallback(
        () => provider.getKeywordIdeas(keyword, { ...options, limit: 8 }),
        fallback
          ? () => fallback.getKeywordIdeas(keyword, { ...options, limit: 8 })
          : () => provider.getKeywordIdeas(keyword, { ...options, limit: 8 })
      ),
      withFallback(
        async () => {
          const start = Date.now()
          try {
            const result = await provider.getSerpAnalysis(keyword, options)
            await logProviderCall(provider.name, keyword, 'success', Date.now() - start, undefined, result)
            return result
          } catch (err) {
            await logProviderCall(provider.name, keyword, 'error', Date.now() - start, String(err))
            throw err
          }
        },
        fallback
          ? async () => {
              const start = Date.now()
              try {
                const result = await fallback.getSerpAnalysis(keyword, options)
                await logProviderCall(fallback.name, keyword, 'success', Date.now() - start, undefined, result)
                return result
              } catch (err) {
                await logProviderCall(fallback.name, keyword, 'error', Date.now() - start, String(err))
                throw err
              }
            }
          : async () => provider.getSerpAnalysis(keyword, options)
      ),
    ])

    const serpKeywords = [keyword, ...ideas.map((k) => k.keyword).filter((k) => k !== keyword)]

    // Run autocomplete mining + Claude keyword expansion in parallel
    const [expansion, claudeKeywords] = await Promise.all([
      expandKeywordsPipeline({ seed: keyword, language, country, miningDepth, maxSuggestions }),
      expandKeywords(keyword, language, serpData, serpKeywords, 15),
    ])

    // Merge: seed → SERP ideas → autocomplete mined → Claude-generated, deduplicated
    const minedKeywords = expansion.keywords.map((k) => k.keyword)
    const allKeywordsSet = [keyword, ...serpKeywords.filter((k) => k !== keyword), ...minedKeywords, ...claudeKeywords]
    const allKeywords = [...new Set(allKeywordsSet)].slice(0, maxSuggestions)

    // Build source maps for provenance tracking
    const autocompleteSourceMap = new Map(expansion.keywords.map((k) => [k.keyword, k]))
    const claudeSet = new Set(claudeKeywords)

    // Build SERP data map for batch ideation
    const serpDataMap = new Map<string, { results: typeof serpData.results; features: ReturnType<typeof analyzeSerpFeatures> }>()
    for (const kw of allKeywords) {
      const serp = kw === keyword ? serpData : { keyword: kw, results: [] as typeof serpData.results }
      serpDataMap.set(kw, { results: serp.results, features: analyzeSerpFeatures(serp.results) })
    }

    // Bulk volume enrichment from DataForSEO (no-op if credentials not set)
    const volumeMap = await enrichWithVolume(allKeywords, country, language)

    // Single batched Claude call for all ideation (titles + content angles in target language)
    const ideationMap = await generateIdeationBatch(allKeywords, language, serpDataMap)

    const rawResults = allKeywords.map((kw) => {
      const idea = ideas.find((i) => i.keyword === kw)
      const serpEntry = serpDataMap.get(kw)!
      const weakness = calculateSerpWeaknessScore(serpEntry.results, serpEntry.features)
      const difficulty = estimateDifficulty(serpEntry.results)
      const volume = idea?.volume ?? volumeMap[kw] ?? null
      const opportunity = calculateOpportunityScore(weakness, volume, difficulty)
      const ideation = ideationMap.get(kw)!
      const kwMeta = autocompleteSourceMap.get(kw)
      const source = kw === keyword ? 'seed' : claudeSet.has(kw) ? 'claude' : (kwMeta?.source ?? 'autocomplete')
      return {
        analysis_id: analysisId,
        keyword: kw,
        estimated_volume: volume,
        intent: ideation.intent,
        difficulty_estimate: difficulty,
        serp_weakness_score: weakness,
        opportunity_score: opportunity,
        suggested_title: ideation.suggested_title,
        content_angle: ideation.content_angle,
        topic_cluster: generateTopicCluster(kw),
        serp_features: serpEntry.features as unknown as Record<string, unknown>,
        raw_serp_data: kw === keyword ? (serpData as unknown as Record<string, unknown>) : null,
        keyword_source: source,
        relevance_score: kw === keyword ? 1 : (kwMeta?.relevanceScore ?? null),
        source_modifier: kwMeta?.modifier ?? null,
      }
    })

    // Sort: seed keyword first, then by opportunity score descending
    const resultsToInsert = [
      rawResults.find((r) => r.keyword === keyword)!,
      ...rawResults
        .filter((r) => r.keyword !== keyword)
        .sort((a, b) => (b.opportunity_score ?? 0) - (a.opportunity_score ?? 0)),
    ].filter(Boolean)

    await (adminSupabase.from('keyword_results') as any).insert(resultsToInsert)

    await Promise.all([
      (adminSupabase.from('keyword_analyses') as any)
        .update({ status: 'completed', provider_used: provider.name })
        .eq('id', analysisId),
      (adminSupabase as any).rpc('increment_usage', { p_user_id: user.id, p_month: currentMonth }),
    ])

    return NextResponse.json({ analysisId, resultsCount: resultsToInsert.length })
  } catch (err) {
    await (adminSupabase.from('keyword_analyses') as any)
      .update({ status: 'failed', error_message: String(err) })
      .eq('id', analysisId)

    console.error('[analyze]', err)
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 })
  }
}

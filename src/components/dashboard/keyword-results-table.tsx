'use client'

import { useState, useMemo } from 'react'
import React from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tables } from '@/types/database'

type Result = Tables<'keyword_results'>

type SortKey = 'keyword' | 'estimated_volume' | 'difficulty_estimate' | 'serp_weakness_score' | 'opportunity_score' | 'relevance_score'
type SortDir = 'asc' | 'desc'

const INTENT_COLORS: Record<string, string> = {
  informational:  'border-blue-200   text-blue-600 bg-blue-50',
  commercial:     'border-purple-200 text-purple-600 bg-purple-50',
  transactional:  'border-emerald-200 text-emerald-700 bg-emerald-50',
  navigational:   'border-gray-200   text-gray-500',
}

const SOURCE_LABELS: Record<string, string> = {
  seed:                  'seed',
  autocomplete:          'auto',
  autocomplete_modifier: 'modifier',
  paa:                   'paa',
  related:               'related',
  claude:                'ai',
}

const SOURCE_COLORS: Record<string, string> = {
  seed:                  'bg-amber-50 text-amber-700 border-amber-200',
  autocomplete:          'bg-sky-50 text-sky-600 border-sky-200',
  autocomplete_modifier: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  paa:                   'bg-violet-50 text-violet-600 border-violet-200',
  related:               'bg-gray-50 text-gray-500 border-gray-200',
  claude:                'bg-emerald-50 text-emerald-700 border-emerald-200',
}

function scoreBg(value: number | null, invert = false) {
  if (value == null) return 'text-gray-300'
  const v = invert ? 100 - value : value
  if (v >= 65) return 'bg-emerald-50 text-emerald-700 font-semibold'
  if (v >= 40) return 'bg-amber-50 text-amber-700 font-semibold'
  return 'bg-red-50 text-red-600 font-semibold'
}

function ScoreCell({ value, invert = false, estimated = false }: { value: number | null; invert?: boolean; estimated?: boolean }) {
  if (value == null) return <span className="text-gray-300 text-sm">—</span>
  if (estimated) {
    return (
      <span className="inline-flex items-center justify-center w-10 h-7 rounded-lg text-xs text-gray-300 border border-dashed border-gray-200" title="Estimated — no SERP data for this keyword">
        ~{value}
      </span>
    )
  }
  return (
    <span className={`inline-flex items-center justify-center w-10 h-7 rounded-lg text-xs ${scoreBg(value, invert)}`}>
      {value}
    </span>
  )
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="h-3 w-3 opacity-30 ml-1" />
  return sortDir === 'asc'
    ? <ChevronUp   className="h-3 w-3 text-emerald-500 ml-1" />
    : <ChevronDown className="h-3 w-3 text-emerald-500 ml-1" />
}

function Th({
  label, col, sortKey, sortDir, onSort, className = '',
}: {
  label: string; col: SortKey; sortKey: SortKey; sortDir: SortDir
  onSort: (k: SortKey) => void; className?: string
}) {
  return (
    <th
      onClick={() => onSort(col)}
      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-800 whitespace-nowrap ${className}`}
    >
      <span className="inline-flex items-center">
        {label}
        <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </span>
    </th>
  )
}

const ALL_INTENTS = ['all', 'informational', 'commercial', 'transactional', 'navigational'] as const

const SCORE_GUIDE = [
  { label: 'Opportunity ≥ 45', desc: 'keyword ad alto potenziale' },
  { label: 'Difficulty ≤ 40',  desc: 'competizione bassa / accessibile' },
  { label: 'Weakness ≥ 35',    desc: 'SERP battibile (solo se reale, non stimata ~)' },
  { label: 'Relevance ≥ 70%',  desc: 'topic centrato sulla seed keyword' },
]

export function KeywordResultsTable({ results }: { results: Result[] }) {
  const [sortKey, setSortKey]       = useState<SortKey>('opportunity_score')
  const [sortDir, setSortDir]       = useState<SortDir>('desc')
  const [intentFilter, setFilter]   = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [guideOpen, setGuideOpen]   = useState(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('ks-guide-closed') !== '1'
  })

  const presentIntents = useMemo(
    () => ALL_INTENTS.filter(i => i === 'all' || results.some(r => r.intent === i)),
    [results],
  )

  const displayed = useMemo(() => {
    const filtered = intentFilter === 'all'
      ? results
      : results.filter(r => r.intent === intentFilter)

    return [...filtered].sort((a, b) => {
      const nullLast = sortDir === 'asc' ? Infinity : -Infinity
      const av = (a[sortKey] as number | string | null) ?? nullLast
      const bv = (b[sortKey] as number | string | null) ?? nullLast
      if (typeof av === 'string' && typeof bv === 'string')
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortDir === 'asc'
        ? (av as number) - (bv as number)
        : (bv as number) - (av as number)
    })
  }, [results, sortKey, sortDir, intentFilter])

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  function countIntent(intent: string) {
    return intent === 'all' ? results.length : results.filter(r => r.intent === intent).length
  }

  return (
    <div className="space-y-4">
      {/* Score guide */}
      {guideOpen && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-emerald-700">Come leggere i punteggi</span>
            <button
              onClick={() => { setGuideOpen(false); localStorage.setItem('ks-guide-closed', '1') }}
              className="text-emerald-400 hover:text-emerald-600 text-xs"
            >
              nascondi
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            {SCORE_GUIDE.map(({ label, desc }) => (
              <div key={label} className="flex gap-2">
                <span className="font-medium text-emerald-700 shrink-0">{label}</span>
                <span className="text-gray-500">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Intent filter pills */}
      <div className="flex gap-2 flex-wrap">
        {presentIntents.map(intent => (
          <button
            key={intent}
            onClick={() => setFilter(intent)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              intentFilter === intent
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {intent === 'all' ? 'All' : intent.charAt(0).toUpperCase() + intent.slice(1)}
            <span className="ml-1 opacity-70">({countIntent(intent)})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <Th label="Keyword"     col="keyword"            sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="min-w-[220px]" />
                <Th label="Vol/mo"      col="estimated_volume"   sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <Th label="Difficulty"  col="difficulty_estimate"   sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <Th label="Weakness"    col="serp_weakness_score" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <Th label="Opportunity" col="opportunity_score"  sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <Th label="Relevance"   col="relevance_score"    sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide min-w-[260px]">
                  Suggested Title
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {displayed.map(r => (
                <React.Fragment key={r.id}>
                  <tr
                    className="hover:bg-gray-50/80 cursor-pointer group transition-colors"
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  >
                    {/* Keyword + intent + source */}
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <ChevronRight
                          className={`h-3.5 w-3.5 text-gray-300 shrink-0 mt-0.5 transition-transform duration-150 ${
                            expandedId === r.id ? 'rotate-90 text-emerald-500' : 'group-hover:text-gray-400'
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 leading-snug">{r.keyword}</p>
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {r.intent && (
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 ${INTENT_COLORS[r.intent] ?? ''}`}
                              >
                                {r.intent}
                              </Badge>
                            )}
                            {r.keyword_source && (
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 ${SOURCE_COLORS[r.keyword_source] ?? ''}`}
                              >
                                {SOURCE_LABELS[r.keyword_source] ?? r.keyword_source}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Volume */}
                    <td className="px-4 py-3 tabular-nums text-gray-600">
                      {r.estimated_volume != null
                        ? r.estimated_volume.toLocaleString('en-US')
                        : <span className="text-gray-300">—</span>}
                    </td>

                    {/* Difficulty (invert: lower = better) */}
                    <td className="px-4 py-3">
                      <ScoreCell value={r.difficulty_estimate} invert estimated={!r.has_real_difficulty} />
                    </td>

                    {/* SERP Weakness */}
                    <td className="px-4 py-3">
                      <ScoreCell value={r.serp_weakness_score} estimated={!r.has_real_serp} />
                    </td>

                    {/* Opportunity */}
                    <td className="px-4 py-3">
                      <ScoreCell value={r.opportunity_score} estimated={!r.has_real_difficulty} />
                    </td>

                    {/* Relevance */}
                    <td className="px-4 py-3">
                      {r.relevance_score != null
                        ? <span className="text-xs tabular-nums text-gray-500">{Math.round(r.relevance_score * 100)}%</span>
                        : <span className="text-gray-300 text-sm">—</span>}
                    </td>

                    {/* Suggested Title */}
                    <td className="px-4 py-3 text-gray-500 max-w-[260px]">
                      <p className="truncate text-xs leading-relaxed">
                        {r.suggested_title ?? <span className="text-gray-300">—</span>}
                      </p>
                    </td>
                  </tr>

                  {/* Expanded row: content angle */}
                  {expandedId === r.id && (
                    <tr className="bg-emerald-50/30 border-l-2 border-emerald-400">
                      <td colSpan={7} className="px-10 py-4">
                        {r.suggested_title && (
                          <div className="mb-3">
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                              Suggested Title
                            </p>
                            <p className="text-sm font-medium text-gray-800">{r.suggested_title}</p>
                          </div>
                        )}
                        {r.content_angle && (
                          <div>
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                              Content Angle
                            </p>
                            <p className="text-sm text-gray-600 leading-relaxed">{r.content_angle}</p>
                          </div>
                        )}
                        {r.topic_cluster && (
                          <p className="text-xs text-gray-400 mt-3">
                            Cluster: <span className="text-gray-500 font-medium">{r.topic_cluster}</span>
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {displayed.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm">
            No results match the current filter.
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-right">
        {displayed.length} of {results.length} keywords · Click a row to expand
      </p>
    </div>
  )
}

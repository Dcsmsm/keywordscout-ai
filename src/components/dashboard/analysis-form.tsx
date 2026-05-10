'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { ROUTES } from '@/lib/constants'

const MARKETS = [
  { label: '🇺🇸 English (US)', language: 'en', country: 'us' },
  { label: '🇬🇧 English (UK)', language: 'en', country: 'gb' },
  { label: '🇮🇹 Italiano',      language: 'it', country: 'it' },
  { label: '🇪🇸 Español',       language: 'es', country: 'es' },
  { label: '🇫🇷 Français',      language: 'fr', country: 'fr' },
  { label: '🇩🇪 Deutsch',       language: 'de', country: 'de' },
  { label: '🇧🇷 Português',     language: 'pt', country: 'br' },
] as const

interface AnalysisFormProps {
  disabled?: boolean
}

export function AnalysisForm({ disabled }: AnalysisFormProps) {
  const router = useRouter()
  const [keyword, setKeyword] = useState('')
  const [market, setMarket] = useState<typeof MARKETS[number]>(MARKETS[0])
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!keyword.trim() || loading) return

    setLoading(true)
    try {
      const res = await fetch('/api/keyword/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          language: market.language,
          country: market.country,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Analysis failed')
      }

      if (!data.analysisId) {
        throw new Error('Analysis completed but no ID was returned.')
      }

      toast.success('Analysis complete!')
      router.push(ROUTES.analysis(data.analysisId))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (disabled) {
    return (
      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>
          You&apos;ve reached your monthly analysis limit.{' '}
          <a href={ROUTES.billing} className="font-semibold underline">
            Upgrade to continue
          </a>
          .
        </span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Enter a seed keyword (e.g. migliore caffettiera)"
            className="pl-10 h-12 text-sm"
            disabled={loading}
          />
        </div>
        <select
          value={`${market.language}-${market.country}`}
          onChange={(e) => {
            const found = MARKETS.find((m) => `${m.language}-${m.country}` === e.target.value)
            if (found) setMarket(found)
          }}
          disabled={loading}
          className="h-12 rounded-xl border border-input bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50"
        >
          {MARKETS.map((m) => (
            <option key={`${m.language}-${m.country}`} value={`${m.language}-${m.country}`}>
              {m.label}
            </option>
          ))}
        </select>
        <Button
          type="submit"
          disabled={!keyword.trim() || loading}
          className="h-12 px-6 bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Analyzing...
            </>
          ) : (
            'Analyze'
          )}
        </Button>
      </div>
    </form>
  )
}

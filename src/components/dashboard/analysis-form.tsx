'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { ROUTES } from '@/lib/constants'

interface AnalysisFormProps {
  disabled?: boolean
}

export function AnalysisForm({ disabled }: AnalysisFormProps) {
  const router = useRouter()
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!keyword.trim() || loading) return

    setLoading(true)
    try {
      const res = await fetch('/api/keyword/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Analysis failed')
      }

      if (!data.analysisId) {
        throw new Error('Analysis completed but no ID was returned. Check console for details.')
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
    <form onSubmit={handleSubmit} className="flex gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Enter a seed keyword (e.g. best coffee grinder)"
          className="pl-10 h-12 text-sm"
          disabled={loading}
        />
      </div>
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
    </form>
  )
}

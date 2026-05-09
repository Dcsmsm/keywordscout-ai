import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ROUTES } from '@/lib/constants'
import { ArrowRight, TrendingUp, Target, Zap } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50 -z-10" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-100/40 rounded-full blur-3xl -z-10" />

      <div className="max-w-4xl mx-auto text-center">
        <Badge className="mb-6 bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
          <Zap className="h-3 w-3 mr-1" />
          AI-native keyword research
        </Badge>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
          Find keywords you can{' '}
          <span className="text-emerald-500 relative">
            actually rank.
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
              <path d="M2 10 Q 150 2 298 10" stroke="#10b981" strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
          </span>
        </h1>

        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Stop chasing impossible keywords. KeywordScout analyzes SERP weakness, spots ranking opportunities, and suggests articles you can realistically win — powered by AI.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button
            size="lg"
            className="bg-emerald-500 hover:bg-emerald-600 text-white h-14 px-8 text-base rounded-xl"
            asChild
          >
            <Link href={ROUTES.signup}>
              Start for free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-14 px-8 text-base rounded-xl border-gray-200"
            asChild
          >
            <a href="#features">See how it works</a>
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto border-t border-gray-100 pt-10">
          {[
            { icon: Target, value: '3 providers', label: 'SERP data sources' },
            { icon: TrendingUp, value: 'AI scoring', label: 'Opportunity detection' },
            { icon: Zap, value: 'Instant', label: 'Analysis results' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="text-center">
              <Icon className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mock UI preview */}
      <div className="max-w-3xl mx-auto mt-16">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 text-center text-xs text-gray-400">keywordscout.ai/dashboard</div>
          </div>
          <div className="p-6">
            <div className="flex gap-3 mb-6">
              <input
                readOnly
                value="best coffee grinder under 50"
                className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 bg-gray-50"
              />
              <div className="bg-emerald-500 text-white px-5 py-3 rounded-lg text-sm font-medium">
                Analyze
              </div>
            </div>
            <div className="space-y-3">
              {[
                { kw: 'best coffee grinder under 50', score: 87, intent: 'Commercial', vol: '2.4K' },
                { kw: 'affordable burr grinder', score: 72, intent: 'Commercial', vol: '1.1K' },
                { kw: 'manual coffee grinder cheap', score: 91, intent: 'Transactional', vol: '900' },
              ].map((row) => (
                <div key={row.kw} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{row.kw}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{row.intent} · {row.vol}/mo</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Opportunity</div>
                      <div
                        className={`text-lg font-bold ${
                          row.score >= 80
                            ? 'text-emerald-500'
                            : row.score >= 60
                            ? 'text-yellow-500'
                            : 'text-red-400'
                        }`}
                      >
                        {row.score}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

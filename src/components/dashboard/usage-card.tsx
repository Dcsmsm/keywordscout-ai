import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'
import { PLAN_NAMES } from '@/types/analysis'

interface UsageCardProps {
  used: number
  limit: number
  plan: string
}

export function UsageCard({ used, limit, plan }: UsageCardProps) {
  const percentage = Math.min((used / limit) * 100, 100)
  const planName = PLAN_NAMES[plan as keyof typeof PLAN_NAMES] ?? plan

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Monthly Usage</h2>
          <p className="text-sm text-gray-500 mt-0.5">Resets on the 1st of each month</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={
              plan === 'free'
                ? 'border-gray-200 text-gray-600'
                : plan === 'pro'
                ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                : 'border-blue-200 text-blue-700 bg-blue-50'
            }
          >
            {planName}
          </Badge>
          {plan === 'free' && (
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white h-8" asChild>
              <Link href={ROUTES.billing}>Upgrade</Link>
            </Button>
          )}
        </div>
      </div>

      <Progress value={percentage} className="h-2 mb-3" />

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          <span className="font-semibold text-gray-900">{used}</span> / {limit} analyses used
        </span>
        {percentage >= 80 && (
          <span className="text-amber-600 font-medium">
            {limit - used} remaining
          </span>
        )}
      </div>
    </div>
  )
}

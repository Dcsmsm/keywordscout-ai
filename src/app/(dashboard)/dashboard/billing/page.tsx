'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Loader2 } from 'lucide-react'
import { STRIPE_PLANS } from '@/lib/stripe/config'
import { toast } from 'sonner'

export default function BillingPage() {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleUpgrade(plan: 'pro' | 'business') {
    setLoading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start checkout')
    } finally {
      setLoading(null)
    }
  }

  async function handleManage() {
    setLoading('portal')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else throw new Error(data.error)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to open billing portal')
    } finally {
      setLoading(null)
    }
  }

  const plans = Object.entries(STRIPE_PLANS).map(([key, plan]) => ({ key, ...plan }))

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Plans</h1>
        <p className="text-gray-500 mt-1">Manage your subscription and usage limits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isPro = plan.key === 'pro'
          return (
            <div
              key={plan.key}
              className={`relative bg-white rounded-2xl p-6 border ${
                isPro ? 'border-emerald-300 shadow-lg shadow-emerald-50' : 'border-gray-200'
              }`}
            >
              {isPro && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white border-0 text-xs">
                  Most popular
                </Badge>
              )}
              <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
              <div className="flex items-end gap-1 my-2">
                <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                {plan.price > 0 && <span className="text-gray-400 mb-0.5">/mo</span>}
              </div>
              <p className="text-sm text-gray-500 mb-4">{plan.analyses} analyses/month</p>

              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {plan.key === 'free' ? (
                <Button variant="outline" className="w-full" disabled>
                  Current plan
                </Button>
              ) : (
                <Button
                  className={`w-full ${isPro ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : ''}`}
                  onClick={() => handleUpgrade(plan.key as 'pro' | 'business')}
                  disabled={loading === plan.key}
                >
                  {loading === plan.key ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </Button>
              )}
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Manage Subscription</h2>
        <p className="text-sm text-gray-500 mb-4">
          Update payment method, view invoices, or cancel your plan.
        </p>
        <Button variant="outline" onClick={handleManage} disabled={loading === 'portal'}>
          {loading === 'portal' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Open billing portal
        </Button>
      </div>
    </div>
  )
}

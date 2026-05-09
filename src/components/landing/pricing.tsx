import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { STRIPE_PLANS } from '@/lib/stripe/config'
import { ROUTES } from '@/lib/constants'

export function Pricing() {
  const plans = Object.entries(STRIPE_PLANS).map(([key, plan]) => ({ key, ...plan }))

  return (
    <section id="pricing" className="py-24 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
          <p className="text-lg text-gray-500">No hidden fees. No seat limits. Cancel anytime.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map((plan) => {
            const isPro = plan.key === 'pro'
            return (
              <div
                key={plan.key}
                className={`relative bg-white rounded-2xl p-8 border ${
                  isPro
                    ? 'border-emerald-300 shadow-xl shadow-emerald-100/50 scale-105'
                    : 'border-gray-200 shadow-sm'
                }`}
              >
                {isPro && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white border-0">
                    Most popular
                  </Badge>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    {plan.price > 0 && (
                      <span className="text-gray-400 mb-1.5">/month</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {plan.analyses} keyword analyses/month
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full rounded-xl ${
                    isPro
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                  asChild
                >
                  <Link href={plan.price === 0 ? ROUTES.signup : ROUTES.signup}>
                    {plan.price === 0 ? 'Get started free' : `Start ${plan.name}`}
                  </Link>
                </Button>
              </div>
            )
          })}
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          All plans include a 7-day free trial on paid tiers. No credit card required for Free.
        </p>
      </div>
    </section>
  )
}

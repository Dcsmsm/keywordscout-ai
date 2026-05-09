export const STRIPE_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    analyses: 5,
    features: [
      '5 keyword analyses/month',
      'SERP weakness scoring',
      'Basic opportunity score',
      'Content angle suggestions',
    ],
  },
  pro: {
    name: 'Pro',
    price: 29,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    analyses: 100,
    features: [
      '100 keyword analyses/month',
      'Advanced SERP weakness analysis',
      'AI-powered content angles',
      'Keyword clustering',
      'Topic cluster generation',
      'Export results',
      'Priority support',
    ],
  },
  business: {
    name: 'Business',
    price: 99,
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID,
    analyses: 500,
    features: [
      '500 keyword analyses/month',
      'Everything in Pro',
      'Multi-provider SERP data',
      'Bulk keyword analysis',
      'Advanced AI scoring',
      'API access',
      'Dedicated support',
    ],
  },
} as const

export type PlanKey = keyof typeof STRIPE_PLANS

import { Target, BarChart2, Lightbulb, Layers, Shield, Zap } from 'lucide-react'

const features = [
  {
    icon: Target,
    title: 'SERP Weakness Analysis',
    description:
      'We scan the top 10 results for Reddit, Quora, weak domains, and outdated content — and score your real competition.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: BarChart2,
    title: 'Opportunity Score',
    description:
      "Combined AI score based on SERP weakness, search volume, and difficulty. Know instantly if a keyword is worth targeting.",
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Lightbulb,
    title: 'AI Content Angles',
    description:
      'Beyond keyword data — get specific content angles and article titles based on what the current SERP is missing.',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: Layers,
    title: 'Topic Clustering',
    description:
      'Automatically group related keywords into topic clusters to plan your content strategy around pillar articles.',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    icon: Shield,
    title: 'Multi-provider SERP',
    description:
      'Powered by SerpApi, Serper.dev, or DataForSEO — choose your provider or enable automatic fallback.',
    color: 'bg-teal-100 text-teal-600',
  },
  {
    icon: Zap,
    title: 'Built for creators',
    description:
      "No enterprise bloat. Just fast, actionable keyword data designed for bloggers and indie creators who want results.",
    color: 'bg-yellow-100 text-yellow-600',
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything you need to find rankable keywords
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            We skip the vanity metrics. KeywordScout focuses on what actually matters: can you rank for this keyword right now?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-2xl border border-gray-100 hover:border-emerald-100 hover:shadow-md transition-all duration-200"
            >
              <div className={`inline-flex p-3 rounded-xl ${feature.color} mb-4`}>
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

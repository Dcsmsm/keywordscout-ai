import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    q: "What makes KeywordScout different from Ahrefs or SEMrush?",
    a: "KeywordScout is built for creators, not agencies. We focus on one thing: finding keywords you can actually rank for. No overwhelming dashboards, no backlink trackers you'll never use. Just fast, AI-scored keyword opportunities.",
  },
  {
    q: "How is the Opportunity Score calculated?",
    a: "The Opportunity Score combines SERP weakness (presence of forums, weak domains, outdated results), estimated search volume, and keyword difficulty. A high score means you have a realistic shot at ranking with solid content.",
  },
  {
    q: "Which SERP data providers do you support?",
    a: "We support SerpApi, Serper.dev, and DataForSEO. You can configure your preferred provider in the admin panel, with automatic fallback if one fails. A mock provider is included for testing.",
  },
  {
    q: "What counts as an 'analysis'?",
    a: "One analysis = one seed keyword analyzed. Each analysis returns up to 8 keyword ideas, with SERP data, opportunity scores, content angles, and topic clusters for each.",
  },
  {
    q: "Can I export my keyword data?",
    a: "CSV export is available on Pro and Business plans. Free users can view and copy results directly from the dashboard.",
  },
  {
    q: "Do I need to add my own API key?",
    a: "The admin can configure a shared SERP provider key for all users. You can also connect your own SerpApi, Serper, or DataForSEO credentials if you prefer.",
  },
  {
    q: "What happens when I hit my monthly limit?",
    a: "You'll see a usage warning as you approach the limit. Once reached, new analyses are blocked until the next billing cycle — or you can upgrade instantly.",
  },
  {
    q: "Is there a free trial?",
    a: "The Free plan is free forever with 5 analyses/month. Paid plans include a 7-day free trial.",
  },
]

export function FAQ() {
  return (
    <section id="faq" className="py-24 px-4 bg-white">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently asked questions</h2>
          <p className="text-gray-500">Got more questions? Email us at hello@keywordscout.ai</p>
        </div>

        <Accordion className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-gray-100 rounded-xl px-5 data-[panel-open]:border-emerald-100"
            >
              <AccordionTrigger className="text-left font-medium text-gray-900 hover:no-underline py-5">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-gray-500 text-sm pb-5 leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

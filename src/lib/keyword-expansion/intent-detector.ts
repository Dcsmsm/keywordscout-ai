import { LanguageMiningConfig } from '@/lib/i18n/keyword-mining'

export type DetectedIntent =
  | 'informational'
  | 'commercial'
  | 'transactional'
  | 'navigational'
  | 'comparison'

export function detectIntent(keyword: string, config: LanguageMiningConfig): DetectedIntent {
  const text = keyword.toLowerCase()

  // Check in priority order: transactional > navigational > comparison > commercial > informational
  if (config.intentPatterns.transactional.some((p) => p.test(text))) return 'transactional'
  if (config.intentPatterns.navigational.some((p) => p.test(text))) return 'navigational'
  if (config.intentPatterns.comparison.some((p) => p.test(text))) return 'comparison'
  if (config.intentPatterns.commercial.some((p) => p.test(text))) return 'commercial'
  if (config.intentPatterns.informational.some((p) => p.test(text))) return 'informational'

  return 'informational'
}

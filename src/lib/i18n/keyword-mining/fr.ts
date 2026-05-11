import { LanguageMiningConfig } from './types'

export const fr: LanguageMiningConfig = {
  language: 'fr',

  questionModifiers: ['comment', 'quand', 'quel', 'quelle', 'combien', 'pourquoi', 'où', 'qui', 'qu est ce que', 'peut on'],
  commercialModifiers: ['meilleur', 'meilleure', 'prix', 'pas cher', 'avis', 'comparatif', 'acheter', 'promotion', 'soldes', 'économique', 'offre'],
  comparisonModifiers: ['vs', 'versus', 'comparaison', 'alternative', 'alternatives', 'différence entre', 'ou'],
  temporalModifiers: ['2025', '2026', "aujourd'hui", 'mis à jour', 'guide', 'nouveau', 'dernière version'],
  audienceModifiers: ['pour débutants', 'pour familles', 'pour entreprises', 'pour enfants', 'pour seniors', 'faire soi même', 'professionnel'],

  stopwords: new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de',
    'en', 'au', 'aux', 'avec', 'pour', 'par', 'sur', 'dans',
    'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car', 'si',
    'que', 'qui', 'quoi', 'dont', 'où', 'ne', 'pas',
    'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
    'me', 'te', 'se', 'mon', 'ton', 'son', 'ma', 'ta', 'sa',
    'ce', 'cet', 'cette', 'ces', 'tout', 'tous', 'très', 'plus',
  ]),

  intentPatterns: {
    informational: [
      /^comment\s/i, /^qu(e|'est)\s/i, /^quand\s/i, /^pourquoi\s/i, /^où\s/i,
      /\bguide\b/i, /\btutoriel\b/i, /\bexplication\b/i, /\bsignifie\b/i,
      /\bdéfinition\b/i, /\bapprendre\b/i, /\bconseils\b/i,
    ],
    commercial: [
      /\bmeilleur(e)?\b/i, /\bavis\b/i, /\bcomparatif\b/i, /\bnotation\b/i,
      /\bprix\b/i, /\bpas cher\b/i, /\boffre\b/i, /\bpromo\b/i,
      /\bsoldes\b/i,
    ],
    transactional: [
      /\bacheter\b/i, /\bcommander\b/i, /\bmagasin\b/i,
      /\bcoupon\b/i, /\babonnement\b/i,
    ],
    navigational: [
      /\bsite\b/i, /\bofficiel\b/i, /\bconnexion\b/i, /\btélécharger\b/i,
      /\bapp\b/i, /\binstaller\b/i, /\bse connecter\b/i,
    ],
    comparison: [
      /\bvs\b/i, /\bversus\b/i, /\bcomparais/i, /\balternatif/i,
      /\bdifférence\b/i, /\bmeilleur\b.+\bou\b/i,
    ],
  },

  normalization: { removeAccents: false, collapseSpaces: true },

  minTokens: 2,
  maxTokens: 7,
}

import { LanguageMiningConfig } from './types'

export const pt: LanguageMiningConfig = {
  language: 'pt',

  questionModifiers: ['como', 'quando', 'qual', 'quais', 'quanto', 'por que', 'onde', 'quem', 'o que é', 'posso'],
  commercialModifiers: ['melhor', 'melhores', 'preço', 'barato', 'barata', 'avaliações', 'opiniões', 'comprar', 'oferta', 'desconto', 'econômico'],
  comparisonModifiers: ['vs', 'versus', 'comparativo', 'alternativas', 'diferença entre', 'ou'],
  temporalModifiers: ['2025', '2026', 'hoje', 'atualizado', 'guia', 'novo', 'última versão'],
  audienceModifiers: ['para iniciantes', 'para famílias', 'para empresas', 'para crianças', 'para idosos', 'faça você mesmo', 'profissional'],

  stopwords: new Set([
    'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
    'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
    'ao', 'aos', 'à', 'às', 'pelo', 'pela', 'pelos', 'pelas',
    'por', 'com', 'para', 'sem', 'sob', 'sobre', 'entre',
    'e', 'ou', 'mas', 'nem', 'se', 'que', 'quem',
    'eu', 'tu', 'ele', 'ela', 'nós', 'vós', 'eles', 'elas',
    'me', 'te', 'se', 'lhe', 'nos', 'vos', 'não', 'já',
  ]),

  intentPatterns: {
    informational: [
      /^como\s/i, /^o que\s/i, /^quando\s/i, /^por que\s/i, /^onde\s/i,
      /\bguia\b/i, /\btutorial\b/i, /\bexplicação\b/i, /\bsignifica\b/i,
      /\bdefinição\b/i, /\baprender\b/i, /\bdicas\b/i,
    ],
    commercial: [
      /\bmelhor(es)?\b/i, /\bavaaliação\b/i, /\bopiniões\b/i,
      /\bpreço\b/i, /\bbarato\b/i, /\boferta\b/i, /\bdesconto\b/i,
      /\beconômic/i,
    ],
    transactional: [
      /\bcomprar\b/i, /\bpedir\b/i, /\bpedido\b/i, /\bloja\b/i,
      /\bcupom\b/i, /\bassinar\b/i,
    ],
    navigational: [
      /\bsite\b/i, /\boficial\b/i, /\bacesso\b/i, /\bbaixar\b/i,
      /\bapp\b/i, /\binstalar\b/i, /\bentrar\b/i,
    ],
    comparison: [
      /\bvs\b/i, /\bversus\b/i, /\bcomparativ/i, /\balternativ/i,
      /\bdiferença\b/i, /\bmelhor\b.+\bou\b/i,
    ],
  },

  normalization: { removeAccents: false, collapseSpaces: true },

  minTokens: 2,
  maxTokens: 7,
}

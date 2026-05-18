import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const BLOG_DIR = resolve(import.meta.dirname, '../../landing/blog')

const posts = [
  {
    slug: 'postura-correta-sentado',
    title: 'Postura Correta para Sentar: Guia Completo',
    metaTitle: 'Postura Correta para Sentar: Guia Completo para Trabalho e Home Office | PosturaCerta',
    description: 'Trabalha de casa sentado o dia todo? Aprenda a postura correta na cadeira do home office, com ajustes simples que evitam dor lombar e no pescoço.',
    ogDescription: 'Trabalha de casa sentado o dia todo? Veja como ajustar a postura na cadeira do home office e evitar dor lombar e no pescoço.',
    twitterDescription: 'Trabalha de casa sentado o dia todo? Veja como ajustar a postura na cadeira e evitar dor nas costas.',
    heroImage: '/blog/assets/postura-correta-sentado-hero.jpg',
    heroAlt: 'Ilustração mostrando a postura correta para sentar no computador com linhas de alinhamento',
    tag: 'ERGONOMIA',
    tagIcon: 'Monitor',
    date: '2026-05-18',
    readTime: '6 min',
    breadcrumbLabel: 'Postura Correta para Sentar',
    relatedSlugs: ['postura-correta', 'como-melhorar-postura', 'ergonomia-home-office'],
    cardExcerpt: 'Passa mais de 6 horas sentado trabalhando de casa? Veja como ajustar a postura na cadeira e terminar o dia sem dor lombar.',
  },
  {
    slug: 'postura-correta',
    title: 'Postura Correta: O Que É, Por Que Importa e Como Manter',
    metaTitle: 'Postura Correta: O Que É, Por Que Importa e Como Manter no Dia a Dia | PosturaCerta',
    description: 'O que é postura correta e por que ela é essencial para quem trabalha de home office. Guia prático para manter o alinhamento e evitar dores crônicas.',
    ogDescription: 'O que é postura correta e por que é essencial para quem faz home office. Guia prático para manter o alinhamento no dia a dia de trabalho remoto.',
    twitterDescription: 'Postura correta para quem trabalha de casa: o que é, por que importa e como manter sem complicação.',
    heroImage: '/blog/assets/postura-correta-hero.jpg',
    heroAlt: 'Ilustração de alinhamento corporal e coluna vertebral com postura correta',
    tag: 'SAÚDE',
    tagIcon: 'HeartPulse',
    date: '2026-05-18',
    readTime: '7 min',
    breadcrumbLabel: 'Postura Correta',
    relatedSlugs: ['postura-correta-sentado', 'postura-coluna', 'postura-errada'],
    cardExcerpt: 'Postura correta não é ficar duro na cadeira. Entenda o que a ciência diz e como aplicar no seu dia de trabalho remoto.',
  },
  {
    slug: 'como-melhorar-postura',
    title: 'Como Melhorar a Postura: 7 Hábitos para o Dia a Dia',
    metaTitle: 'Como Melhorar a Postura: 7 Hábitos Que Funcionam no Dia a Dia | PosturaCerta',
    description: 'Como melhorar a postura no home office com 7 hábitos que encaixam na rotina de quem trabalha de casa. Dicas práticas de ergonomia e exercícios rápidos.',
    ogDescription: '7 hábitos para melhorar a postura no home office. Dicas que encaixam entre calls e entregas sem atrapalhar sua rotina.',
    twitterDescription: '7 hábitos para melhorar a postura de quem trabalha de casa. Encaixam na rotina sem parar tudo.',
    heroImage: '/blog/assets/como-melhorar-postura-hero.jpg',
    heroAlt: 'Ilustração de hábitos para melhorar a postura: alongamento, ergonomia e exercícios',
    tag: 'HÁBITOS',
    tagIcon: 'Sparkles',
    date: '2026-05-18',
    readTime: '6 min',
    breadcrumbLabel: 'Como Melhorar a Postura',
    relatedSlugs: ['postura-correta', 'postura-correta-sentado', 'postura-errada'],
    cardExcerpt: '7 hábitos fáceis de encaixar na rotina do home office para melhorar a postura sem precisar parar tudo.',
  },
  {
    slug: 'postura-coluna',
    title: 'Postura e Coluna: Como Proteger Sua Coluna no Trabalho',
    metaTitle: 'Postura e Coluna: Como Proteger Sua Coluna Vertebral no Trabalho | PosturaCerta',
    description: 'Como a postura no home office afeta sua coluna vertebral. Conheça o alinhamento ideal e aplique ajustes para prevenir dores e lesões no trabalho remoto.',
    ogDescription: 'Como a postura no home office afeta a coluna. Entenda o alinhamento ideal e previna dores no trabalho remoto.',
    twitterDescription: 'Sua coluna sofre com 8h sentado em casa? Saiba como proteger a coluna no home office com ajustes simples.',
    heroImage: '/blog/assets/postura-coluna-hero.jpg',
    heroAlt: 'Ilustração anatômica da coluna vertebral mostrando postura correta e pontos de pressão',
    tag: 'COLUNA',
    tagIcon: 'Bone',
    date: '2026-05-18',
    readTime: '6 min',
    breadcrumbLabel: 'Postura e Coluna',
    relatedSlugs: ['postura-correta', 'postura-correta-sentado', 'como-melhorar-postura'],
    cardExcerpt: 'Sua coluna não foi feita para 8h na mesma posição. Saiba o que acontece quando a postura falha e como proteger a coluna no trabalho remoto.',
  },
  {
    slug: 'ergonomia-home-office',
    title: 'Ergonomia no Home Office: Monte um Espaço que Cuida de Você',
    metaTitle: 'Ergonomia no Home Office: Como Montar um Espaço que Cuida da Sua Postura | PosturaCerta',
    description: 'Checklist de ergonomia para home office: altura da mesa, posição do monitor, cadeira ideal e hábitos que protegem sua postura no trabalho remoto.',
    ogDescription: 'Aprenda a aplicar ergonomia no home office: altura da mesa, posição do monitor, cadeira ideal e hábitos para proteger sua postura.',
    twitterDescription: 'Aprenda a aplicar ergonomia no home office: altura da mesa, posição do monitor, cadeira ideal e hábitos para proteger sua postura.',
    heroImage: '/blog/assets/ergonomia-home-office-hero.jpg',
    heroAlt: 'Setup ergonômico ideal de home office com cadeira, monitor e mesa ajustados',
    tag: 'HOME OFFICE',
    tagIcon: 'Home',
    date: '2026-05-18',
    readTime: '6 min',
    breadcrumbLabel: 'Ergonomia no Home Office',
    relatedSlugs: ['postura-correta-sentado', 'como-melhorar-postura', 'postura-coluna'],
    cardExcerpt: 'Checklist prático para transformar qualquer canto da casa num setup ergonômico que protege sua postura o dia todo.',
  },
  {
    slug: 'postura-errada',
    title: 'Postura Errada: Sinais, Consequências e Como Corrigir',
    metaTitle: 'Postura Errada: Sinais, Consequências e Como Corrigir Antes que Doa | PosturaCerta',
    description: 'Sinais de postura errada que quem trabalha de casa ignora: dor no pescoço, ombro travado, lombar queimando. Saiba como corrigir antes que vire crônico.',
    ogDescription: 'Trabalha de casa e sente dor no fim do dia? Esses são sinais de postura errada. Veja como corrigir antes que vire crônico.',
    twitterDescription: 'Sinais de postura errada que quem faz home office ignora. Corrija antes que vire dor crônica.',
    heroImage: '/blog/assets/postura-errada-hero.jpg',
    heroAlt: 'Comparação visual de postura errada vs postura correta ao sentar no computador',
    tag: 'PREVENÇÃO',
    tagIcon: 'ShieldAlert',
    date: '2026-05-18',
    readTime: '6 min',
    breadcrumbLabel: 'Postura Errada',
    relatedSlugs: ['postura-correta', 'como-melhorar-postura', 'postura-coluna'],
    cardExcerpt: 'Dor no pescoço, ombro travado, lombar queimando? Esses são sinais de postura errada. Saiba como corrigir antes que vire crônico.',
  },
]

function extractField(html, regex) {
  const m = html.match(regex)
  return m ? m[1].trim() : ''
}

function extractBody(html) {
  const start = html.indexOf('<div class="article__body">')
  if (start === -1) return ''
  const innerStart = html.indexOf('>', start) + 1
  let depth = 1, i = innerStart
  while (i < html.length && depth > 0) {
    if (html.slice(i, i + 4) === '<div') depth++
    if (html.slice(i, i + 6) === '</div>') { depth--; if (depth === 0) break }
    i++
  }
  return html.slice(innerStart, i).trim()
}

function extractLead(html) {
  const m = html.match(/class="article__lead"[^>]*>([\s\S]*?)<\/p>/)
  return m ? m[1].trim() : ''
}

const results = posts.map(p => {
  const html = readFileSync(resolve(BLOG_DIR, `${p.slug}.html`), 'utf-8')
  return { ...p, lead: extractLead(html), body: extractBody(html) }
})

let output = `export interface BlogPost {
  slug: string
  title: string
  metaTitle: string
  description: string
  ogDescription: string
  twitterDescription: string
  heroImage: string
  heroAlt: string
  tag: string
  tagIcon: string
  lead: string
  date: string
  readTime: string
  breadcrumbLabel: string
  body: string
  relatedSlugs: string[]
  cardExcerpt: string
}

const posts: BlogPost[] = [\n`

for (const p of results) {
  output += `  {\n`
  for (const [k, v] of Object.entries(p)) {
    if (k === 'body' || k === 'lead') {
      output += `    ${k}: ${JSON.stringify(v)},\n`
    } else if (Array.isArray(v)) {
      output += `    ${k}: ${JSON.stringify(v)},\n`
    } else {
      output += `    ${k}: ${JSON.stringify(v)},\n`
    }
  }
  output += `  },\n`
}

output += `]

export function getAllPosts(): BlogPost[] {
  return posts
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find(p => p.slug === slug)
}

export function getAllSlugs(): string[] {
  return posts.map(p => p.slug)
}
`

writeFileSync(resolve(import.meta.dirname, '../src/content/posts.ts'), output)
console.log(`Generated posts.ts with ${results.length} posts`)
for (const p of results) {
  console.log(`  ${p.slug}: lead=${p.lead.length}chars, body=${p.body.length}chars`)
}

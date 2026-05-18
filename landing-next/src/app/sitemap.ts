import type { MetadataRoute } from 'next'
import { getAllSlugs } from '@/content/posts'

const BASE = 'https://posturacerta.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const blogPages = getAllSlugs().map((slug) => ({
    url: `${BASE}/blog/${slug}`,
    lastModified: new Date('2026-05-18'),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: BASE,
      lastModified: new Date('2026-05-18'),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE}/blog`,
      lastModified: new Date('2026-05-18'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...blogPages,
  ]
}

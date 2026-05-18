import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getAllPosts } from '@/content/posts'
import BlogNav from '@/components/BlogNav'
import BlogFooter from '@/components/BlogFooter'

export const metadata: Metadata = {
  title: 'Blog PosturaCerta | Dicas de Postura, Ergonomia e Saúde no Home Office',
  description:
    'Artigos sobre postura correta, ergonomia no home office, saúde da coluna e hábitos para quem trabalha de casa. Conteúdo prático e direto ao ponto.',
  openGraph: {
    title: 'Blog PosturaCerta | Dicas de Postura, Ergonomia e Saúde no Home Office',
    description:
      'Artigos sobre postura correta, ergonomia no home office e hábitos para quem trabalha de casa.',
    type: 'website',
    url: 'https://posturacerta.com/blog',
    siteName: 'PosturaCerta',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog PosturaCerta | Postura e Ergonomia no Home Office',
    description:
      'Artigos práticos sobre postura, ergonomia e saúde para quem trabalha de casa.',
  },
  alternates: {
    canonical: 'https://posturacerta.com/blog',
  },
}

export default function BlogPage() {
  const posts = getAllPosts()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog PosturaCerta',
    description:
      'Artigos sobre postura correta, ergonomia no home office e saúde da coluna.',
    url: 'https://posturacerta.com/blog',
    publisher: {
      '@type': 'Organization',
      name: 'PosturaCerta',
      logo: {
        '@type': 'ImageObject',
        url: 'https://posturacerta.com/assets/logo.png',
      },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogNav />
      <main className="blog">
        <header className="blog__header">
          <h1 className="blog__title">Blog PosturaCerta</h1>
          <p className="blog__subtitle">
            Postura, ergonomia e saúde para quem trabalha de casa.
          </p>
        </header>
        <div className="blog__grid">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="blog-card"
            >
              <Image
                className="blog-card__img"
                src={post.heroImage}
                alt={post.title}
                width={600}
                height={315}
                loading="lazy"
              />
              <span className="blog-card__tag">{post.tag}</span>
              <h2 className="blog-card__title">{post.title}</h2>
              <p className="blog-card__excerpt">{post.description}</p>
              <span className="blog-card__meta">18 mai 2026</span>
            </Link>
          ))}
        </div>
      </main>
      <BlogFooter />
    </>
  )
}

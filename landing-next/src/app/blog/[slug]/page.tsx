import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllSlugs, getPostBySlug } from '@/content/posts'
import BlogNav from '@/components/BlogNav'
import BlogFooter from '@/components/BlogFooter'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  return {
    title: post.metaTitle,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.ogDescription,
      type: 'article',
      url: `https://posturacerta.com/blog/${post.slug}`,
      images: [{ url: `https://posturacerta.com${post.heroImage}` }],
      publishedTime: post.date,
      siteName: 'PosturaCerta',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.twitterDescription,
      images: [`https://posturacerta.com${post.heroImage}`],
    },
    alternates: {
      canonical: `https://posturacerta.com/blog/${post.slug}`,
    },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const relatedPosts = post.relatedSlugs
    .map((s) => getPostBySlug(s))
    .filter(Boolean)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Organization', name: 'PosturaCerta' },
    publisher: {
      '@type': 'Organization',
      name: 'PosturaCerta',
      logo: {
        '@type': 'ImageObject',
        url: 'https://posturacerta.com/assets/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://posturacerta.com/blog/${post.slug}`,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogNav />
      <article className="article">
        <ol className="article__breadcrumb">
          <li>
            <Link href="/">PosturaCerta</Link>
          </li>
          <li>›</li>
          <li>
            <Link href="/blog">Blog</Link>
          </li>
          <li>›</li>
          <li>{post.breadcrumbLabel}</li>
        </ol>

        <Image
          className="article__hero"
          src={post.heroImage}
          alt={post.heroAlt}
          width={1200}
          height={630}
          priority
        />

        <header className="article__header">
          <span className="article__tag">{post.tag}</span>
          <h1 className="article__title">{post.title}</h1>
          <p className="article__lead">{post.lead}</p>
          <p className="article__meta">
            18 de maio de 2026 · Leitura de {post.readTime}
          </p>
        </header>

        <div
          className="article__body"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />

        <aside className="article__related">
          <h2>Leia também</h2>
          <div className="article__related-list">
            {relatedPosts.map((related) => (
              <Link
                key={related!.slug}
                href={`/blog/${related!.slug}`}
                className="article__related-link"
              >
                <strong>{related!.title}</strong>
                <span>{related!.description}</span>
              </Link>
            ))}
          </div>
        </aside>
      </article>
      <BlogFooter />
    </>
  )
}

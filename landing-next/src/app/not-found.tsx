import Link from 'next/link'
import BlogNav from '@/components/BlogNav'
import BlogFooter from '@/components/BlogFooter'

export default function NotFound() {
  return (
    <>
      <BlogNav />
      <main className="not-found">
        <h1>404</h1>
        <p>Página não encontrada.</p>
        <nav className="not-found__links">
          <Link href="/">Voltar ao início</Link>
          <Link href="/blog">Ver o blog</Link>
        </nav>
      </main>
      <BlogFooter />
    </>
  )
}

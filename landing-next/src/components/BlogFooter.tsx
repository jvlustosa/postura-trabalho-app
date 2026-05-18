import Link from 'next/link'

export default function BlogFooter() {
  return (
    <footer className="blog-foot">
      <p>PosturaCerta · © 2026</p>
      <nav>
        <Link href="/">Início</Link>
        <a href="mailto:contato@posturacerta.com">Contato</a>
      </nav>
    </footer>
  )
}

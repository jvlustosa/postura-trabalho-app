import Link from 'next/link'
import Image from 'next/image'

export default function BlogNav() {
  return (
    <nav className="blog-nav">
      <Link href="/" className="blog-nav__brand">
        <Image
          src="/assets/logo.png"
          alt="PosturaCerta"
          className="blog-nav__logo"
          width={32}
          height={32}
        />
      </Link>
      <ul className="blog-nav__links">
        <li>
          <Link href="/blog">Blog</Link>
        </li>
        <li>
          <Link
            href="https://wa.me/5512982218937?text=Tenho%20interesse%20no%20plano%20vital%C3%ADcio"
            className="button button--filled"
            target="_blank"
            rel="noopener noreferrer"
          >
            Garantir licença
          </Link>
        </li>
      </ul>
    </nav>
  )
}

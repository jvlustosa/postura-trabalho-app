import type { Metadata, Viewport } from 'next'
import { Roboto } from 'next/font/google'
import '@/styles/landing.css'
import '@/styles/blog.css'

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#006a6a' },
    { media: '(prefers-color-scheme: dark)', color: '#0e1514' },
  ],
}

export const metadata: Metadata = {
  icons: {
    icon: '/assets/logo.png',
    apple: '/assets/icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={roboto.className}>
      <body>{children}</body>
    </html>
  )
}

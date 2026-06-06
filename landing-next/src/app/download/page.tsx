import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Download, ChevronDown, Camera, Monitor, ShieldCheck } from 'lucide-react'

import { getPlatformDownloads } from '@/lib/github-release'
import { RELEASES_PAGE, SITE_URL, WA_LINK } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Baixar PosturaCerta · Windows, Linux e macOS',
  description:
    'Baixe o PosturaCerta grátis para testar. Instalador para Windows, AppImage e .deb para Linux. Sem conta, sem nuvem.',
  openGraph: {
    title: 'Baixar PosturaCerta',
    description: 'Download direto. Instale em minutos e comece a monitorar sua postura.',
    url: `${SITE_URL}/download`,
  },
}

const QUICK_START = [
  {
    Icon: Download,
    title: 'Baixe o instalador',
    copy: 'Escolha o arquivo do seu sistema operacional e salve no computador.',
  },
  {
    Icon: Monitor,
    title: 'Abra o app',
    copy: 'Windows: execute o instalador. Linux: AppImage com dois cliques ou instale o .deb. macOS: abra o DMG.',
  },
  {
    Icon: Camera,
    title: 'Permita a câmera e calibre',
    copy: 'O onboarding leva menos de 2 minutos. Depois disso o monitoramento roda sozinho.',
  },
] as const

const HELP = [
  {
    q: 'Windows pediu confirmação no SmartScreen',
    a: 'Normal em apps sem assinatura digital da Microsoft. Clique em "Mais informações" → "Executar assim mesmo".',
  },
  {
    q: 'macOS não deixa abrir',
    a: 'Clique com o botão direito no app → "Abrir" → confirme. Ou em Ajustes → Privacidade e Segurança → "Abrir mesmo assim".',
  },
  {
    q: 'Linux: AppImage não abre',
    a: 'Clique com o botão direito → Propriedades → marque "Permitir executar como programa". Ou no terminal: chmod +x PosturaCerta*.AppImage',
  },
  {
    q: 'A câmera não funciona / está em uso',
    a: 'Feche Meet, Zoom ou OBS que estejam usando a webcam. Nas configurações do app você pode escolher uma câmera virtual (OBS) para compartilhar.',
  },
  {
    q: 'Não aparece nenhum download',
    a: 'A versão pode ainda não ter sido publicada. Confira a página de releases no GitHub ou fale conosco pelo WhatsApp.',
  },
] as const

interface PlatformBlockProps {
  title: string
  cssClass: string
  links: { label: string; url: string; hint?: string }[]
  emptyCopy: string
}

const PlatformBlock = ({ title, cssClass, links, emptyCopy }: PlatformBlockProps) => (
  <article className="download-platform">
    <span className={`platform-card__icon brand-icon ${cssClass}`} aria-hidden="true" />
    <h2 className="download-platform__title">{title}</h2>
    {links.length > 0 ? (
      <div className="download-platform__actions">
        {links.map((link) => (
          <div className="download-platform__action" key={link.url}>
            <a className="button button--filled download-platform__btn" href={link.url} download>
              <Download aria-hidden="true" />
              <span>{link.label}</span>
            </a>
            {link.hint ? <p className="download-platform__hint">{link.hint}</p> : null}
          </div>
        ))}
      </div>
    ) : (
      <p className="download-platform__empty">{emptyCopy}</p>
    )}
  </article>
)

export default async function DownloadPage() {
  const downloads = await getPlatformDownloads()

  return (
    <div className="app-shell">
      <header className="app-bar">
        <Link className="app-bar__brand" href="/" aria-label="PosturaCerta">
          <Image className="app-bar__logo" src="/assets/logo.png" alt="" width={32} height={32} />
          <span className="app-bar__title">PosturaCerta</span>
        </Link>
        <div className="app-bar__actions">
          <Link className="app-bar__link" href="/#beneficios">
            Benefícios
          </Link>
          <Link className="app-bar__link" href="/#preco">
            Investimento
          </Link>
          <Link className="app-bar__link" href="/blog">
            Blog
          </Link>
          <a
            className="button button--filled app-bar__cta"
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
          >
            Garantir licença
          </a>
        </div>
      </header>

      <main className="app-content download-page">
        <section className="download-hero" aria-labelledby="download-title">
          <span className="eyebrow eyebrow--plain">Download grátis</span>
          <h1 id="download-title" className="download-hero__title">
            Baixe, instale e use em minutos
          </h1>
          <p className="download-hero__lead">
            Sem criar conta. Sem nuvem. Escolha o arquivo do seu sistema, abra o app, permita a
            câmera e calibre — pronto.
            {downloads.version ? (
              <>
                {' '}
                Versão atual: <strong>v{downloads.version}</strong>.
              </>
            ) : null}
          </p>
          {downloads.windows.length + downloads.linux.length + downloads.macos.length === 0 ? (
            <p className="download-hero__notice">
              Os instaladores ainda não estão publicados aqui.{' '}
              <a href={RELEASES_PAGE} target="_blank" rel="noopener noreferrer">
                Ver releases no GitHub
              </a>{' '}
              ou{' '}
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
                peça acesso antecipado no WhatsApp
              </a>
              .
            </p>
          ) : null}
        </section>

        <section className="section" aria-labelledby="platforms-dl-title">
          <header className="section__head">
            <h2 id="platforms-dl-title" className="section__title">
              Escolha seu sistema
            </h2>
          </header>
          <div className="download-platforms">
            <PlatformBlock
              title="Windows"
              cssClass="brand-icon--windows"
              links={downloads.windows}
              emptyCopy="Em breve na página de releases. Windows 10 ou superior."
            />
            <PlatformBlock
              title="Linux"
              cssClass="brand-icon--linux"
              links={downloads.linux}
              emptyCopy="AppImage e .deb na página de releases."
            />
            <PlatformBlock
              title="macOS"
              cssClass="brand-icon--apple"
              links={downloads.macos}
              emptyCopy="DMG para Intel e Apple Silicon. Pode pedir confirmação extra na primeira abertura."
            />
          </div>
          <p className="download-fallback">
            Prefere escolher manualmente?{' '}
            <a href={downloads.releasesPage} target="_blank" rel="noopener noreferrer">
              Todas as versões no GitHub
            </a>
          </p>
        </section>

        <section className="section" aria-labelledby="quickstart-title">
          <header className="section__head">
            <h2 id="quickstart-title" className="section__title">
              Primeiro uso em 3 passos
            </h2>
          </header>
          <ol className="steps">
            {QUICK_START.map(({ Icon, title, copy }) => (
              <li className="step" key={title}>
                <span className="step__icon">
                  <Icon aria-hidden="true" />
                </span>
                <div className="step__text">
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="section section--faq" id="ajuda" aria-labelledby="help-title">
          <header className="section__head section__head--faq">
            <span className="eyebrow eyebrow--plain">Ajuda</span>
            <h2 id="help-title" className="section__title">
              Problemas comuns
            </h2>
          </header>
          <div className="faq faq-panel" role="group" aria-label="Ajuda com instalação">
            {HELP.map(({ q, a }) => (
              <details className="faq__item" key={q}>
                <summary>
                  <span className="faq__q">{q}</span>
                  <span className="faq__chev" aria-hidden="true">
                    <ChevronDown />
                  </span>
                </summary>
                <div className="faq__body">
                  <p>{a}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="download-upsell" aria-label="Licença vitalícia">
          <ShieldCheck aria-hidden="true" />
          <div>
            <h2 className="download-upsell__title">Gostou? Garanta o vitalício</h2>
            <p className="download-upsell__copy">
              Teste à vontade. A licença vitalícia (R$ 149) inclui atualizações e vale em até 3
              máquinas suas.
            </p>
          </div>
          <a
            className="button button--filled"
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
          >
            Falar no WhatsApp
          </a>
        </section>

        <footer className="app-foot">
          <div className="app-foot__brand">
            <Image src="/assets/logo.png" alt="" width={24} height={24} />
            <span>PosturaCerta · © 2026</span>
          </div>
          <div className="app-foot__links">
            <Link href="/">Início</Link>
            <Link href="/#preco">Investimento</Link>
            <Link href="/blog">Blog</Link>
            <a href="mailto:contato@posturacerta.com">Suporte</a>
          </div>
        </footer>
      </main>
    </div>
  )
}

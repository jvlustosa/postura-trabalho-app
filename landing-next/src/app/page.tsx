import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  Home,
  ShieldCheck,
  Zap,
  BellOff,
  HeartPulse,
  LockKeyhole,
  SlidersHorizontal,
  TrendingUp,
  Feather,
  Download,
  Camera,
  Briefcase,
  Sparkles,
  Check,
  ChevronDown,
} from 'lucide-react'

const WA_LINK =
  'https://wa.me/5512982218937?text=Tenho%20interesse%20no%20plano%20vital%C3%ADcio'

export const metadata: Metadata = {
  title: 'PosturaCerta · Postura correta no home office sem ficar se policiando',
  description:
    'PosturaCerta — app desktop que avisa quando sua postura escorrega no home office. Sem nuvem, sem assinatura. Ideal para quem trabalha de casa e sente dor nas costas no fim do dia.',
  openGraph: {
    siteName: 'PosturaCerta',
    title: 'PosturaCerta · Postura alinhada no home office, sem ficar se policiando',
    description:
      'Trabalha de casa e termina o dia com dor nas costas? O PosturaCerta usa sua webcam para avisar quando a postura escorrega. 100% local, sem mensalidade.',
    type: 'website',
    url: 'https://posturacerta.com/',
    locale: 'pt_BR',
    images: [
      {
        url: 'https://posturacerta.com/assets/hero-postura-guia.jpg',
        width: 1024,
        height: 660,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PosturaCerta · Postura alinhada no home office, sem ficar se policiando',
    description:
      'Trabalha de casa e sente dor nas costas? PosturaCerta avisa discretamente quando sua postura sai do eixo. 100% no seu PC.',
    images: ['https://posturacerta.com/assets/hero-postura-guia.jpg'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PosturaCerta',
  description:
    'App desktop que monitora sua postura no home office usando a webcam e avisa quando você escorrega. 100% local, sem nuvem.',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Windows, Linux',
  offers: {
    '@type': 'Offer',
    price: '149.00',
    priceCurrency: 'BRL',
    availability: 'https://schema.org/InStock',
  },
  audience: {
    '@type': 'Audience',
    audienceType: 'Profissionais adultos que trabalham de home office',
  },
  url: 'https://posturacerta.com',
}

const BENEFITS = [
  {
    Icon: HeartPulse,
    title: 'Menos tensão, mais rendimento',
    copy: 'Depois de horas entre calls e entregas, pescoço e lombar cobram. Um aviso na hora certa evita o acúmulo de tensão que só aparece no final do expediente.',
  },
  {
    Icon: LockKeyhole,
    title: 'Privacidade que dá para explicar',
    copy: 'O processamento é local. A ideia é simples: a webcam ajuda a medir postura no seu computador, sem enviar imagem para servidor nem terceiros.',
  },
  {
    Icon: BellOff,
    title: 'Chega de alarme constrangedor',
    copy: 'Nada de alarme no meio da daily. Só um toque visual discreto quando o corpo realmente sai do eixo — você corrige sem ninguém perceber na call.',
  },
  {
    Icon: SlidersHorizontal,
    title: 'Do seu biotipo, não de um PDF',
    copy: 'Calibra em segundos na postura em que você trabalha bem. Nada de padrão genérico de \u201cassim que deveria ser\u201d.',
  },
  {
    Icon: TrendingUp,
    title: 'Histórico que mostra padrão, não culpa',
    copy: 'Veja em quais horários do expediente você tende a curvar mais — depois do almoço? Na call das 16h? — e se a semana está melhorando, com dado objetivo.',
  },
  {
    Icon: Feather,
    title: 'Tão leve que você esquece que está aberto',
    copy: 'Roda em segundo plano sem brigar por CPU. Ideal para quem já vive com Slack, Zoom, navegador e planilha abertos ao mesmo tempo.',
  },
] as const

const GALLERY_STEPS = [
  {
    src: '/assets/manual-ia-step-1.png',
    alt: 'Ilustração em perfil: pessoa na cadeira com costas curvadas e olhar baixo para o monitor.',
    caption: 'Antes — postura escorrega',
  },
  {
    src: '/assets/manual-ia-step-2.png',
    alt: 'Pessoa ereta; linhas tracejadas na coluna e olhos na altura da tela; calibração na webcam.',
    caption: 'Calibra — seu eixo de referência',
  },
  {
    src: '/assets/manual-ia-step-3.png',
    alt: 'Leve desalinhamento; na tela, aviso discreto do app.',
    caption: 'Aviso — na hora certa, sem drama',
  },
  {
    src: '/assets/manual-ia-step-4.png',
    alt: 'Postura alinhada; na tela, indício de hábito melhor ao longo do tempo.',
    caption: 'Resultado — postura alinhada no trabalho',
  },
] as const

const PLATFORMS = [
  {
    cssClass: 'brand-icon--windows',
    title: 'Windows',
    copy: 'Instalador clássico para o notebook ou desktop do home office. Windows 10 em diante.',
  },
  {
    cssClass: 'brand-icon--linux',
    title: 'Linux',
    copy: 'AppImage ou .deb para devs e profissionais que preferem Linux no trabalho remoto.',
  },
  {
    cssClass: 'brand-icon--apple',
    title: 'macOS',
    copy: 'Em desenvolvimento. Quando sair, sua licença atual já habilita, sem pagar de novo.',
  },
] as const

const HOW_IT_WORKS = [
  {
    Icon: Download,
    title: 'Compra e receba no e-mail',
    copy: 'Você fecha com a gente (hoje pelo WhatsApp) e recebe instalador e chave na caixa de entrada logo após a confirmação.',
  },
  {
    Icon: Camera,
    title: 'Calibra em um instante',
    copy: 'Sente na posição em que trabalha bem; em poucos segundos o app registra esse alinhamento como referência.',
  },
  {
    Icon: Briefcase,
    title: 'Volta ao trabalho de verdade',
    copy: 'Ele observa de forma contínua e só chama atenção quando a postura realmente foge do que você calibrou.',
  },
] as const

const PRICE_FEATURES = [
  'Windows, Linux e, em breve, macOS na mesma chave',
  'Atualizações futuras incluídas enquanto o produto existir',
  'Análise de postura 100% offline no seu hardware',
  'Calibração personalizada + linha do tempo do hábito',
  'Sem criar conta, sem pixel de anúncio rondando o app',
] as const

const FAQ = [
  {
    q: 'É vitalício mesmo?',
    a: 'Sim: um único pagamento de R$ 149 e a licença permanece válida para você, com melhorias e correções futuras incluídas enquanto mantivermos o produto ativo.',
  },
  {
    q: 'Dá pra instalar em mais de um computador?',
    a: 'Sim, até três máquinas suas. Ideal para quem alterna entre notebook e desktop no home office.',
  },
  {
    q: 'O app manda imagens pra algum servidor?',
    a: 'Não há upload contínuo de vídeo para nuvem: o fluxo de câmera é analisado no próprio computador para gerar o feedback de postura.',
  },
  {
    q: 'E se eu não gostar?',
    a: 'Sete dias para testar com calma. Se não fizer sentido, devolvemos o valor, com processo simples, sem letra miúda escondida.',
  },
] as const

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="app-shell">
        {/* ── Header ── */}
        <header className="app-bar">
          <a className="app-bar__brand" href="#top" aria-label="PosturaCerta">
            <Image
              className="app-bar__logo"
              src="/assets/logo.png"
              alt=""
              width={32}
              height={32}
            />
            <span className="app-bar__title">PosturaCerta</span>
          </a>
          <div className="app-bar__actions">
            <a className="app-bar__link" href="#beneficios">Benefícios</a>
            <a className="app-bar__link" href="#como-funciona">Como funciona</a>
            <a className="app-bar__link" href="#preco">Investimento</a>
            <Link className="app-bar__link" href="/blog">Blog</Link>
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

        <main className="app-content" id="top">
          {/* ── Hero ── */}
          <section className="hero" aria-labelledby="hero-title">
            <div className="hero__copy">
              <span className="eyebrow">
                <Home aria-hidden="true" />
                <span>Para quem trabalha de casa</span>
              </span>
              <h1 id="hero-title" className="hero__title">
                Termina o expediente sem dor nas costas.
                <br />
                Sua postura no piloto automático.
              </h1>
              <p className="hero__lead">
                Quem faz home office sabe: depois de horas em call e tarefas, o corpo cobra.
                O PosturaCerta usa a webcam do seu PC para avisar na hora que a postura escorrega
                — sem nuvem, sem assinatura, sem interromper seu fluxo de trabalho.
              </p>

              <div className="hero__cta">
                <a
                  className="button button--filled button--cta"
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Check aria-hidden="true" />
                  <span>Quero o vitalício por R$ 149</span>
                </a>
                <p className="hero__hint">
                  Pagamento único, uso vitalício. Windows e Linux hoje; macOS na mesma licença quando lançar.
                </p>
              </div>

              <ul className="hero__features" role="list">
                <li className="feature-item">
                  <ShieldCheck aria-hidden="true" />
                  <span>100% no seu PC</span>
                </li>
                <li className="feature-item">
                  <Zap aria-hidden="true" />
                  <span>Leve no dia a dia</span>
                </li>
                <li className="feature-item">
                  <BellOff aria-hidden="true" />
                  <span>Aviso discreto</span>
                </li>
              </ul>
            </div>

            <div className="hero__visual">
              <figure className="hero__photo hero__photo--guide">
                <Image
                  src="/assets/hero-postura-guia.jpg"
                  width={1024}
                  height={660}
                  alt="Ilustração comparando postura correta e incorreta na mesa: coluna alinhada, olhos na altura do monitor e pés apoiados, versus corpo curvado e olhar baixo."
                  priority
                />
              </figure>
            </div>
          </section>

          {/* ── Benefits ── */}
          <section className="section" id="beneficios" aria-labelledby="benefits-title">
            <header className="section__head">
              <span className="eyebrow eyebrow--plain">Benefícios</span>
              <h3 id="benefits-title" className="section__title">
                O que muda no seu dia de trabalho remoto
              </h3>
              <p className="section__subtitle">
                Não é app de academia. É um assistente invisível para quem passa 6, 8, 10 horas
                na cadeira de casa — e termina o dia sentindo no corpo.
              </p>
            </header>

            {/* Manual gallery */}
            <div className="manual-gallery" aria-labelledby="manual-gallery-title">
              <div className="manual-gallery__head">
                <h4 id="manual-gallery-title" className="manual-gallery__title">
                  Passo a passo
                </h4>
                <p className="manual-gallery__subtitle">
                  Do hábito antigo ao ganho com o app — quatro quadros em sequência.
                </p>
              </div>
              <div className="manual-gallery__grid" role="list">
                {GALLERY_STEPS.map((step, i) => (
                  <figure className="manual-gallery__item" role="listitem" key={step.src}>
                    <span className="manual-gallery__step" aria-hidden="true">
                      {i + 1}
                    </span>
                    <div className="manual-gallery__frame">
                      <Image
                        className="manual-gallery__img"
                        src={step.src}
                        width={960}
                        height={540}
                        alt={step.alt}
                        loading="lazy"
                        sizes="(max-width: 767px) 85vw, (max-width: 1023px) 45vw, 22vw"
                      />
                    </div>
                    <figcaption className="manual-gallery__cap">{step.caption}</figcaption>
                  </figure>
                ))}
              </div>
            </div>

            {/* Benefit cards */}
            <div className="benefits">
              {BENEFITS.map(({ Icon, title, copy }) => (
                <article className="benefit-card" key={title}>
                  <span className="benefit-card__icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <h4 className="benefit-card__title">{title}</h4>
                  <p className="benefit-card__copy">{copy}</p>
                </article>
              ))}
            </div>
          </section>

          {/* ── Platforms ── */}
          <section className="section" aria-labelledby="platforms-title">
            <header className="section__head">
              <span className="eyebrow eyebrow--plain">Compatível</span>
              <h3 id="platforms-title" className="section__title">
                Um app nativo em cada sistema
              </h3>
              <p className="section__subtitle">
                A mesma licença vale para o ecossistema que você usa hoje e para o macOS assim que
                a build estiver pronta.
              </p>
            </header>

            <div className="platforms">
              {PLATFORMS.map(({ cssClass, title, copy }) => (
                <div className="platform-card" key={title}>
                  <span
                    className={`platform-card__icon brand-icon ${cssClass}`}
                    aria-hidden="true"
                  />
                  <h4 className="platform-card__title">{title}</h4>
                  <p className="platform-card__copy">{copy}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── How it works ── */}
          <section className="section" id="como-funciona" aria-labelledby="howto-title">
            <header className="section__head">
              <span className="eyebrow eyebrow--plain">Como funciona</span>
              <h3 id="howto-title" className="section__title">
                Três passos. Daí em diante, é no piloto automático.
              </h3>
            </header>

            <ol className="steps">
              {HOW_IT_WORKS.map(({ Icon, title, copy }) => (
                <li className="step" key={title}>
                  <span className="step__icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <div className="step__text">
                    <h4>{title}</h4>
                    <p>{copy}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* ── Pricing ── */}
          <section className="section" id="preco" aria-labelledby="price-title">
            <header className="section__head section__head--center">
              <span className="eyebrow eyebrow--plain">Investimento</span>
              <h3 id="price-title" className="section__title">
                Pague uma vez. Use por anos.
              </h3>
              <p className="section__subtitle">
                Sem fatura recorrente esquecida no cartão. Uma licença vitalícia cobre o que você
                precisa hoje e as evoluções que ainda vão sair.
              </p>
            </header>

            <div className="price-card" id="comprar">
              <div className="price-card__tag">
                <Sparkles aria-hidden="true" />
                <span>Lançamento · vitalício</span>
              </div>
              <div className="price-card__amount">
                <span className="price-card__currency">R$</span>
                <span className="price-card__value">149</span>
                <span className="price-card__period">lifetime</span>
              </div>
              <p className="price-card__lead">
                Tudo o que lançarmos de relevante para o app entra na sua licença, sem upgrade pago
                escondido.
              </p>

              <ul className="price-card__list">
                {PRICE_FEATURES.map((feat) => (
                  <li key={feat}>
                    <Check aria-hidden="true" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <a
                className="button button--filled button--cta price-card__cta"
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Check aria-hidden="true" />
                <span>Reservar vitalício no WhatsApp por R$ 149</span>
              </a>

              <p className="price-card__small">
                Depois da confirmação, você recebe instalador e instruções de ativação por e-mail.
              </p>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section
            className="section section--faq"
            id="duvidas"
            aria-labelledby="faq-title"
          >
            <header className="section__head section__head--faq">
              <span className="eyebrow eyebrow--plain">Dúvidas</span>
              <h3 id="faq-title" className="section__title">Perguntas frequentes</h3>
              <p className="section__subtitle section__subtitle--faq">
                Licença, instalação, privacidade e política de arrependimento, direto ao ponto.
              </p>
            </header>

            <div className="faq faq-panel" role="group" aria-label="Perguntas frequentes">
              {FAQ.map(({ q, a }) => (
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

          {/* ── Footer ── */}
          <footer className="app-foot">
            <div className="app-foot__brand">
              <Image src="/assets/logo.png" alt="" width={24} height={24} />
              <span>PosturaCerta · © 2026</span>
            </div>
            <div className="app-foot__links">
              <a href="#preco">Investimento</a>
              <a href="#duvidas">Dúvidas</a>
              <Link href="/blog">Blog</Link>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
              >
                Garantir licença
              </a>
              <a href="mailto:contato@posturacerta.com">Suporte</a>
            </div>
          </footer>
        </main>
      </div>
    </>
  )
}

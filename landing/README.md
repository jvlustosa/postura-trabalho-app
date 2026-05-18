# Landing: PosturaCerta

Landing page estática para divulgação do app desktop. Mesmo design (Material 3) do app, com detecção automática de SO e links para os releases do GitHub.

## Deploy na Vercel

A pasta `landing/` é um site estático puro (HTML + CSS + JS). Não precisa de build.

### Opção 1: CLI

```bash
cd landing
npx vercel
# ou para produção:
npx vercel --prod
```

### Opção 2: Importar via Dashboard

1. Acesse https://vercel.com/new
2. Importe o repositório `jvlustosa/postura-certa`
3. Em **Root Directory** selecione `landing`
4. Framework Preset: **Other** (sem build)
5. Deploy

## Como funciona o download

O `app.js` chama `https://api.github.com/repos/jvlustosa/postura-certa/releases/latest` no browser, classifica os assets por extensão (`.exe`, `.AppImage`, `.deb`, `.dmg`) e monta o card de download para o SO detectado.

Se a API do GitHub estiver indisponível ou sem rate limit, cai para um link direto para a página de releases.

## Estrutura

```
landing/
├── index.html       # Markup + SEO
├── styles.css       # Material 3 tokens compartilhados com o app
├── app.js           # OS detection + GitHub Releases API
├── vercel.json      # Headers e cache
└── assets/
    ├── logo.png
    ├── icon.png
    └── hero-postura-guia.jpg   # ilustração hero (postura certa vs errada)
```

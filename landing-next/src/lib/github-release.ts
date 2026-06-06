import { GITHUB_REPO, RELEASES_PAGE } from './site'

export interface DownloadLink {
  label: string
  url: string
  hint?: string
}

export interface PlatformDownloads {
  version: string | null
  releasesPage: string
  windows: DownloadLink[]
  linux: DownloadLink[]
  macos: DownloadLink[]
}

const emptyDownloads = (): PlatformDownloads => ({
  version: null,
  releasesPage: RELEASES_PAGE,
  windows: [],
  linux: [],
  macos: [],
})

type AssetKind =
  | 'linux-appimage'
  | 'linux-deb'
  | 'win-setup'
  | 'win-portable'
  | 'mac-dmg'
  | 'mac-dmg-arm'
  | 'mac-zip'

const classifyAsset = (name: string): AssetKind | null => {
  const lower = name.toLowerCase()
  if (lower.endsWith('.appimage')) return 'linux-appimage'
  if (lower.endsWith('.deb')) return 'linux-deb'
  if (lower.endsWith('.dmg')) {
    return lower.includes('arm64') || lower.includes('-arm-') ? 'mac-dmg-arm' : 'mac-dmg'
  }
  if (lower.endsWith('.exe')) {
    return lower.includes('setup') ? 'win-setup' : 'win-portable'
  }
  if (lower.endsWith('.zip') && (lower.includes('mac') || lower.includes('darwin'))) {
    return 'mac-zip'
  }
  return null
}

const labelFor = (kind: AssetKind): DownloadLink => {
  switch (kind) {
    case 'linux-appimage':
      return {
        label: 'AppImage',
        url: '',
        hint: 'Baixe, dê dois cliques e pronto. Funciona na maioria das distros.',
      }
    case 'linux-deb':
      return { label: 'Debian / Ubuntu (.deb)', url: '', hint: 'Para quem prefere instalar pelo gerenciador de pacotes.' }
    case 'win-setup':
      return {
        label: 'Instalador Windows',
        url: '',
        hint: 'Recomendado. Cria atalho no menu Iniciar.',
      }
    case 'win-portable':
      return { label: 'Portable (.exe)', url: '', hint: 'Sem instalação — útil em PC corporativo.' }
    case 'mac-dmg-arm':
      return { label: 'macOS Apple Silicon', url: '', hint: 'M1, M2, M3 e posteriores.' }
    case 'mac-dmg':
      return { label: 'macOS Intel', url: '', hint: 'Macs com processador Intel.' }
    case 'mac-zip':
      return { label: 'macOS (zip)', url: '', hint: 'Alternativa ao DMG.' }
  }
}

export async function getPlatformDownloads(): Promise<PlatformDownloads> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'PosturaCerta-Landing',
      },
      next: { revalidate: 600 },
    })

    if (!res.ok) return emptyDownloads()

    const data = (await res.json()) as {
      tag_name?: string
      assets?: { name: string; browser_download_url: string }[]
    }

    const version = data.tag_name?.replace(/^v/, '') ?? null
    const result = emptyDownloads()
    result.version = version

    const seen = new Set<AssetKind>()

    for (const asset of data.assets ?? []) {
      const kind = classifyAsset(asset.name)
      if (!kind || seen.has(kind)) continue
      seen.add(kind)

      const link = labelFor(kind)
      link.url = asset.browser_download_url

      if (kind.startsWith('linux')) result.linux.push(link)
      else if (kind.startsWith('win')) result.windows.push(link)
      else result.macos.push(link)
    }

    const sortByKind = (kinds: AssetKind[], list: DownloadLink[]): DownloadLink[] =>
      kinds
        .map((k) => list.find((l) => l.label === labelFor(k).label))
        .filter((l): l is DownloadLink => Boolean(l))

    result.linux = sortByKind(['linux-appimage', 'linux-deb'], result.linux)
    result.windows = sortByKind(['win-setup', 'win-portable'], result.windows)

    return result
  } catch {
    return emptyDownloads()
  }
}

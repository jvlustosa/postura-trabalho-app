(() => {
  const REPO = 'jvlustosa/postura-trabalho';
  const RELEASES_PAGE = `https://github.com/${REPO}/releases`;
  const LATEST_PAGE = `https://github.com/${REPO}/releases/latest`;

  const OS_LABELS = { windows: 'Windows', linux: 'Linux', mac: 'macOS' };
  const PRIMARY_OS = 'windows';

  const renderLucide = () => {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  };

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const classifyAsset = (name) => {
    const lower = name.toLowerCase();

    if (lower.endsWith('.exe')) {
      return {
        os: 'windows',
        label: lower.includes('setup') ? 'Instalador Windows (NSIS)' : 'Windows Portable',
        kind: lower.includes('setup') ? 'installer' : 'portable',
        icon: 'package',
      };
    }
    if (lower.endsWith('.appimage')) {
      return { os: 'linux', label: 'Linux AppImage', kind: 'appimage', icon: 'box' };
    }
    if (lower.endsWith('.deb')) {
      return { os: 'linux', label: 'Debian / Ubuntu (.deb)', kind: 'deb', icon: 'box' };
    }
    if (lower.endsWith('.rpm')) {
      return { os: 'linux', label: 'Fedora / RHEL (.rpm)', kind: 'rpm', icon: 'box' };
    }
    if (lower.endsWith('.dmg')) {
      return { os: 'mac', label: 'macOS (.dmg)', kind: 'dmg', icon: 'package' };
    }
    if (lower.endsWith('.zip') && lower.includes('mac')) {
      return { os: 'mac', label: 'macOS (.zip)', kind: 'zip', icon: 'package' };
    }
    return null;
  };

  const renderAssets = (assets, os) => {
    const panel = document.getElementById('os-panel');
    if (!panel) return;

    const filtered = assets.filter((a) => a.os === os);
    panel.innerHTML = '';

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'os-panel__empty';

      if (os === 'mac') {
        empty.innerHTML = `Build para macOS ainda não disponível.
          <a href="${RELEASES_PAGE}" target="_blank" rel="noopener">Ver releases</a>`;
      } else {
        empty.innerHTML = `Sem builds para ${OS_LABELS[os]} na última release.
          <a href="${RELEASES_PAGE}" target="_blank" rel="noopener">Ver releases</a>`;
      }

      panel.appendChild(empty);
      renderLucide();
      return;
    }

    filtered.forEach((asset) => {
      const row = document.createElement('div');
      row.className = 'asset-row';
      row.innerHTML = `
        <span class="asset-row__icon">
          <i data-lucide="${asset.icon || 'package'}"></i>
        </span>
        <span class="asset-row__text">
          <span class="asset-row__label">${asset.label}</span>
          <span class="asset-row__meta">${asset.name} · ${formatSize(asset.size)}</span>
        </span>
        <a class="button button--tonal asset-row__cta" href="${asset.url}" target="_blank" rel="noopener">
          <i data-lucide="download"></i>
          <span>Baixar</span>
        </a>
      `;
      panel.appendChild(row);
    });

    renderLucide();
  };

  const renderFallbackPanel = (os) => {
    const panel = document.getElementById('os-panel');
    if (!panel) return;
    panel.innerHTML = '';

    const empty = document.createElement('div');
    empty.className = 'os-panel__empty';
    empty.innerHTML = `Não foi possível listar os arquivos agora.
      <a href="${RELEASES_PAGE}" target="_blank" rel="noopener">Abrir releases no GitHub</a>`;
    panel.appendChild(empty);
    renderLucide();
  };

  const updatePrimaryButton = (os, assets) => {
    const btn = document.getElementById('primary-download');
    const label = document.getElementById('primary-download-label');
    const hint = document.getElementById('download-hint');
    if (!btn || !label || !hint) return;

    const filtered = assets ? assets.filter((a) => a.os === os) : [];
    const preferred =
      filtered.find((a) => a.kind === 'installer') ||
      filtered.find((a) => a.kind === 'appimage') ||
      filtered.find((a) => a.kind === 'dmg') ||
      filtered[0];

    if (preferred) {
      btn.href = preferred.url;
      label.textContent = `Baixar para ${OS_LABELS[os]}`;
      hint.textContent = `${preferred.label} · ${formatSize(preferred.size)}`;
    } else {
      btn.href = RELEASES_PAGE;
      label.textContent = `Ver releases no GitHub`;
      hint.textContent = `Sem build automático de ${OS_LABELS[os]} ainda.`;
    }
  };

  const setActiveTab = (os) => {
    document.querySelectorAll('.os-tab').forEach((tab) => {
      const isActive = tab.dataset.os === os;
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  };

  const init = async () => {
    renderLucide();

    const initialOs = PRIMARY_OS;
    setActiveTab(initialOs);

    const versionPill = document.getElementById('version-pill');
    const versionText = document.getElementById('version-pill-text');
    const hint = document.getElementById('download-hint');
    if (hint) hint.textContent = `Buscando última versão para Windows…`;

    let assets = [];
    let version = '';

    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      version = (data.tag_name || '').replace(/^v/, '');
      if (versionText) versionText.textContent = version ? `v${version}` : 'mais recente';

      assets = (data.assets || [])
        .map((a) => {
          const cls = classifyAsset(a.name);
          if (!cls) return null;
          return {
            name: a.name,
            url: a.browser_download_url,
            size: a.size,
            os: cls.os,
            label: cls.label,
            kind: cls.kind,
            icon: cls.icon,
          };
        })
        .filter(Boolean);

      renderAssets(assets, initialOs);
      updatePrimaryButton(initialOs, assets);
    } catch (err) {
      console.warn('Falha ao carregar release:', err);
      if (versionText) versionText.textContent = 'GitHub';
      renderFallbackPanel(initialOs);
      const btn = document.getElementById('primary-download');
      const label = document.getElementById('primary-download-label');
      if (btn) btn.href = LATEST_PAGE;
      if (label) label.textContent = `Baixar para ${OS_LABELS[initialOs]}`;
      if (hint) hint.textContent = `Abrindo página de releases do GitHub.`;
    }

    document.querySelectorAll('.os-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const os = tab.dataset.os;
        if (!os) return;
        setActiveTab(os);
        if (assets.length > 0) {
          renderAssets(assets, os);
          updatePrimaryButton(os, assets);
        } else {
          renderFallbackPanel(os);
        }
      });
    });
  };

  const start = () => {
    if (window.lucide) {
      init();
    } else {
      window.addEventListener('load', init, { once: true });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

import { BrowserWindow, Menu, screen } from 'electron';

export interface FloatingState {
  state: string;
  label: string;
  score: number;
}

const FLOATING_WIDTH = 252;
const FLOATING_HEIGHT = 60;
const FLOATING_MARGIN = 16;
const DEFAULT_OPACITY = 0.92;

let floatingWindow: BrowserWindow | null = null;
let currentOpacity = DEFAULT_OPACITY;

const buildHtml = (initialOpacity: number): string => `<!doctype html>
<html lang="pt-br">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'" />
    <title>Postura</title>
    <style>
      :root {
        color-scheme: dark;
        --card-opacity: ${initialOpacity};
        --state-color: #9aa0a6;
        --state-tint: rgba(154, 160, 166, 0.18);
        --card-bg: rgba(14, 16, 20, 0.88);
      }
      *, *::before, *::after { box-sizing: border-box; }
      html, body {
        margin: 0;
        height: 100%;
        font-family: -apple-system, "Segoe UI", Roboto, system-ui, sans-serif;
        background: transparent;
        color: #f7fafa;
        -webkit-user-select: none;
        user-select: none;
        overflow: hidden;
      }
      body {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 6px;
      }
      .card {
        position: relative;
        display: grid;
        grid-template-columns: 38px 1fr auto;
        align-items: center;
        gap: 10px;
        width: 100%;
        height: 100%;
        padding: 0 6px 0 8px;
        border: 0;
        border-radius: 999px;
        font-family: inherit;
        color: inherit;
        text-align: left;
        cursor: pointer;
        background: var(--card-bg);
        box-shadow:
          0 12px 28px rgba(0, 0, 0, 0.45),
          inset 0 0 0 1px rgba(255, 255, 255, 0.06);
        backdrop-filter: blur(16px) saturate(140%);
        -webkit-backdrop-filter: blur(16px) saturate(140%);
        opacity: var(--card-opacity, 0.92);
        transition:
          background 220ms ease,
          transform 160ms ease,
          opacity 160ms ease,
          box-shadow 220ms ease;
      }
      .card:hover {
        opacity: 1;
        transform: translateY(-1px);
        box-shadow:
          0 18px 38px rgba(0, 0, 0, 0.55),
          inset 0 0 0 1px rgba(255, 255, 255, 0.10);
      }
      .card:active { transform: translateY(0); }
      .card:focus { outline: none; }
      .card__indicator {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: var(--state-tint);
        flex-shrink: 0;
      }
      .card__dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--state-color);
        box-shadow: 0 0 12px var(--state-color);
      }
      .card__info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
        line-height: 1.1;
      }
      .card__label {
        font-size: 12.5px;
        font-weight: 600;
        letter-spacing: 0.01em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .card__meta {
        font-size: 10.5px;
        font-weight: 500;
        opacity: 0.6;
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.02em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .card__action {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        height: 34px;
        padding: 0 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        font-size: 10.5px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.92);
        transition: background 160ms ease, color 160ms ease;
      }
      .card:hover .card__action {
        background: rgba(255, 255, 255, 0.18);
        color: #fff;
      }
      .card__action-icon {
        font-size: 13px;
        line-height: 1;
        transform: translate(0, -1px);
      }
      .card[data-state="good"] {
        --state-color: #5ee27a;
        --state-tint: rgba(94, 226, 122, 0.18);
        --card-bg: rgba(18, 50, 32, 0.88);
      }
      .card[data-state="warning"] {
        --state-color: #ffc857;
        --state-tint: rgba(255, 200, 87, 0.20);
        --card-bg: rgba(70, 50, 14, 0.88);
      }
      .card[data-state="bad"] {
        --state-color: #ff6b78;
        --state-tint: rgba(255, 107, 120, 0.22);
        --card-bg: rgba(82, 14, 22, 0.90);
      }
      .card[data-state="away"] {
        --state-color: #9bb5e6;
        --state-tint: rgba(155, 181, 230, 0.22);
        --card-bg: rgba(22, 32, 56, 0.92);
      }
      .card[data-state="calibrating"] .card__dot,
      .card[data-state="away"] .card__dot {
        animation: pulse 1.2s ease-in-out infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 0.45; transform: scale(0.85); }
        50% { opacity: 1; transform: scale(1.05); }
      }
      .drag {
        position: absolute;
        inset: 0;
        -webkit-app-region: drag;
        pointer-events: none;
      }
      .tooltip {
        position: fixed;
        left: 50%;
        bottom: calc(100% + 6px);
        transform: translateX(-50%) translateY(4px);
        max-width: 220px;
        padding: 6px 10px;
        border-radius: 8px;
        background: rgba(20, 22, 26, 0.96);
        color: #f7fafa;
        font-size: 11.5px;
        line-height: 1.35;
        font-weight: 500;
        white-space: normal;
        text-align: center;
        box-shadow: 0 8px 22px rgba(0, 0, 0, 0.45);
        pointer-events: none;
        opacity: 0;
        transition: opacity 120ms ease, transform 120ms ease;
        z-index: 10;
      }
      .tooltip[data-visible="true"] {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    </style>
  </head>
  <body>
    <div
      class="card"
      id="card"
      data-state="calibrating"
      role="button"
      tabindex="0"
      aria-describedby="tooltip"
    >
      <span class="card__indicator" aria-hidden="true">
        <span class="card__dot"></span>
      </span>
      <span class="card__info">
        <span class="card__label" id="label">Calibrando</span>
        <span class="card__meta" id="meta">aguarde…</span>
      </span>
      <span class="card__action" aria-hidden="true">
        <span class="card__action-text">Abrir</span>
        <span class="card__action-icon">↗</span>
      </span>
      <span class="tooltip" id="tooltip" role="tooltip">Clique para abrir o app · Botão direito para mais opções</span>
    </div>
    <div class="drag" aria-hidden="true"></div>
    <script>
      var SCORE_STATES = ['good', 'warning', 'bad'];
      var META_FALLBACK = {
        calibrating: 'aguarde…',
        inactive: 'monitor pausado',
        away: 'sem você na câmera',
        'camera-error': 'sem câmera',
        'model-error': 'erro no modelo',
      };
      window.__setFloatingOpacity = function (opacity) {
        try {
          if (typeof opacity === 'number' && isFinite(opacity)) {
            document.documentElement.style.setProperty('--card-opacity', String(opacity));
          }
        } catch (error) {
          // ignore
        }
      };
      window.__setFloating = function (payload) {
        try {
          var card = document.getElementById('card');
          var label = document.getElementById('label');
          var meta = document.getElementById('meta');
          if (!card || !label || !meta) return;
          if (!payload || typeof payload !== 'object') return;
          if (typeof payload.state === 'string') card.setAttribute('data-state', payload.state);
          if (typeof payload.label === 'string') label.textContent = payload.label;
          var state = card.getAttribute('data-state');
          var hasScore = SCORE_STATES.indexOf(state) !== -1;
          if (hasScore && typeof payload.score === 'number' && isFinite(payload.score)) {
            meta.textContent = Math.round(payload.score) + ' pts';
          } else {
            meta.textContent = META_FALLBACK[state] || '';
          }
        } catch (error) {
          // ignore
        }
      };
      var card = document.getElementById('card');
      var tooltip = document.getElementById('tooltip');
      var tooltipTimer = null;
      var TOOLTIP_DELAY = 650;
      var showTooltip = function () {
        if (!tooltip) return;
        if (tooltipTimer !== null) window.clearTimeout(tooltipTimer);
        tooltipTimer = window.setTimeout(function () {
          if (tooltip) tooltip.setAttribute('data-visible', 'true');
          tooltipTimer = null;
        }, TOOLTIP_DELAY);
      };
      var hideTooltip = function () {
        if (tooltipTimer !== null) {
          window.clearTimeout(tooltipTimer);
          tooltipTimer = null;
        }
        if (tooltip) tooltip.removeAttribute('data-visible');
      };
      if (card) {
        card.addEventListener('mouseenter', showTooltip);
        card.addEventListener('mouseleave', hideTooltip);
        card.addEventListener('focus', showTooltip);
        card.addEventListener('blur', hideTooltip);
        card.addEventListener('click', function () {
          hideTooltip();
          if (window.postureApp && window.postureApp.restoreFromFloating) {
            window.postureApp.restoreFromFloating();
          }
        });
        card.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            hideTooltip();
            if (window.postureApp && window.postureApp.restoreFromFloating) {
              window.postureApp.restoreFromFloating();
            }
          } else if (event.key === 'Escape') {
            hideTooltip();
          }
        });
        card.addEventListener('contextmenu', function (event) {
          event.preventDefault();
          hideTooltip();
          if (window.postureApp && window.postureApp.openFloatingMenu) {
            window.postureApp.openFloatingMenu();
          }
        });
      }
    </script>
  </body>
</html>`;

const positionBottomRight = (window: BrowserWindow): void => {
  const display = screen.getPrimaryDisplay();
  const { workArea } = display;
  const x = workArea.x + workArea.width - FLOATING_WIDTH - FLOATING_MARGIN;
  const y = workArea.y + workArea.height - FLOATING_HEIGHT - FLOATING_MARGIN;
  window.setPosition(x, y);
};

export const showPostureFloating = (preloadPath: string, opacity = DEFAULT_OPACITY): void => {
  currentOpacity = opacity;

  if (floatingWindow && !floatingWindow.isDestroyed()) {
    setPostureFloatingOpacity(opacity);
    floatingWindow.showInactive();
    return;
  }

  const window = new BrowserWindow({
    width: FLOATING_WIDTH,
    height: FLOATING_HEIGHT,
    frame: false,
    resizable: false,
    movable: true,
    transparent: true,
    hasShadow: false,
    skipTaskbar: true,
    fullscreenable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    focusable: true,
    alwaysOnTop: true,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.setAlwaysOnTop(true, 'screen-saver');
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  window.setIgnoreMouseEvents(false);
  positionBottomRight(window);

  window.on('closed', () => {
    if (floatingWindow === window) {
      floatingWindow = null;
    }
  });

  void window
    .loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(buildHtml(currentOpacity))}`)
    .then(() => {
      if (!window.isDestroyed()) {
        window.showInactive();
      }
    })
    .catch(() => undefined);

  floatingWindow = window;
};

export const hidePostureFloating = (): void => {
  if (floatingWindow && !floatingWindow.isDestroyed()) {
    floatingWindow.destroy();
  }
  floatingWindow = null;
};

export const updatePostureFloating = (payload: FloatingState): void => {
  if (!floatingWindow || floatingWindow.isDestroyed()) {
    return;
  }

  const safePayload = JSON.stringify(payload);

  floatingWindow.webContents
    .executeJavaScript(`window.__setFloating && window.__setFloating(${safePayload})`)
    .catch(() => undefined);
};

export const isPostureFloatingVisible = (): boolean =>
  Boolean(floatingWindow && !floatingWindow.isDestroyed() && floatingWindow.isVisible());

export const setPostureFloatingOpacity = (opacity: number): void => {
  currentOpacity = opacity;
  if (!floatingWindow || floatingWindow.isDestroyed()) return;
  floatingWindow.webContents
    .executeJavaScript(`window.__setFloatingOpacity && window.__setFloatingOpacity(${opacity})`)
    .catch(() => undefined);
};

export const openFloatingMenu = (
  options: { onRestore: () => void; onQuit: () => void },
): void => {
  if (!floatingWindow || floatingWindow.isDestroyed()) return;

  const menu = Menu.buildFromTemplate([
    {
      label: 'Abrir Postura Trabalho',
      click: () => options.onRestore(),
    },
    { type: 'separator' },
    {
      label: 'Sair',
      click: () => options.onQuit(),
    },
  ]);

  menu.popup({ window: floatingWindow });
};

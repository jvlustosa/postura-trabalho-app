import { BrowserWindow, screen } from 'electron';

export type AlertLevel = 'warning' | 'bad';

const ALERT_WIDTH = 360;
const ALERT_HEIGHT = 110;
const ALERT_MARGIN = 20;

let alertWindow: BrowserWindow | null = null;

const themes: Record<
  AlertLevel,
  { bg: string; accent: string; iconBg: string; icon: string; title: string }
> = {
  warning: {
    bg: 'rgba(28, 22, 8, 0.95)',
    accent: '#f59e0b',
    iconBg: 'rgba(245, 158, 11, 0.18)',
    icon: '🔔',
    title: 'Atenção à postura',
  },
  bad: {
    bg: 'rgba(28, 8, 8, 0.95)',
    accent: '#ef4444',
    iconBg: 'rgba(239, 68, 68, 0.18)',
    icon: '⚠️',
    title: 'Hora de corrigir',
  },
};

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const buildHtml = (level: AlertLevel, message: string): string => {
  const theme = themes[level];
  const safeMessage = escapeHtml(message);

  return `<!doctype html>
<html lang="pt-br">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'" />
    <title>Postura</title>
    <style>
      :root { color-scheme: dark; }
      *, *::before, *::after { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        overflow: hidden;
        font-family: -apple-system, "Segoe UI", Roboto, system-ui, sans-serif;
        color: #f1f5f9;
        background: transparent;
        -webkit-user-select: none;
        user-select: none;
        cursor: default;
      }
      body {
        display: flex;
        align-items: stretch;
        justify-content: stretch;
        padding: 10px;
        -webkit-app-region: drag;
      }
      @keyframes slide-in {
        from { opacity: 0; transform: translateX(32px) scale(0.97); }
        to   { opacity: 1; transform: translateX(0)    scale(1);    }
      }
      .card {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 14px 14px 16px;
        border-radius: 14px;
        background: ${theme.bg};
        border: 1px solid rgba(255,255,255,0.08);
        border-top: 2px solid ${theme.accent};
        box-shadow:
          0 4px 6px rgba(0,0,0,0.3),
          0 12px 32px rgba(0,0,0,0.4),
          inset 0 1px 0 rgba(255,255,255,0.06);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        animation: slide-in 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
      }
      .icon {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: ${theme.iconBg};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
      }
      .copy {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
        line-height: 1.35;
      }
      .title {
        font-size: 13px;
        font-weight: 600;
        color: #f8fafc;
        letter-spacing: 0.01em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .body {
        font-size: 12px;
        color: rgba(241,245,249,0.72);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .dismiss {
        -webkit-app-region: no-drag;
        flex-shrink: 0;
        appearance: none;
        border: 1px solid rgba(255,255,255,0.15);
        background: rgba(255,255,255,0.08);
        color: rgba(241,245,249,0.85);
        font: inherit;
        font-size: 18px;
        line-height: 1;
        width: 30px;
        height: 30px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 140ms ease, border-color 140ms ease;
        align-self: flex-start;
      }
      .dismiss:hover {
        background: rgba(255,255,255,0.16);
        border-color: rgba(255,255,255,0.25);
        color: #fff;
      }
      .dismiss:focus-visible {
        outline: 2px solid ${theme.accent};
        outline-offset: 2px;
      }
    </style>
  </head>
  <body>
    <div class="card" role="alertdialog" aria-labelledby="al-title" aria-describedby="al-body">
      <div class="icon" aria-hidden="true">${theme.icon}</div>
      <div class="copy">
        <span id="al-title" class="title">${theme.title}</span>
        <span id="al-body"  class="body">${safeMessage}</span>
      </div>
      <button id="dismiss" class="dismiss" type="button" title="Fechar" aria-label="Fechar">&#x2715;</button>
    </div>
    <script>
      document.getElementById('dismiss').addEventListener('click', () => window.close());
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Enter') window.close();
      });
    </script>
  </body>
</html>`;
};

const positionTopRight = (window: BrowserWindow): void => {
  const display = screen.getPrimaryDisplay();
  const { workArea } = display;
  const x = workArea.x + workArea.width - ALERT_WIDTH - ALERT_MARGIN;
  const y = workArea.y + ALERT_MARGIN;
  window.setPosition(x, y);
};

export const showPostureAlert = (level: AlertLevel, message: string): void => {
  if (alertWindow && !alertWindow.isDestroyed()) {
    alertWindow.webContents
      .loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(buildHtml(level, message))}`)
      .catch(() => undefined);
    alertWindow.showInactive();
    return;
  }

  const window = new BrowserWindow({
    width: ALERT_WIDTH,
    height: ALERT_HEIGHT,
    frame: false,
    resizable: false,
    movable: true,
    transparent: true,
    hasShadow: false,
    skipTaskbar: true,
    fullscreenable: false,
    minimizable: false,
    maximizable: false,
    closable: true,
    focusable: true,
    alwaysOnTop: true,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.setAlwaysOnTop(true, 'screen-saver');
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  positionTopRight(window);

  window.on('closed', () => {
    if (alertWindow === window) {
      alertWindow = null;
    }
  });

  void window
    .loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(buildHtml(level, message))}`)
    .then(() => {
      if (!window.isDestroyed()) {
        window.showInactive();
      }
    })
    .catch(() => undefined);

  alertWindow = window;
};

export const hidePostureAlert = (): void => {
  if (alertWindow && !alertWindow.isDestroyed()) {
    alertWindow.close();
  }
  alertWindow = null;
};

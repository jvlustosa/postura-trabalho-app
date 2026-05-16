import { BrowserWindow, screen } from 'electron';

export type AlertLevel = 'warning' | 'bad';

const ALERT_WIDTH = 380;
const ALERT_HEIGHT = 148;
const ALERT_MARGIN = 24;

let alertWindow: BrowserWindow | null = null;

const themes: Record<AlertLevel, { gradient: string; icon: string; title: string }> = {
  warning: {
    gradient: 'linear-gradient(135deg, rgba(180, 130, 20, 0.97), rgba(120, 80, 0, 0.97))',
    icon: '🔔',
    title: 'Atenção à postura',
  },
  bad: {
    gradient: 'linear-gradient(135deg, rgba(186, 26, 26, 0.97), rgba(120, 0, 5, 0.97))',
    icon: '⚠️',
    title: 'Hora de ajustar a postura',
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
      :root {
        color-scheme: dark;
      }
      html, body {
        margin: 0;
        height: 100%;
        font-family: -apple-system, "Segoe UI", Roboto, system-ui, sans-serif;
        color: #f7fafa;
        background: transparent;
        -webkit-user-select: none;
        user-select: none;
        cursor: default;
      }
      body {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 12px;
        -webkit-app-region: drag;
      }
      .card {
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: 56px 1fr auto;
        align-items: center;
        gap: 14px;
        padding: 16px 18px;
        border-radius: 18px;
        background: ${theme.gradient};
        box-shadow: 0 18px 48px rgba(0, 0, 0, 0.45);
      }
      .icon {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.14);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
      }
      .copy {
        display: flex;
        flex-direction: column;
        gap: 4px;
        line-height: 1.3;
      }
      .title {
        font-size: 15px;
        font-weight: 600;
        letter-spacing: 0.01em;
      }
      .body {
        font-size: 13px;
        opacity: 0.88;
      }
      .dismiss {
        -webkit-app-region: no-drag;
        appearance: none;
        border: none;
        background: rgba(255, 255, 255, 0.16);
        color: #fff;
        font: inherit;
        font-size: 12px;
        font-weight: 500;
        padding: 8px 12px;
        border-radius: 999px;
        cursor: pointer;
        transition: background 160ms ease;
      }
      .dismiss:hover {
        background: rgba(255, 255, 255, 0.28);
      }
      .dismiss:focus-visible {
        outline: 2px solid #fff;
        outline-offset: 2px;
      }
    </style>
  </head>
  <body>
    <div class="card" role="alertdialog" aria-labelledby="title" aria-describedby="body">
      <div class="icon" aria-hidden="true">${theme.icon}</div>
      <div class="copy">
        <span id="title" class="title">${theme.title}</span>
        <span id="body" class="body">${safeMessage}</span>
      </div>
      <button id="dismiss" class="dismiss" type="button">Ok</button>
    </div>
    <script>
      document.getElementById('dismiss').addEventListener('click', () => window.close());
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' || event.key === 'Enter') {
          window.close();
        }
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

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { applyTheme } from './lib/theme/applyTheme';
import type { ThemePreference } from './lib/settings/types';
import './design-system/design-system.css';
import './styles.css';

const STORAGE_KEY = 'postura-certa.settings.v1';

// Read the persisted theme synchronously and apply it before the first paint
// to avoid a flash of the wrong color scheme. App default is dark.
const readPersistedTheme = (): ThemePreference => {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return 'dark';
    const parsed = JSON.parse(raw) as { theme?: unknown };
    return parsed.theme === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
};

applyTheme(readPersistedTheme());

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

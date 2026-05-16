import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { App } from './App';

const STORAGE_KEY = 'postura-trabalho.settings.v1';

const createMemoryStorage = (): Storage => {
  const data = new Map<string, string>();
  return {
    get length(): number {
      return data.size;
    },
    clear: (): void => data.clear(),
    getItem: (key: string): string | null => data.get(key) ?? null,
    key: (index: number): string | null => Array.from(data.keys())[index] ?? null,
    removeItem: (key: string): void => {
      data.delete(key);
    },
    setItem: (key: string, value: string): void => {
      data.set(key, value);
    },
  };
};

const installStorage = (storage: Storage): void => {
  Object.defineProperty(window, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  });
};

const seedOnboarded = (): void => {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      sensitivity: 'standard',
      calibrationSeconds: 5,
      mirrorVideo: true,
      showOverlay: true,
      onboardingCompleted: true,
    }),
  );
};

describe('App', () => {
  let originalStorage: Storage | undefined;

  beforeEach(() => {
    originalStorage = window.localStorage;
    installStorage(createMemoryStorage());
  });

  afterEach(() => {
    if (originalStorage) {
      installStorage(originalStorage);
    }
  });

  it('starts onboarding when no settings are persisted', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /postura sob controle/i }),
    ).toBeInTheDocument();
  });

  it('shows the opt-in posture check once onboarding is complete', () => {
    seedOnboarded();
    render(<App />);

    expect(screen.getByRole('button', { name: /ativar check de postura/i })).toBeInTheDocument();
    expect(screen.getByText(/processado localmente/i)).toBeInTheDocument();
  });

  it('clicking the brand logo returns to the main screen from settings', async () => {
    seedOnboarded();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /abrir configurações/i }));
    expect(screen.queryByRole('button', { name: /ativar check de postura/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /voltar para a tela principal/i }));
    expect(screen.getByRole('button', { name: /ativar check de postura/i })).toBeInTheDocument();
  });

  it('clicking the brand logo returns to the main screen from timeline', async () => {
    seedOnboarded();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /abrir histórico/i }));
    expect(screen.queryByRole('button', { name: /ativar check de postura/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /voltar para a tela principal/i }));
    expect(screen.getByRole('button', { name: /ativar check de postura/i })).toBeInTheDocument();
  });
});

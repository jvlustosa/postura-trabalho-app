import { useCallback, useEffect, useRef, useState } from 'react';

import { loadSettings, loadSettingsAsync, saveSettings } from './storage';
import type { AppSettings } from './types';

export interface UseSettingsResult {
  settings: AppSettings;
  update: (patch: Partial<AppSettings>) => void;
}

export const useSettings = (): UseSettingsResult => {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const hydratedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void loadSettingsAsync().then((loaded) => {
      if (cancelled) return;
      hydratedRef.current = true;
      setSettings(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    saveSettings(settings);
  }, [settings]);

  const update = useCallback((patch: Partial<AppSettings>): void => {
    hydratedRef.current = true;
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  return { settings, update };
};

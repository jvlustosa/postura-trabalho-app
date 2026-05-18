const SESSION_KEY = 'postura-certa-session';

export interface SessionState {
  checkActive: boolean;
  isPaused: boolean;
  accumulatedMs: number;
  runStartedAt: number | null;
}

const empty: SessionState = {
  checkActive: false,
  isPaused: false,
  accumulatedMs: 0,
  runStartedAt: null,
};

export const loadSession = (): SessionState => {
  if (typeof window === 'undefined' || !window.localStorage) return empty;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<SessionState>;
    return {
      checkActive: typeof parsed.checkActive === 'boolean' ? parsed.checkActive : false,
      isPaused: typeof parsed.isPaused === 'boolean' ? parsed.isPaused : false,
      accumulatedMs:
        typeof parsed.accumulatedMs === 'number' && parsed.accumulatedMs >= 0
          ? parsed.accumulatedMs
          : 0,
      runStartedAt:
        typeof parsed.runStartedAt === 'number' && parsed.runStartedAt > 0
          ? parsed.runStartedAt
          : null,
    };
  } catch {
    return empty;
  }
};

export const saveSession = (state: SessionState): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    // best-effort
  }
};

export const clearSession = (): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // best-effort
  }
};

import type { TimelineSegment, TimelineState } from './types';

const STORAGE_KEY = 'postura-trabalho.timeline.v1';
const MAX_SEGMENTS = 5000;
const DEFAULT_RETENTION_DAYS = 7;

const validStates: readonly TimelineState[] = ['good', 'warning', 'bad'];

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isTimelineState = (value: unknown): value is TimelineState =>
  typeof value === 'string' && (validStates as readonly string[]).includes(value);

const parseSegments = (raw: unknown): TimelineSegment[] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  const segments: TimelineSegment[] = [];
  for (const item of raw) {
    if (
      typeof item === 'object' &&
      item !== null &&
      isTimelineState((item as { state: unknown }).state) &&
      isFiniteNumber((item as { startedAt: unknown }).startedAt) &&
      isFiniteNumber((item as { endedAt: unknown }).endedAt) &&
      (item as TimelineSegment).endedAt >= (item as TimelineSegment).startedAt
    ) {
      segments.push(item as TimelineSegment);
    }
  }
  return segments;
};

let memoryCache: TimelineSegment[] | null = null;
let hydratePromise: Promise<TimelineSegment[]> | null = null;

const getBridge = (): NonNullable<Window['postureApp']>['storage'] | undefined => {
  if (typeof window === 'undefined') return undefined;
  return window.postureApp?.storage;
};

const readFromLocalStorage = (): TimelineSegment[] => {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return parseSegments(JSON.parse(raw));
  } catch {
    return [];
  }
};

const writeToLocalStorage = (segments: readonly TimelineSegment[]): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(segments));
  } catch {
    // localStorage may be unavailable (private mode, quota); fail silently
  }
};

const writeToBridge = (segments: readonly TimelineSegment[]): void => {
  const bridge = getBridge();
  if (!bridge) return;
  void bridge.writeTimeline(segments).catch(() => undefined);
};

export const pruneSegments = (
  segments: readonly TimelineSegment[],
  now: number,
  retentionDays: number = DEFAULT_RETENTION_DAYS,
): TimelineSegment[] => {
  const cutoff = now - retentionDays * 24 * 60 * 60 * 1000;
  const kept = segments.filter((segment) => segment.endedAt >= cutoff);
  if (kept.length <= MAX_SEGMENTS) {
    return [...kept];
  }
  return kept.slice(kept.length - MAX_SEGMENTS);
};

export const hydrateTimeline = async (): Promise<TimelineSegment[]> => {
  if (hydratePromise) return hydratePromise;

  hydratePromise = (async (): Promise<TimelineSegment[]> => {
    const bridge = getBridge();
    const local = readFromLocalStorage();

    if (!bridge) {
      memoryCache = local;
      return local;
    }

    try {
      const remote = await bridge.readTimeline();
      const parsed = parseSegments(remote);

      if (parsed.length === 0 && local.length > 0) {
        memoryCache = local;
        void bridge.writeTimeline(local).catch(() => undefined);
        return local;
      }

      memoryCache = parsed;
      return parsed;
    } catch {
      memoryCache = local;
      return local;
    }
  })();

  return hydratePromise;
};

export const loadTimeline = (): TimelineSegment[] => {
  if (memoryCache !== null) {
    return [...memoryCache];
  }
  const fallback = readFromLocalStorage();
  memoryCache = fallback;
  return [...fallback];
};

export const saveTimeline = (segments: readonly TimelineSegment[]): void => {
  memoryCache = [...segments];
  writeToLocalStorage(segments);
  writeToBridge(segments);
};

export const appendSegment = (
  segment: TimelineSegment,
  retentionDays: number = DEFAULT_RETENTION_DAYS,
): TimelineSegment[] => {
  const existing = loadTimeline();
  const merged = mergeSegment(existing, segment);
  const pruned = pruneSegments(merged, segment.endedAt, retentionDays);
  saveTimeline(pruned);
  return pruned;
};

export const clearTimeline = (): void => {
  memoryCache = [];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // no-op
    }
  }
  writeToBridge([]);
};

const mergeSegment = (
  existing: readonly TimelineSegment[],
  next: TimelineSegment,
): TimelineSegment[] => {
  const last = existing[existing.length - 1];
  if (last && last.state === next.state && next.startedAt <= last.endedAt + 250) {
    const merged: TimelineSegment = {
      state: last.state,
      startedAt: last.startedAt,
      endedAt: Math.max(last.endedAt, next.endedAt),
    };
    return [...existing.slice(0, -1), merged];
  }
  return [...existing, next];
};

export const __resetForTests = (): void => {
  memoryCache = null;
  hydratePromise = null;
};

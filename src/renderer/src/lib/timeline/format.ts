import type { TimelineBucket } from './stats';
import type { TimelineState } from './types';

export type TimelineRange = '24h' | '7d';

export const RANGE_DURATION_MS: Record<TimelineRange, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

export const RANGE_LABEL: Record<TimelineRange, string> = {
  '24h': 'Últimas 24h',
  '7d': 'Últimos 7 dias',
};

export const RANGE_BUCKET_COUNT: Record<TimelineRange, number> = {
  '24h': 24,
  '7d': 28,
};

export const STATE_LABEL: Record<TimelineState, string> = {
  good: 'Postura ok',
  warning: 'Ajuste leve',
  bad: 'Postura ruim',
};

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return '0s';
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const totalMinutes = Math.floor(totalSeconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes - hours * 60;
  return minutes > 0 ? `${hours}h ${minutes} min` : `${hours}h`;
};

export const formatPercent = (value: number): string => `${Math.round(value * 100)}%`;

export const formatBucketLabel = (range: TimelineRange, bucketStart: number): string => {
  const date = new Date(bucketStart);
  if (range === '24h') {
    return `${String(date.getHours()).padStart(2, '0')}h`;
  }
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const formatBucketRangeLabel = (range: TimelineRange, bucket: TimelineBucket): string => {
  const start = new Date(bucket.bucketStart);
  const end = new Date(bucket.bucketEnd);
  const pad = (n: number): string => String(n).padStart(2, '0');
  if (range === '24h') {
    return `${pad(start.getHours())}:${pad(start.getMinutes())} – ${pad(end.getHours())}:${pad(end.getMinutes())}`;
  }
  return `${pad(start.getDate())}/${pad(start.getMonth() + 1)} ${pad(start.getHours())}h – ${pad(end.getDate())}/${pad(end.getMonth() + 1)} ${pad(end.getHours())}h`;
};

/** Indices of `count` evenly spaced axis labels across `n` buckets. */
export const evenlySpacedIndices = (count: number, n: number): number[] => {
  if (n <= 0 || count <= 0) return [];
  if (count === 1 || n === 1) return [0];
  return Array.from({ length: count }, (_, k) => Math.round((k / (count - 1)) * (n - 1)));
};

/** Horizontal alignment for an axis tick at a given 0..1 position. */
export const tickAlign = (ratio: number): 'start' | 'center' | 'end' =>
  ratio < 0.04 ? 'start' : ratio > 0.96 ? 'end' : 'center';

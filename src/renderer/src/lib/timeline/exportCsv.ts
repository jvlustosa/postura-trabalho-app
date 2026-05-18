import type { TimelineSegment, TimelineState } from './types';

const STATE_LABEL: Record<TimelineState, string> = {
  good: 'ok',
  warning: 'atencao',
  bad: 'ruim',
};

const CSV_HEADER = 'estado,inicio,fim,duracao_segundos';

const pad = (value: number): string => value.toString().padStart(2, '0');

const escapeCell = (value: string): string =>
  /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

export const buildTimelineCsv = (segments: readonly TimelineSegment[]): string => {
  const rows = segments.map((segment) => {
    const durationSeconds = Math.max(
      0,
      Math.round((segment.endedAt - segment.startedAt) / 1000),
    );
    return [
      escapeCell(STATE_LABEL[segment.state]),
      escapeCell(new Date(segment.startedAt).toISOString()),
      escapeCell(new Date(segment.endedAt).toISOString()),
      String(durationSeconds),
    ].join(',');
  });
  return [CSV_HEADER, ...rows].join('\n');
};

export const buildExportFileName = (now: Date = new Date()): string => {
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  return `postura-historico-${year}-${month}-${day}-${hours}${minutes}.csv`;
};

export const downloadTimelineCsv = (segments: readonly TimelineSegment[]): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const csv = buildTimelineCsv(segments);
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = buildExportFileName();
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

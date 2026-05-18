import { describe, expect, it } from 'vitest';

import { buildExportFileName, buildTimelineCsv } from './exportCsv';
import type { TimelineSegment } from './types';

describe('buildTimelineCsv', () => {
  it('retorna apenas o cabeçalho quando não há segmentos', () => {
    expect(buildTimelineCsv([])).toBe('estado,inicio,fim,duracao_segundos');
  });

  it('formata cada segmento como linha CSV com duração arredondada em segundos', () => {
    const segments: TimelineSegment[] = [
      {
        state: 'good',
        startedAt: Date.UTC(2026, 4, 17, 12, 0, 0),
        endedAt: Date.UTC(2026, 4, 17, 12, 0, 30),
      },
      {
        state: 'warning',
        startedAt: Date.UTC(2026, 4, 17, 12, 0, 30),
        endedAt: Date.UTC(2026, 4, 17, 12, 0, 45, 500),
      },
      {
        state: 'bad',
        startedAt: Date.UTC(2026, 4, 17, 12, 0, 45, 500),
        endedAt: Date.UTC(2026, 4, 17, 12, 1, 0),
      },
    ];

    expect(buildTimelineCsv(segments).split('\n')).toEqual([
      'estado,inicio,fim,duracao_segundos',
      'ok,2026-05-17T12:00:00.000Z,2026-05-17T12:00:30.000Z,30',
      'atencao,2026-05-17T12:00:30.000Z,2026-05-17T12:00:45.500Z,16',
      'ruim,2026-05-17T12:00:45.500Z,2026-05-17T12:01:00.000Z,15',
    ]);
  });
});

describe('buildExportFileName', () => {
  it('usa data e hora locais com zero à esquerda', () => {
    expect(buildExportFileName(new Date(2026, 4, 17, 9, 5))).toBe(
      'postura-historico-2026-05-17-0905.csv',
    );
  });
});

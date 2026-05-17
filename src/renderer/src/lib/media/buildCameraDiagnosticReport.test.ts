import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildCameraDiagnosticReport } from './buildCameraDiagnosticReport';

describe('buildCameraDiagnosticReport', () => {
  beforeEach(() => {
    window.postureApp = {
      platform: 'linux',
      showAlert: vi.fn(),
      hideAlert: vi.fn(),
      versions: { electron: '42.0.0', chrome: '130.0.0' },
    };

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        enumerateDevices: vi.fn().mockResolvedValue([
          { kind: 'videoinput', label: 'Cam Test', deviceId: 'dev-v1', groupId: 'g1' } as MediaDeviceInfo,
        ]),
        getUserMedia: vi.fn(),
      },
    });

    Object.defineProperty(navigator, 'permissions', {
      configurable: true,
      value: {
        query: vi.fn().mockRejectedValue(new Error('unsupported')),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete window.postureApp;
    Reflect.deleteProperty(navigator, 'mediaDevices');
    Reflect.deleteProperty(navigator, 'permissions');
  });

  it('includes classification, stack hint, constraints and device enum', async () => {
    const err = new Error('boom');
    err.name = 'NotReadableError';

    const report = await buildCameraDiagnosticReport(err, {
      surface: 'calibration',
      uiMessage: 'Falhou',
      constraints: { video: true, audio: false },
    });

    expect(report).toContain('Postura Trabalho: log detalhado');
    expect(report).toContain('surface: calibration');
    expect(report).toContain('mensagem_ui: Falhou');
    expect(report).toContain('classifyMediaError: camera-in-use');
    expect(report).toContain('NotReadableError');
    expect(report).toContain('boom');
    expect(report).toContain('constraints_json:');
    expect(report).toContain('enumerate_devices_count: 1');
    expect(report).toContain('videoinput');
    expect(report).toContain('electron_version: 42.0.0');
  });

  it('handles missing error object', async () => {
    const report = await buildCameraDiagnosticReport(undefined, {
      surface: 'posture-check',
      extraNotes: 'no samples',
    });
    expect(report).toContain('nenhum objeto Error capturado');
    expect(report).toContain('notas: no samples');
  });
});

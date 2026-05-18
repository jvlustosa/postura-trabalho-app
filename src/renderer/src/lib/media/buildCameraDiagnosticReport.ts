import { classifyMediaError, formatMediaErrorDetails } from './classifyMediaError';

export type CameraDiagnosticSurface = 'posture-check' | 'calibration';

export interface CameraDiagnosticOptions {
  surface: CameraDiagnosticSurface;
  uiMessage?: string;
  analysisState?: string;
  constraints?: MediaStreamConstraints;
  video?: HTMLVideoElement | null;
  stream?: MediaStream | null;
  extraNotes?: string;
}

const appendStreamTracks = (lines: string[], stream: MediaStream | null | undefined): void => {
  if (!stream) {
    return;
  }
  const tracks = stream.getTracks();
  lines.push(`--- media_stream (${tracks.length} tracks) ---`);
  tracks.forEach((t, i) => {
    lines.push(
      `  [${i}] kind=${t.kind} label=${JSON.stringify(t.label)} readyState=${t.readyState} muted=${t.muted} enabled=${t.enabled}`,
    );
    if (t.kind === 'video' && typeof t.getCapabilities === 'function') {
      try {
        lines.push(`       capabilities: ${JSON.stringify(t.getCapabilities())}`);
      } catch {
        lines.push('       capabilities: (erro ao ler)');
      }
    }
  });
};

const appendVideoElement = (lines: string[], video: HTMLVideoElement | null | undefined): void => {
  if (!video) {
    return;
  }
  lines.push('--- video_element ---');
  lines.push(`ready_state: ${video.readyState}`);
  lines.push(`video_width: ${video.videoWidth}`);
  lines.push(`video_height: ${video.videoHeight}`);
  lines.push(`paused: ${video.paused}`);
  lines.push(`error: ${video.error ? `${video.error.code} ${video.error.message}` : 'none'}`);
};

async function queryCameraPermissionState(): Promise<string> {
  try {
    const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return result.state;
  } catch {
    return '(consulta indisponível neste ambiente)';
  }
}

async function appendEnumerateDevices(lines: string[]): Promise<void> {
  if (!navigator.mediaDevices?.enumerateDevices) {
    lines.push('enumerate_devices: API indisponível');
    return;
  }
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    lines.push(`enumerate_devices_count: ${devices.length}`);
    devices.forEach((d, i) => {
      lines.push(`  [${i}] kind=${d.kind} label=${JSON.stringify(d.label)} deviceId=${d.deviceId}`);
    });
  } catch (e) {
    lines.push(`enumerate_devices_error: ${formatMediaErrorDetails(e)}`);
  }
}

export async function buildCameraDiagnosticReport(
  error: unknown | undefined,
  options: CameraDiagnosticOptions,
): Promise<string> {
  const lines: string[] = [];
  lines.push('PosturaCerta: log detalhado (câmera / mídia)');
  lines.push(`timestamp_iso: ${new Date().toISOString()}`);
  lines.push(`surface: ${options.surface}`);
  if (options.uiMessage) lines.push(`mensagem_ui: ${options.uiMessage}`);
  if (options.analysisState) lines.push(`analysis_state: ${options.analysisState}`);
  if (options.extraNotes) lines.push(`notas: ${options.extraNotes}`);

  lines.push('--- erro ---');
  if (error !== undefined) {
    lines.push(`classifyMediaError: ${classifyMediaError(error)}`);
    lines.push(`error_summary: ${formatMediaErrorDetails(error)}`);
    if (error instanceof Error && error.stack) {
      lines.push('error_stack:');
      lines.push(error.stack);
    }
  } else {
    lines.push('(nenhum objeto Error capturado; ex.: falha lógica ou fluxo sem exceção)');
  }

  lines.push('--- ambiente ---');
  lines.push(`electron_platform: ${window.postureApp?.platform ?? 'n/a'}`);
  lines.push(`electron_version: ${window.postureApp?.versions?.electron ?? 'n/a'}`);
  lines.push(`chrome_version: ${window.postureApp?.versions?.chrome ?? 'n/a'}`);
  lines.push(`user_agent: ${navigator.userAgent}`);
  lines.push(`href: ${window.location.href}`);
  lines.push(`language: ${navigator.language}`);
  lines.push(`secure_context: ${window.isSecureContext}`);
  lines.push(`media_devices_api: ${Boolean(navigator.mediaDevices)}`);
  lines.push(`get_user_media: ${Boolean(navigator.mediaDevices?.getUserMedia)}`);

  if (options.constraints) {
    try {
      lines.push(`constraints_json: ${JSON.stringify(options.constraints)}`);
    } catch {
      lines.push('constraints_json: (falha ao serializar)');
    }
  }

  appendVideoElement(lines, options.video);
  appendStreamTracks(lines, options.stream);

  lines.push('--- display ---');
  lines.push(`screen: ${typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : 'n/a'}`);
  lines.push(`device_pixel_ratio: ${window.devicePixelRatio}`);

  lines.push('--- permissões / dispositivos ---');
  lines.push(`permissions_api_camera: ${await queryCameraPermissionState()}`);
  await appendEnumerateDevices(lines);

  lines.push('');
  lines.push('(Labels de dispositivo podem vir vazias até a câmera ser autorizada; isso é esperado no Chromium.)');

  return lines.join('\n');
}

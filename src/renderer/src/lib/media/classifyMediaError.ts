export type MediaErrorReason =
  | 'permission-denied'
  | 'no-camera'
  | 'camera-in-use'
  | 'unsupported'
  | 'unknown';

export const classifyMediaError = (error: unknown): MediaErrorReason => {
  if (!(error instanceof Error)) {
    return 'unknown';
  }

  switch (error.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'permission-denied';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'no-camera';
    case 'NotReadableError':
    case 'TrackStartError':
    case 'AbortError':
    case 'OperationError':
      return 'camera-in-use';
    case 'NotSupportedError':
    case 'TypeError':
      return 'unsupported';
    default:
      return 'unknown';
  }
};

export const formatMediaErrorDetails = (error: unknown): string => {
  if (error instanceof Error) {
    const name = error.name || 'Error';
    const message = error.message ? `: ${error.message}` : '';
    return `${name}${message}`;
  }

  if (typeof error === 'string' && error.length > 0) {
    return error;
  }

  if (error !== undefined && error !== null) {
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  return 'Sem detalhes disponíveis';
};

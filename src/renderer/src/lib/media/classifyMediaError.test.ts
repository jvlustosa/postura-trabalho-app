import { describe, expect, it } from 'vitest';

import { classifyMediaError, formatMediaErrorDetails } from './classifyMediaError';

const errorWithName = (name: string, message = ''): Error => {
  const error = new Error(message);
  error.name = name;
  return error;
};

describe('classifyMediaError', () => {
  it('returns permission-denied for NotAllowedError', () => {
    expect(classifyMediaError(errorWithName('NotAllowedError'))).toBe('permission-denied');
  });

  it('returns permission-denied for SecurityError', () => {
    expect(classifyMediaError(errorWithName('SecurityError'))).toBe('permission-denied');
  });

  it('returns no-camera for NotFoundError and OverconstrainedError', () => {
    expect(classifyMediaError(errorWithName('NotFoundError'))).toBe('no-camera');
    expect(classifyMediaError(errorWithName('OverconstrainedError'))).toBe('no-camera');
  });

  it('returns camera-in-use for NotReadableError, TrackStartError, AbortError, OperationError', () => {
    expect(classifyMediaError(errorWithName('NotReadableError'))).toBe('camera-in-use');
    expect(classifyMediaError(errorWithName('TrackStartError'))).toBe('camera-in-use');
    expect(classifyMediaError(errorWithName('AbortError'))).toBe('camera-in-use');
    expect(classifyMediaError(errorWithName('OperationError'))).toBe('camera-in-use');
  });

  it('returns unsupported for NotSupportedError and TypeError', () => {
    expect(classifyMediaError(errorWithName('NotSupportedError'))).toBe('unsupported');
    expect(classifyMediaError(errorWithName('TypeError'))).toBe('unsupported');
  });

  it('returns unknown for non-Error values and unfamiliar names', () => {
    expect(classifyMediaError(undefined)).toBe('unknown');
    expect(classifyMediaError('string')).toBe('unknown');
    expect(classifyMediaError(errorWithName('SomethingElse'))).toBe('unknown');
  });
});

describe('formatMediaErrorDetails', () => {
  it('includes error name and message in a single copyable line', () => {
    const details = formatMediaErrorDetails(errorWithName('NotReadableError', 'Device busy'));
    expect(details).toContain('NotReadableError');
    expect(details).toContain('Device busy');
  });

  it('falls back to a placeholder when no Error is provided', () => {
    expect(formatMediaErrorDetails(undefined)).toMatch(/sem detalhes/i);
  });

  it('serializes non-Error values when possible', () => {
    expect(formatMediaErrorDetails('plain string')).toContain('plain string');
  });
});

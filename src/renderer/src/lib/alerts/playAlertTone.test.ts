import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface MockOscillator {
  type: OscillatorType;
  frequency: { setValueAtTime: ReturnType<typeof vi.fn> };
  connect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}

interface MockGain {
  gain: {
    setValueAtTime: ReturnType<typeof vi.fn>;
    linearRampToValueAtTime: ReturnType<typeof vi.fn>;
    exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
  };
  connect: ReturnType<typeof vi.fn>;
}

interface MockContext {
  state: 'suspended' | 'running';
  currentTime: number;
  resume: ReturnType<typeof vi.fn>;
  createOscillator: Mock<() => MockOscillator>;
  createGain: Mock<() => MockGain>;
  destination: object;
  lastOscillator: MockOscillator | null;
  shouldThrowOnCreateOscillator: boolean;
}

const instances: MockContext[] = [];
let constructorCalls = 0;

class FakeAudioContext {
  constructor() {
    constructorCalls += 1;
    const ctx: MockContext = {
      state: 'suspended',
      currentTime: 0,
      resume: vi.fn(),
      destination: {},
      lastOscillator: null,
      shouldThrowOnCreateOscillator: false,
      createOscillator: vi.fn() as Mock<() => MockOscillator>,
      createGain: vi.fn() as Mock<() => MockGain>,
    };

    ctx.createOscillator.mockImplementation((): MockOscillator => {
      if (ctx.shouldThrowOnCreateOscillator) throw new Error('boom');
      const gain: MockGain = {
        gain: {
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      };
      const osc: MockOscillator = {
        type: 'sine',
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(() => gain),
        start: vi.fn(),
        stop: vi.fn(),
      };
      ctx.lastOscillator = osc;
      return osc;
    });

    ctx.createGain.mockImplementation(
      (): MockGain => ({
        gain: {
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      }),
    );

    instances.push(ctx);
    // returning ctx replaces the freshly-constructed `this`
    // eslint-disable-next-line no-constructor-return
    return ctx as unknown as FakeAudioContext;
  }
}

const installAudioContext = (): void => {
  Object.defineProperty(window, 'AudioContext', {
    configurable: true,
    writable: true,
    value: FakeAudioContext,
  });
};

const uninstallAudioContext = (): void => {
  Object.defineProperty(window, 'AudioContext', {
    configurable: true,
    writable: true,
    value: undefined,
  });
  Object.defineProperty(window, 'webkitAudioContext', {
    configurable: true,
    writable: true,
    value: undefined,
  });
};

describe('playAlertTone', () => {
  beforeEach(() => {
    vi.resetModules();
    instances.length = 0;
    constructorCalls = 0;
    installAudioContext();
  });

  afterEach(() => {
    uninstallAudioContext();
  });

  it('plays a 660 Hz tone for level "bad"', async () => {
    const { playAlertTone } = await import('./playAlertTone');

    playAlertTone('bad');

    const ctx = instances[0];
    expect(ctx.lastOscillator).not.toBeNull();
    expect(ctx.lastOscillator?.frequency.setValueAtTime).toHaveBeenCalledWith(660, 0);
    expect(ctx.lastOscillator?.start).toHaveBeenCalledTimes(1);
    expect(ctx.lastOscillator?.stop).toHaveBeenCalledTimes(1);
  });

  it('plays an 880 Hz tone for level "warning"', async () => {
    const { playAlertTone } = await import('./playAlertTone');

    playAlertTone('warning');

    expect(instances[0].lastOscillator?.frequency.setValueAtTime).toHaveBeenCalledWith(880, 0);
  });

  it('defaults to the "bad" tone when no level is provided', async () => {
    const { playAlertTone } = await import('./playAlertTone');

    playAlertTone();

    expect(instances[0].lastOscillator?.frequency.setValueAtTime).toHaveBeenCalledWith(660, 0);
  });

  it('resumes a suspended AudioContext before playing', async () => {
    const { playAlertTone } = await import('./playAlertTone');

    playAlertTone('bad');

    expect(instances[0].resume).toHaveBeenCalledTimes(1);
  });

  it('reuses the same AudioContext across consecutive calls', async () => {
    const { playAlertTone } = await import('./playAlertTone');

    playAlertTone('bad');
    playAlertTone('warning');

    expect(constructorCalls).toBe(1);
    expect(instances[0].lastOscillator?.frequency.setValueAtTime).toHaveBeenLastCalledWith(880, 0);
  });

  it('does not throw when AudioContext is unavailable', async () => {
    uninstallAudioContext();
    const { playAlertTone } = await import('./playAlertTone');

    expect(() => playAlertTone('bad')).not.toThrow();
    expect(instances).toHaveLength(0);
  });

  it('swallows errors thrown during playback', async () => {
    const { playAlertTone } = await import('./playAlertTone');

    playAlertTone('bad');
    instances[0].shouldThrowOnCreateOscillator = true;

    expect(() => playAlertTone('warning')).not.toThrow();
  });
});

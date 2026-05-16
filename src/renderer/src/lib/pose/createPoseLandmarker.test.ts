import { beforeEach, describe, expect, it, vi } from 'vitest';

const forVisionTasks = vi.fn();
const createFromOptions = vi.fn();

vi.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: {
    forVisionTasks: (...args: unknown[]) => forVisionTasks(...args),
  },
  PoseLandmarker: {
    createFromOptions: (...args: unknown[]) => createFromOptions(...args),
  },
}));

const importFresh = async (): Promise<typeof import('./createPoseLandmarker')> => {
  vi.resetModules();
  return import('./createPoseLandmarker');
};

const isRelativeOrAbsoluteUrl = (path: string): boolean => {
  if (/^https?:\/\//.test(path)) {
    return true;
  }

  return path.startsWith('./') || path.startsWith('../');
};

describe('createPoseLandmarker', () => {
  beforeEach(() => {
    forVisionTasks.mockReset();
    createFromOptions.mockReset();
    forVisionTasks.mockResolvedValue({});
    createFromOptions.mockResolvedValue({ close: vi.fn() });
  });

  it('requests the wasm fileset using a path that resolves under file:// (no leading slash)', async () => {
    const { createPoseLandmarker } = await importFresh();

    await createPoseLandmarker();

    expect(forVisionTasks).toHaveBeenCalledTimes(1);
    const passedPath = forVisionTasks.mock.calls[0]?.[0] as string;
    expect(passedPath.startsWith('/')).toBe(false);
    expect(isRelativeOrAbsoluteUrl(passedPath)).toBe(true);
  });

  it('loads the pose landmark model using a path that resolves under file:// (no leading slash)', async () => {
    const { createPoseLandmarker } = await importFresh();

    await createPoseLandmarker();

    expect(createFromOptions).toHaveBeenCalled();
    const options = createFromOptions.mock.calls[0]?.[1] as {
      baseOptions: { modelAssetPath: string };
    };
    const modelPath = options.baseOptions.modelAssetPath;
    expect(modelPath.startsWith('/')).toBe(false);
    expect(isRelativeOrAbsoluteUrl(modelPath)).toBe(true);
  });

  it('falls back to CPU delegate when GPU creation rejects', async () => {
    createFromOptions
      .mockRejectedValueOnce(new Error('gpu unavailable'))
      .mockResolvedValueOnce({ close: vi.fn() });

    const { createPoseLandmarker } = await importFresh();

    await createPoseLandmarker();

    expect(createFromOptions).toHaveBeenCalledTimes(2);
    const gpuCallOptions = createFromOptions.mock.calls[0]?.[1] as {
      baseOptions: { delegate: string };
    };
    const cpuCallOptions = createFromOptions.mock.calls[1]?.[1] as {
      baseOptions: { delegate: string };
    };
    expect(gpuCallOptions.baseOptions.delegate).toBe('GPU');
    expect(cpuCallOptions.baseOptions.delegate).toBe('CPU');
  });
});

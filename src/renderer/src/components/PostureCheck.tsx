import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, EyeOff, Flame, Maximize2, Pause, PictureInPicture2, RotateCcw, UserX } from 'lucide-react';
import type { PoseLandmarker } from '@mediapipe/tasks-vision';

import type { MiniView } from '../App';
import { buildAlertMessage, reasonMessages } from '../lib/alerts/buildAlertMessage';
import { createPostureWatcher } from '../lib/alerts/createPostureWatcher';
import { playAlertTone } from '../lib/alerts/playAlertTone';
import { buildCameraDiagnosticReport } from '../lib/media/buildCameraDiagnosticReport';
import { classifyMediaError, formatMediaErrorDetails } from '../lib/media/classifyMediaError';
import { createPoseLandmarker } from '../lib/pose/createPoseLandmarker';
import { mapPoseLandmarks } from '../lib/pose/mapPoseLandmarks';
import { drawPoseOverlay } from '../lib/pose/poseOverlay';
import { analyzePosture } from '../lib/posture/analyzePosture';
import { createLandmarkSmoother } from '../lib/posture/createLandmarkSmoother';
import { createPersonalizedThresholds } from '../lib/posture/createPersonalizedThresholds';
import { createPostureSmoother } from '../lib/posture/createPostureSmoother';
import type { PostureAnalysis, PostureState, PostureThresholds } from '../lib/posture/types';
import { sensitivityMultiplier } from '../lib/settings/sensitivityMultiplier';
import type { AppSettings, CalibrationData } from '../lib/settings/types';
import { createTimelineRecorder } from '../lib/timeline/createTimelineRecorder';
import { Tooltip } from './Tooltip';

interface PostureCheckProps {
  onStop: () => void;
  settings: AppSettings;
  onSettingsChange?: (patch: Partial<AppSettings>) => void;
  miniView?: MiniView;
  onChangeMiniView?: (next: MiniView) => void;
  onExitMini?: () => void;
}

const UPRIGHT_SAMPLE_LIMITS = {
  headOffset: 0.12,
  shoulderTilt: 0.06,
};
const MIN_CALIBRATION_SAMPLES = 5;

const POSTURE_CHECK_MEDIA_CONSTRAINTS: MediaStreamConstraints = {
  video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 60 } },
  audio: false,
};

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

const scaleThresholds = (thresholds: PostureThresholds, multiplier: number): PostureThresholds => ({
  ...thresholds,
  headWarning: thresholds.headWarning * multiplier,
  headBad: thresholds.headBad * multiplier,
  shoulderWarning: thresholds.shoulderWarning * multiplier,
  shoulderBad: thresholds.shoulderBad * multiplier,
  neckWarning: thresholds.neckWarning * multiplier,
  neckBad: thresholds.neckBad * multiplier,
  shoulderNarrowWarning: clamp01(1 - (1 - thresholds.shoulderNarrowWarning) * multiplier),
  shoulderNarrowBad: clamp01(1 - (1 - thresholds.shoulderNarrowBad) * multiplier),
  slouchWarning: clamp01(1 - (1 - thresholds.slouchWarning) * multiplier),
  slouchBad: clamp01(1 - (1 - thresholds.slouchBad) * multiplier),
  headDownWarning: clamp01(1 - (1 - thresholds.headDownWarning) * multiplier),
  headDownBad: clamp01(1 - (1 - thresholds.headDownBad) * multiplier),
  hunchSignificantDeficit: thresholds.hunchSignificantDeficit * multiplier,
  hunchCompositeWarning: thresholds.hunchCompositeWarning * multiplier,
  hunchCompositeBad: thresholds.hunchCompositeBad * multiplier,
});

const isUprightSample = (metrics: PostureAnalysis['metrics']): boolean =>
  metrics.headOffset <= UPRIGHT_SAMPLE_LIMITS.headOffset &&
  metrics.shoulderTilt <= UPRIGHT_SAMPLE_LIMITS.shoulderTilt;

const initialAnalysis: PostureAnalysis = {
  state: 'calibrating',
  score: 0,
  reasons: [],
  message: 'Preparando câmera',
  metrics: { headOffset: 0, shoulderTilt: 0, neckTilt: 0, shoulderWidth: 0, torsoAspectRatio: 0, headVerticalRatio: 0 },
};

const statusLabels: Record<PostureState, string> = {
  inactive: 'Inativo',
  calibrating: 'Calibrando',
  good: 'Postura ok',
  warning: 'Ajuste leve',
  bad: 'Corrija postura',
  away: 'Fora da tela',
  'camera-error': 'Sem câmera',
  'model-error': 'Erro no modelo',
};

const AWAY_GRACE_MS = 800;
const SHARED_SAMPLE_WINDOW_MS = 5_000;
const SHARED_WARMUP_FRAMES = 4;

type CycleState = 'continuous' | 'warmup' | 'sampling' | 'idle';

const hintFor = (analysis: PostureAnalysis, awaitingUpright: boolean): string | null => {
  if (analysis.state === 'away') return 'Volte para a câmera quando quiser';
  if (analysis.state === 'calibrating') {
    if (analysis.reasons.includes('low-confidence')) return 'Mostre cabeça e ombros';
    return awaitingUpright ? 'Sente-se ereto para calibrar' : 'Calibrando';
  }
  if (analysis.state === 'good') return null;
  if (analysis.reasons.includes('slouch')) return 'Endireite as costas';
  if (analysis.reasons.includes('head-down')) return 'Levante a cabeça';
  if (analysis.reasons.includes('head-forward')) return 'Recue a cabeça';
  if (analysis.reasons.includes('neck-tilt')) return 'Alinhe a cabeça com os ombros';
  if (analysis.reasons.includes('shoulder-tilt')) return 'Nivele os ombros';
  return null;
};

const SCORE_HISTORY_MAX = 60;
const SCORE_SAMPLE_INTERVAL_MS = 1000;

const formatStreak = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m === 0) return `${s}s`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

interface ScoreSample {
  score: number;
  state: PostureState;
}

interface SparklineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  state: 'good' | 'warning' | 'bad';
}

const segmentStateFor = (a: PostureState, b: PostureState): SparklineSegment['state'] => {
  if (a === 'bad' || b === 'bad') return 'bad';
  if (a === 'warning' || b === 'warning') return 'warning';
  return 'good';
};

const buildSparklineSegments = (
  samples: readonly ScoreSample[],
  width: number,
  height: number,
): SparklineSegment[] => {
  if (samples.length < 2) return [];
  const step = width / (samples.length - 1);
  const segments: SparklineSegment[] = [];
  for (let i = 0; i < samples.length - 1; i += 1) {
    const a = samples[i];
    const b = samples[i + 1];
    const ay = height - (Math.max(0, Math.min(100, a.score)) / 100) * height;
    const by = height - (Math.max(0, Math.min(100, b.score)) / 100) * height;
    segments.push({
      x1: i * step,
      y1: ay,
      x2: (i + 1) * step,
      y2: by,
      state: segmentStateFor(a.state, b.state),
    });
  }
  return segments;
};

export const PostureCheck = ({
  onStop,
  settings,
  onSettingsChange,
  miniView = 'off',
  onChangeMiniView,
  onExitMini,
}: PostureCheckProps): ReactElement => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStageRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastInferenceRef = useRef(0);
  const miniViewRef = useRef<MiniView>(miniView);

  useEffect(() => {
    miniViewRef.current = miniView;
  }, [miniView]);
  const calibrationStartedRef = useRef<number | null>(null);
  const calibrationSamplesRef = useRef<PostureAnalysis['metrics'][]>([]);
  const baseThresholdsRef = useRef<PostureThresholds | null>(null);
  const personalizedThresholdsRef = useRef<PostureThresholds | null>(null);
  const isCalibratedRef = useRef(false);

  const multiplierRef = useRef(sensitivityMultiplier(settings.sensitivity));
  const calibrationDurationRef = useRef(settings.calibrationSeconds * 1_000);
  const showOverlayRef = useRef(settings.showOverlay);
  const alertsEnabledRef = useRef(settings.alertsEnabled);
  const alertThresholdMsRef = useRef(settings.alertThresholdSeconds * 1_000);
  const alertSoundRef = useRef(settings.alertSound);
  const cameraModeRef = useRef(settings.cameraMode);
  const sharedIntervalMsRef = useRef(settings.sharedCheckIntervalSeconds * 1_000);

  const cycleStateRef = useRef<CycleState>(
    settings.cameraMode === 'shared' ? 'sampling' : 'continuous',
  );
  const warmupFramesRef = useRef(0);
  const sampleStartedAtRef = useRef<number | null>(null);
  const idleTimeoutRef = useRef<number | null>(null);
  const idleUntilRef = useRef<number | null>(null);
  const restartCameraRef = useRef<(() => void) | null>(null);

  const smoother = useMemo(() => createPostureSmoother(8), []);
  const landmarkSmoother = useMemo(() => createLandmarkSmoother(0.4), []);
  const timelineRecorder = useMemo(() => createTimelineRecorder(), []);
  const postureWatcher = useMemo(
    () =>
      createPostureWatcher({
        warningThresholdMs: () => alertThresholdMsRef.current * 0.5,
        badThresholdMs: () => alertThresholdMsRef.current,
        onAlert: ({ level, reasons }) => {
          if (!alertsEnabledRef.current) return;
          const message = buildAlertMessage(level, reasons);
          window.postureApp?.showAlert(level, message);
          window.postureApp?.notify?.(level, message);
          if (alertSoundRef.current) playAlertTone(level);
        },
        onClear: () => {
          window.postureApp?.hideAlert();
        },
      }),
    [],
  );

  const streakStartRef = useRef<number | null>(null);
  const scoreHistoryRef = useRef<ScoreSample[]>([]);
  const lastScoreSampleRef = useRef(0);
  const lastFloatingPushRef = useRef(0);
  const lastFloatingStateRef = useRef<PostureState | null>(null);
  const awaySinceRef = useRef<number | null>(null);

  const pushFloating = useCallback((state: PostureState, score: number, label?: string): void => {
    const now = performance.now();
    if (state !== lastFloatingStateRef.current || now - lastFloatingPushRef.current >= 500) {
      lastFloatingStateRef.current = state;
      lastFloatingPushRef.current = now;
      window.postureApp?.updateFloating?.({
        state,
        label: label ?? statusLabels[state],
        score: Math.round(score ?? 0),
      });
    }
  }, []);

  const [analysis, setAnalysis] = useState<PostureAnalysis>(initialAnalysis);
  const [awaitingUpright, setAwaitingUpright] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [copyDiagFeedback, setCopyDiagFeedback] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [streakMs, setStreakMs] = useState(0);
  const [scoreHistory, setScoreHistory] = useState<ScoreSample[]>([]);
  const [sharedIdleUntil, setSharedIdleUntil] = useState<number | null>(null);
  const [sharedNow, setSharedNow] = useState(() => Date.now());
  const diagnosticCaptureRef = useRef<{ error?: unknown; stream?: MediaStream | null }>({});

  useEffect(() => {
    if (sharedIdleUntil === null) return;
    setSharedNow(Date.now());
    const id = window.setInterval(() => setSharedNow(Date.now()), 1_000);
    return () => window.clearInterval(id);
  }, [sharedIdleUntil]);

  const copyDetailedLogs = useCallback(async (): Promise<void> => {
    const { error, stream } = diagnosticCaptureRef.current;
    try {
      const text = await buildCameraDiagnosticReport(error, {
        surface: 'posture-check',
        uiMessage: analysis.message,
        analysisState: analysis.state,
        constraints: POSTURE_CHECK_MEDIA_CONSTRAINTS,
        video: videoRef.current,
        stream: stream ?? streamRef.current,
      });
      await navigator.clipboard.writeText(text);
      setCopyDiagFeedback('copied');
      window.setTimeout(() => setCopyDiagFeedback('idle'), 2500);
    } catch {
      setCopyDiagFeedback('failed');
      window.setTimeout(() => setCopyDiagFeedback('idle'), 2500);
    }
  }, [analysis.message, analysis.state]);

  // Sync settings changes into refs
  useEffect(() => {
    multiplierRef.current = sensitivityMultiplier(settings.sensitivity);
    if (baseThresholdsRef.current) {
      personalizedThresholdsRef.current = scaleThresholds(baseThresholdsRef.current, multiplierRef.current);
    }
  }, [settings.sensitivity]);

  useEffect(() => {
    calibrationDurationRef.current = settings.calibrationSeconds * 1_000;
  }, [settings.calibrationSeconds]);

  useEffect(() => {
    showOverlayRef.current = settings.showOverlay;
    if (!settings.showOverlay) {
      const overlay = overlayRef.current;
      overlay?.getContext('2d')?.clearRect(0, 0, overlay.width, overlay.height);
    }
  }, [settings.showOverlay]);

  useEffect(() => {
    alertsEnabledRef.current = settings.alertsEnabled;
    if (!settings.alertsEnabled) {
      postureWatcher.reset();
      window.postureApp?.hideAlert();
    }
  }, [settings.alertsEnabled, postureWatcher]);

  useEffect(() => {
    alertThresholdMsRef.current = settings.alertThresholdSeconds * 1_000;
  }, [settings.alertThresholdSeconds]);

  useEffect(() => {
    alertSoundRef.current = settings.alertSound;
  }, [settings.alertSound]);

  useEffect(() => {
    sharedIntervalMsRef.current = settings.sharedCheckIntervalSeconds * 1_000;
  }, [settings.sharedCheckIntervalSeconds]);

  useEffect(() => {
    const prev = cameraModeRef.current;
    cameraModeRef.current = settings.cameraMode;
    if (prev === settings.cameraMode) return;

    if (settings.cameraMode === 'continuous') {
      cycleStateRef.current = 'continuous';
      warmupFramesRef.current = 0;
      sampleStartedAtRef.current = null;
      if (idleTimeoutRef.current !== null) {
        window.clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = null;
      }
      idleUntilRef.current = null;
      if (sharedIdleUntil !== null) {
        setSharedIdleUntil(null);
        restartCameraRef.current?.();
      }
    } else {
      cycleStateRef.current = 'sampling';
      sampleStartedAtRef.current = null;
      warmupFramesRef.current = 0;
    }
  }, [settings.cameraMode, sharedIdleUntil]);

  // Restore saved calibration on mount (only if baselines are present)
  useEffect(() => {
    if (settings.calibration && calibrationSamplesRef.current.length === 0) {
      const t = settings.calibration.thresholds;
      const hasBaselines = t.shoulderWidthBaseline > 0 || t.headVerticalRatioBaseline > 0;
      if (!hasBaselines) return;

      baseThresholdsRef.current = t;
      personalizedThresholdsRef.current = scaleThresholds(t, multiplierRef.current);
      isCalibratedRef.current = true;
    }
  }, [settings.calibration]);

  const persistCalibration = useCallback(
    (thresholds: PostureThresholds, samples: PostureAnalysis['metrics'][]): void => {
      if (!onSettingsChange || samples.length === 0) return;

      const avg = (vals: number[]) => vals.reduce((a, b) => a + b, 0) / vals.length;
      const calibration: CalibrationData = {
        thresholds,
        baseline: {
          headOffset: avg(samples.map((m) => m.headOffset)),
          shoulderTilt: avg(samples.map((m) => m.shoulderTilt)),
          neckTilt: avg(samples.map((m) => m.neckTilt)),
          shoulderWidth: avg(samples.map((m) => m.shoulderWidth)),
          torsoAspectRatio: avg(samples.map((m) => m.torsoAspectRatio)),
          headVerticalRatio: avg(samples.map((m) => m.headVerticalRatio)),
        },
        sampleCount: samples.length,
        sampledAt: new Date().toISOString(),
      };
      onSettingsChange({ calibration });
    },
    [onSettingsChange],
  );

  const recalibrate = useCallback(() => {
    calibrationSamplesRef.current = [];
    calibrationStartedRef.current = null;
    baseThresholdsRef.current = null;
    personalizedThresholdsRef.current = null;
    isCalibratedRef.current = false;
    streakStartRef.current = null;
    scoreHistoryRef.current = [];
    lastScoreSampleRef.current = 0;
    awaySinceRef.current = null;
    smoother.reset();
    landmarkSmoother.reset();
    postureWatcher.reset();
    timelineRecorder.flush();
    timelineRecorder.reset();
    window.postureApp?.hideAlert();
    setAwaitingUpright(false);
    setCalibrationProgress(0);
    setStreakMs(0);
    setScoreHistory([]);
    setAnalysis({ ...initialAnalysis, message: 'Recalibrando' });
  }, [smoother, landmarkSmoother, postureWatcher, timelineRecorder]);

  useEffect(() => {
    let cancelled = false;
    let busyRetryTimeout: number | null = null;
    let busyAttempts = 0;

    const clearBusyRetry = (): void => {
      if (busyRetryTimeout !== null) {
        window.clearTimeout(busyRetryTimeout);
        busyRetryTimeout = null;
      }
    };

    const stopStream = (): void => {
      streamRef.current?.getTracks().forEach((t) => {
        t.onended = null;
        t.stop();
      });
      streamRef.current = null;
    };

    const enterIdle = (): void => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      stopStream();
      if (videoRef.current) videoRef.current.srcObject = null;
      const overlay = overlayRef.current;
      overlay?.getContext('2d')?.clearRect(0, 0, overlay.width, overlay.height);
      timelineRecorder.flush();
      postureWatcher.reset();
      window.postureApp?.hideAlert();
      cycleStateRef.current = 'idle';
      warmupFramesRef.current = 0;
      sampleStartedAtRef.current = null;
      if (streakStartRef.current !== null) {
        streakStartRef.current = null;
        setStreakMs(0);
      }
      const until = Date.now() + sharedIntervalMsRef.current;
      idleUntilRef.current = until;
      setSharedIdleUntil(until);
      pushFloating('inactive', 0, 'Câmera liberada');
      if (idleTimeoutRef.current !== null) {
        window.clearTimeout(idleTimeoutRef.current);
      }
      idleTimeoutRef.current = window.setTimeout(() => {
        idleTimeoutRef.current = null;
        if (cancelled) return;
        if (cameraModeRef.current !== 'shared') return;
        cycleStateRef.current = 'warmup';
        warmupFramesRef.current = 0;
        sampleStartedAtRef.current = null;
        setSharedIdleUntil(null);
        void start();
      }, sharedIntervalMsRef.current);
    };

    const runFrame = (): void => {
      if (cancelled) return;
      frameRef.current = requestAnimationFrame(runFrame);

      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !landmarker || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

      const now = performance.now();
      if (now - lastInferenceRef.current < 100) return;
      lastInferenceRef.current = now;

      const result = landmarker.detectForVideo(video, now);
      const poseLandmarks = result.landmarks[0];
      const overlay = overlayRef.current;
      const landmarks = landmarkSmoother.smooth(mapPoseLandmarks(poseLandmarks));

      if (overlay && showOverlayRef.current) {
        const bounds = overlay.getBoundingClientRect();
        drawPoseOverlay(overlay, poseLandmarks, {
          viewportWidth: bounds.width,
          viewportHeight: bounds.height,
          sourceWidth: video.videoWidth || 1280,
          sourceHeight: video.videoHeight || 720,
          pixelRatio: window.devicePixelRatio || 1,
        });
      }

      const rawAnalysis = analyzePosture(landmarks);

      if (cycleStateRef.current === 'warmup') {
        if (rawAnalysis.state !== 'calibrating' && isCalibratedRef.current) {
          warmupFramesRef.current += 1;
          if (warmupFramesRef.current >= SHARED_WARMUP_FRAMES) {
            cycleStateRef.current = 'sampling';
            sampleStartedAtRef.current = now;
          }
        }
        return;
      }

      if (rawAnalysis.state === 'calibrating') {
        if (isCalibratedRef.current) {
          awaySinceRef.current ??= now;
          postureWatcher.observe('away', []);
          if (now - awaySinceRef.current >= AWAY_GRACE_MS) {
            smoother.reset();
            if (streakStartRef.current !== null) {
              streakStartRef.current = null;
              setStreakMs(0);
            }
            timelineRecorder.flush(now);
            setAwaitingUpright(false);
            setAnalysis({
              state: 'away',
              score: 0,
              reasons: [],
              message: 'Você saiu da câmera. Volte quando estiver pronto.',
              metrics: rawAnalysis.metrics,
            });
            pushFloating('away', 0, 'Fora da tela');
          }
          return;
        }
        postureWatcher.observe('calibrating', []);
        setAwaitingUpright(false);
        setCalibrationProgress(0);
        setAnalysis(rawAnalysis);
        pushFloating('calibrating', 0, 'Calibrando');
        return;
      }

      awaySinceRef.current = null;

      if (!isCalibratedRef.current) {
        if (!isUprightSample(rawAnalysis.metrics)) {
          postureWatcher.observe('calibrating', []);
          setAwaitingUpright(true);
          setAnalysis({
            ...rawAnalysis,
            state: 'calibrating',
            score: 0,
            reasons: [],
            message: 'Sente-se ereto para calibrar',
          });
          pushFloating('calibrating', 0, 'Sente-se ereto');
          return;
        }

        calibrationSamplesRef.current.push(rawAnalysis.metrics);
        calibrationStartedRef.current ??= now;
        setAwaitingUpright(false);

        const elapsed = now - calibrationStartedRef.current;
        const enoughSamples = calibrationSamplesRef.current.length >= MIN_CALIBRATION_SAMPLES;
        const enoughTime = elapsed >= calibrationDurationRef.current;
        const progress = Math.min(
          1,
          Math.min(
            elapsed / Math.max(1, calibrationDurationRef.current),
            calibrationSamplesRef.current.length / MIN_CALIBRATION_SAMPLES,
          ),
        );
        setCalibrationProgress(progress);

        if (enoughSamples && enoughTime) {
          const personalized = createPersonalizedThresholds(calibrationSamplesRef.current);
          baseThresholdsRef.current = personalized;
          personalizedThresholdsRef.current = scaleThresholds(personalized, multiplierRef.current);
          isCalibratedRef.current = true;
          smoother.reset();
          setCalibrationProgress(1);
          persistCalibration(personalized, calibrationSamplesRef.current);
        } else {
          postureWatcher.observe('calibrating', []);
          setAnalysis({
            ...rawAnalysis,
            state: 'calibrating',
            score: 0,
            reasons: [],
            message: 'Mantenha postura ereta',
          });
          pushFloating('calibrating', 0, 'Calibrando');
          return;
        }
      }

      const nextAnalysis = smoother.push(
        analyzePosture(landmarks, personalizedThresholdsRef.current ?? undefined),
      );

      postureWatcher.observe(nextAnalysis.state, nextAnalysis.reasons);
      timelineRecorder.observe(nextAnalysis.state);
      setAnalysis(nextAnalysis);
      pushFloating(nextAnalysis.state, nextAnalysis.score);

      if (cameraModeRef.current === 'shared') {
        if (cycleStateRef.current === 'continuous') cycleStateRef.current = 'sampling';
        if (cycleStateRef.current === 'sampling') {
          sampleStartedAtRef.current ??= now;
          if (now - sampleStartedAtRef.current >= SHARED_SAMPLE_WINDOW_MS) {
            enterIdle();
            return;
          }
        }
      }

      if (nextAnalysis.state === 'good') {
        if (streakStartRef.current === null) {
          streakStartRef.current = now;
        }
        setStreakMs(now - streakStartRef.current);
      } else if (streakStartRef.current !== null) {
        streakStartRef.current = null;
        setStreakMs(0);
      }

      if (now - lastScoreSampleRef.current >= SCORE_SAMPLE_INTERVAL_MS) {
        lastScoreSampleRef.current = now;
        const history = scoreHistoryRef.current;
        history.push({ score: nextAnalysis.score, state: nextAnalysis.state });
        if (history.length > SCORE_HISTORY_MAX) history.shift();
        setScoreHistory([...history]);
      }
    };

    const messageForCameraError = (error: unknown): string => {
      switch (classifyMediaError(error)) {
        case 'permission-denied':
          return 'Permissão da webcam negada. Libere o acesso à câmera nas configurações do sistema.';
        case 'no-camera':
          return 'Nenhuma webcam encontrada. Conecte uma câmera e tente novamente.';
        case 'camera-in-use':
          return 'Webcam em uso por outro app. Feche videoconferências ou apps que estejam usando a câmera.';
        case 'unsupported':
          return 'Webcam indisponível neste dispositivo.';
        default:
          return 'Sem acesso à webcam. Verifique a permissão.';
      }
    };

    const scheduleBusyRetry = (): void => {
      if (cancelled) return;
      clearBusyRetry();
      busyAttempts += 1;
      const delayMs = Math.min(15_000, 1500 + busyAttempts * 1000);
      busyRetryTimeout = window.setTimeout(() => {
        busyRetryTimeout = null;
        if (cancelled) return;
        void start();
      }, delayMs);
    };

    const start = async (): Promise<void> => {
      if (cancelled) return;
      diagnosticCaptureRef.current = {};
      let stream: MediaStream;

      try {
        stream = await navigator.mediaDevices.getUserMedia(POSTURE_CHECK_MEDIA_CONSTRAINTS);
      } catch (error) {
        const kind = classifyMediaError(error);
        console.warn('[posture-check] camera error', kind, error);
        if (cancelled) return;

        if (kind === 'camera-in-use') {
          diagnosticCaptureRef.current = { error, stream: null };
          setErrorDetails(null);
          setAnalysis({
            ...initialAnalysis,
            state: 'camera-error',
            message: 'Câmera em uso por outro app. Aguardando ficar livre…',
          });
          pushFloating('camera-error', 0, 'Câmera ocupada');
          scheduleBusyRetry();
          return;
        }

        diagnosticCaptureRef.current = { error, stream: null };
        setErrorDetails(formatMediaErrorDetails(error));
        setAnalysis({ ...initialAnalysis, state: 'camera-error', message: messageForCameraError(error) });
        pushFloating('camera-error', 0, 'Sem câmera');
        return;
      }

      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      busyAttempts = 0;
      clearBusyRetry();

      stream.getTracks().forEach((t) => {
        t.onended = (): void => {
          if (cancelled) return;
          console.warn('[posture-check] camera track ended — yielding & retrying');
          stopStream();
          setAnalysis({
            ...initialAnalysis,
            state: 'camera-error',
            message: 'Câmera tomada por outro app. Aguardando ficar livre…',
          });
          pushFloating('camera-error', 0, 'Câmera ocupada');
          scheduleBusyRetry();
        };
      });

      streamRef.current = stream;

      if (!settings.cameraPermissionGranted) {
        onSettingsChange?.({ cameraPermissionGranted: true });
      }

      try {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error) {
        console.warn('[posture-check] video play error', error);
        if (!cancelled) {
          diagnosticCaptureRef.current = { error, stream: streamRef.current };
          setErrorDetails(formatMediaErrorDetails(error));
          setAnalysis({ ...initialAnalysis, state: 'camera-error', message: messageForCameraError(error) });
          pushFloating('camera-error', 0, 'Sem câmera');
        }
        return;
      }

      if (!landmarkerRef.current) {
        try {
          landmarkerRef.current = await createPoseLandmarker();
        } catch (error) {
          console.warn('[posture-check] pose landmarker error', error);
          if (!cancelled) {
            diagnosticCaptureRef.current = { error, stream: streamRef.current };
            setErrorDetails(formatMediaErrorDetails(error));
            setAnalysis({ ...initialAnalysis, state: 'model-error', message: 'Falha ao carregar o detector de pose.' });
            pushFloating('model-error', 0, 'Erro modelo');
          }
          return;
        }
      }

      if (!cancelled) {
        diagnosticCaptureRef.current = {};
        setErrorDetails(null);
        if (!isCalibratedRef.current) {
          setAnalysis((c) => ({ ...c, message: 'Calibrando' }));
        }
        frameRef.current = requestAnimationFrame(runFrame);
      }
    };

    restartCameraRef.current = (): void => {
      if (cancelled) return;
      if (idleTimeoutRef.current !== null) {
        window.clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = null;
      }
      idleUntilRef.current = null;
      setSharedIdleUntil(null);
      cycleStateRef.current = cameraModeRef.current === 'shared' ? 'sampling' : 'continuous';
      warmupFramesRef.current = 0;
      sampleStartedAtRef.current = null;
      void start();
    };

    void start();

    return () => {
      cancelled = true;
      clearBusyRetry();
      if (idleTimeoutRef.current !== null) {
        window.clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = null;
      }
      idleUntilRef.current = null;
      setSharedIdleUntil(null);
      restartCameraRef.current = null;
      cycleStateRef.current = cameraModeRef.current === 'shared' ? 'sampling' : 'continuous';
      warmupFramesRef.current = 0;
      sampleStartedAtRef.current = null;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      stopStream();
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
      overlayRef.current?.getContext('2d')?.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
      smoother.reset();
      landmarkSmoother.reset();
      postureWatcher.reset();
      timelineRecorder.flush();
      timelineRecorder.reset();
      window.postureApp?.hideAlert();
      calibrationSamplesRef.current = [];
      calibrationStartedRef.current = null;
      baseThresholdsRef.current = null;
      personalizedThresholdsRef.current = null;
      isCalibratedRef.current = false;
      streakStartRef.current = null;
      scoreHistoryRef.current = [];
      lastScoreSampleRef.current = 0;
      awaySinceRef.current = null;
    };
  }, [smoother, landmarkSmoother, postureWatcher, timelineRecorder, persistCalibration, pushFloating]);

  const isError = analysis.state === 'camera-error' || analysis.state === 'model-error';
  const isAway = analysis.state === 'away';
  const isActive = analysis.state === 'good' || analysis.state === 'warning' || analysis.state === 'bad';
  const isSharedIdle = sharedIdleUntil !== null;
  const sharedRemainingSec = isSharedIdle
    ? Math.max(0, Math.ceil(((sharedIdleUntil ?? 0) - sharedNow) / 1_000))
    : 0;
  const hint = hintFor(analysis, awaitingUpright);
  const hintTone = isError
    ? 'error'
    : isAway
      ? 'away'
      : awaitingUpright || analysis.state === 'bad' || analysis.state === 'warning'
        ? 'warn'
        : 'calibrating';
  const showCalibrationBar =
    analysis.state === 'calibrating' && !awaitingUpright && !isError && !isAway && !isSharedIdle;
  const calibrationPercent = Math.round(calibrationProgress * 100);

  const scoreBarModifier =
    analysis.state === 'bad' ? ' score-bar__fill--bad' : analysis.state === 'warning' ? ' score-bar__fill--warning' : '';

  const relevantReasons = analysis.reasons.filter((r) => r !== 'low-confidence');

  const checklistItems: { label: string; ok: boolean }[] = isActive
    ? [
        { label: 'Cabeça centralizada', ok: !analysis.reasons.includes('head-forward') },
        { label: 'Ombros nivelados', ok: !analysis.reasons.includes('shoulder-tilt') },
        { label: 'Pescoço alinhado', ok: !analysis.reasons.includes('neck-tilt') },
        { label: 'Costas eretas', ok: !analysis.reasons.includes('slouch') },
        { label: 'Cabeça erguida', ok: !analysis.reasons.includes('head-down') },
      ]
    : [];

  const isMini = miniView !== 'off';
  const miniViewClass = isMini ? ` camera-stage--mini camera-stage--mini-${miniView}` : '';
  const showVideoInMini = miniView !== 'points';
  const showOverlayInMini = !isMini || miniView === 'points' || settings.showOverlay;

  if (isMini) {
    return (
      <section
        className={`mini-panel mini-panel--${miniView} status-${analysis.state}`}
        aria-live="polite"
      >
        <div
          ref={cameraStageRef}
          className={`camera-stage${settings.mirrorVideo ? ' camera-stage--mirrored' : ''}${miniViewClass}`}
        >
          <div className="camera-stage__inner">
            <video
              ref={videoRef}
              className={`camera-preview${showVideoInMini ? '' : ' camera-preview--hidden'}`}
              muted
              playsInline
            />
            <canvas
              ref={overlayRef}
              className={`pose-overlay${showOverlayInMini ? '' : ' pose-overlay--hidden'}`}
              aria-hidden="true"
            />
          </div>

          <div className="mini-drag-region" aria-hidden="true" />

          <div className="mini-controls" role="toolbar" aria-label="Controles do mini">
            <span
              className={`mini-controls__status status-dot status-${analysis.state}`}
              aria-label={statusLabels[analysis.state]}
            />
            <div className="mini-controls__modes" role="group" aria-label="Modo de visualização">
              <Tooltip label="Mostrar câmera" placement="bottom">
                <button
                  type="button"
                  className={`mini-mode-btn${miniView === 'full' ? ' mini-mode-btn--active' : ''}`}
                  aria-pressed={miniView === 'full'}
                  aria-label="Mostrar câmera"
                  onClick={() => onChangeMiniView?.('full')}
                >
                  <Camera size={14} aria-hidden="true" />
                </button>
              </Tooltip>
              <Tooltip label="Ocultar câmera (modo privado)" placement="bottom">
                <button
                  type="button"
                  className={`mini-mode-btn${miniView === 'points' ? ' mini-mode-btn--active' : ''}`}
                  aria-pressed={miniView === 'points'}
                  aria-label="Ocultar câmera (modo privado)"
                  onClick={() => onChangeMiniView?.('points')}
                >
                  <EyeOff size={14} aria-hidden="true" />
                </button>
              </Tooltip>
            </div>
            <Tooltip label="Expandir janela" placement="bottom">
              <button
                type="button"
                className="mini-mode-btn mini-mode-btn--expand"
                aria-label="Expandir janela"
                onClick={() => onExitMini?.()}
              >
                <Maximize2 size={14} aria-hidden="true" />
              </button>
            </Tooltip>
          </div>

          {analysis.state === 'good' && streakMs >= 1000 ? (
            <div className="mini-streak" aria-label={`Streak ${formatStreak(streakMs)}`}>
              <Flame size={11} aria-hidden="true" />
              <span>{formatStreak(streakMs)}</span>
            </div>
          ) : null}

          {isError ? (
            <p className="mini-error" role="alert">
              {analysis.message}
            </p>
          ) : null}

          {isAway ? (
            <div className="mini-away" role="status" aria-live="polite">
              <UserX size={14} aria-hidden="true" />
              <span>Fora da tela</span>
            </div>
          ) : null}

          {isSharedIdle ? (
            <div className="mini-shared-idle" role="status" aria-live="polite">
              <Pause size={14} aria-hidden="true" />
              <span>
                Câmera livre · próxima leitura em {sharedRemainingSec}s
              </span>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="card posture-card" aria-live="polite">
      <div className="posture-header">
        <div className="status-title">
          <span className={`status-dot status-${analysis.state}`} aria-hidden="true" />
          <h2>{statusLabels[analysis.state]}</h2>
        </div>
        <div className="posture-header__actions">
          <button
            className="icon-button"
            type="button"
            aria-label="Recalibrar"
            onClick={recalibrate}
            disabled={!isCalibratedRef.current}
          >
            <RotateCcw size={20} aria-hidden="true" />
          </button>
          <Tooltip
            label="Reduz a janela e mantém o monitor de postura visível por cima dos outros apps"
            placement="bottom"
          >
            <button
              className="icon-button"
              type="button"
              aria-label="Reduzir para janela flutuante"
              onClick={() => onChangeMiniView?.('full')}
            >
              <PictureInPicture2 size={20} aria-hidden="true" />
            </button>
          </Tooltip>
          <button className="button button--text" type="button" onClick={onStop}>
            Pausar
          </button>
        </div>
      </div>

      <div
        ref={cameraStageRef}
        className={`camera-stage${settings.mirrorVideo ? ' camera-stage--mirrored' : ''}`}
      >
        <video ref={videoRef} className="camera-preview" muted playsInline />
        <canvas
          ref={overlayRef}
          className={`pose-overlay${settings.showOverlay ? '' : ' pose-overlay--hidden'}`}
          aria-hidden="true"
        />
        {hint ? (
          <div className={`hint-pill hint-pill--${hintTone}`} role="status">
            {hint}
          </div>
        ) : null}
        {isAway ? (
          <div className="away-banner" role="status" aria-live="polite">
            <UserX size={28} aria-hidden="true" />
            <div className="away-banner__text">
              <strong className="away-banner__title">Você saiu da câmera</strong>
              <span className="away-banner__hint">Monitoramento pausado. Volte quando estiver pronto.</span>
            </div>
          </div>
        ) : null}
        {isSharedIdle ? (
          <div className="shared-idle-banner" role="status" aria-live="polite">
            <Pause size={28} aria-hidden="true" />
            <div className="shared-idle-banner__text">
              <strong className="shared-idle-banner__title">Câmera liberada</strong>
              <span className="shared-idle-banner__hint">
                Outros apps podem usar a câmera. Próxima leitura em {sharedRemainingSec}s.
              </span>
            </div>
          </div>
        ) : null}
        {showCalibrationBar ? (
          <div
            className="calibration-progress"
            role="progressbar"
            aria-label="Progresso da calibração"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={calibrationPercent}
          >
            <div className="calibration-progress__fill" style={{ width: `${calibrationPercent}%` }} />
          </div>
        ) : null}
        {isActive && analysis.state === 'good' && streakMs >= 1000 ? (
          <div className="streak-pill" aria-live="polite" aria-label={`Streak de postura ${formatStreak(streakMs)}`}>
            <Flame size={16} aria-hidden="true" />
            <span className="streak-pill__label">Streak</span>
            <span className="streak-pill__time">{formatStreak(streakMs)}</span>
          </div>
        ) : null}
        {isActive && scoreHistory.length >= 2 ? (
          <div className="sparkline" aria-hidden="true">
            <svg viewBox="0 0 100 24" preserveAspectRatio="none">
              {buildSparklineSegments(scoreHistory, 100, 24).map((segment, i) => (
                <line
                  key={i}
                  x1={segment.x1}
                  y1={segment.y1}
                  x2={segment.x2}
                  y2={segment.y2}
                  className={`sparkline__seg sparkline__seg--${segment.state}`}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
          </div>
        ) : null}
        {checklistItems.length > 0 ? (
          <aside className="evaluation evaluation--floating" aria-label="Avaliação da postura">
            <div className="evaluation__score">
              <span className="evaluation__score-label">Score geral</span>
              <span className="evaluation__score-value">{analysis.score}</span>
            </div>
            <ul className="checklist" role="list">
              {checklistItems.map((item) => (
                <li key={item.label} className={`checklist__item checklist__item--${item.ok ? 'ok' : 'bad'}`}>
                  <span className="checklist__label">{item.label}</span>
                  <span className="checklist__mark" aria-label={item.ok ? 'Ok' : 'Corrigir'}>
                    {item.ok ? '✓' : '✗'}
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </div>

      {isError ? (
        <div className="error-note" role="alert">
          <p className="error-note__message">{analysis.message}</p>
          <div className="error-note__actions">
            <button type="button" className="button button--filled" onClick={() => void copyDetailedLogs()}>
              Copiar logs detalhados
            </button>
            {copyDiagFeedback === 'copied' ? (
              <span className="error-note__feedback" aria-live="polite">
                Copiado para a área de transferência
              </span>
            ) : null}
            {copyDiagFeedback === 'failed' ? (
              <span className="error-note__feedback" aria-live="polite">
                Não foi possível copiar. Selecione e copie os detalhes abaixo.
              </span>
            ) : null}
          </div>
          {errorDetails ? (
            <details className="error-note__details">
              <summary>Resumo do erro (copiar)</summary>
              <pre className="error-note__pre">{errorDetails}</pre>
              <button
                type="button"
                className="button button--text"
                onClick={() => {
                  void navigator.clipboard?.writeText(errorDetails).catch(() => undefined);
                }}
              >
                Copiar resumo
              </button>
            </details>
          ) : null}
        </div>
      ) : null}

      {isActive ? (
        <div className={`status-row${analysis.state === 'bad' ? ' status-row--error' : ''}`}>
          <span className={`status-dot status-${analysis.state}`} aria-hidden="true" />
          <div className="status-text">
            <p className="status-message">
              {relevantReasons.length > 0
                ? reasonMessages[relevantReasons[0]][analysis.state === 'bad' ? 'bad' : 'warning']
                : 'Postura ok'}
            </p>
            <p className="status-score">Score {analysis.score}</p>
          </div>
        </div>
      ) : null}

      {isActive ? (
        <div className="score-scale-group">
          <div className="score-bar" aria-label={`Score ${analysis.score}`}>
            <div
              className={`score-bar__fill${scoreBarModifier}`}
              style={{ width: `${analysis.score}%` }}
            />
          </div>
          <div className="score-scale" aria-hidden="true">
            <span className="score-scale__tick">0</span>
            <span className="score-scale__tick">50</span>
            <span className="score-scale__tick">75</span>
            <span className="score-scale__tick">100</span>
          </div>
        </div>
      ) : null}
    </section>
  );
};

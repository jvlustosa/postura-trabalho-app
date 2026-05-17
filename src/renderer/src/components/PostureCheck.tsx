import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Crosshair, Flame, Maximize2, PictureInPicture2, RotateCcw, Sparkles } from 'lucide-react';
import type { PoseLandmarker } from '@mediapipe/tasks-vision';

import type { MiniView } from '../App';
import { type AlertLevel, createPostureWatcher } from '../lib/alerts/createPostureWatcher';
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
import type { PostureAnalysis, PostureReason, PostureState, PostureThresholds } from '../lib/posture/types';
import { sensitivityMultiplier } from '../lib/settings/sensitivityMultiplier';
import type { AppSettings, CalibrationData } from '../lib/settings/types';
import { createTimelineRecorder } from '../lib/timeline/createTimelineRecorder';

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
  'camera-error': 'Sem câmera',
  'model-error': 'Erro no modelo',
};

const reasonMessages: Record<PostureReason, { warning: string; bad: string }> = {
  'low-confidence': { warning: 'Enquadre melhor cabeça e ombros.', bad: 'Enquadre melhor cabeça e ombros.' },
  'head-forward': { warning: 'Sua cabeça está um pouco à frente. Recue levemente.', bad: 'Sua cabeça está muito projetada à frente. Reajuste agora.' },
  'shoulder-tilt': { warning: 'Seus ombros estão levemente desnivelados.', bad: 'Seus ombros estão muito desnivelados. Nivele-os.' },
  'neck-tilt': { warning: 'Pescoço levemente inclinado. Alinhe a cabeça.', bad: 'Seu pescoço está muito inclinado. Corrija a posição.' },
  slouch: { warning: 'Você está curvando levemente as costas. Endireite-se.', bad: 'Suas costas estão muito curvadas. Sente-se ereto agora.' },
  'head-down': { warning: 'Sua cabeça está caindo um pouco. Levante o olhar.', bad: 'Sua cabeça está muito baixa. Levante a cabeça.' },
};

const hintFor = (analysis: PostureAnalysis, awaitingUpright: boolean): string | null => {
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

const buildAlertMessage = (level: AlertLevel, reasons: PostureReason[]): string => {
  const relevant = reasons.filter((r) => r !== 'low-confidence');
  if (relevant.length === 0) return 'Reajuste sua postura.';
  return reasonMessages[relevant[0]]?.[level] ?? 'Reajuste sua postura.';
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

const buildSparklinePoints = (values: readonly number[], width: number, height: number): string => {
  if (values.length < 2) return '';
  const step = width / (values.length - 1);
  return values
    .map((v, i) => {
      const clamped = Math.max(0, Math.min(100, v));
      const x = i * step;
      const y = height - (clamped / 100) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
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
    const stage = cameraStageRef.current;
    if (stage && miniView !== 'face') {
      stage.style.setProperty('--face-x', '50%');
      stage.style.setProperty('--face-y', '50%');
    }
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
  const scoreHistoryRef = useRef<number[]>([]);
  const lastScoreSampleRef = useRef(0);
  const lastFloatingPushRef = useRef(0);
  const lastFloatingStateRef = useRef<PostureState | null>(null);

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
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);
  const diagnosticCaptureRef = useRef<{ error?: unknown; stream?: MediaStream | null }>({});

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

    const stopStream = (): void => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
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

      if (miniViewRef.current === 'face' && poseLandmarks && poseLandmarks.length > 0) {
        const nose = poseLandmarks[0];
        const leftEar = poseLandmarks[7];
        const rightEar = poseLandmarks[8];
        const fxRaw =
          (nose?.x ?? 0.5) * 0.6 +
          ((leftEar?.x ?? nose?.x ?? 0.5) + (rightEar?.x ?? nose?.x ?? 0.5)) * 0.2;
        const fyRaw =
          (nose?.y ?? 0.5) * 0.6 +
          ((leftEar?.y ?? nose?.y ?? 0.5) + (rightEar?.y ?? nose?.y ?? 0.5)) * 0.2;
        const stage = cameraStageRef.current;
        if (stage) {
          const displayedFx = settings.mirrorVideo ? 1 - fxRaw : fxRaw;
          const clampedX = Math.max(0.15, Math.min(0.85, displayedFx));
          const clampedY = Math.max(0.15, Math.min(0.85, fyRaw));
          stage.style.setProperty('--face-x', `${(clampedX * 100).toFixed(1)}%`);
          stage.style.setProperty('--face-y', `${(clampedY * 100).toFixed(1)}%`);
        }
      }

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

      if (rawAnalysis.state === 'calibrating') {
        postureWatcher.observe('calibrating', []);
        setAwaitingUpright(false);
        setCalibrationProgress(0);
        setAnalysis(rawAnalysis);
        pushFloating('calibrating', 0, 'Calibrando');
        return;
      }

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
        history.push(nextAnalysis.score);
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

    const start = async (): Promise<void> => {
      diagnosticCaptureRef.current = {};
      let stream: MediaStream;

      try {
        stream = await navigator.mediaDevices.getUserMedia(POSTURE_CHECK_MEDIA_CONSTRAINTS);
      } catch (error) {
        console.warn('[posture-check] camera error', error);
        if (!cancelled) {
          diagnosticCaptureRef.current = { error, stream: null };
          setErrorDetails(formatMediaErrorDetails(error));
          setAnalysis({ ...initialAnalysis, state: 'camera-error', message: messageForCameraError(error) });
          pushFloating('camera-error', 0, 'Sem câmera');
        }
        return;
      }

      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

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

      if (!cancelled) {
        diagnosticCaptureRef.current = {};
        setErrorDetails(null);
        setAnalysis((c) => ({ ...c, message: 'Calibrando' }));
        frameRef.current = requestAnimationFrame(runFrame);
      }
    };

    void start();

    return () => {
      cancelled = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      stopStream();
      landmarkerRef.current?.close();
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
    };
  }, [smoother, landmarkSmoother, postureWatcher, timelineRecorder, persistCalibration, pushFloating]);

  const isError = analysis.state === 'camera-error' || analysis.state === 'model-error';
  const isActive = analysis.state === 'good' || analysis.state === 'warning' || analysis.state === 'bad';
  const hint = hintFor(analysis, awaitingUpright);
  const hintTone = isError
    ? 'error'
    : awaitingUpright || analysis.state === 'bad' || analysis.state === 'warning'
      ? 'warn'
      : 'calibrating';
  const showCalibrationBar = analysis.state === 'calibrating' && !awaitingUpright && !isError;
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
          className={`camera-stage${settings.mirrorVideo && miniView !== 'face' ? ' camera-stage--mirrored' : ''}${miniViewClass}`}
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
              <button
                type="button"
                className={`mini-mode-btn${miniView === 'full' ? ' mini-mode-btn--active' : ''}`}
                aria-pressed={miniView === 'full'}
                aria-label="Câmera completa"
                title="Câmera completa"
                onClick={() => onChangeMiniView?.('full')}
              >
                <Camera size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`mini-mode-btn${miniView === 'face' ? ' mini-mode-btn--active' : ''}`}
                aria-pressed={miniView === 'face'}
                aria-label="Seguir rosto"
                title="Seguir rosto"
                onClick={() => onChangeMiniView?.('face')}
              >
                <Crosshair size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`mini-mode-btn${miniView === 'points' ? ' mini-mode-btn--active' : ''}`}
                aria-pressed={miniView === 'points'}
                aria-label="Apenas pontos"
                title="Apenas pontos"
                onClick={() => onChangeMiniView?.('points')}
              >
                <Sparkles size={14} aria-hidden="true" />
              </button>
            </div>
            <button
              type="button"
              className="mini-mode-btn mini-mode-btn--expand"
              aria-label="Expandir janela"
              title="Expandir janela"
              onClick={() => onExitMini?.()}
            >
              <Maximize2 size={14} aria-hidden="true" />
            </button>
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
          <button
            className="icon-button"
            type="button"
            aria-label="Modo janela compacta"
            title="Encolhe a janela e posiciona no canto inferior direito da tela onde o cursor está"
            onClick={() => onChangeMiniView?.('full')}
          >
            <PictureInPicture2 size={20} aria-hidden="true" />
          </button>
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
            <Flame size={14} aria-hidden="true" />
            <span className="streak-pill__time">{formatStreak(streakMs)}</span>
          </div>
        ) : null}
        {isActive && scoreHistory.length >= 2 ? (
          <div
            className={`sparkline sparkline--${analysis.state}`}
            aria-hidden="true"
          >
            <svg viewBox="0 0 100 24" preserveAspectRatio="none">
              <polyline
                points={buildSparklinePoints(scoreHistory, 100, 24)}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
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
        <div className="score-bar" aria-label={`Score ${analysis.score}`}>
          <div
            className={`score-bar__fill${scoreBarModifier}`}
            style={{ width: `${analysis.score}%` }}
          />
        </div>
      ) : null}
    </section>
  );
};

import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type { PoseLandmarker } from '@mediapipe/tasks-vision';

import { type AlertLevel, createPostureWatcher } from '../lib/alerts/createPostureWatcher';
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
}

const UPRIGHT_SAMPLE_LIMITS = {
  headOffset: 0.12,
  shoulderTilt: 0.06,
};
const MIN_CALIBRATION_SAMPLES = 5;

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

export const PostureCheck = ({ onStop, settings, onSettingsChange }: PostureCheckProps): ReactElement => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastInferenceRef = useRef(0);
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
          window.postureApp?.showAlert(level, buildAlertMessage(level, reasons));
        },
        onClear: () => {
          window.postureApp?.hideAlert();
        },
      }),
    [],
  );

  const [analysis, setAnalysis] = useState<PostureAnalysis>(initialAnalysis);
  const [awaitingUpright, setAwaitingUpright] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);

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
    smoother.reset();
    landmarkSmoother.reset();
    postureWatcher.reset();
    timelineRecorder.flush();
    timelineRecorder.reset();
    window.postureApp?.hideAlert();
    setAwaitingUpright(false);
    setCalibrationProgress(0);
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
          return;
        }
      }

      const nextAnalysis = smoother.push(
        analyzePosture(landmarks, personalizedThresholdsRef.current ?? undefined),
      );

      postureWatcher.observe(nextAnalysis.state, nextAnalysis.reasons);
      timelineRecorder.observe(nextAnalysis.state);
      setAnalysis(nextAnalysis);
    };

    const start = async (): Promise<void> => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 60 } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        landmarkerRef.current = await createPoseLandmarker();

        if (!cancelled) {
          setAnalysis((c) => ({ ...c, message: 'Calibrando' }));
          frameRef.current = requestAnimationFrame(runFrame);
        }
      } catch {
        if (!cancelled) {
          setAnalysis({ ...initialAnalysis, state: 'camera-error', message: 'Sem acesso à webcam. Verifique a permissão.' });
        }
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
    };
  }, [smoother, landmarkSmoother, postureWatcher, timelineRecorder, persistCalibration]);

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
          <button className="button button--text" type="button" onClick={onStop}>
            Pausar
          </button>
        </div>
      </div>

      <div className={`camera-stage${settings.mirrorVideo ? ' camera-stage--mirrored' : ''}`}>
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
      </div>

      {isError ? <p className="error-note">{analysis.message}</p> : null}

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

      {checklistItems.length > 0 ? (
        <div className="evaluation">
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
          <div className="evaluation__score">
            <span className="evaluation__score-label">Score geral</span>
            <span className="evaluation__score-value">{analysis.score}</span>
          </div>
        </div>
      ) : null}
    </section>
  );
};

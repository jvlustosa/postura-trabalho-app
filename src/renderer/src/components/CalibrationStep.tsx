import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { Camera, ShieldCheck } from 'lucide-react';
import type { PoseLandmarker } from '@mediapipe/tasks-vision';

import { buildCameraDiagnosticReport } from '../lib/media/buildCameraDiagnosticReport';
import { classifyMediaError, formatMediaErrorDetails } from '../lib/media/classifyMediaError';
import { createPoseLandmarker } from '../lib/pose/createPoseLandmarker';
import { drawPoseOverlay } from '../lib/pose/poseOverlay';
import { mapPoseLandmarks } from '../lib/pose/mapPoseLandmarks';
import { analyzePosture } from '../lib/posture/analyzePosture';
import { createPersonalizedThresholds } from '../lib/posture/createPersonalizedThresholds';
import type { PostureAnalysis } from '../lib/posture/types';
import type { CalibrationData } from '../lib/settings/types';

interface CalibrationStepProps {
  durationSeconds: number;
  onCalibrated: (data: CalibrationData) => void;
  onSkip: () => void;
}

type Phase = 'consent' | 'preparing' | 'sampling' | 'done' | 'error';

type ErrorReason =
  | 'permission-denied'
  | 'no-camera'
  | 'camera-in-use'
  | 'unsupported'
  | 'model-failed'
  | 'no-samples'
  | 'unknown';

type MediaReason = 'permission-denied' | 'no-camera' | 'camera-in-use' | 'unsupported' | 'unknown';

const CALIBRATION_MEDIA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 15, max: 30 },
  },
  audio: false,
};

const SETTLE_DELAY_MS = 1_000;
const UPRIGHT_SAMPLE_LIMITS = {
  headOffset: 0.12,
  shoulderTilt: 0.06,
};
const MIN_UPRIGHT_SAMPLES = 5;

const isUprightSample = (metrics: PostureAnalysis['metrics']): boolean =>
  metrics.headOffset <= UPRIGHT_SAMPLE_LIMITS.headOffset &&
  metrics.shoulderTilt <= UPRIGHT_SAMPLE_LIMITS.shoulderTilt;

interface ErrorCopy {
  title: string;
  hint: string;
  retryable: boolean;
}

const ERROR_COPY: Record<ErrorReason, ErrorCopy> = {
  'permission-denied': {
    title: 'Permissão da webcam negada',
    hint: 'Libere o acesso à câmera nas configurações do sistema e tente novamente.',
    retryable: true,
  },
  'no-camera': {
    title: 'Nenhuma webcam encontrada',
    hint: 'Conecte uma câmera e tente novamente, ou pule esta etapa.',
    retryable: true,
  },
  'camera-in-use': {
    title: 'Webcam em uso por outro app',
    hint: 'Feche videoconferências ou outros apps que estejam usando a câmera.',
    retryable: true,
  },
  unsupported: {
    title: 'Webcam indisponível neste dispositivo',
    hint: 'Seu sistema não expôs uma câmera utilizável para o app.',
    retryable: false,
  },
  'model-failed': {
    title: 'Falha ao carregar o detector de pose',
    hint: 'Verifique sua conexão e tente novamente em alguns segundos.',
    retryable: true,
  },
  'no-samples': {
    title: 'Não conseguimos te enxergar',
    hint: 'Posicione-se diante da câmera com o tronco visível e tente novamente.',
    retryable: true,
  },
  unknown: {
    title: 'Algo deu errado na calibragem',
    hint: 'Tente novamente. Se persistir, pule esta etapa e calibre depois nas configurações.',
    retryable: true,
  },
};

const toErrorReason = (mediaReason: MediaReason): ErrorReason => mediaReason;

export const CalibrationStep = ({
  durationSeconds,
  onCalibrated,
  onSkip,
}: CalibrationStepProps): ReactElement => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const frameRef = useRef<number | null>(null);
  const samplesRef = useRef<PostureAnalysis['metrics'][]>([]);
  const startedAtRef = useRef<number | null>(null);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [phase, setPhase] = useState<Phase>('consent');
  const [secondsLeft, setSecondsLeft] = useState<number>(durationSeconds);
  const [progress, setProgress] = useState<number>(0);
  const [errorReason, setErrorReason] = useState<ErrorReason>('unknown');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState<number>(0);
  const [copyDiagFeedback, setCopyDiagFeedback] = useState<'idle' | 'copied' | 'failed'>('idle');
  const diagnosticCaptureRef = useRef<{ error?: unknown; stream?: MediaStream | null }>({});

  const beginCalibration = useCallback((): void => {
    diagnosticCaptureRef.current = {};
    setErrorDetails(null);
    setHasStarted(true);
  }, []);

  const retry = useCallback((): void => {
    diagnosticCaptureRef.current = {};
    setErrorDetails(null);
    setRetryToken((token) => token + 1);
  }, []);

  const copyDetailedLogs = useCallback(async (): Promise<void> => {
    const { error, stream } = diagnosticCaptureRef.current;
    const title = ERROR_COPY[errorReason].title;
    try {
      const text = await buildCameraDiagnosticReport(error, {
        surface: 'calibration',
        uiMessage: title,
        constraints: CALIBRATION_MEDIA_CONSTRAINTS,
        video: videoRef.current,
        stream: stream ?? streamRef.current,
        extraNotes:
          errorReason === 'no-samples'
            ? 'Calibração encerrada sem amostras suficientes de pose.'
            : undefined,
      });
      await navigator.clipboard.writeText(text);
      setCopyDiagFeedback('copied');
      window.setTimeout(() => setCopyDiagFeedback('idle'), 2500);
    } catch {
      setCopyDiagFeedback('failed');
      window.setTimeout(() => setCopyDiagFeedback('idle'), 2500);
    }
  }, [errorReason]);

  useEffect(() => {
    if (!hasStarted) {
      return;
    }

    let cancelled = false;
    const durationMs = durationSeconds * 1_000;
    setPhase('preparing');
    setSecondsLeft(durationSeconds);
    setProgress(0);
    samplesRef.current = [];
    startedAtRef.current = null;

    const stopStream = (): void => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };

    const failWith = (reason: ErrorReason, error?: unknown): void => {
      if (cancelled) {
        return;
      }

      if (error !== undefined) {
        console.warn('[calibration] failed', reason, error);
      }

      diagnosticCaptureRef.current = { error, stream: streamRef.current };

      stopStream();
      setErrorReason(reason);
      setErrorDetails(error !== undefined ? formatMediaErrorDetails(error) : null);
      setPhase('error');
    };

    const finish = (): void => {
      const allSamples = samplesRef.current;

      if (allSamples.length < 5) {
        failWith('no-samples');

        return;
      }

      const uprightSamples = allSamples.filter(isUprightSample);
      const samples =
        uprightSamples.length >= MIN_UPRIGHT_SAMPLES ? uprightSamples : allSamples;

      const thresholds = createPersonalizedThresholds(samples);
      const baseline = samples.reduce(
        (totals, current) => ({
          headOffset: totals.headOffset + current.headOffset,
          shoulderTilt: totals.shoulderTilt + current.shoulderTilt,
          neckTilt: totals.neckTilt + current.neckTilt,
          shoulderWidth: totals.shoulderWidth + current.shoulderWidth,
          torsoAspectRatio: totals.torsoAspectRatio + current.torsoAspectRatio,
          headVerticalRatio: totals.headVerticalRatio + current.headVerticalRatio,
        }),
        {
          headOffset: 0,
          shoulderTilt: 0,
          neckTilt: 0,
          shoulderWidth: 0,
          torsoAspectRatio: 0,
          headVerticalRatio: 0,
        },
      );
      const averaged = {
        headOffset: baseline.headOffset / samples.length,
        shoulderTilt: baseline.shoulderTilt / samples.length,
        neckTilt: baseline.neckTilt / samples.length,
        shoulderWidth: baseline.shoulderWidth / samples.length,
        torsoAspectRatio: baseline.torsoAspectRatio / samples.length,
        headVerticalRatio: baseline.headVerticalRatio / samples.length,
      };

      setPhase('done');
      onCalibrated({
        thresholds,
        baseline: averaged,
        sampleCount: samples.length,
        sampledAt: new Date().toISOString(),
      });
    };

    const tick = (): void => {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;

      if (
        !cancelled &&
        video &&
        landmarker &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        const now = performance.now();
        const startedAt = startedAtRef.current ?? now;
        startedAtRef.current = startedAt;
        const result = landmarker.detectForVideo(video, now);
        const poseLandmarks = result.landmarks[0];
        const landmarks = mapPoseLandmarks(poseLandmarks);
        const analysis = analyzePosture(landmarks);

        const overlay = overlayRef.current;
        if (overlay) {
          const bounds = overlay.getBoundingClientRect();
          drawPoseOverlay(overlay, poseLandmarks, {
            viewportWidth: bounds.width,
            viewportHeight: bounds.height,
            sourceWidth: video.videoWidth || 640,
            sourceHeight: video.videoHeight || 480,
            pixelRatio: window.devicePixelRatio || 1,
          });
        }

        const elapsed = now - startedAt;

        if (analysis.state !== 'calibrating' && elapsed >= SETTLE_DELAY_MS) {
          samplesRef.current.push(analysis.metrics);
        }

        const remaining = Math.max(0, Math.ceil((durationMs - elapsed) / 1_000));
        setSecondsLeft(remaining);
        setProgress(Math.min(1, elapsed / Math.max(1, durationMs)));

        if (elapsed >= durationMs) {
          setProgress(1);
          finish();

          return;
        }
      }

      if (!cancelled) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    const start = async (): Promise<void> => {
      diagnosticCaptureRef.current = {};

      if (!navigator.mediaDevices?.getUserMedia) {
        failWith('unsupported');

        return;
      }

      let stream: MediaStream;

      try {
        stream = await navigator.mediaDevices.getUserMedia(CALIBRATION_MEDIA_CONSTRAINTS);
      } catch (error) {
        failWith(toErrorReason(classifyMediaError(error)), error);

        return;
      }

      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop());

        return;
      }

      streamRef.current = stream;

      try {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error) {
        failWith(toErrorReason(classifyMediaError(error)) === 'unknown' ? 'camera-in-use' : toErrorReason(classifyMediaError(error)), error);

        return;
      }

      try {
        landmarkerRef.current = await createPoseLandmarker();
      } catch (error) {
        failWith('model-failed', error);

        return;
      }

      if (cancelled) {
        return;
      }

      diagnosticCaptureRef.current = {};
      setPhase('sampling');
      startedAtRef.current = performance.now();
      frameRef.current = requestAnimationFrame(tick);
    };

    void start();

    return () => {
      cancelled = true;

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      stopStream();
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
      samplesRef.current = [];
      startedAtRef.current = null;
    };
  }, [durationSeconds, onCalibrated, retryToken, hasStarted]);

  const errorCopy = ERROR_COPY[errorReason];

  return (
    <div className="calibration-step">
      <div className="calibration-step__stage">
        <video ref={videoRef} className="calibration-step__video" muted playsInline />
        <canvas ref={overlayRef} className="calibration-step__overlay-canvas" aria-hidden="true" />
        {phase === 'sampling' ? (
          <>
            <div className="calibration-step__countdown" aria-live="polite">
              {secondsLeft}
            </div>
            <div
              className="calibration-progress"
              role="progressbar"
              aria-label="Progresso da calibração"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
            >
              <div
                className="calibration-progress__fill"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </>
        ) : null}
        {phase === 'consent' ? (
          <div className="calibration-step__overlay calibration-step__overlay--consent">
            <Camera size={32} aria-hidden="true" className="calibration-step__overlay-icon" />
            <span className="calibration-step__overlay-text">Permita o acesso à câmera</span>
            <span className="calibration-step__overlay-sub">
              Vamos ler sua postura sem enviar imagens para fora deste dispositivo.
            </span>
          </div>
        ) : null}
        {phase === 'preparing' ? (
          <div className="calibration-step__overlay">
            <span className="calibration-step__overlay-text">Preparando câmera…</span>
          </div>
        ) : null}
        {phase === 'error' ? (
          <div
            className="calibration-step__overlay calibration-step__overlay--error"
            role="alert"
          >
            <span className="calibration-step__overlay-text">{errorCopy.title}</span>
          </div>
        ) : null}
        {phase === 'done' ? (
          <div className="calibration-step__overlay calibration-step__overlay--success">
            <span className="calibration-step__overlay-text">Calibragem salva neste dispositivo.</span>
          </div>
        ) : null}
      </div>

      {phase === 'error' ? (
        <>
          <div className="calibration-step__diag-actions">
            <button type="button" className="button button--filled" onClick={() => void copyDetailedLogs()}>
              Copiar logs detalhados
            </button>
            {copyDiagFeedback === 'copied' ? (
              <span className="calibration-step__diag-feedback" aria-live="polite">
                Copiado para a área de transferência
              </span>
            ) : null}
            {copyDiagFeedback === 'failed' ? (
              <span className="calibration-step__diag-feedback" aria-live="polite">
                Não foi possível copiar automaticamente
              </span>
            ) : null}
          </div>
          {errorDetails ? (
            <details className="calibration-step__error-details">
              <summary>Resumo do erro (copiar)</summary>
              <pre className="calibration-step__error-pre">{errorDetails}</pre>
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
        </>
      ) : null}

      <p className="calibration-step__hint">
        {phase === 'error'
          ? errorCopy.hint
          : phase === 'consent'
            ? 'Sente-se ereto, olhe para a tela e mantenha-se parado. Vamos detectar os pontos do seu corpo por alguns segundos para personalizar o monitoramento.'
            : 'Mantenha postura ereta, olhe para a tela e fique parado durante a contagem.'}
      </p>

      <div className="calibration-step__actions">
        {phase === 'consent' ? (
          <button className="button button--filled" type="button" onClick={beginCalibration}>
            <ShieldCheck size={18} aria-hidden="true" />
            Permitir câmera e começar
          </button>
        ) : null}
        {phase === 'error' && errorCopy.retryable ? (
          <button className="button button--filled" type="button" onClick={retry}>
            Tentar novamente
          </button>
        ) : null}
        <button className="button button--text" type="button" onClick={onSkip}>
          {phase === 'error' ? 'Pular esta etapa' : 'Calibrar depois'}
        </button>
      </div>
    </div>
  );
};

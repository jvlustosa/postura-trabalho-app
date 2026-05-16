import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import type { PoseLandmarker } from '@mediapipe/tasks-vision';

import { createPoseLandmarker } from '../lib/pose/createPoseLandmarker';
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

type Phase = 'preparing' | 'sampling' | 'done' | 'error';

type ErrorReason =
  | 'permission-denied'
  | 'no-camera'
  | 'camera-in-use'
  | 'unsupported'
  | 'model-failed'
  | 'no-samples'
  | 'unknown';

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

const classifyMediaError = (error: unknown): ErrorReason => {
  if (!(error instanceof Error)) {
    return 'unknown';
  }

  const name = error.name;

  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'permission-denied';
  }

  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'no-camera';
  }

  if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') {
    return 'camera-in-use';
  }

  if (name === 'TypeError') {
    return 'unsupported';
  }

  return 'unknown';
};

export const CalibrationStep = ({
  durationSeconds,
  onCalibrated,
  onSkip,
}: CalibrationStepProps): ReactElement => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const frameRef = useRef<number | null>(null);
  const samplesRef = useRef<PostureAnalysis['metrics'][]>([]);
  const startedAtRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<Phase>('preparing');
  const [secondsLeft, setSecondsLeft] = useState<number>(durationSeconds);
  const [progress, setProgress] = useState<number>(0);
  const [errorReason, setErrorReason] = useState<ErrorReason>('unknown');
  const [retryToken, setRetryToken] = useState<number>(0);

  const retry = useCallback((): void => {
    setRetryToken((token) => token + 1);
  }, []);

  useEffect(() => {
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

      stopStream();
      setErrorReason(reason);
      setPhase('error');
    };

    const finish = (): void => {
      const samples = samplesRef.current;

      if (samples.length < 5) {
        failWith('no-samples');

        return;
      }

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
        const landmarks = mapPoseLandmarks(result.landmarks[0]);
        const analysis = analyzePosture(landmarks);

        if (analysis.state !== 'calibrating') {
          samplesRef.current.push(analysis.metrics);
        }

        const elapsed = now - startedAt;
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
      if (!navigator.mediaDevices?.getUserMedia) {
        failWith('unsupported');

        return;
      }

      let stream: MediaStream;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 15, max: 30 },
          },
          audio: false,
        });
      } catch (error) {
        failWith(classifyMediaError(error), error);

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
        failWith('camera-in-use', error);

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
  }, [durationSeconds, onCalibrated, retryToken]);

  const errorCopy = ERROR_COPY[errorReason];

  return (
    <div className="calibration-step">
      <div className="calibration-step__stage">
        <video ref={videoRef} className="calibration-step__video" muted playsInline />
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

      <p className="calibration-step__hint">
        {phase === 'error'
          ? errorCopy.hint
          : 'Sente como costuma trabalhar, olhe para a tela e mantenha-se parado durante a contagem.'}
      </p>

      <div className="calibration-step__actions">
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

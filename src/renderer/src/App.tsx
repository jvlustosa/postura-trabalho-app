import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  CalendarClock,
  Camera,
  Clock,
  History,
  Lock,
  Minus,
  Pause,
  PictureInPicture2,
  Play,
  Settings as SettingsIcon,
  Shield,
  ShieldCheck,
  Square,
  StopCircle,
  X,
} from 'lucide-react';

import { classifyMediaError } from './lib/media/classifyMediaError';

import { Onboarding } from './components/Onboarding';
import { PostureCheck } from './components/PostureCheck';
import { SettingsPanel } from './components/SettingsPanel';
import { TimelineView } from './components/TimelineView';
import { Tooltip } from './components/Tooltip';
import { clearSession, loadSession, saveSession } from './lib/session/storage';
import { formatScheduleSummary } from './lib/settings/formatScheduleSummary';
import { isWithinSchedule } from './lib/settings/schedule';
import { decideScheduleAutoStart } from './lib/settings/scheduleAutoStart';
import { useSettings } from './lib/settings/useSettings';
import { hydrateTimeline } from './lib/timeline/storage';

type View = 'idle' | 'active' | 'settings' | 'timeline' | 'permission';

export type MiniView = 'off' | 'full' | 'face' | 'points';

const isMiniRenderer =
  typeof window !== 'undefined' && window.location.hash.replace(/^#/, '') === 'mini';

if (typeof window !== 'undefined') {
  console.log('[renderer] boot', {
    hash: window.location.hash,
    isMiniRenderer,
    hasBridge: Boolean(window.postureApp),
    hasEnterMini: Boolean(window.postureApp?.enterMini),
  });
}

const formatElapsed = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number): string => String(n).padStart(2, '0');
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
};

const initialSession = loadSession();

const MiniApp = (): ReactElement => {
  const { settings, update } = useSettings();
  const [miniView, setMiniView] = useState<Exclude<MiniView, 'off'>>('full');

  useEffect(() => {
    void hydrateTimeline();
  }, []);

  const handleExit = useCallback((): void => {
    window.postureApp?.exitMini?.();
  }, []);

  const handlePause = useCallback((): void => {
    const session = loadSession();
    if (session.runStartedAt !== null) {
      saveSession({
        ...session,
        isPaused: true,
        accumulatedMs:
          session.accumulatedMs + Math.max(0, Date.now() - session.runStartedAt),
        runStartedAt: null,
      });
    }
    handleExit();
  }, [handleExit]);

  return (
    <div className="mini-shell" data-mini-view={miniView}>
      <header className="mini-shell__chrome">
        <span className="mini-shell__drag" aria-hidden="true">
          Postura Trabalho
        </span>
        <div className="mini-shell__chrome-actions">
          <button
            type="button"
            className="mini-shell__restore"
            aria-label="Voltar para a janela principal"
            title="Voltar para a janela principal"
            onClick={handleExit}
          >
            <PictureInPicture2 size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="mini-shell__restore"
            aria-label="Fechar janela flutuante"
            title="Fechar janela flutuante"
            onClick={handleExit}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </header>
      <div className="mini-shell__body">
        <PostureCheck
          settings={settings}
          onStop={handlePause}
          onSettingsChange={update}
          miniView={miniView}
          onChangeMiniView={(next) => {
            if (next === 'off') handleExit();
            else setMiniView(next);
          }}
          onExitMini={handleExit}
        />
      </div>
    </div>
  );
};

export const App = (): ReactElement => {
  if (isMiniRenderer) return <MiniApp />;
  return <MainApp />;
};

const MainApp = (): ReactElement => {
  const { settings, update } = useSettings();
  const [view, setView] = useState<View>(
    initialSession.checkActive && !initialSession.isPaused ? 'active' : 'idle',
  );
  const [checkActive, setCheckActive] = useState(initialSession.checkActive);
  const [isPaused, setIsPaused] = useState(initialSession.isPaused);
  const [miniActive, setMiniActive] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(() => {
    const startedAt = initialSession.runStartedAt;
    return startedAt !== null
      ? initialSession.accumulatedMs + Math.max(0, Date.now() - startedAt)
      : initialSession.accumulatedMs;
  });
  const previousOnboardingCompleted = useRef<boolean>(settings.onboardingCompleted);
  const autoStartedRef = useRef(initialSession.checkActive);
  const accumulatedMsRef = useRef(initialSession.accumulatedMs);
  const runStartedAtRef = useRef<number | null>(initialSession.runStartedAt);

  const exitMini = useCallback((): void => {
    window.postureApp?.exitMini?.();
  }, []);

  const enterMini = useCallback((): void => {
    console.log('[renderer] enterMini click → IPC');
    window.postureApp?.enterMini?.();
  }, []);

  const startCheck = useCallback((): void => {
    accumulatedMsRef.current = 0;
    runStartedAtRef.current = Date.now();
    setElapsedMs(0);
    setIsPaused(false);
    setCheckActive(true);
    setView('active');
    saveSession({
      checkActive: true,
      isPaused: false,
      accumulatedMs: 0,
      runStartedAt: runStartedAtRef.current,
    });
  }, []);

  const requestStart = useCallback((): void => {
    if (!settings.cameraPermissionGranted) {
      setView('permission');
      return;
    }
    startCheck();
  }, [settings.cameraPermissionGranted, startCheck]);

  const pauseCheck = useCallback((): void => {
    if (runStartedAtRef.current !== null) {
      accumulatedMsRef.current += Date.now() - runStartedAtRef.current;
      runStartedAtRef.current = null;
    }
    setElapsedMs(accumulatedMsRef.current);
    setIsPaused(true);
    setView('idle');
    exitMini();
    saveSession({
      checkActive: true,
      isPaused: true,
      accumulatedMs: accumulatedMsRef.current,
      runStartedAt: null,
    });
  }, [exitMini]);

  const resumeCheck = useCallback((): void => {
    runStartedAtRef.current = Date.now();
    setIsPaused(false);
    setView('active');
    saveSession({
      checkActive: true,
      isPaused: false,
      accumulatedMs: accumulatedMsRef.current,
      runStartedAt: runStartedAtRef.current,
    });
  }, []);

  const stopCheck = useCallback((): void => {
    accumulatedMsRef.current = 0;
    runStartedAtRef.current = null;
    setElapsedMs(0);
    setIsPaused(false);
    setCheckActive(false);
    setView('idle');
    exitMini();
    clearSession();
  }, [exitMini]);

  useEffect(() => {
    void hydrateTimeline();
  }, []);

  useEffect(() => {
    const off = window.postureApp?.onMiniActive?.((active) => {
      console.log('[renderer] miniActive →', active);
      setMiniActive(active);
    });
    return () => {
      off?.();
    };
  }, []);

  useEffect(() => {
    if (!previousOnboardingCompleted.current && settings.onboardingCompleted) {
      requestStart();
    }
    previousOnboardingCompleted.current = settings.onboardingCompleted;
  }, [settings.onboardingCompleted, requestStart]);

  useEffect(() => {
    if (autoStartedRef.current) return;
    if (!settings.onboardingCompleted) return;
    if (settings.autoStartMode !== 'on-launch') return;
    autoStartedRef.current = true;
    requestStart();
  }, [settings.onboardingCompleted, settings.autoStartMode, requestStart]);

  const wasWithinScheduleRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (!settings.onboardingCompleted) return;
    if (settings.autoStartMode !== 'schedule') {
      wasWithinScheduleRef.current = null;
      return;
    }

    const evaluate = (): void => {
      const inside = isWithinSchedule(settings.schedule);
      const decision = decideScheduleAutoStart({
        isWithinWindow: inside,
        wasWithinWindow: wasWithinScheduleRef.current,
        isCheckActive: checkActive,
      });
      wasWithinScheduleRef.current = inside;
      if (decision === 'start') requestStart();
    };

    evaluate();
    const id = window.setInterval(evaluate, 30_000);
    return () => window.clearInterval(id);
  }, [
    settings.onboardingCompleted,
    settings.autoStartMode,
    settings.schedule,
    checkActive,
    requestStart,
  ]);

  useEffect(() => {
    if (!checkActive || isPaused || runStartedAtRef.current === null) return;
    const id = window.setInterval(() => {
      const startedAt = runStartedAtRef.current;
      if (startedAt === null) return;
      setElapsedMs(accumulatedMsRef.current + (Date.now() - startedAt));
    }, 1000);
    return () => window.clearInterval(id);
  }, [checkActive, isPaused]);

  useEffect(() => {
    window.postureApp?.setAnalysisActive?.(checkActive);
  }, [checkActive]);

  useEffect(() => {
    window.postureApp?.setFocusConfig?.({
      enabled: settings.floatingWindow,
      opacity: settings.floatingOpacity,
    });
  }, [settings.floatingWindow, settings.floatingOpacity]);

  useEffect(() => {
    if (!checkActive) return;
    if (isPaused) {
      window.postureApp?.updateFloating?.({ state: 'inactive', label: 'Pausada', score: 0 });
    }
  }, [checkActive, isPaused]);

  if (!settings.onboardingCompleted) {
    return (
      <div className="app-shell">
        <header className="app-bar">
          <div className="app-bar__brand app-bar__brand--static">
            <img className="app-bar__logo" src="./app-logo.png" alt="" />
            <h1 className="app-bar__title">Postura Trabalho</h1>
          </div>
          <WindowControls />
        </header>
        <main className="app-content">
          <Onboarding
            initialSensitivity={settings.sensitivity}
            initialScreenHeight={settings.screenHeight}
            calibrationSeconds={settings.calibrationSeconds}
            onComplete={update}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-bar">
        <button
          className="app-bar__brand"
          type="button"
          aria-label="Voltar para a tela principal"
          onClick={() => setView(checkActive ? 'active' : 'idle')}
        >
          <img className="app-bar__logo" src="./app-logo.png" alt="" />
          <h1 className="app-bar__title">Postura Trabalho</h1>
        </button>
        <div className="app-bar__actions">
          {checkActive ? (
            <Tooltip
              label={
                isPaused
                  ? `Análise pausada em ${formatElapsed(elapsedMs)}. Clique para retomar.`
                  : `Analisando postura há ${formatElapsed(elapsedMs)}. Clique para voltar à câmera.`
              }
              placement="bottom"
            >
              <button
                type="button"
                className={`app-bar__badge app-bar__badge--button${isPaused ? ' app-bar__badge--paused' : ''}`}
                aria-live="polite"
                aria-label={
                  isPaused
                    ? `Análise pausada em ${formatElapsed(elapsedMs)}. Abrir painel`
                    : `Analisando postura há ${formatElapsed(elapsedMs)}. Voltar à câmera`
                }
                onClick={() => (isPaused ? setView('idle') : setView('active'))}
              >
                <span className="app-bar__badge-dot" aria-hidden="true" />
                <span className="app-bar__badge-label">
                  {isPaused ? 'Análise pausada' : 'Analisando postura'}
                </span>
                <span className="app-bar__badge-time">{formatElapsed(elapsedMs)}</span>
              </button>
            </Tooltip>
          ) : null}
          {checkActive && !isPaused ? (
            <Tooltip
              label="Abrir janela flutuante (PiP) com a câmera"
              placement="bottom"
            >
              <button
                className="icon-button"
                type="button"
                aria-label="Abrir janela flutuante"
                onClick={enterMini}
              >
                <PictureInPicture2 size={20} aria-hidden="true" />
              </button>
            </Tooltip>
          ) : null}
          <button
            className="icon-button"
            type="button"
            aria-label="Abrir histórico"
            aria-pressed={view === 'timeline'}
            onClick={() =>
              setView((current) =>
                current === 'timeline' ? (checkActive ? 'active' : 'idle') : 'timeline',
              )
            }
          >
            <History size={20} aria-hidden="true" />
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label="Abrir configurações"
            aria-pressed={view === 'settings'}
            onClick={() =>
              setView((current) =>
                current === 'settings' ? (checkActive ? 'active' : 'idle') : 'settings',
              )
            }
          >
            <SettingsIcon size={20} aria-hidden="true" />
          </button>
          <WindowControls />
        </div>
      </header>

      <main className={`app-content${view === 'active' ? ' app-content--wide' : ''}`}>
        {checkActive && !isPaused && !miniActive ? (
          <div
            className={`posture-host${view === 'active' ? '' : ' posture-host--background'}`}
            aria-hidden={view !== 'active'}
          >
            <PostureCheck
              settings={settings}
              onStop={pauseCheck}
              onSettingsChange={update}
              miniView="off"
              onChangeMiniView={(next) => {
                if (next !== 'off') enterMini();
              }}
              onExitMini={exitMini}
            />
          </div>
        ) : null}

        {miniActive ? (
          <section className="mini-active-card" aria-live="polite">
            <h2 className="mini-active-card__title">Janela flutuante ativa</h2>
            <p className="mini-active-card__copy">
              A análise está rodando na janela mini. Feche-a para voltar à câmera aqui.
            </p>
            <button
              className="button button--filled"
              type="button"
              onClick={exitMini}
            >
              Trazer de volta para a janela principal
            </button>
          </section>
        ) : null}

        {view === 'settings' ? (
          <SettingsPanel
            settings={settings}
            onChange={update}
            onClose={() => setView(checkActive && !isPaused ? 'active' : 'idle')}
            onResetOnboarding={() => update({ onboardingCompleted: false })}
          />
        ) : view === 'timeline' ? (
          <TimelineView onClose={() => setView(checkActive && !isPaused ? 'active' : 'idle')} />
        ) : view === 'permission' ? (
          <PermissionRequestPanel
            onGranted={() => {
              update({ cameraPermissionGranted: true });
              startCheck();
            }}
            onCancel={() => setView('idle')}
          />
        ) : view === 'idle' ? (
          checkActive ? (
            isPaused ? (
              <PausedPanel
                elapsedMs={elapsedMs}
                onResume={resumeCheck}
                onStop={stopCheck}
              />
            ) : (
              <RunningPanel
                elapsedMs={elapsedMs}
                onResume={() => setView('active')}
                onPause={pauseCheck}
              />
            )
          ) : (
            <IdlePanel
              onStart={requestStart}
              scheduleSummary={
                settings.autoStartMode === 'schedule'
                  ? formatScheduleSummary(settings.schedule)
                  : null
              }
            />
          )
        ) : null}
      </main>
    </div>
  );
};

interface PermissionRequestPanelProps {
  onGranted: () => void;
  onCancel: () => void;
}

const permissionErrorCopy = (error: unknown): string => {
  switch (classifyMediaError(error)) {
    case 'permission-denied':
      return 'Permissão negada. Libere o acesso à câmera nas configurações do sistema e tente novamente.';
    case 'no-camera':
      return 'Nenhuma webcam encontrada. Conecte uma câmera e tente de novo.';
    case 'camera-in-use':
      return 'A webcam está em uso por outro app. Feche-o e tente de novo.';
    case 'unsupported':
      return 'Câmera indisponível neste dispositivo.';
    default:
      return 'Não foi possível acessar a câmera. Tente novamente.';
  }
};

const PermissionRequestPanel = ({
  onGranted,
  onCancel,
}: PermissionRequestPanelProps): ReactElement => {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestPermission = useCallback(async (): Promise<void> => {
    setStatus('requesting');
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      stream.getTracks().forEach((track) => track.stop());
      onGranted();
    } catch (error) {
      console.warn('[permission] camera request failed', error);
      setErrorMessage(permissionErrorCopy(error));
      setStatus('error');
    }
  }, [onGranted]);

  return (
    <section className="idle-card permission-card" aria-live="polite">
      <header className="idle-card__header">
        <div className="permission-card__icon" aria-hidden="true">
          <Camera size={28} />
        </div>
        <h2 className="idle-card__title">Permitir acesso à câmera</h2>
        <p className="idle-card__copy">
          A análise de postura precisa ler a imagem da webcam. As imagens não saem deste
          computador, só os pontos do corpo são usados.
        </p>
      </header>

      {status === 'error' && errorMessage ? (
        <p className="permission-card__error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="idle-card__cta-stack">
        <button
          className="button button--filled idle-card__cta"
          type="button"
          onClick={() => void requestPermission()}
          disabled={status === 'requesting'}
        >
          <ShieldCheck size={18} aria-hidden="true" />
          {status === 'requesting' ? 'Solicitando…' : 'Permitir câmera e iniciar'}
        </button>
        <button className="button button--text" type="button" onClick={onCancel}>
          Agora não
        </button>
      </div>

      <ul className="idle-card__features" role="list">
        <li className="feature-item">
          <Lock size={16} aria-hidden="true" />
          <span>Imagens nunca saem do PC</span>
        </li>
        <li className="feature-item">
          <Shield size={16} aria-hidden="true" />
          <span>Só pontos do corpo são lidos</span>
        </li>
      </ul>
    </section>
  );
};

const IdlePanel = ({
  onStart,
  scheduleSummary,
}: {
  onStart: () => void;
  scheduleSummary: string | null;
}): ReactElement => (
  <section className="idle-card">
    <header className="idle-card__header">
      <h2 className="idle-card__title">Postura alinhada no trabalho</h2>
      <p className="idle-card__tagline">Evite dores, mantenha a saúde da sua coluna.</p>
      <p className="idle-card__copy">
        Ligue o monitoramento: a webcam avisa quando você desalinha. Sem cronômetro, sem nuvem —
        tudo no seu PC.
      </p>
    </header>

    <div className="idle-card__cta-stack">
      <button className="button button--filled idle-card__cta" type="button" onClick={onStart}>
        <Play size={18} aria-hidden="true" />
        Ativar monitoramento
      </button>
      {scheduleSummary ? (
        <p className="idle-card__schedule-hint" aria-live="polite">
          <CalendarClock size={13} aria-hidden="true" />
          <span>Inicia automático {scheduleSummary}</span>
        </p>
      ) : null}
    </div>

    <ul className="idle-card__features" role="list">
      <li className="feature-item">
        <Shield size={16} aria-hidden="true" />
        <span>Só no seu computador</span>
      </li>
      <li className="feature-item">
        <Clock size={16} aria-hidden="true" />
        <span>Sem filas nem timer</span>
      </li>
      <li className="feature-item">
        <Activity size={16} aria-hidden="true" />
        <span>Aviso quando desalinhar</span>
      </li>
    </ul>
  </section>
);

const closeAppWindow = (): void => {
  if (window.postureApp?.window?.close) {
    window.postureApp.window.close();
    return;
  }
  window.close();
};

const WindowControls = (): ReactElement => (
  <div className="window-controls" role="group" aria-label="Controles da janela">
    <button
      type="button"
      className="window-controls__btn"
      aria-label="Minimizar"
      onClick={() => window.postureApp?.window?.minimize()}
    >
      <Minus size={16} aria-hidden="true" />
    </button>
    <button
      type="button"
      className="window-controls__btn"
      aria-label="Maximizar / Restaurar"
      onClick={() => window.postureApp?.window?.toggleMaximize()}
    >
      <Square size={14} aria-hidden="true" />
    </button>
    <button
      type="button"
      className="window-controls__btn window-controls__btn--close"
      aria-label="Fechar"
      onClick={closeAppWindow}
    >
      <X size={16} aria-hidden="true" />
    </button>
  </div>
);

const RunningPanel = ({
  elapsedMs,
  onResume,
  onPause,
}: {
  elapsedMs: number;
  onResume: () => void;
  onPause: () => void;
}): ReactElement => (
  <section className="idle-card">
    <header className="idle-card__header">
      <h2 className="idle-card__title">Analisando sua postura</h2>
      <p className="idle-card__copy">
        Análise rodando em segundo plano. Os alertas continuam ativos enquanto você usa o app.
      </p>
      <p className="idle-card__elapsed" aria-live="polite">
        <Clock size={16} aria-hidden="true" />
        <span>Tempo de análise: {formatElapsed(elapsedMs)}</span>
      </p>
    </header>

    <div className="idle-card__row">
      <button className="button button--filled idle-card__cta" type="button" onClick={onResume}>
        <ArrowLeft size={18} aria-hidden="true" />
        Voltar à câmera
      </button>
      <button className="button button--text" type="button" onClick={onPause}>
        <Pause size={18} aria-hidden="true" />
        Pausar análise
      </button>
    </div>
  </section>
);

const PausedPanel = ({
  elapsedMs,
  onResume,
  onStop,
}: {
  elapsedMs: number;
  onResume: () => void;
  onStop: () => void;
}): ReactElement => (
  <section className="idle-card">
    <header className="idle-card__header">
      <h2 className="idle-card__title">Análise pausada</h2>
      <p className="idle-card__copy">
        A câmera foi liberada. Clique em continuar quando estiver pronto para retomar.
      </p>
      <p className="idle-card__elapsed idle-card__elapsed--paused" aria-live="polite">
        <Pause size={16} aria-hidden="true" />
        <span>Pausada em {formatElapsed(elapsedMs)}</span>
      </p>
    </header>

    <div className="idle-card__row">
      <button className="button button--filled idle-card__cta" type="button" onClick={onResume}>
        <Play size={18} aria-hidden="true" />
        Continuar análise
      </button>
      <button className="button button--text" type="button" onClick={onStop}>
        <StopCircle size={18} aria-hidden="true" />
        Parar análise
      </button>
    </div>
  </section>
);

import { type ReactElement, useState } from 'react';
import {
  Activity,
  Clock,
  History,
  Play,
  Settings as SettingsIcon,
  Shield,
} from 'lucide-react';

import { Onboarding } from './components/Onboarding';
import { PostureCheck } from './components/PostureCheck';
import { SettingsPanel } from './components/SettingsPanel';
import { TimelineView } from './components/TimelineView';
import { useSettings } from './lib/settings/useSettings';

type View = 'idle' | 'active' | 'settings' | 'timeline';

export const App = (): ReactElement => {
  const { settings, update } = useSettings();
  const [view, setView] = useState<View>('idle');

  if (!settings.onboardingCompleted) {
    return (
      <div className="app-shell">
        <header className="app-bar">
          <img className="app-bar__logo" src="/app-logo.png" alt="" />
          <h1 className="app-bar__title">Postura Trabalho</h1>
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
          onClick={() => setView('idle')}
        >
          <img className="app-bar__logo" src="/app-logo.png" alt="" />
          <h1 className="app-bar__title">Postura Trabalho</h1>
        </button>
        <div className="app-bar__actions">
          <button
            className="icon-button"
            type="button"
            aria-label="Abrir histórico"
            aria-pressed={view === 'timeline'}
            onClick={() => setView((current) => (current === 'timeline' ? 'idle' : 'timeline'))}
          >
            <History size={20} aria-hidden="true" />
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label="Abrir configurações"
            aria-pressed={view === 'settings'}
            onClick={() => setView((current) => (current === 'settings' ? 'idle' : 'settings'))}
          >
            <SettingsIcon size={20} aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className={`app-content${view === 'active' ? ' app-content--wide' : ''}`}>
        {view === 'active' ? (
          <PostureCheck settings={settings} onStop={() => setView('idle')} onSettingsChange={update} />
        ) : view === 'settings' ? (
          <SettingsPanel
            settings={settings}
            onChange={update}
            onClose={() => setView('idle')}
            onResetOnboarding={() => update({ onboardingCompleted: false })}
          />
        ) : view === 'timeline' ? (
          <TimelineView onClose={() => setView('idle')} />
        ) : (
          <IdlePanel onStart={() => setView('active')} />
        )}
      </main>
    </div>
  );
};

const IdlePanel = ({ onStart }: { onStart: () => void }): ReactElement => (
  <section className="idle-card">
    <header className="idle-card__header">
      <h2 className="idle-card__title">Pronto para iniciar</h2>
      <p className="idle-card__copy">
        Calibragem rápida e monitoramento contínuo da sua postura.
      </p>
    </header>

    <button className="button button--filled idle-card__cta" type="button" onClick={onStart}>
      <Play size={18} aria-hidden="true" />
      Ativar check de postura
    </button>

    <ul className="idle-card__features" role="list">
      <li className="feature-item">
        <Shield size={16} strokeWidth={2} aria-hidden="true" />
        <span>Processado localmente</span>
      </li>
      <li className="feature-item">
        <Clock size={16} strokeWidth={2} aria-hidden="true" />
        <span>Calibragem rápida</span>
      </li>
      <li className="feature-item">
        <Activity size={16} strokeWidth={2} aria-hidden="true" />
        <span>Alertas em tempo real</span>
      </li>
    </ul>
  </section>
);

import { type ReactElement } from 'react';

import { ScreenHeightPicker } from './ScreenHeightPicker';
import type { AlertThresholdSeconds, AppSettings, SensitivityLevel } from '../lib/settings/types';

interface SettingsPanelProps {
  settings: AppSettings;
  onChange: (patch: Partial<AppSettings>) => void;
  onClose: () => void;
  onResetOnboarding: () => void;
}

const sensitivityLabels: Record<SensitivityLevel, string> = {
  relaxed: 'Relaxado',
  standard: 'Padrão',
  strict: 'Atento',
};

const calibrationOptions: AppSettings['calibrationSeconds'][] = [3, 5, 8];

const alertThresholdOptions: AlertThresholdSeconds[] = [30, 60, 120, 300];

const formatAlertThreshold = (seconds: AlertThresholdSeconds): string =>
  seconds >= 60 ? `${seconds / 60} min` : `${seconds}s`;

export const SettingsPanel = ({
  settings,
  onChange,
  onClose,
  onResetOnboarding,
}: SettingsPanelProps): ReactElement => {
  return (
    <section className="card settings-card" aria-label="Configurações">
      <header className="settings-card__header">
        <h2 className="settings-card__title">Configurações</h2>
        <button className="button button--text" type="button" onClick={onClose}>
          Fechar
        </button>
      </header>

      <div className="settings-group" role="group" aria-label="Sensibilidade">
        <div className="settings-group__head">
          <span className="settings-group__label">Sensibilidade</span>
          <span className="settings-group__hint">
            Define o quão rápido o app sinaliza desvios de postura.
          </span>
        </div>
        <div className="segmented" role="radiogroup">
          {(Object.keys(sensitivityLabels) as SensitivityLevel[]).map((level) => {
            const isSelected = settings.sensitivity === level;

            return (
              <button
                key={level}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`segmented__option${isSelected ? ' segmented__option--selected' : ''}`}
                onClick={() => onChange({ sensitivity: level })}
              >
                {sensitivityLabels[level]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="settings-group" role="group" aria-label="Tempo de calibragem">
        <div className="settings-group__head">
          <span className="settings-group__label">Tempo de calibragem</span>
          <span className="settings-group__hint">
            Duração da leitura inicial para ajustar ao seu corpo.
          </span>
        </div>
        <div className="segmented" role="radiogroup">
          {calibrationOptions.map((seconds) => {
            const isSelected = settings.calibrationSeconds === seconds;

            return (
              <button
                key={seconds}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`segmented__option${isSelected ? ' segmented__option--selected' : ''}`}
                onClick={() => onChange({ calibrationSeconds: seconds })}
              >
                {seconds}s
              </button>
            );
          })}
        </div>
      </div>

      <div className="settings-group" role="group" aria-label="Altura da tela">
        <div className="settings-group__head">
          <span className="settings-group__label">Altura da tela</span>
          <span className="settings-group__hint">
            Posição do seu monitor em relação aos olhos.
          </span>
        </div>
        <ScreenHeightPicker
          value={settings.screenHeight}
          onChange={(next) => onChange({ screenHeight: next })}
        />
      </div>

      <ToggleRow
        label="Espelhar vídeo"
        hint="Mostra a imagem invertida como se fosse um espelho."
        value={settings.mirrorVideo}
        onChange={(value) => onChange({ mirrorVideo: value })}
      />

      <ToggleRow
        label="Mostrar pontos da pose"
        hint="Exibe a sobreposição de articulações sobre a imagem da câmera."
        value={settings.showOverlay}
        onChange={(value) => onChange({ showOverlay: value })}
      />

      <ToggleRow
        label="Pop-up de alerta"
        hint="Mostra um aviso por cima de qualquer janela quando a postura ruim persiste."
        value={settings.alertsEnabled}
        onChange={(value) => onChange({ alertsEnabled: value })}
      />

      <div className="settings-group" role="group" aria-label="Tempo até o alerta">
        <div className="settings-group__head">
          <span className="settings-group__label">Tempo até o alerta</span>
          <span className="settings-group__hint">
            Quanto a postura ruim deve durar antes do pop-up aparecer.
          </span>
        </div>
        <div className="segmented" role="radiogroup">
          {alertThresholdOptions.map((seconds) => {
            const isSelected = settings.alertThresholdSeconds === seconds;

            return (
              <button
                key={seconds}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={!settings.alertsEnabled}
                className={`segmented__option${isSelected ? ' segmented__option--selected' : ''}`}
                onClick={() => onChange({ alertThresholdSeconds: seconds })}
              >
                {formatAlertThreshold(seconds)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="settings-row settings-row--action">
        <div className="settings-row__text">
          <span className="settings-row__label">Calibragem do algoritmo</span>
          <span className="settings-row__hint">
            {settings.calibration
              ? `Salva em ${formatCalibratedAt(settings.calibration.sampledAt)} com ${settings.calibration.sampleCount} amostras.`
              : 'Nenhum dado de calibragem salvo. A próxima sessão calibra ao vivo.'}
          </span>
        </div>
        <button
          className="button button--tonal"
          type="button"
          onClick={() => onChange({ calibration: null })}
          disabled={!settings.calibration}
        >
          Limpar
        </button>
      </div>

      <div className="settings-row settings-row--action">
        <div className="settings-row__text">
          <span className="settings-row__label">Refazer onboarding</span>
          <span className="settings-row__hint">
            Volta para as telas iniciais para reconfigurar altura da tela, sensibilidade e
            calibragem.
          </span>
        </div>
        <button className="button button--tonal" type="button" onClick={onResetOnboarding}>
          Resetar
        </button>
      </div>
    </section>
  );
};

const formatCalibratedAt = (iso: string): string => {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

interface ToggleRowProps {
  label: string;
  hint: string;
  value: boolean;
  onChange: (next: boolean) => void;
}

const ToggleRow = ({ label, hint, value, onChange }: ToggleRowProps): ReactElement => (
  <div className="settings-row">
    <div className="settings-row__text">
      <span className="settings-row__label">{label}</span>
      <span className="settings-row__hint">{hint}</span>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      className={`switch${value ? ' switch--on' : ''}`}
      onClick={() => onChange(!value)}
    >
      <span className="switch__thumb" />
    </button>
  </div>
);

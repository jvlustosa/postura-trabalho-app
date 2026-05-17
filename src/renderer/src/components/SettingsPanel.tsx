import {
  type ComponentType,
  type ReactElement,
  type ReactNode,
  type SVGProps,
} from 'react';
import { Activity, Bell, Camera, CalendarClock, Clock, Focus, Settings2 } from 'lucide-react';

import { ScreenHeightPicker } from './ScreenHeightPicker';
import { useConfirm } from './ConfirmDialog';
import { playAlertTone } from '../lib/alerts/playAlertTone';
import type {
  AlertThresholdSeconds,
  AppSettings,
  AutoStartMode,
  SensitivityLevel,
  Weekday,
} from '../lib/settings/types';

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

const alertThresholdOptions: AlertThresholdSeconds[] = [30, 60, 120, 180];

const formatAlertThreshold = (seconds: AlertThresholdSeconds): string =>
  seconds >= 60 ? `${seconds / 60} min` : `${seconds}s`;

const autoStartLabels: Record<AutoStartMode, string> = {
  off: 'Desligado',
  'on-launch': 'Ao abrir',
  schedule: 'Agendado',
};

const weekdayLabels: Record<Weekday, string> = {
  0: 'Dom',
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb',
};

const weekdayOrder: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

export const SettingsPanel = ({
  settings,
  onChange,
  onClose,
  onResetOnboarding,
}: SettingsPanelProps): ReactElement => {
  const { confirm, dialog: confirmDialog } = useConfirm();

  const handleClearCalibration = async (): Promise<void> => {
    const ok = await confirm({
      title: 'Limpar calibragem?',
      message: 'Os dados salvos da calibragem serão removidos. A próxima sessão calibra ao vivo.',
      confirmLabel: 'Limpar',
      destructive: true,
    });
    if (ok) onChange({ calibration: null });
  };

  const handleResetOnboarding = async (): Promise<void> => {
    const ok = await confirm({
      title: 'Refazer onboarding?',
      message: 'Você volta para as telas iniciais e refaz altura da tela, sensibilidade e calibragem.',
      confirmLabel: 'Resetar',
      destructive: true,
    });
    if (ok) onResetOnboarding();
  };

  const toggleWeekday = (day: Weekday): void => {
    const current = new Set(settings.schedule.weekdays);
    if (current.has(day)) current.delete(day);
    else current.add(day);
    onChange({
      schedule: {
        ...settings.schedule,
        weekdays: Array.from(current).sort((a, b) => a - b) as Weekday[],
      },
    });
  };

  const updateScheduleTime = (key: 'startTime' | 'endTime', value: string): void => {
    onChange({ schedule: { ...settings.schedule, [key]: value } });
  };

  const scheduleActive = settings.autoStartMode === 'schedule';

  return (
    <section className="card settings-card" aria-label="Configurações">
      <header className="settings-card__header">
        <h2 className="settings-card__title">Configurações</h2>
        <button className="button button--text" type="button" onClick={onClose}>
          Fechar
        </button>
      </header>

      <SettingsSection
        icon={Activity}
        title="Postura"
        hint="Como o app entende e mede sua postura."
      >
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

        <div className="settings-group" role="group" aria-label="Sensibilidade">
          <div className="settings-group__head">
            <span className="settings-group__label">Sensibilidade</span>
            <span className="settings-group__hint">
              Define o quão rápido o app sinaliza desvios.
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

        <div className="settings-row settings-row--action">
          <div className="settings-row__text">
            <span className="settings-row__label">Calibragem salva</span>
            <span className="settings-row__hint">
              {settings.calibration
                ? `Salva em ${formatCalibratedAt(settings.calibration.sampledAt)} com ${settings.calibration.sampleCount} amostras.`
                : 'Nenhum dado salvo. A próxima sessão calibra ao vivo.'}
            </span>
          </div>
          <button
            className="button button--tonal"
            type="button"
            onClick={() => {
              void handleClearCalibration();
            }}
            disabled={!settings.calibration}
          >
            Limpar
          </button>
        </div>
      </SettingsSection>

      <SettingsSection icon={Bell} title="Alertas" hint="Quando e como o aviso aparece.">
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

        <ToggleRow
          label="Som de aviso"
          hint="Toca um bip discreto quando o alerta dispara."
          value={settings.alertSound}
          onChange={(value) => {
            onChange({ alertSound: value });
            if (value) playAlertTone('bad');
          }}
          disabled={!settings.alertsEnabled}
        />
      </SettingsSection>

      <SettingsSection
        icon={CalendarClock}
        title="Horário de uso"
        hint="Quando o app começa a analisar sozinho."
      >
        <div className="settings-group" role="group" aria-label="Modo de início automático">
          <div className="settings-group__head">
            <span className="settings-group__label">Iniciar automaticamente</span>
            <span className="settings-group__hint">
              Desligado, sempre ao abrir, ou só em horário definido.
            </span>
          </div>
          <div className="segmented" role="radiogroup">
            {(Object.keys(autoStartLabels) as AutoStartMode[]).map((mode) => {
              const isSelected = settings.autoStartMode === mode;

              return (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`segmented__option${isSelected ? ' segmented__option--selected' : ''}`}
                  onClick={() => onChange({ autoStartMode: mode })}
                >
                  {autoStartLabels[mode]}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className={`settings-group${scheduleActive ? '' : ' settings-group--disabled'}`}
          role="group"
          aria-label="Dias da semana"
        >
          <div className="settings-group__head">
            <span className="settings-group__label">Dias da semana</span>
            <span className="settings-group__hint">
              Dias em que o app deve iniciar sozinho.
            </span>
          </div>
          <div className="weekday-chips" role="group">
            {weekdayOrder.map((day) => {
              const isSelected = settings.schedule.weekdays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  role="checkbox"
                  aria-checked={isSelected}
                  disabled={!scheduleActive}
                  className={`weekday-chip${isSelected ? ' weekday-chip--selected' : ''}`}
                  onClick={() => toggleWeekday(day)}
                >
                  {weekdayLabels[day]}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className={`settings-group${scheduleActive ? '' : ' settings-group--disabled'}`}
          role="group"
          aria-label="Janela de horário"
        >
          <div className="settings-group__head">
            <span className="settings-group__label">Janela de horário</span>
            <span className="settings-group__hint">
              Início e fim do período de análise automática.
            </span>
          </div>
          <div className="time-range">
            <label className="time-field">
              <span className="time-field__label">Início</span>
              <div className="time-field__control">
                <Clock className="time-field__icon" aria-hidden="true" />
                <input
                  type="time"
                  lang="pt-BR"
                  step={60}
                  className="time-field__input"
                  value={settings.schedule.startTime}
                  disabled={!scheduleActive}
                  onChange={(event) => updateScheduleTime('startTime', event.target.value)}
                />
              </div>
            </label>
            <span className="time-range__separator" aria-hidden="true">
              até
            </span>
            <label className="time-field">
              <span className="time-field__label">Fim</span>
              <div className="time-field__control">
                <Clock className="time-field__icon" aria-hidden="true" />
                <input
                  type="time"
                  lang="pt-BR"
                  step={60}
                  className="time-field__input"
                  value={settings.schedule.endTime}
                  disabled={!scheduleActive}
                  onChange={(event) => updateScheduleTime('endTime', event.target.value)}
                />
              </div>
            </label>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection icon={Camera} title="Câmera" hint="Aparência da imagem ao vivo.">
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
      </SettingsSection>

      <SettingsSection
        icon={Focus}
        title="Modo foco"
        hint="Como o app some da sua tela enquanto você trabalha."
      >
        <ToggleRow
          label="Pill flutuante ao fechar a janela"
          hint="Ao fechar, a janela some e fica só uma pill discreta no canto com seu status. Sem isso, fechar encerra o app."
          value={settings.floatingWindow}
          onChange={(value) => onChange({ floatingWindow: value })}
        />

        <div
          className={`settings-group${settings.floatingWindow ? '' : ' settings-group--disabled'}`}
          role="group"
          aria-label="Opacidade da pill"
        >
          <div className="settings-group__head">
            <span className="settings-group__label">Opacidade da pill</span>
            <span className="settings-group__hint">
              Quanto mais transparente, menos a pill chama atenção.
            </span>
          </div>
          <div className="segmented" role="radiogroup">
            {[0.6, 0.75, 0.85, 1].map((value) => {
              const isSelected = Math.abs(settings.floatingOpacity - value) < 0.01;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={!settings.floatingWindow}
                  className={`segmented__option${isSelected ? ' segmented__option--selected' : ''}`}
                  onClick={() => onChange({ floatingOpacity: value })}
                >
                  {Math.round(value * 100)}%
                </button>
              );
            })}
          </div>
        </div>
      </SettingsSection>

      <SettingsSection icon={Settings2} title="Aplicativo" hint="Comportamento geral.">
        <div className="settings-row settings-row--action">
          <div className="settings-row__text">
            <span className="settings-row__label">Refazer onboarding</span>
            <span className="settings-row__hint">
              Volta para as telas iniciais para reconfigurar altura da tela, sensibilidade e
              calibragem.
            </span>
          </div>
          <button
            className="button button--tonal"
            type="button"
            onClick={() => {
              void handleResetOnboarding();
            }}
          >
            Resetar
          </button>
        </div>
      </SettingsSection>

      {confirmDialog}
    </section>
  );
};

interface SettingsSectionProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  hint: string;
  children: ReactNode;
}

const SettingsSection = ({
  icon: Icon,
  title,
  hint,
  children,
}: SettingsSectionProps): ReactElement => (
  <section className="settings-section" aria-label={title}>
    <header className="settings-section__head">
      <span className="settings-section__icon" aria-hidden="true">
        <Icon />
      </span>
      <div className="settings-section__text">
        <h3 className="settings-section__title">{title}</h3>
        <span className="settings-section__hint">{hint}</span>
      </div>
    </header>
    <div className="settings-section__body">{children}</div>
  </section>
);

const formatCalibratedAt = (iso: string): string => {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return '-';
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
  disabled?: boolean;
}

const ToggleRow = ({ label, hint, value, onChange, disabled }: ToggleRowProps): ReactElement => (
  <div className={`settings-row${disabled ? ' settings-row--disabled' : ''}`}>
    <div className="settings-row__text">
      <span className="settings-row__label">{label}</span>
      <span className="settings-row__hint">{hint}</span>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      disabled={disabled}
      className={`switch${value ? ' switch--on' : ''}`}
      onClick={() => onChange(!value)}
    >
      <span className="switch__thumb" />
    </button>
  </div>
);

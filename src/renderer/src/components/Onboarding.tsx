import { type ReactElement, useCallback, useState } from 'react';

import { CalibrationStep } from './CalibrationStep';
import { ScreenHeightPicker } from './ScreenHeightPicker';
import type { AppSettings, CalibrationData, SensitivityLevel } from '../lib/settings/types';

interface OnboardingProps {
  initialSensitivity: SensitivityLevel;
  initialScreenHeight: number;
  calibrationSeconds: number;
  onComplete: (patch: Partial<AppSettings>) => void;
}

const steps = ['welcome', 'screen-height', 'sensitivity', 'calibrate'] as const;
type Step = (typeof steps)[number];

const sensitivityOptions: { value: SensitivityLevel; label: string; copy: string }[] = [
  { value: 'relaxed', label: 'Relaxado', copy: 'Só avisos quando piora bastante.' },
  { value: 'standard', label: 'Padrão', copy: 'Equilíbrio para o dia a dia.' },
  { value: 'strict', label: 'Atento', copy: 'Detecta desvios sutis.' },
];

export const Onboarding = ({
  initialSensitivity,
  initialScreenHeight,
  calibrationSeconds,
  onComplete,
}: OnboardingProps): ReactElement => {
  const [step, setStep] = useState<Step>('welcome');
  const [sensitivity, setSensitivity] = useState<SensitivityLevel>(initialSensitivity);
  const [screenHeight, setScreenHeight] = useState<number>(initialScreenHeight);
  const [calibration, setCalibration] = useState<CalibrationData | null>(null);

  const stepIndex = steps.indexOf(step);
  const isLast = step === 'calibrate';

  const finish = (data: CalibrationData | null): void => {
    onComplete({
      sensitivity,
      screenHeight,
      calibration: data,
      onboardingCompleted: true,
    });
  };

  const goNext = (): void => {
    if (isLast) {
      finish(calibration);

      return;
    }

    setStep(steps[stepIndex + 1]);
  };

  const skip = (): void => {
    finish(calibration);
  };

  const handleCalibrated = useCallback((data: CalibrationData): void => {
    setCalibration(data);
  }, []);

  const handleSkipCalibration = (): void => {
    setCalibration(null);
    finish(null);
  };

  return (
    <section className="onboarding-m" aria-live="polite">
      <div className="onboarding-m__topbar">
        <button
          className="button button--text"
          type="button"
          onClick={skip}
          aria-label="Pular onboarding"
        >
          Pular
        </button>
      </div>

      <div className="onboarding-m__body">
        {step === 'welcome' ? <WelcomeStep /> : null}
        {step === 'screen-height' ? (
          <ScreenHeightStep value={screenHeight} onChange={setScreenHeight} />
        ) : null}
        {step === 'sensitivity' ? (
          <SensitivityStep value={sensitivity} onChange={setSensitivity} />
        ) : null}
        {step === 'calibrate' ? (
          <CalibrateStep
            durationSeconds={calibrationSeconds}
            calibrated={calibration !== null}
            onCalibrated={handleCalibrated}
            onSkip={handleSkipCalibration}
          />
        ) : null}
      </div>

      <div className="onboarding-m__pager" role="tablist" aria-label="Progresso">
        {steps.map((id, index) => (
          <span
            key={id}
            role="tab"
            aria-selected={index === stepIndex}
            className={`onboarding-m__dot${index === stepIndex ? ' onboarding-m__dot--active' : ''}`}
          />
        ))}
      </div>

      <button className="button button--filled onboarding-m__cta" type="button" onClick={goNext}>
        {isLast ? (calibration ? 'Começar' : 'Pular calibragem') : 'Continuar'}
      </button>
    </section>
  );
};

const WelcomeStep = (): ReactElement => (
  <div className="onboarding-m__step">
    <div className="onboarding-m__hero" aria-hidden="true">
      <img className="onboarding-m__hero-logo" src="./app-logo.png" alt="" />
    </div>
    <h2 className="onboarding-m__title">Postura sob controle</h2>
    <p className="onboarding-m__copy">
      Monitoramos sua postura pela webcam, em tempo real, sem enviar nada para a internet.
    </p>
  </div>
);

interface ScreenHeightStepProps {
  value: number;
  onChange: (next: number) => void;
}

const ScreenHeightStep = ({ value, onChange }: ScreenHeightStepProps): ReactElement => (
  <div className="onboarding-m__step">
    <h2 className="onboarding-m__title">Onde está sua tela?</h2>
    <p className="onboarding-m__copy">Arraste para mostrar a altura do monitor em relação aos olhos.</p>
    <ScreenHeightPicker value={value} onChange={onChange} />
  </div>
);

interface SensitivityStepProps {
  value: SensitivityLevel;
  onChange: (next: SensitivityLevel) => void;
}

const SensitivityStep = ({ value, onChange }: SensitivityStepProps): ReactElement => (
  <div className="onboarding-m__step">
    <h2 className="onboarding-m__title">Quão alerta?</h2>
    <p className="onboarding-m__copy">Escolha agora. Dá para mudar nas configurações.</p>
    <div className="option-list" role="radiogroup" aria-label="Sensibilidade dos avisos">
      {sensitivityOptions.map((option) => {
        const isSelected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={`option-card${isSelected ? ' option-card--selected' : ''}`}
            onClick={() => onChange(option.value)}
          >
            <span className="option-card__label">{option.label}</span>
            <span className="option-card__copy">{option.copy}</span>
          </button>
        );
      })}
    </div>
  </div>
);

interface CalibrateStepProps {
  durationSeconds: number;
  calibrated: boolean;
  onCalibrated: (data: CalibrationData) => void;
  onSkip: () => void;
}

const CalibrateStep = ({
  durationSeconds,
  calibrated,
  onCalibrated,
  onSkip,
}: CalibrateStepProps): ReactElement => (
  <div className="onboarding-m__step">
    <h2 className="onboarding-m__title">Calibragem inicial</h2>
    <p className="onboarding-m__copy">
      Vamos medir sua postura ereta por {durationSeconds}s para personalizar a detecção.
      Sente-se reto e olhe para a tela. Os dados ficam só neste dispositivo.
    </p>
    <CalibrationStep
      durationSeconds={durationSeconds}
      onCalibrated={onCalibrated}
      onSkip={onSkip}
    />
    {calibrated ? (
      <span className="screen-height__tag" role="status">
        Calibragem concluída
      </span>
    ) : null}
  </div>
);

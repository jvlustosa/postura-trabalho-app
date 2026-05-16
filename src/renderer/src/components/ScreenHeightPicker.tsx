import { type ReactElement } from 'react';

interface ScreenHeightPickerProps {
  value: number;
  onChange: (next: number) => void;
}

const eyeY = 70;
const eyeX = 240;
const minMonitorTopY = 4;
const maxMonitorTopY = 92;
const monitorWidth = 76;
const monitorHeight = 48;
const monitorX = 70;
const deskY = 146;
const standBaseY = 144;

const heightLabel = (value: number): string => {
  if (value >= 45 && value <= 55) {
    return 'Na altura dos olhos';
  }

  if (value > 55 && value <= 75) {
    return 'Pouco acima dos olhos';
  }

  if (value > 75) {
    return 'Bem acima dos olhos';
  }

  if (value >= 25 && value < 45) {
    return 'Pouco abaixo dos olhos';
  }

  return 'Bem abaixo dos olhos';
};

export const ScreenHeightPicker = ({ value, onChange }: ScreenHeightPickerProps): ReactElement => {
  const monitorTopY = maxMonitorTopY - (value / 100) * (maxMonitorTopY - minMonitorTopY);
  const monitorBottomY = monitorTopY + monitorHeight;
  const label = heightLabel(value);

  return (
    <div className="screen-height">
      <div className="screen-height__stage" aria-hidden="true">
        <svg
          viewBox="0 0 320 168"
          preserveAspectRatio="xMidYMid meet"
          className="screen-height__svg"
          role="img"
        >
          <line
            x1="16"
            x2="304"
            y1={eyeY}
            y2={eyeY}
            stroke="currentColor"
            strokeOpacity="0.28"
            strokeWidth="1"
            strokeDasharray="3 4"
          />

          <line x1="40" x2="200" y1={deskY} y2={deskY} stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" />

          <rect
            x={monitorX + monitorWidth / 2 - 12}
            y={standBaseY}
            width="24"
            height="2"
            fill="currentColor"
            opacity="0.5"
          />
          <rect
            x={monitorX + monitorWidth / 2 - 1}
            y={monitorBottomY}
            width="2"
            height={Math.max(2, standBaseY - monitorBottomY)}
            fill="currentColor"
            opacity="0.5"
          />
          <rect
            x={monitorX}
            y={monitorTopY}
            width={monitorWidth}
            height={monitorHeight}
            rx="3"
            fill="var(--md-sys-color-primary)"
          />

          <rect x="218" y="136" width="44" height="3" fill="currentColor" opacity="0.45" />
          <path
            d="M236 82
               L236 88
               Q220 88, 216 102
               L216 132
               Q216 138, 222 138
               L258 138
               Q264 138, 264 132
               L264 102
               Q260 88, 244 88
               L244 82 Z"
            fill="currentColor"
            opacity="0.85"
          />
          <circle cx={eyeX} cy={eyeY} r="12" fill="currentColor" opacity="0.85" />
          <circle cx={eyeX - 4} cy={eyeY} r="1.6" fill="var(--md-sys-color-surface)" />
        </svg>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="screen-height__slider"
        aria-label="Altura do monitor em relação aos seus olhos"
        aria-valuetext={label}
      />

      <div className="screen-height__tag" role="status">
        {label}
      </div>
    </div>
  );
};

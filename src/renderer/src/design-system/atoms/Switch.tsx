import { forwardRef } from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible label; required when there is no visible associated label. */
  'aria-label'?: string;
  /** Id of an external element labelling the switch. */
  'aria-labelledby'?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, onChange, disabled = false, className, id, ...aria },
  ref
) {
  const classes = ['ds-switch', className ?? ''].filter(Boolean).join(' ');

  return (
    <button
      ref={ref}
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={classes}
      onClick={() => onChange(!checked)}
      {...aria}
    >
      <span className="ds-switch__thumb" aria-hidden="true" />
    </button>
  );
});

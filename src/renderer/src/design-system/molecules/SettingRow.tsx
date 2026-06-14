import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { Text } from '../atoms';
import './molecules.css';

export interface SettingRowProps extends HTMLAttributes<HTMLDivElement> {
  /** Primary label shown on the left. */
  label: ReactNode;
  /** Optional supporting description below the label. */
  description?: ReactNode;
  /** Control rendered on the right (or below, when stacked). */
  control?: ReactNode;
  /** Stack the control under the text instead of beside it. */
  stacked?: boolean;
  /** Id of the control, used to associate the label for accessibility. */
  htmlFor?: string;
}

export const SettingRow = forwardRef<HTMLDivElement, SettingRowProps>(function SettingRow(
  { label, description, control, stacked = false, htmlFor, className, children, ...rest },
  ref,
) {
  const classes = ['ds-setting-row', stacked ? 'ds-setting-row--stacked' : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={ref} className={classes} {...rest}>
      <div className="ds-setting-row__text">
        {htmlFor ? (
          <label className="ds-text ds-text--label ds-tone--default" htmlFor={htmlFor}>
            {label}
          </label>
        ) : (
          <Text as="span" variant="label">
            {label}
          </Text>
        )}
        {description ? (
          <Text variant="body-sm" tone="muted">
            {description}
          </Text>
        ) : null}
      </div>
      {control ?? children ? <div className="ds-setting-row__control">{control ?? children}</div> : null}
    </div>
  );
});

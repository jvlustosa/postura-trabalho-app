import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  /** Diameter in pixels. */
  size?: number;
  /** Stroke width in pixels. */
  thickness?: number;
  /** Accessible status text announced by screen readers. */
  label?: string;
}

export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = 20, thickness = 2, label = 'Carregando', className, style, ...rest },
  ref
) {
  const classes = ['ds-spinner', className ?? ''].filter(Boolean).join(' ');
  const composedStyle: CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    borderWidth: `${thickness}px`,
    ...style,
  };

  return (
    <span
      ref={ref}
      className={classes}
      style={composedStyle}
      role="status"
      aria-live="polite"
      aria-label={label}
      {...rest}
    />
  );
});

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

export type ButtonVariant = 'filled' | 'tonal' | 'text' | 'outlined';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Lucide icon rendered before the label. */
  icon?: LucideIcon;
  /** Stretch the button to fill its container width. */
  fullWidth?: boolean;
}

const ICON_SIZE: Record<ButtonSize, number> = { sm: 16, md: 18 };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'filled', size = 'md', icon: Icon, fullWidth = false, className, type = 'button', children, ...rest },
  ref
) {
  const classes = [
    'ds-button',
    `ds-button--${variant}`,
    size === 'sm' ? 'ds-button--sm' : '',
    fullWidth ? 'ds-button--full' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button ref={ref} type={type} className={classes} {...rest}>
      {Icon ? (
        <span className="ds-button__icon" aria-hidden="true">
          <Icon size={ICON_SIZE[size]} />
        </span>
      ) : null}
      {children}
    </button>
  );
});

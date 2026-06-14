import { forwardRef, type ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

export type IconButtonSize = 'sm' | 'md';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Lucide icon to render. */
  icon: LucideIcon;
  /** Required: accessible label, since the button has no visible text. */
  'aria-label': string;
  size?: IconButtonSize;
}

const ICON_SIZE: Record<IconButtonSize, number> = { sm: 18, md: 20 };

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, size = 'md', className, type = 'button', ...rest },
  ref
) {
  const classes = ['ds-icon-button', size === 'sm' ? 'ds-icon-button--sm' : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <button ref={ref} type={type} className={classes} {...rest}>
      <Icon size={ICON_SIZE[size]} aria-hidden="true" />
    </button>
  );
});

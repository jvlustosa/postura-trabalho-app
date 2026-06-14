import { forwardRef, type HTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'error';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Optional leading lucide icon. */
  icon?: LucideIcon;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { tone = 'neutral', icon: Icon, className, children, ...rest },
  ref
) {
  const classes = ['ds-badge', `ds-badge--${tone}`, className ?? ''].filter(Boolean).join(' ');

  return (
    <span ref={ref} className={classes} {...rest}>
      {Icon ? <Icon size={13} aria-hidden="true" /> : null}
      {children}
    </span>
  );
});

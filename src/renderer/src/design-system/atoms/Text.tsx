import { forwardRef, type HTMLAttributes } from 'react';

export type TextVariant = 'body' | 'body-sm' | 'label' | 'eyebrow';
export type TextElement = 'p' | 'span' | 'div' | 'label';
export type Tone = 'default' | 'muted' | 'primary' | 'success' | 'warning' | 'error';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: TextElement;
  variant?: TextVariant;
  tone?: Tone;
}

export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  { as = 'p', variant = 'body', tone = 'default', className, children, ...rest },
  ref
) {
  const Component = as;
  const classes = ['ds-text', `ds-text--${variant}`, `ds-tone--${tone}`, className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <Component ref={ref as never} className={classes} {...rest}>
      {children}
    </Component>
  );
});

import { forwardRef, type HTMLAttributes } from 'react';
import type { Tone } from './Text';

export type HeadingLevel = 1 | 2 | 3;
export type HeadingElement = 'h1' | 'h2' | 'h3' | 'h4';

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Semantic element. Defaults to the matching h{level}. */
  as?: HeadingElement;
  /** Visual size. */
  level?: HeadingLevel;
  tone?: Tone;
}

const DEFAULT_ELEMENT: Record<HeadingLevel, HeadingElement> = { 1: 'h1', 2: 'h2', 3: 'h3' };

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { as, level = 2, tone = 'default', className, children, ...rest },
  ref
) {
  const Component = as ?? DEFAULT_ELEMENT[level];
  const classes = ['ds-heading', `ds-heading--${level}`, `ds-tone--${tone}`, className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <Component ref={ref} className={classes} {...rest}>
      {children}
    </Component>
  );
});

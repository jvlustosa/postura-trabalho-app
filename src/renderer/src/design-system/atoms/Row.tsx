import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';
import type { Align, Justify } from './Stack';

const ALIGN_MAP: Record<Align, CSSProperties['alignItems']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
};

const JUSTIFY_MAP: Record<Justify, CSSProperties['justifyContent']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
};

export interface RowProps extends HTMLAttributes<HTMLDivElement> {
  /** Gap between children, in pixels. */
  gap?: number;
  align?: Align;
  justify?: Justify;
  wrap?: boolean;
}

export const Row = forwardRef<HTMLDivElement, RowProps>(function Row(
  { gap = 0, align = 'center', justify, wrap = false, className, style, children, ...rest },
  ref
) {
  const classes = ['ds-row', wrap ? 'ds-row--wrap' : '', className ?? ''].filter(Boolean).join(' ');
  const composedStyle: CSSProperties = {
    gap: `${gap}px`,
    alignItems: ALIGN_MAP[align],
    justifyContent: justify ? JUSTIFY_MAP[justify] : undefined,
    ...style,
  };

  return (
    <div ref={ref} className={classes} style={composedStyle} {...rest}>
      {children}
    </div>
  );
});

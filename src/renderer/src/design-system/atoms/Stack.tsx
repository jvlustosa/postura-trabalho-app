import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';

export type Align = 'start' | 'center' | 'end' | 'stretch';
export type Justify = 'start' | 'center' | 'end' | 'between' | 'around';

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

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  /** Gap between children, in pixels. */
  gap?: number;
  align?: Align;
  justify?: Justify;
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack(
  { gap = 0, align, justify, className, style, children, ...rest },
  ref
) {
  const classes = ['ds-stack', className ?? ''].filter(Boolean).join(' ');
  const composedStyle: CSSProperties = {
    gap: `${gap}px`,
    alignItems: align ? ALIGN_MAP[align] : undefined,
    justifyContent: justify ? JUSTIFY_MAP[justify] : undefined,
    ...style,
  };

  return (
    <div ref={ref} className={classes} style={composedStyle} {...rest}>
      {children}
    </div>
  );
});

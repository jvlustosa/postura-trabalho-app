import { forwardRef, type HTMLAttributes } from 'react';

export type SurfaceShape = 'sm' | 'md' | 'lg';
export type SurfaceElevation = 'flat' | 'raised' | 'high' | 'outlined';

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  shape?: SurfaceShape;
  elevation?: SurfaceElevation;
}

export interface CardProps extends SurfaceProps {
  /** Removes the default 24px padding when false. */
  padded?: boolean;
}

const SHAPE_CLASS: Record<SurfaceShape, string> = {
  sm: 'ds-surface--sm',
  md: '',
  lg: 'ds-surface--lg',
};

const ELEVATION_CLASS: Record<SurfaceElevation, string> = {
  flat: '',
  raised: 'ds-surface--elevated',
  high: 'ds-surface--elevated-2',
  outlined: 'ds-surface--outlined',
};

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  { shape = 'md', elevation = 'flat', className, children, ...rest },
  ref
) {
  const classes = ['ds-surface', SHAPE_CLASS[shape], ELEVATION_CLASS[elevation], className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={ref} className={classes} {...rest}>
      {children}
    </div>
  );
});

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { shape = 'lg', elevation = 'raised', padded = true, className, ...rest },
  ref
) {
  const classes = [padded ? 'ds-card' : '', className ?? ''].filter(Boolean).join(' ');
  return <Surface ref={ref} shape={shape} elevation={elevation} className={classes} {...rest} />;
});

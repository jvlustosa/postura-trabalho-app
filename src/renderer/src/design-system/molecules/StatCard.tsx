import { type ReactElement, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, Heading, Text } from '../atoms';
import type { Tone } from '../atoms';
import './molecules.css';

export interface StatCardProps {
  /** Short metric caption. */
  label: ReactNode;
  /** Prominent metric value. */
  value: ReactNode;
  /** Optional leading icon. */
  icon?: LucideIcon;
  /** Optional helper text under the value. */
  hint?: ReactNode;
  /** Tone applied to the value. */
  tone?: Tone;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = 'default',
  className,
}: StatCardProps): ReactElement {
  return (
    <Card className={['ds-stat-card', className ?? ''].filter(Boolean).join(' ')} elevation="flat">
      <div className="ds-stat-card__head">
        {Icon ? <Icon size={16} aria-hidden="true" /> : null}
        <Text variant="label" tone="muted">
          {label}
        </Text>
      </div>
      <Heading level={2} tone={tone}>
        {value}
      </Heading>
      {hint ? (
        <Text variant="body-sm" tone="muted">
          {hint}
        </Text>
      ) : null}
    </Card>
  );
}

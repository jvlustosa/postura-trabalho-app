import { type ReactElement, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, Heading, Text } from '../atoms';
import './molecules.css';

export interface ModalShellProps {
  /** Open state. When false, nothing renders. */
  open: boolean;
  title: ReactNode;
  /** Supporting message under the title. */
  message?: ReactNode;
  /** Optional leading icon shown in a circular badge. */
  icon?: LucideIcon;
  /** Tints the icon badge with the error palette. */
  danger?: boolean;
  /** Action buttons rendered in the footer. */
  actions?: ReactNode;
  children?: ReactNode;
  /** Called when the backdrop is clicked. */
  onBackdropClick?: () => void;
  role?: 'dialog' | 'alertdialog';
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  className?: string;
}

export function ModalShell({
  open,
  title,
  message,
  icon: Icon,
  danger = false,
  actions,
  children,
  onBackdropClick,
  role = 'dialog',
  className,
  ...aria
}: ModalShellProps): ReactElement | null {
  if (!open) return null;

  return (
    <div
      className="ds-modal-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onBackdropClick?.();
      }}
    >
      <Card
        className={['ds-modal', className ?? ''].filter(Boolean).join(' ')}
        role={role}
        aria-modal="true"
        {...aria}
      >
        {Icon ? (
          <div className={`ds-modal__icon${danger ? ' ds-modal__icon--danger' : ''}`}>
            <Icon size={28} aria-hidden="true" />
          </div>
        ) : null}
        <Heading
          level={3}
          {...(aria['aria-labelledby'] ? { id: aria['aria-labelledby'] } : {})}
        >
          {title}
        </Heading>
        {message ? (
          <Text {...(aria['aria-describedby'] ? { id: aria['aria-describedby'] } : {})}>
            {message}
          </Text>
        ) : null}
        {children}
        {actions ? <div className="ds-modal__actions">{actions}</div> : null}
      </Card>
    </div>
  );
}

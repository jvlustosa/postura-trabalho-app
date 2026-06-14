import { useCallback, useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../design-system/atoms';
import { ModalShell } from '../design-system/molecules';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface ConfirmDialogProps extends ConfirmOptions {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): ReactElement | null => {
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKey);
    confirmRef.current?.focus();

    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <ModalShell
      open
      role="alertdialog"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      icon={AlertTriangle}
      danger={destructive}
      title={title}
      message={message}
      onBackdropClick={onCancel}
      actions={
        <>
          <Button variant="text" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            variant="filled"
            className={destructive ? 'button--danger' : undefined}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
};

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export interface UseConfirmResult {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  dialog: ReactNode;
}

export const useConfirm = (): UseConfirmResult => {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions): Promise<boolean> =>
      new Promise<boolean>((resolve) => {
        setState({ ...options, resolve });
      }),
    [],
  );

  const handleConfirm = useCallback(() => {
    state?.resolve(true);
    setState(null);
  }, [state]);

  const handleCancel = useCallback(() => {
    state?.resolve(false);
    setState(null);
  }, [state]);

  const dialog = state ? (
    <ConfirmDialog
      open
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      destructive={state.destructive}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null;

  return { confirm, dialog };
};

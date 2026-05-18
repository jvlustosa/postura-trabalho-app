import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

type Placement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  label: ReactNode;
  children: ReactElement;
  delay?: number;
  placement?: Placement;
}

const DEFAULT_DELAY = 650;
const VIEWPORT_MARGIN = 8;
const GAP = 8;

export function Tooltip({
  label,
  children,
  delay = DEFAULT_DELAY,
  placement = 'bottom',
}: TooltipProps): ReactElement {
  const child = Children.only(children);
  if (!isValidElement(child)) {
    throw new Error('Tooltip expects a single React element child.');
  }

  const tooltipId = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<CSSProperties>({});

  const cancelTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const show = useCallback(() => {
    cancelTimer();
    timerRef.current = window.setTimeout(() => {
      setOpen(true);
      timerRef.current = null;
    }, delay);
  }, [cancelTimer, delay]);

  const hide = useCallback(() => {
    cancelTimer();
    setOpen(false);
  }, [cancelTimer]);

  useEffect(() => () => cancelTimer(), [cancelTimer]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hide();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, hide]);

  useLayoutEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip) return;

    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top: number;
    let left: number;

    if (placement === 'top') {
      top = triggerRect.top - tooltipRect.height - GAP;
      left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    } else if (placement === 'bottom') {
      top = triggerRect.bottom + GAP;
      left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    } else if (placement === 'left') {
      top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      left = triggerRect.left - tooltipRect.width - GAP;
    } else {
      top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      left = triggerRect.right + GAP;
    }

    left = Math.min(
      Math.max(VIEWPORT_MARGIN, left),
      viewportWidth - tooltipRect.width - VIEWPORT_MARGIN,
    );
    top = Math.min(
      Math.max(VIEWPORT_MARGIN, top),
      viewportHeight - tooltipRect.height - VIEWPORT_MARGIN,
    );

    setStyle({ top, left });
  }, [open, placement, label]);

  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      triggerRef.current = node;
      const original = (child as ReactElement & { ref?: unknown }).ref;
      if (typeof original === 'function') {
        original(node);
      } else if (original && typeof original === 'object' && 'current' in original) {
        (original as { current: HTMLElement | null }).current = node;
      }
    },
    [child],
  );

  const childProps = child.props as Record<string, unknown>;

  const handleMouseEnter = (event: React.MouseEvent): void => {
    show();
    const original = childProps.onMouseEnter as
      | ((event: React.MouseEvent) => void)
      | undefined;
    original?.(event);
  };

  const handleMouseLeave = (event: React.MouseEvent): void => {
    hide();
    const original = childProps.onMouseLeave as
      | ((event: React.MouseEvent) => void)
      | undefined;
    original?.(event);
  };

  const handleFocus = (event: React.FocusEvent): void => {
    show();
    const original = childProps.onFocus as
      | ((event: React.FocusEvent) => void)
      | undefined;
    original?.(event);
  };

  const handleBlur = (event: React.FocusEvent): void => {
    hide();
    const original = childProps.onBlur as
      | ((event: React.FocusEvent) => void)
      | undefined;
    original?.(event);
  };

  const cloned = cloneElement(child, {
    ref: setRefs,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
    'aria-describedby': open
      ? [childProps['aria-describedby'], tooltipId].filter(Boolean).join(' ')
      : (childProps['aria-describedby'] as string | undefined),
  } as Record<string, unknown>);

  return (
    <>
      {cloned}
      {open
        ? createPortal(
            <div
              ref={tooltipRef}
              id={tooltipId}
              role="tooltip"
              className="tooltip"
              data-placement={placement}
              style={style}
            >
              {label}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

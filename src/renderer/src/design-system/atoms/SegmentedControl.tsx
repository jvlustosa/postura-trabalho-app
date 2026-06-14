import type { JSX } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  /** Accessible label for the group. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  ...aria
}: SegmentedControlProps<T>): JSX.Element {
  const classes = ['ds-segmented', className ?? ''].filter(Boolean).join(' ');

  return (
    <div role="radiogroup" className={classes} {...aria}>
      {options.map((option) => {
        const Icon = option.icon;
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={option.disabled}
            className="ds-segmented__option"
            onClick={() => onChange(option.value)}
          >
            {Icon ? <Icon size={16} aria-hidden="true" /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

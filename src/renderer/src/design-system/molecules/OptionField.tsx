import { type JSX, type ReactNode } from 'react';
import { SegmentedControl, type SegmentedOption } from '../atoms';
import { SettingRow } from './SettingRow';

export interface OptionFieldProps<T extends string> {
  label: ReactNode;
  description?: ReactNode;
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  /** Accessible label for the segmented group. */
  groupLabel: string;
  /** Stack the control under the label instead of beside it. */
  stacked?: boolean;
  className?: string;
}

export function OptionField<T extends string>({
  label,
  description,
  options,
  value,
  onChange,
  groupLabel,
  stacked = true,
  className,
}: OptionFieldProps<T>): JSX.Element {
  return (
    <SettingRow
      className={className}
      stacked={stacked}
      label={label}
      description={description}
      control={
        <SegmentedControl
          options={options}
          value={value}
          onChange={onChange}
          aria-label={groupLabel}
        />
      }
    />
  );
}

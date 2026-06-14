import { type ReactElement, type ReactNode, useId } from 'react';
import { Switch } from '../atoms';
import { SettingRow } from './SettingRow';

export interface ToggleFieldProps {
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function ToggleField({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className,
}: ToggleFieldProps): ReactElement {
  const id = useId();

  return (
    <SettingRow
      className={className}
      htmlFor={id}
      label={label}
      description={description}
      control={<Switch id={id} checked={checked} onChange={onChange} disabled={disabled} />}
    />
  );
}

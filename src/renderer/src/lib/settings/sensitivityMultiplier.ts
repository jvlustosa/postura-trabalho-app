import type { SensitivityLevel } from './types';

export const sensitivityMultiplier = (level: SensitivityLevel): number => {
  if (level === 'relaxed') {
    return 1.35;
  }

  if (level === 'strict') {
    return 0.75;
  }

  return 1;
};

import type { ThemePreference } from '../settings/types';

/**
 * Applies the given theme by setting the `data-theme` attribute on <html>.
 * CSS in styles.css reads this attribute to override the OS color scheme.
 */
export const applyTheme = (theme: ThemePreference): void => {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
};

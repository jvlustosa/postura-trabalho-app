import { afterEach, describe, expect, it } from 'vitest';

import { applyTheme } from './applyTheme';

describe('applyTheme', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
  });

  it('sets data-theme to dark on the document element', () => {
    applyTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('sets data-theme to light on the document element', () => {
    applyTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('overwrites a previously applied theme', () => {
    applyTheme('dark');
    applyTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});

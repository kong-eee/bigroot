export type UiTheme = 'refresh' | 'classic';

export const UI_THEME_KEY = 'bigroot-ui-theme';
export const UI_THEME_DEFAULT: UiTheme = 'refresh';

export function isUiTheme(value: string | null): value is UiTheme {
  return value === 'refresh' || value === 'classic';
}

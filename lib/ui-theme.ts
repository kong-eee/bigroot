/** 운영 UI — classic(이전 UI) 고정. refresh는 theme-backup/refresh 참고 */
export type UiTheme = 'classic';

export const UI_THEME_KEY = 'bigroot-ui-theme';
export const UI_THEME_DEFAULT: UiTheme = 'classic';

export function isUiTheme(value: string | null): value is UiTheme {
  return value === 'classic';
}

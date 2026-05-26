export function parseJibun(
  jibun: string
): { mountain: boolean; main: number; sub: number } | null {
  const trimmed = jibun.trim().replace(/\s+/g, '');
  if (!trimmed) return null;

  const mountain = trimmed.startsWith('산');
  const body = mountain ? trimmed.slice(1) : trimmed;
  const match = body.match(/^(\d+)(?:-(\d+))?$/);
  if (!match) return null;

  const main = Number.parseInt(match[1], 10);
  const sub = match[2] ? Number.parseInt(match[2], 10) : 0;
  if (!Number.isFinite(main) || main <= 0 || main > 9999 || sub < 0 || sub > 9999) {
    return null;
  }

  return { mountain, main, sub };
}

/** 법정동코드(8~10자리) + 번지 → 19자리 PNU */
export function buildPnu(dongCode: string, jibun: string): string | null {
  const parsed = parseJibun(jibun);
  if (!parsed) return null;

  const digits = dongCode.replace(/\D/g, '');
  if (digits.length < 8) return null;

  const legalDong = digits.padEnd(10, '0').slice(0, 10);
  const landType = parsed.mountain ? '2' : '1';
  const main = String(parsed.main).padStart(4, '0');
  const sub = String(parsed.sub).padStart(4, '0');

  return `${legalDong}${landType}${main}${sub}`;
}

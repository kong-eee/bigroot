function textOf(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  return '';
}

export function pickField(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = textOf(row[key]);
    if (v) return v;
  }
  return '';
}

export function normalizeItems(body: unknown): Record<string, unknown>[] {
  if (!body || typeof body !== 'object') return [];
  const b = body as Record<string, unknown>;
  const items = b.items;
  if (!items || typeof items !== 'object') return [];
  const item = (items as { item?: unknown }).item;
  if (Array.isArray(item)) return item as Record<string, unknown>[];
  if (item && typeof item === 'object') return [item as Record<string, unknown>];
  return [];
}

export function parseDataGoKrResponse(json: Record<string, unknown>): {
  items: Record<string, unknown>[];
  totalCount: number;
} {
  const response = json.response as Record<string, unknown> | undefined;
  const header = response?.header as { resultCode?: string; resultMsg?: string } | undefined;
  const body = response?.body as Record<string, unknown> | undefined;

  const code = header?.resultCode ?? textOf(json.resultCode);
  if (code && code !== '00' && code !== '0') {
    throw new Error(header?.resultMsg ?? textOf(json.resultMsg) ?? `API 오류 (코드 ${code})`);
  }

  const items = normalizeItems(body ?? json);
  const totalCount = Number(body?.totalCount ?? items.length) || items.length;
  return { items, totalCount };
}

export function formatApplyDate(raw: string): { iso: string; label: string } {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 8) {
    const y = digits.slice(0, 4);
    const m = digits.slice(4, 6);
    const d = digits.slice(6, 8);
    const iso = `${y}-${m}-${d}`;
    const label = new Date(iso).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return { iso, label: Number.isNaN(Date.parse(iso)) ? raw : label };
  }
  if (digits.length === 6) {
    const y = digits.slice(0, 4);
    const m = digits.slice(4, 6);
    return {
      iso: `${y}-${m}-01`,
      label: `${y}년 ${Number(m)}월`,
    };
  }
  return { iso: raw, label: raw };
}

export function rateRowsFromObject(
  row: Record<string, unknown>,
  keys: { key: string; label: string }[]
): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  for (const { key, label } of keys) {
    const v = textOf(row[key]);
    if (v && v !== '0' && v !== '-') {
      out.push({ label, value: `${v}%` });
    }
  }
  return out;
}

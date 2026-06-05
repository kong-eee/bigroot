import type { BokBaseRate } from './types';

export async function fetchBokBaseRate(): Promise<BokBaseRate> {
  const API_KEY = process.env.BOK_ECOS_API_KEY?.trim();
  if (!API_KEY || API_KEY === 'sample') {
    return { value: 3.5, source: 'fallback' };
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10).replace(/-/g, '');
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');

  try {
    const url = `https://ecos.bok.or.kr/api/StatisticSearch/${API_KEY}/json/kr/1/1/722Y001/D/${lastWeek}/${today}/0101000`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();
    const rows = data.StatisticSearch?.row;
    if (Array.isArray(rows) && rows.length > 0) {
      const latest = rows[rows.length - 1];
      const value = parseFloat(latest.DATA_VALUE);
      const asOf = latest.TIME ?? undefined;
      if (Number.isFinite(value)) {
        return { value, asOf, source: 'api' };
      }
    }
  } catch {
    /* fallback below */
  }

  return { value: 3.5, source: 'fallback' };
}

import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
for (const key of ['DATA_GO_KR_SERVICE_KEY', 'YOUTH_CENTER_API_KEY', 'BOK_ECOS_API_KEY']) {
  const m = env.match(new RegExp(`^${key}=(.+)$`, 'm'));
  if (m) process.env[key] = m[1].trim();
}

const { fetchLoanRatesBundle } = await import('../lib/housing-fund/index.ts');
const { fetchPolicyNotices } = await import('../lib/policy-notices/index.ts');

const rates = await fetchLoanRatesBundle();
console.log('loan-rates', {
  didimdol: rates.didimdol.length,
  rent: rates.rent.length,
  conforming: rates.conforming.length,
  conformingSource: rates.conformingSource,
  conformingUnavailable: rates.conformingUnavailable ?? null,
  sample: rates.conforming[0]?.productName,
});

const notices = await fetchPolicyNotices('11');
console.log('policy-notices', {
  total: notices.items.length,
  categories: notices.items.reduce((a, i) => {
    a[i.category] = (a[i.category] ?? 0) + 1;
    return a;
  }, {}),
  first: notices.items.slice(0, 4).map((i) => i.title),
});

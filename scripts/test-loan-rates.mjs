import { readFileSync } from 'fs';
import { fetchLoanRatesBundle } from '../lib/housing-fund/index.ts';

const env = readFileSync('.env.local', 'utf8');
const m = env.match(/^DATA_GO_KR_SERVICE_KEY=(.+)$/m);
if (m) process.env.DATA_GO_KR_SERVICE_KEY = m[1].trim();

const r = await fetchLoanRatesBundle();
console.log({
  source: r.source,
  didimdol: r.didimdol.length,
  rent: r.rent.length,
  conforming: r.conforming.length,
  warnings: r.warnings,
  didimdolSample: r.didimdol[0]?.summary?.slice(0, 80),
  rentSample: r.rent[0]?.institution,
});

import { readFileSync } from 'fs';
import { XMLParser } from 'fast-xml-parser';

const env = readFileSync('.env.local', 'utf8');
const m = env.match(/^DATA_GO_KR_SERVICE_KEY=(.+)$/m);
const key = m?.[1]?.trim();
if (!key) {
  console.error('no key');
  process.exit(1);
}
const decoded = key.includes('%') ? decodeURIComponent(key) : key;
const keyQ = `serviceKey=${encodeURIComponent(decoded)}`;

const PRODUCTS = [
  '',
  'IBK 장기고정금리 모기지론',
  'KB 국민은행',
  '신한은행',
  '하나은행',
  '우리은행',
  'NH농협은행',
  'SC제일은행',
  '한국주택금융공사',
];

const BASES = [
  'https://apis.data.go.kr/B551408/conforming-loan-rate/conforming-list',
  'http://apis.data.go.kr/B551408/conforming-loan-rate/conforming-list',
];

const parser = new XMLParser({ ignoreAttributes: false });

async function probe(label, url) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    const text = await res.text();
    let code = '';
    let count = 0;
    if (text.trim().startsWith('{')) {
      const j = JSON.parse(text);
      const h = j.response?.header ?? j.header;
      code = h?.resultCode ?? '';
      const body = j.response?.body ?? j.body;
      const items = body?.items;
      if (Array.isArray(items)) count = items.length;
      else if (items?.item) count = Array.isArray(items.item) ? items.item.length : 1;
      else if (body?.item) count = 1;
    } else if (text.trim().startsWith('<')) {
      const j = parser.parse(text);
      const h = j.response?.header ?? j.header;
      code = h?.resultCode ?? '';
      const body = j.response?.body ?? j.body;
      const item = body?.items?.item;
      count = Array.isArray(item) ? item.length : item ? 1 : 0;
    }
    const ok = res.ok && (code === '00' || code === '0') && count > 0;
    console.log(`${ok ? '✅' : '❌'} ${label} → HTTP ${res.status} code=${code} items=${count}`);
    if (ok) console.log('   URL:', url.slice(0, 120) + '...');
    return ok ? { url, count } : null;
  } catch (e) {
    console.log(`❌ ${label} → ${e.message}`);
    return null;
  }
}

let winner = null;
for (const base of BASES) {
  for (const dt of ['json', 'XML']) {
    for (const product of PRODUCTS) {
      const params = new URLSearchParams({
        pageNo: '1',
        numOfRows: '10',
        dataType: dt,
      });
      if (product) params.set('productNm', product);
      const label = `${base.startsWith('https') ? 'https' : 'http'} ${dt} product=${product || '(없음)'}`;
      const url = `${base}?${keyQ}&${params}`;
      const r = await probe(label, url);
      if (r && !winner) winner = r;
    }
  }
}

if (winner) {
  console.log('\n성공 조합 발견');
} else {
  console.log('\n모든 조합 실패 — API 서버 자체 장애 또는 승인 대기 가능');
}

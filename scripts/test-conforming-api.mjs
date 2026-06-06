/**
 * HF 적격대출 API 샘플 호출 확인
 * 사용: node scripts/test-conforming-api.mjs
 * (.env.local 의 DATA_GO_KR_SERVICE_KEY 필요)
 */
import { readFileSync } from 'fs';
import { buildDataGoKrServiceKeyQuery } from '../lib/data-go-kr.ts';

const env = readFileSync('.env.local', 'utf8');
const m = env.match(/^DATA_GO_KR_SERVICE_KEY=(.+)$/m);
const serviceKey = m?.[1]?.trim();
if (!serviceKey) {
  console.error('❌ .env.local 에 DATA_GO_KR_SERVICE_KEY 가 없습니다.');
  process.exit(1);
}

const BASE = 'https://apis.data.go.kr/B551408/conforming-loan-rate/conforming-list';
const keyQuery = buildDataGoKrServiceKeyQuery(serviceKey);

async function tryCall(label, extraParams = {}) {
  const params = new URLSearchParams({
    pageNo: '1',
    numOfRows: '10',
    dataType: 'json',
    ...extraParams,
  });
  const url = `${BASE}?${keyQuery}&${params.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });
  const text = await res.text();
  const preview = text.slice(0, 400).replace(/\s+/g, ' ');

  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    /* not json */
  }

  const header =
    parsed?.response?.header ??
    parsed?.header ??
    (parsed?.body?.header && typeof parsed.body.header === 'object' ? parsed.body.header : null);
  const resultCode = header?.resultCode ?? parsed?.body?.resultCode;
  const resultMsg = header?.resultMsg ?? parsed?.body?.resultMsg;

  const body = parsed?.response?.body ?? parsed?.body ?? parsed;
  const items = body?.items;
  const itemCount = Array.isArray(items)
    ? items.length
    : items?.item
      ? Array.isArray(items.item)
        ? items.item.length
        : 1
      : body?.item
        ? 1
        : 0;

  console.log(`\n── ${label} ──`);
  console.log(`HTTP ${res.status} ${res.statusText}`);
  if (resultCode) console.log(`resultCode: ${resultCode}  resultMsg: ${resultMsg ?? ''}`);
  console.log(`items: ${itemCount}건`);
  if (!res.ok || resultCode && resultCode !== '00') {
    console.log('응답 미리보기:', preview);
  } else if (itemCount > 0) {
    console.log('✅ 샘플 호출 성공 (JSON 데이터 수신)');
  } else {
    console.log('⚠️ HTTP는 성공했으나 목록이 비었습니다.');
    console.log('응답 미리보기:', preview);
  }
}

console.log('HF 적격대출 API 확인 (15082047)');
console.log('키: .env.local DATA_GO_KR_SERVICE_KEY 사용');

await tryCall('① 파라미터만 (pageNo, numOfRows, json) — 앱과 동일');
await tryCall('② productNm 포함 (포털 샘플)', {
  productNm: 'IBK 장기고정금리 모기지론',
});

console.log('\n해석:');
console.log('- HTTP 200 + resultCode 00 + items > 0 → 정상');
console.log('- HTTP 500 → 공공데이터/HF 서버 오류 (앱과 동일 증상)');
console.log('- HTTP 401/403 또는 SERVICE_KEY → 인증키·활용신청 확인');

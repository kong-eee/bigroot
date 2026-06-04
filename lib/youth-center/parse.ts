import { XMLParser } from 'fast-xml-parser';

function textOf(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    if ('_cdata' in o) return String(o._cdata ?? '').trim();
    if ('_text' in o) return String(o._text ?? '').trim();
    if ('#text' in o) return String(o['#text'] ?? '').trim();
  }
  return '';
}

function pick(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = textOf(obj[key]);
    if (v) return v;
  }
  return '';
}

export function parseYouthPolicyXml(xml: string): {
  items: Record<string, unknown>[];
  totalCount: number;
} {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    trimValues: true,
    isArray: (name) =>
      ['youthPolicy', 'youthPlcy', 'emp', 'item', 'result'].includes(name),
  });

  const json = parser.parse(xml) as Record<string, unknown>;
  const root =
    json.youthPolicyList ??
    json.youthPlcyList ??
    json.empsInfo ??
    json.result ??
    json;

  const body =
    (root as { youthPolicyList?: unknown }).youthPolicyList ??
    (root as { youthPlcyList?: unknown }).youthPlcyList ??
    root;

  const listRaw =
    (body as { youthPolicy?: unknown }).youthPolicy ??
    (body as { youthPlcy?: unknown }).youthPlcy ??
    (body as { emp?: unknown }).emp ??
    (body as { result?: unknown }).result;

  const items = Array.isArray(listRaw)
    ? (listRaw as Record<string, unknown>[])
    : listRaw && typeof listRaw === 'object'
      ? [listRaw as Record<string, unknown>]
      : [];

  const pag =
    (body as { pagging?: unknown }).pagging ??
    (body as { paging?: unknown }).paging ??
    (body as { paginationInfo?: unknown }).paginationInfo;

  const totalCount = Number(
    textOf((pag as Record<string, unknown>)?.totCount) ||
      textOf((pag as Record<string, unknown>)?.totalCount) ||
      textOf((pag as Record<string, unknown>)?.totalRecordCount) ||
      items.length
  );

  return { items, totalCount: Number.isFinite(totalCount) ? totalCount : items.length };
}

export function mapRawPolicy(row: Record<string, unknown>): {
  id: string;
  title: string;
  summary: string;
  support: string;
  orgType: string;
  orgName: string;
  regionLabel: string;
  period: string;
  applyUrl: string;
  detailUrl: string;
} {
  const id = pick(row, ['bizId', 'plcyId', 'polyBizId', 'policyId']) || pick(row, ['polyBizSjnm']);
  const title = pick(row, ['polyBizSjnm', 'plcyNm', 'policyNm']);
  const summary = pick(row, ['polyItcnCn', 'plcySumryCn', 'policyCn']);
  const support = pick(row, ['sporCn', 'plcySporCn']);
  const orgType = pick(row, ['polyBizTy', 'plcyTyNm', 'polyBizTyNm']);
  const orgName = pick(row, ['cnsgNmor', 'sprvsnInstNm', 'operInstNm', 'rgtrInstNm']);
  const regionLabel = pick(row, ['plcyRgnNm', 'polyRgnNm', 'rgnSeNm', 'polyBizSecdNm']);
  const period = pick(row, ['rqutPrdCn', 'bizPrdCn', 'plcyPrd']);
  const applyUrl = pick(row, ['rqutUrla', 'plcyAplyUrl', 'aplyUrl']);
  const detailId = pick(row, ['bizId', 'plcyId', 'polyBizId']);
  const detailUrl = detailId
    ? `https://www.youthcenter.go.kr/yni/youthPolicy/YouthPolicyView.do?plcyId=${encodeURIComponent(detailId)}`
    : 'https://www.youthcenter.go.kr/';

  return {
    id,
    title: title || '제목 없음',
    summary,
    support,
    orgType,
    orgName,
    regionLabel,
    period,
    applyUrl,
    detailUrl,
  };
}

export function isCentralPolicy(orgType: string, regionLabel: string, orgName = ''): boolean {
  const t = `${orgType} ${regionLabel} ${orgName}`;
  if (t.includes('중앙') || t.includes('전국') || t.includes('국가')) return true;
  if (/[시도]청|광역시|특별시|특별자치|구청|군청|주민센터/.test(orgName)) return false;
  if (/(부|처)$/.test(orgName.trim()) && !orgName.includes('시')) return true;
  return false;
}

export function mapJsonPolicy(row: Record<string, unknown>): {
  id: string;
  title: string;
  summary: string;
  support: string;
  orgType: string;
  orgName: string;
  regionLabel: string;
  period: string;
  applyUrl: string;
  detailUrl: string;
} {
  const id = textOf(row.plcyNo) || textOf(row.plcyId);
  const title = textOf(row.plcyNm);
  const summary = textOf(row.plcyExplnCn);
  const support = textOf(row.plcySprtCn);
  const providerGroup = textOf(row.pvsnInstGroupCd);
  const orgType =
    providerGroup === '0054001'
      ? '중앙부처'
      : providerGroup === '0054002'
        ? '지자체'
        : textOf(row.lclsfNm) || textOf(row.mclsfNm);
  const orgName =
    textOf(row.operInstCdNm) ||
    textOf(row.sprvsnInstCdNm) ||
    textOf(row.rgtrInstCdNm);
  const regionLabel = [
    textOf(row.plcyNm),
    textOf(row.sprvsnInstCdNm),
    textOf(row.operInstCdNm),
    textOf(row.rgtrUpInstCdNm),
    textOf(row.rgtrHghrkInstCdNm),
    textOf(row.rgtrInstCdNm),
  ]
    .filter(Boolean)
    .join(' ');
  const period =
    textOf(row.bizPrdEtcCn) ||
    [textOf(row.bizPrdBgngYmd), textOf(row.bizPrdEndYmd)].filter(Boolean).join(' ~ ') ||
    textOf(row.aplyYmd);
  const applyUrl = textOf(row.aplyUrlAddr) || textOf(row.refUrlAddr1);
  const detailUrl =
    textOf(row.refUrlAddr1) ||
    (id
      ? `https://www.youthcenter.go.kr/youthPolicy/ythPlcyTotalSearch?plcyNo=${encodeURIComponent(id)}`
      : 'https://www.youthcenter.go.kr/');

  return {
    id,
    title: title || '제목 없음',
    summary,
    support,
    orgType,
    orgName,
    regionLabel,
    period,
    applyUrl: applyUrl || detailUrl,
    detailUrl,
  };
}

export function policyMatchesSido(
  item: { title: string; summary: string; orgName: string; orgType: string; regionLabel: string },
  shortName: string,
  fullName: string
): boolean {
  const hay = `${item.title} ${item.summary} ${item.orgName} ${item.orgType} ${item.regionLabel}`;
  const keys = [
    shortName,
    fullName.replace(/특별자치시|특별자치도|광역시|특별시|도$/g, '').trim(),
  ].filter((k) => k.length >= 2);
  return keys.some((k) => hay.includes(k));
}

type YouthPlcyApiJson = {
  resultCode?: number;
  resultMessage?: string;
  result?: {
    pagging?: { totCount?: number; pageNum?: number; pageSize?: number };
    youthPolicyList?: Record<string, unknown>[];
  };
};

export function parseYouthPolicyJson(body: string): {
  items: Record<string, unknown>[];
  totalCount: number;
} {
  const json = JSON.parse(body) as YouthPlcyApiJson;
  if (json.resultCode != null && json.resultCode !== 200) {
    throw new Error(json.resultMessage || `온통청년 API 오류 (코드 ${json.resultCode})`);
  }
  const items = json.result?.youthPolicyList ?? [];
  const totalCount = Number(json.result?.pagging?.totCount ?? items.length);
  return {
    items,
    totalCount: Number.isFinite(totalCount) ? totalCount : items.length,
  };
}

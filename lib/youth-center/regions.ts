import { getSidoShortLabel, STATIC_SIDO_LIST } from '@/lib/korea-sido';

/** 온통청년 API srchPolyBizSecd (시·도) */
export const YOUTH_SIDO_API_CODE: Record<string, string> = {
  '11': '003002001',
  '26': '003002002',
  '27': '003002003',
  '28': '003002004',
  '29': '003002005',
  '30': '003002006',
  '31': '003002007',
  '41': '003002008',
  '42': '003002009',
  '43': '003002010',
  '44': '003002011',
  '45': '003002012',
  '46': '003002013',
  '47': '003002014',
  '48': '003002015',
  '50': '003002016',
  '36': '003002017',
};

export type YouthSidoRegion = {
  /** 행정안전부 시·도 코드 */
  sidoCode: string;
  name: string;
  shortName: string;
  youthApiCode: string;
};

export const YOUTH_SIDO_REGIONS: YouthSidoRegion[] = STATIC_SIDO_LIST.map((s) => ({
  sidoCode: s.code,
  name: s.name,
  shortName: getSidoShortLabel(s.code),
  youthApiCode: YOUTH_SIDO_API_CODE[s.code] ?? '',
}));

export function getYouthRegionBySido(sidoCode: string): YouthSidoRegion | undefined {
  return YOUTH_SIDO_REGIONS.find((r) => r.sidoCode === sidoCode);
}

export function getYouthApiCode(sidoCode: string): string | undefined {
  return YOUTH_SIDO_API_CODE[sidoCode];
}

/** 온통청년 주거 분야 */
export const YOUTH_BIZ_TYPE_HOUSING = '023020';

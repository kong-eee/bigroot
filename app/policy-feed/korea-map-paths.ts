/**
 * 대한민국 시·도 경계 (viewBox 0 0 524 631)
 * 출처: @svg-maps/south-korea (MapSVG, CC BY 4.0)
 */
import southKoreaMap from '@svg-maps/south-korea';

type MapLocation = { id: string; path: string };

export type MapRegionPath = {
  sidoCode: string;
  label: string;
  path: string;
  labelX: number;
  labelY: number;
};

export const KOREA_MAP_VIEWBOX = southKoreaMap.viewBox;

const MAP_META: Record<string, { sidoCode: string; label: string; labelX: number; labelY: number }> = {
  gangwon: { sidoCode: '42', label: '강원', labelX: 318, labelY: 118 },
  gyeonggi: { sidoCode: '41', label: '경기', labelX: 128, labelY: 198 },
  seoul: { sidoCode: '11', label: '서울', labelX: 178, labelY: 178 },
  incheon: { sidoCode: '28', label: '인천', labelX: 98, labelY: 168 },
  'north-chungcheong': { sidoCode: '43', label: '충북', labelX: 248, labelY: 268 },
  sejong: { sidoCode: '36', label: '세종', labelX: 212, labelY: 248 },
  'south-chungcheong': { sidoCode: '44', label: '충남', labelX: 168, labelY: 298 },
  daejeon: { sidoCode: '30', label: '대전', labelX: 198, labelY: 288 },
  'north-gyeongsang': { sidoCode: '47', label: '경북', labelX: 368, labelY: 298 },
  daegu: { sidoCode: '27', label: '대구', labelX: 308, labelY: 368 },
  ulsan: { sidoCode: '31', label: '울산', labelX: 418, labelY: 388 },
  'south-gyeongsang': { sidoCode: '48', label: '경남', labelX: 328, labelY: 448 },
  busan: { sidoCode: '26', label: '부산', labelX: 398, labelY: 498 },
  'north-jeolla': { sidoCode: '45', label: '전북', labelX: 168, labelY: 358 },
  gwangju: { sidoCode: '29', label: '광주', labelX: 158, labelY: 418 },
  'south-jeolla': { sidoCode: '46', label: '전남', labelX: 148, labelY: 478 },
  jeju: { sidoCode: '50', label: '제주', labelX: 132, labelY: 598 },
};

export const KOREA_MAP_PATHS: MapRegionPath[] = (southKoreaMap.locations as MapLocation[])
  .flatMap((loc) => {
    const meta = MAP_META[loc.id];
    if (!meta) return [];
    return [
      {
        sidoCode: meta.sidoCode,
        label: meta.label,
        path: loc.path,
        labelX: meta.labelX,
        labelY: meta.labelY,
      },
    ];
  });

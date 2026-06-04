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
};

export const KOREA_MAP_VIEWBOX = southKoreaMap.viewBox;

const MAP_META: Record<string, { sidoCode: string; label: string }> = {
  gangwon: { sidoCode: '42', label: '강원' },
  gyeonggi: { sidoCode: '41', label: '경기' },
  seoul: { sidoCode: '11', label: '서울' },
  incheon: { sidoCode: '28', label: '인천' },
  'north-chungcheong': { sidoCode: '43', label: '충북' },
  sejong: { sidoCode: '36', label: '세종' },
  'south-chungcheong': { sidoCode: '44', label: '충남' },
  daejeon: { sidoCode: '30', label: '대전' },
  'north-gyeongsang': { sidoCode: '47', label: '경북' },
  daegu: { sidoCode: '27', label: '대구' },
  ulsan: { sidoCode: '31', label: '울산' },
  'south-gyeongsang': { sidoCode: '48', label: '경남' },
  busan: { sidoCode: '26', label: '부산' },
  'north-jeolla': { sidoCode: '45', label: '전북' },
  gwangju: { sidoCode: '29', label: '광주' },
  'south-jeolla': { sidoCode: '46', label: '전남' },
  jeju: { sidoCode: '50', label: '제주' },
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
      },
    ];
  });

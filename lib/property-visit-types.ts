import type { GoldenPropertyType } from '@/lib/golden-time-schedule';

export type VisitDecision = '관심' | '보류' | '제외';

export type ChecklistEntry = {
  checked: boolean;
  note?: string;
};

export type VisitPhoto = {
  id: string;
  path: string;
  caption?: string;
  createdAt: string;
};

export type PropertyVisit = {
  id: string;
  propertyType: GoldenPropertyType;
  title: string;
  address: string | null;
  visitedAt: string;
  depositWon: number | null;
  monthlyRentWon: number | null;
  maintenanceWon: number | null;
  keyMoneyWon: number | null;
  areaM2: number | null;
  floor: string | null;
  direction: string | null;
  buildingYear: number | null;
  parking: string | null;
  transport: string | null;
  neighborhood: string | null;
  sunlight: string | null;
  noise: string | null;
  humidity: string | null;
  facilities: string | null;
  pros: string | null;
  cons: string | null;
  features: string | null;
  landlordImpression: string | null;
  agentInfo: string | null;
  contractNotes: string | null;
  overallScore: number | null;
  decision: VisitDecision | null;
  checklist: Record<string, ChecklistEntry>;
  photos: VisitPhoto[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PropertyVisitDraft = Omit<PropertyVisit, 'id' | 'createdAt' | 'updatedAt'>;

export const VISIT_DECISIONS: VisitDecision[] = ['관심', '보류', '제외'];

export const DIRECTION_OPTIONS = [
  '남향',
  '남동향',
  '남서향',
  '동향',
  '서향',
  '북향',
  '북동향',
  '북서향',
  '복합',
  '미확인',
] as const;

export const PHOTO_BUCKET = 'property-visit-photos';

export function emptyVisitDraft(propertyType: GoldenPropertyType = '주택'): PropertyVisitDraft {
  return {
    propertyType,
    title: '',
    address: null,
    visitedAt: new Date().toISOString().slice(0, 10),
    depositWon: null,
    monthlyRentWon: null,
    maintenanceWon: null,
    keyMoneyWon: null,
    areaM2: null,
    floor: null,
    direction: null,
    buildingYear: null,
    parking: null,
    transport: null,
    neighborhood: null,
    sunlight: null,
    noise: null,
    humidity: null,
    facilities: null,
    pros: null,
    cons: null,
    features: null,
    landlordImpression: null,
    agentInfo: null,
    contractNotes: null,
    overallScore: null,
    decision: null,
    checklist: {},
    photos: [],
    isFavorite: false,
  };
}

export function formatWon(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '-';
  return `${value.toLocaleString('ko-KR')}원`;
}

export function parseWonInput(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

export function checklistProgress(
  checklist: Record<string, ChecklistEntry>,
  itemIds: string[]
): { done: number; total: number; pct: number } {
  const total = itemIds.length;
  const done = itemIds.filter((id) => checklist[id]?.checked).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

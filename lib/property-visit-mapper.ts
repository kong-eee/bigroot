import type { PropertyVisit, PropertyVisitDraft, VisitPhoto } from '@/lib/property-visit-types';
import type { GoldenPropertyType } from '@/lib/golden-time-schedule';

function isPropertyType(v: string): v is GoldenPropertyType {
  return v === '주택' || v === '상가';
}

function parsePhotos(raw: unknown): VisitPhoto[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p): p is VisitPhoto => Boolean(p && typeof p === 'object' && 'id' in p && 'path' in p))
    .map((p) => ({
      id: String(p.id),
      path: String(p.path),
      caption: p.caption ? String(p.caption) : undefined,
      createdAt: p.createdAt ? String(p.createdAt) : new Date().toISOString(),
    }));
}

function parseChecklist(raw: unknown): Record<string, { checked: boolean; note?: string }> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, { checked: boolean; note?: string }> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const entry = value as { checked?: boolean; note?: string };
    out[key] = {
      checked: Boolean(entry.checked),
      note: entry.note ? String(entry.note) : undefined,
    };
  }
  return out;
}

export function rowToVisit(row: Record<string, unknown>): PropertyVisit {
  return {
    id: String(row.id),
    propertyType: isPropertyType(String(row.property_type)) ? (row.property_type as GoldenPropertyType) : '주택',
    title: String(row.title ?? ''),
    address: row.address ? String(row.address) : null,
    visitedAt: String(row.visited_at ?? ''),
    depositWon: row.deposit_won != null ? Number(row.deposit_won) : null,
    monthlyRentWon: row.monthly_rent_won != null ? Number(row.monthly_rent_won) : null,
    maintenanceWon: row.maintenance_won != null ? Number(row.maintenance_won) : null,
    keyMoneyWon: row.key_money_won != null ? Number(row.key_money_won) : null,
    areaM2: row.area_m2 != null ? Number(row.area_m2) : null,
    floor: row.floor ? String(row.floor) : null,
    direction: row.direction ? String(row.direction) : null,
    buildingYear: row.building_year != null ? Number(row.building_year) : null,
    parking: row.parking ? String(row.parking) : null,
    transport: row.transport ? String(row.transport) : null,
    neighborhood: row.neighborhood ? String(row.neighborhood) : null,
    sunlight: row.sunlight ? String(row.sunlight) : null,
    noise: row.noise ? String(row.noise) : null,
    humidity: row.humidity ? String(row.humidity) : null,
    facilities: row.facilities ? String(row.facilities) : null,
    pros: row.pros ? String(row.pros) : null,
    cons: row.cons ? String(row.cons) : null,
    features: row.features ? String(row.features) : null,
    landlordImpression: row.landlord_impression ? String(row.landlord_impression) : null,
    agentInfo: row.agent_info ? String(row.agent_info) : null,
    contractNotes: row.contract_notes ? String(row.contract_notes) : null,
    overallScore: row.overall_score != null ? Number(row.overall_score) : null,
    decision:
      row.decision === '관심' || row.decision === '보류' || row.decision === '제외'
        ? row.decision
        : null,
    checklist: parseChecklist(row.checklist),
    photos: parsePhotos(row.photos),
    isFavorite: Boolean(row.is_favorite),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

export function draftToRow(draft: Partial<PropertyVisitDraft>, userId: string) {
  const row: Record<string, unknown> = { user_id: userId };

  if (draft.propertyType) row.property_type = draft.propertyType;
  if (draft.title !== undefined) row.title = draft.title.trim();
  if (draft.address !== undefined) row.address = draft.address?.trim() || null;
  if (draft.visitedAt !== undefined) row.visited_at = draft.visitedAt;
  if (draft.depositWon !== undefined) row.deposit_won = draft.depositWon;
  if (draft.monthlyRentWon !== undefined) row.monthly_rent_won = draft.monthlyRentWon;
  if (draft.maintenanceWon !== undefined) row.maintenance_won = draft.maintenanceWon;
  if (draft.keyMoneyWon !== undefined) row.key_money_won = draft.keyMoneyWon;
  if (draft.areaM2 !== undefined) row.area_m2 = draft.areaM2;
  if (draft.floor !== undefined) row.floor = draft.floor?.trim() || null;
  if (draft.direction !== undefined) row.direction = draft.direction?.trim() || null;
  if (draft.buildingYear !== undefined) row.building_year = draft.buildingYear;
  if (draft.parking !== undefined) row.parking = draft.parking?.trim() || null;
  if (draft.transport !== undefined) row.transport = draft.transport?.trim() || null;
  if (draft.neighborhood !== undefined) row.neighborhood = draft.neighborhood?.trim() || null;
  if (draft.sunlight !== undefined) row.sunlight = draft.sunlight?.trim() || null;
  if (draft.noise !== undefined) row.noise = draft.noise?.trim() || null;
  if (draft.humidity !== undefined) row.humidity = draft.humidity?.trim() || null;
  if (draft.facilities !== undefined) row.facilities = draft.facilities?.trim() || null;
  if (draft.pros !== undefined) row.pros = draft.pros?.trim() || null;
  if (draft.cons !== undefined) row.cons = draft.cons?.trim() || null;
  if (draft.features !== undefined) row.features = draft.features?.trim() || null;
  if (draft.landlordImpression !== undefined) row.landlord_impression = draft.landlordImpression?.trim() || null;
  if (draft.agentInfo !== undefined) row.agent_info = draft.agentInfo?.trim() || null;
  if (draft.contractNotes !== undefined) row.contract_notes = draft.contractNotes?.trim() || null;
  if (draft.overallScore !== undefined) row.overall_score = draft.overallScore;
  if (draft.decision !== undefined) row.decision = draft.decision;
  if (draft.checklist !== undefined) row.checklist = draft.checklist;
  if (draft.photos !== undefined) row.photos = draft.photos;
  if (draft.isFavorite !== undefined) row.is_favorite = draft.isFavorite;

  return row;
}

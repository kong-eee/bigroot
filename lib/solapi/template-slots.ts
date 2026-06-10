const PENDING_MARKERS = new Set(['PENDING', 'TBD', '심사중']);

export type AlimtalkSlot = 1 | 2 | 3;

export const ALIMTALK_SLOTS: AlimtalkSlot[] = [1, 2, 3];

export function isApprovedTemplateId(id?: string): boolean {
  if (!id?.trim()) return false;
  return !PENDING_MARKERS.has(id.trim().toUpperCase());
}

export function getSlotTemplateId(slot: AlimtalkSlot): string | undefined {
  const perSlot = process.env[`SOLAPI_KAKAO_TEMPLATE_SLOT_${slot}`]?.trim();
  if (perSlot) return perSlot;
  return process.env.SOLAPI_KAKAO_TEMPLATE_ID?.trim();
}

export function areAllSlotTemplatesReady(): boolean {
  return ALIMTALK_SLOTS.every((slot) => isApprovedTemplateId(getSlotTemplateId(slot)));
}

export function missingSlotNumbers(): AlimtalkSlot[] {
  return ALIMTALK_SLOTS.filter((slot) => !isApprovedTemplateId(getSlotTemplateId(slot)));
}

export function getSlotTemplateStatus(): Record<
  AlimtalkSlot,
  { envKey: string; configured: boolean; approved: boolean }
> {
  return {
    1: slotStatus(1),
    2: slotStatus(2),
    3: slotStatus(3),
  };
}

function slotStatus(slot: AlimtalkSlot) {
  const envKey = `SOLAPI_KAKAO_TEMPLATE_SLOT_${slot}`;
  const id = process.env[envKey]?.trim();
  return {
    envKey,
    configured: Boolean(id),
    approved: isApprovedTemplateId(id),
  };
}

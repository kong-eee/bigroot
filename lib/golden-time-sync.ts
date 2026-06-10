import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildReminderSchedule,
  type GoldenPropertyType,
} from '@/lib/golden-time-schedule';

export type ContractSyncInput = {
  contractEndDate: string;
  propertyType: GoldenPropertyType;
};

export function applyScheduleToReminderPayload(
  payload: Record<string, unknown>,
  contractEndDate: string,
  propertyType: GoldenPropertyType
): { schedule: ReturnType<typeof buildReminderSchedule>; payload: Record<string, unknown> } {
  const schedule = buildReminderSchedule(contractEndDate, propertyType);
  payload.remind_on_1 = null;
  payload.remind_on_2 = null;
  payload.remind_on_3 = null;
  payload.label_1 = null;
  payload.label_2 = null;
  payload.label_3 = null;

  schedule.forEach((s) => {
    payload[`remind_on_${s.slot}`] = s.remindOn;
    payload[`label_${s.slot}`] = s.label;
  });

  return { schedule, payload };
}

/** profiles.contract_end_date · property_type 동기화 */
export async function syncProfileContract(
  supabase: SupabaseClient,
  userId: string,
  input: ContractSyncInput
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    contract_end_date: input.contractEndDate,
    property_type: input.propertyType,
    updated_at: new Date().toISOString(),
  });

  return { error: error?.message ?? null };
}

/** 기존 카카오 예약이 있으면 만기일·유형·알림 일정만 갱신 */
export async function syncReminderContractIfExists(
  supabase: SupabaseClient,
  userId: string,
  input: ContractSyncInput
): Promise<{ updated: boolean; error: string | null }> {
  const { data: existing, error: fetchError } = await supabase
    .from('golden_time_reminders')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) return { updated: false, error: fetchError.message };
  if (!existing) return { updated: false, error: null };

  let payload: Record<string, unknown> = {
    property_type: input.propertyType,
    contract_end_date: input.contractEndDate,
  };

  const { error: scheduleError } = (() => {
    try {
      applyScheduleToReminderPayload(payload, input.contractEndDate, input.propertyType);
      return { error: null as string | null };
    } catch (e) {
      return { error: e instanceof Error ? e.message : '일정 계산 실패' };
    }
  })();

  if (scheduleError) return { updated: false, error: scheduleError };

  const { error: updateError } = await supabase
    .from('golden_time_reminders')
    .update(payload)
    .eq('user_id', userId);

  return { updated: true, error: updateError?.message ?? null };
}

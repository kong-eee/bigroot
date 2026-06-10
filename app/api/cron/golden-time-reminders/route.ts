import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { buildAlimtalkVariables } from '@/lib/solapi/alimtalk-variables';
import { todayKstIso, type GoldenPropertyType } from '@/lib/golden-time-schedule';
import { getTemplateIdForSlot, sendKakaoAlimtalk } from '@/lib/solapi/alimtalk';
import { getAlimtalkReadiness, isAlimtalkSendEnabled } from '@/lib/solapi/readiness';

export const dynamic = 'force-dynamic';

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  if (request.headers.get('authorization') === `Bearer ${secret}`) return true;
  // Vercel 예약 크론 (GET + x-vercel-cron)
  return (
    process.env.VERCEL === '1' &&
    request.headers.get('x-vercel-cron') === '1'
  );
}

function isPropertyType(v: unknown): v is GoldenPropertyType {
  return v === '주택' || v === '상가';
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const readiness = getAlimtalkReadiness();
  const sendEnabled = isAlimtalkSendEnabled();

  const admin = createAdminSupabase();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY 필요' },
      { status: 500 }
    );
  }

  const today = todayKstIso();
  const { data: rows, error } = await admin.from('golden_time_reminders').select('*');

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  let sent = 0;
  let wouldSend = 0;
  const errors: string[] = [];
  const pending: { reminderId: string; slot: number; phone: string }[] = [];

  for (const row of rows ?? []) {
    const propertyType = row.property_type;
    const contractEndDate = row.contract_end_date as string;
    if (!isPropertyType(propertyType) || !contractEndDate) continue;

    for (const slot of [1, 2, 3] as const) {
      const remindOn = row[`remind_on_${slot}`] as string | null;
      const sentAt = row[`sent_at_${slot}`] as string | null;

      if (!remindOn || remindOn !== today || sentAt) continue;

      wouldSend += 1;

      if (!sendEnabled) {
        pending.push({
          reminderId: row.id as string,
          slot,
          phone: (row.phone as string).replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
        });
        continue;
      }

      const variables = buildAlimtalkVariables(
        propertyType,
        contractEndDate,
        slot,
        remindOn
      );
      const templateId = getTemplateIdForSlot(slot);
      const result = await sendKakaoAlimtalk(row.phone as string, variables, templateId);

      if (result.ok) {
        await admin
          .from('golden_time_reminders')
          .update({ [`sent_at_${slot}`]: new Date().toISOString() })
          .eq('id', row.id);
        sent += 1;
      } else {
        errors.push(`${row.id}:${slot}:${result.reason}`);
      }
    }
  }

  return NextResponse.json({
    success: true,
    channel: 'kakao_alimtalk',
    mode: sendEnabled ? 'live' : 'dry_run',
    readiness: readiness.status,
    today,
    sent,
    wouldSend,
    pending: sendEnabled ? undefined : pending,
    errors,
    message: sendEnabled
      ? undefined
      : readiness.message,
  });
}

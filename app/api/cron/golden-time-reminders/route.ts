import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { buildAlimtalkVariables } from '@/lib/solapi/alimtalk-variables';
import type { GoldenPropertyType } from '@/lib/golden-time-schedule';
import { getTemplateIdForSlot, sendKakaoAlimtalk } from '@/lib/solapi/alimtalk';
import { isSolapiKakaoConfigured } from '@/lib/solapi/auth';

export const dynamic = 'force-dynamic';

function todayKstIso(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split('T')[0];
}

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

function isPropertyType(v: unknown): v is GoldenPropertyType {
  return v === '주택' || v === '상가';
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSolapiKakaoConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: 'Solapi 카카오 알림톡 env 미설정. docs/SOLAPI_KAKAO_SETUP.md 참고',
      },
      { status: 503 }
    );
  }

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
  const errors: string[] = [];

  for (const row of rows ?? []) {
    const propertyType = row.property_type;
    const contractEndDate = row.contract_end_date as string;
    if (!isPropertyType(propertyType) || !contractEndDate) continue;

    for (const slot of [1, 2, 3] as const) {
      const remindOn = row[`remind_on_${slot}`] as string | null;
      const sentAt = row[`sent_at_${slot}`] as string | null;

      if (!remindOn || remindOn !== today || sentAt) continue;

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
    today,
    sent,
    errors,
  });
}

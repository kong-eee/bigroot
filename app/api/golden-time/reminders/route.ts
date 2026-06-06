import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import {
  buildReminderSchedule,
  normalizePhoneKr,
  type GoldenPropertyType,
} from '@/lib/golden-time-schedule';
import { getAlimtalkReadiness } from '@/lib/solapi/readiness';

export const dynamic = 'force-dynamic';

function isPropertyType(v: string): v is GoldenPropertyType {
  return v === '주택' || v === '상가';
}

function rowToPayload(row: Record<string, unknown>) {
  const slots = [1, 2, 3]
    .map((n) => {
      const on = row[`remind_on_${n}`] as string | null;
      const label = row[`label_${n}`] as string | null;
      const sent = row[`sent_at_${n}`] as string | null;
      if (!on) return null;
      return { slot: n, remindOn: on, label: label ?? '', sentAt: sent };
    })
    .filter(Boolean);

  return {
    id: row.id,
    propertyType: row.property_type,
    contractEndDate: row.contract_end_date,
    phone: row.phone,
    consentAt: row.consent_at,
    slots,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: true, reminder: null });
    }

    const { data, error } = await supabase
      .from('golden_time_reminders')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      reminder: data ? rowToPayload(data as Record<string, unknown>) : null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '조회 실패';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = (await request.json()) as {
      contractEndDate?: string;
      propertyType?: string;
      phone?: string;
      consent?: boolean;
    };

    const { contractEndDate, propertyType, phone, consent } = body;

    if (!contractEndDate || !propertyType || !isPropertyType(propertyType)) {
      return NextResponse.json(
        { success: false, error: '만기일과 주택/상가 유형이 필요합니다.' },
        { status: 400 }
      );
    }

    if (!consent) {
      return NextResponse.json(
        { success: false, error: '알림 발송 개인정보 동의가 필요합니다.' },
        { status: 400 }
      );
    }

    const normalized = normalizePhoneKr(phone ?? '');
    if (!normalized) {
      return NextResponse.json(
        { success: false, error: '010으로 시작하는 휴대폰 번호 11자리를 입력해 주세요.' },
        { status: 400 }
      );
    }

    const schedule = buildReminderSchedule(contractEndDate, propertyType);
    if (schedule.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '알림을 보낼 날짜가 없습니다. 만기일을 다시 확인해 주세요.',
        },
        { status: 400 }
      );
    }

    const payload: Record<string, unknown> = {
      user_id: user.id,
      property_type: propertyType,
      contract_end_date: contractEndDate,
      phone: normalized,
      consent_at: new Date().toISOString(),
      remind_on_1: null,
      remind_on_2: null,
      remind_on_3: null,
      label_1: null,
      label_2: null,
      label_3: null,
      sent_at_1: null,
      sent_at_2: null,
      sent_at_3: null,
    };

    schedule.forEach((s) => {
      payload[`remind_on_${s.slot}`] = s.remindOn;
      payload[`label_${s.slot}`] = s.label;
    });

    const { data, error } = await supabase
      .from('golden_time_reminders')
      .upsert(payload, { onConflict: 'user_id' })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const readiness = getAlimtalkReadiness();

    return NextResponse.json({
      success: true,
      reminder: rowToPayload(data as Record<string, unknown>),
      schedule,
      alimtalk: {
        sendEnabled: readiness.sendEnabled,
        status: readiness.status,
        message: readiness.message,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '저장 실패';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { error } = await supabase
      .from('golden_time_reminders')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : '삭제 실패';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

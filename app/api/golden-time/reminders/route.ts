import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import {
  buildReminderSchedule,
  normalizePhoneKr,
  type GoldenPropertyType,
} from '@/lib/golden-time-schedule';
import { parseInterestTypes } from '@/lib/profile-interests';
import {
  applyScheduleToReminderPayload,
  syncProfileContract,
  syncReminderContractIfExists,
} from '@/lib/golden-time-sync';
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

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: true, reminders: [], profilePhone: null, contracts: null });
    }

    const { searchParams } = new URL(request.url);
    const filterType = searchParams.get('propertyType');

    let reminderQuery = supabase.from('golden_time_reminders').select('*').eq('user_id', user.id);
    if (filterType && isPropertyType(filterType)) {
      reminderQuery = reminderQuery.eq('property_type', filterType);
    }

    const [{ data: rows, error }, { data: profile }] = await Promise.all([
      reminderQuery,
      supabase
        .from('profiles')
        .select('phone, contract_end_date_housing, contract_end_date_commercial, interest_types')
        .eq('id', user.id)
        .maybeSingle(),
    ]);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const list = (rows ?? []) as Record<string, unknown>[];
    const single = filterType && isPropertyType(filterType) ? list[0] ?? null : null;

    return NextResponse.json({
      success: true,
      reminders: list.map(rowToPayload),
      reminder: single ? rowToPayload(single) : list[0] ? rowToPayload(list[0]) : null,
      profilePhone: profile?.phone ?? null,
      interestTypes: parseInterestTypes(profile?.interest_types),
      contracts: {
        housing: profile?.contract_end_date_housing ?? null,
        commercial: profile?.contract_end_date_commercial ?? null,
      },
      profile:
        profile?.contract_end_date_housing || profile?.contract_end_date_commercial
          ? {
              contractEndDateHousing: profile?.contract_end_date_housing ?? null,
              contractEndDateCommercial: profile?.contract_end_date_commercial ?? null,
            }
          : null,
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
      consent?: boolean;
    };

    const { contractEndDate, propertyType, consent } = body;

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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('phone, phone_consent_at')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ success: false, error: profileError.message }, { status: 500 });
    }

    const normalized = normalizePhoneKr(profile?.phone ?? '');
    if (!normalized || !profile?.phone_consent_at) {
      return NextResponse.json(
        {
          success: false,
          error: '마이페이지에서 본인 휴대폰 번호를 먼저 등록해 주세요.',
          code: 'PHONE_REQUIRED',
        },
        { status: 400 }
      );
    }

    const schedule = buildReminderSchedule(contractEndDate, propertyType);
    if (schedule.length === 0) {
      return NextResponse.json(
        { success: false, error: '알림을 보낼 날짜가 없습니다. 만기일을 다시 확인해 주세요.' },
        { status: 400 }
      );
    }

    let payload: Record<string, unknown> = {
      user_id: user.id,
      property_type: propertyType,
      contract_end_date: contractEndDate,
      phone: normalized,
      consent_at: new Date().toISOString(),
      sent_at_1: null,
      sent_at_2: null,
      sent_at_3: null,
    };

    payload = applyScheduleToReminderPayload(payload, contractEndDate, propertyType).payload;

    const { data, error } = await supabase
      .from('golden_time_reminders')
      .upsert(payload, { onConflict: 'user_id,property_type' })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const profileSync = await syncProfileContract(supabase, user.id, {
      contractEndDate,
      propertyType,
    });
    if (profileSync.error) {
      console.error('profile sync after reminder:', profileSync.error);
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

export async function PATCH(request: Request) {
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
    };

    const { contractEndDate, propertyType } = body;
    if (!contractEndDate || !propertyType || !isPropertyType(propertyType)) {
      return NextResponse.json(
        { success: false, error: '만기일과 주택/상가 유형이 필요합니다.' },
        { status: 400 }
      );
    }

    const profileSync = await syncProfileContract(supabase, user.id, {
      contractEndDate,
      propertyType,
    });
    if (profileSync.error) {
      return NextResponse.json({ success: false, error: profileSync.error }, { status: 500 });
    }

    const reminderSync = await syncReminderContractIfExists(supabase, user.id, {
      contractEndDate,
      propertyType,
    });
    if (reminderSync.error) {
      return NextResponse.json({ success: false, error: reminderSync.error }, { status: 500 });
    }

    const { data: reminder } = await supabase
      .from('golden_time_reminders')
      .select('*')
      .eq('user_id', user.id)
      .eq('property_type', propertyType)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      reminderUpdated: reminderSync.updated,
      reminder: reminder ? rowToPayload(reminder as Record<string, unknown>) : null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '동기화 실패';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyType = searchParams.get('propertyType');

    let query = supabase.from('golden_time_reminders').delete().eq('user_id', user.id);
    if (propertyType && isPropertyType(propertyType)) {
      query = query.eq('property_type', propertyType);
    }

    const { error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : '삭제 실패';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

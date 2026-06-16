import { NextResponse } from 'next/server';

import { createServerSupabase } from '@/lib/supabase-server';

import { createAdminSupabase } from '@/lib/supabase-admin';

import {

  normalizePhoneKr,

  type GoldenPropertyType,

} from '@/lib/golden-time-schedule';

import { parseInterestTypes } from '@/lib/profile-interests';

import { syncAuthUserProfile } from '@/lib/sync-auth-user';



export const dynamic = 'force-dynamic';



function contractColumn(propertyType: GoldenPropertyType): string {

  return propertyType === '주택' ? 'contract_end_date_housing' : 'contract_end_date_commercial';

}



function normalizeInterestInput(raw: unknown): GoldenPropertyType[] | null {

  if (!Array.isArray(raw)) return null;

  const types = raw.filter((v): v is GoldenPropertyType => v === '주택' || v === '상가');

  return [...new Set(types)];

}



export async function GET() {

  try {

    const supabase = await createServerSupabase();

    const {

      data: { user },

    } = await supabase.auth.getUser();



    if (!user) {

      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });

    }



    const { data: profile, error } = await supabase

      .from('profiles')

      .select(

        'nickname, gender, interest_types, phone, phone_consent_at, contract_end_date_housing, contract_end_date_commercial'

      )

      .eq('id', user.id)

      .maybeSingle();



    if (error) {

      return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    }



    const interestTypes = parseInterestTypes(profile?.interest_types);



    return NextResponse.json({

      success: true,

      profile: {

        nickname: profile?.nickname ?? null,

        gender: profile?.gender ?? null,

        interestTypes,

        phone: profile?.phone ?? null,

        phoneConsentAt: profile?.phone_consent_at ?? null,

        contractEndDateHousing: profile?.contract_end_date_housing ?? null,

        contractEndDateCommercial: profile?.contract_end_date_commercial ?? null,

      },

    });

  } catch (e) {

    const message = e instanceof Error ? e.message : '조회 실패';

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

      phone?: string;

      phoneConsent?: boolean;

      nickname?: string;

      gender?: string;

      interestTypes?: string[];

      contractEndDate?: string;

      propertyType?: string;

    };



    const updates: Record<string, unknown> = {

      id: user.id,

      updated_at: new Date().toISOString(),

    };



    if (body.phone !== undefined) {

      if (!body.phoneConsent) {

        return NextResponse.json(

          { success: false, error: '휴대폰 번호 저장·알림 발송 동의가 필요합니다.' },

          { status: 400 }

        );

      }

      const normalized = normalizePhoneKr(body.phone);

      if (!normalized) {

        return NextResponse.json(

          { success: false, error: '010으로 시작하는 휴대폰 번호 11자리를 입력해 주세요.' },

          { status: 400 }

        );

      }

      updates.phone = normalized;

      updates.phone_consent_at = new Date().toISOString();

    }



    if (body.nickname !== undefined) {

      const trimmed = body.nickname.trim();

      if (!trimmed) {

        return NextResponse.json({ success: false, error: '닉네임을 입력해 주세요.' }, { status: 400 });

      }

      updates.nickname = trimmed;

    }



    if (body.gender !== undefined) {

      if (body.gender !== '남성' && body.gender !== '여성') {

        return NextResponse.json({ success: false, error: '성별을 선택해 주세요.' }, { status: 400 });

      }

      updates.gender = body.gender;

    }



    if (body.interestTypes !== undefined) {

      const types = normalizeInterestInput(body.interestTypes);

      if (!types || types.length === 0) {

        return NextResponse.json(

          { success: false, error: '관심 분야(주택·상가)를 하나 이상 선택해 주세요.' },

          { status: 400 }

        );

      }

      updates.interest_types = types;

    }



    if (body.contractEndDate !== undefined && body.propertyType) {

      if (body.propertyType !== '주택' && body.propertyType !== '상가') {

        return NextResponse.json({ success: false, error: '유형은 주택 또는 상가여야 합니다.' }, { status: 400 });

      }

      const col = contractColumn(body.propertyType);

      updates[col] = body.contractEndDate || null;

    }



    const { data, error } = await supabase.from('profiles').upsert(updates).select('*').single();



    if (error) {

      if (error.code === '23505') {

        return NextResponse.json({ success: false, error: '이미 사용 중인 닉네임입니다.' }, { status: 409 });

      }

      return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    }



    const interestTypes = parseInterestTypes(data.interest_types);

    let authSynced = { phone: false, displayName: false, interests: false };



    const admin = createAdminSupabase();

    if (admin) {
      const syncResult = await syncAuthUserProfile(admin.auth.admin, user.id, {
        phone010: typeof updates.phone === 'string' ? updates.phone : data.phone ?? undefined,
        nickname: (data.nickname as string | null) ?? undefined,
        interestTypes,
      });
      authSynced = {
        phone: Boolean(syncResult.phone),
        displayName: Boolean(syncResult.displayName),
        interests: Boolean(syncResult.interests),
      };
    }

    return NextResponse.json({
      success: true,
      profile: {
        nickname: data.nickname ?? null,
        gender: data.gender ?? null,
        interestTypes,
        phone: data.phone ?? null,
        phoneConsentAt: data.phone_consent_at ?? null,
        contractEndDateHousing: data.contract_end_date_housing ?? null,
        contractEndDateCommercial: data.contract_end_date_commercial ?? null,
      },
      authSynced,
      authSyncNote: admin
        ? undefined
        : 'SUPABASE_SERVICE_ROLE_KEY가 없어 Auth Users에 반영되지 않았습니다.',
    });

  } catch (e) {

    const message = e instanceof Error ? e.message : '저장 실패';

    return NextResponse.json({ success: false, error: message }, { status: 500 });

  }

}


import { NextResponse } from 'next/server';
import { buildAlimtalkVariables } from '@/lib/solapi/alimtalk-variables';
import { getTemplateIdForSlot, sendKakaoAlimtalk } from '@/lib/solapi/alimtalk';
import { isSolapiKakaoConfigured } from '@/lib/solapi/auth';
import { normalizePhoneKr, type GoldenPropertyType } from '@/lib/golden-time-schedule';

export const dynamic = 'force-dynamic';

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

function isPropertyType(v: unknown): v is GoldenPropertyType {
  return v === '주택' || v === '상가';
}

/** 관리자 테스트: 카카오 알림톡 1건 발송 */
export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSolapiKakaoConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Solapi 카카오 env 미설정' },
      { status: 503 }
    );
  }

  const body = (await request.json()) as {
    phone?: string;
    slot?: 1 | 2 | 3;
    contractEndDate?: string;
    propertyType?: string;
  };

  const phone = normalizePhoneKr(body.phone ?? '');
  if (!phone) {
    return NextResponse.json({ success: false, error: '유효한 휴대폰 번호 필요' }, { status: 400 });
  }

  const slot = body.slot ?? 1;
  const contractEndDate = body.contractEndDate ?? '2027-12-31';
  const propertyType = body.propertyType;

  if (!isPropertyType(propertyType)) {
    return NextResponse.json({ success: false, error: 'propertyType: 주택|상가' }, { status: 400 });
  }

  const variables = buildAlimtalkVariables(
    propertyType,
    contractEndDate,
    slot,
    new Date().toISOString().split('T')[0]
  );

  const result = await sendKakaoAlimtalk(phone, variables, getTemplateIdForSlot(slot));

  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.reason }, { status: 502 });
  }

  return NextResponse.json({
    success: true,
    channel: 'kakao_alimtalk',
    messageId: result.messageId,
    variables,
  });
}

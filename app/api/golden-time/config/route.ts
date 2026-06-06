import { NextResponse } from 'next/server';
import { KAKAO_TEMPLATE_DRAFT } from '@/lib/solapi/alimtalk-variables';
import { getAlimtalkReadiness } from '@/lib/solapi/readiness';

export const dynamic = 'force-dynamic';

/** 골든타임 알림톡 연동 상태 (공개 — 비밀키 노출 없음) */
export async function GET() {
  const readiness = getAlimtalkReadiness();

  return NextResponse.json({
    success: true,
    ...readiness,
    templateDraft: KAKAO_TEMPLATE_DRAFT,
    cronScheduleKst: '매일 오전 9시 (한국시간)',
    docsPath: '/docs/SOLAPI_KAKAO_SETUP.md',
  });
}

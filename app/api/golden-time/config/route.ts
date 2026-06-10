import { NextResponse } from 'next/server';
import {
  ALIMTALK_VARIABLE_EXAMPLES,
  KAKAO_TEMPLATE_DRAFTS,
} from '@/lib/solapi/alimtalk-variables';
import { getAlimtalkReadiness } from '@/lib/solapi/readiness';

export const dynamic = 'force-dynamic';

/** 골든타임 알림톡 연동 상태 (공개 — 비밀키 노출 없음) */
export async function GET() {
  const readiness = getAlimtalkReadiness();

  return NextResponse.json({
    success: true,
    ...readiness,
    templateDrafts: KAKAO_TEMPLATE_DRAFTS,
    variableExamples: ALIMTALK_VARIABLE_EXAMPLES,
    cronScheduleKst: '매일 오전 9시 (한국시간)',
    docsPath: '/docs/SOLAPI_KAKAO_SETUP.md',
  });
}

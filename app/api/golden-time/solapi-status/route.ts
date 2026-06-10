import { NextResponse } from 'next/server';
import { getSolapiConfig } from '@/lib/solapi/auth';
import {
  ALIMTALK_VARIABLE_EXAMPLES,
  ALIMTALK_VARIABLE_KEYS,
  KAKAO_TEMPLATE_DRAFTS,
} from '@/lib/solapi/alimtalk-variables';
import { getAlimtalkReadiness, getSlotTemplateStatus } from '@/lib/solapi/readiness';

export const dynamic = 'force-dynamic';

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const c = getSolapiConfig();
  const readiness = getAlimtalkReadiness();
  return NextResponse.json({
    success: true,
    ...readiness,
    kakaoReady: readiness.sendEnabled,
    configured: {
      apiKey: Boolean(c.apiKey),
      apiSecret: Boolean(c.apiSecret),
      senderPhone: Boolean(c.from),
      pfId: Boolean(c.pfId),
      sendEnabledFlag: process.env.SOLAPI_KAKAO_SEND_ENABLED?.trim() ?? null,
      templateSlots: getSlotTemplateStatus(),
    },
    templateVariables: ALIMTALK_VARIABLE_KEYS,
    templateDrafts: KAKAO_TEMPLATE_DRAFTS,
    variableExamples: ALIMTALK_VARIABLE_EXAMPLES,
    docs: '/docs/SOLAPI_KAKAO_SETUP.md',
  });
}

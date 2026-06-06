import { NextResponse } from 'next/server';
import { getSolapiConfig } from '@/lib/solapi/auth';
import { ALIMTALK_VARIABLE_KEYS, KAKAO_TEMPLATE_DRAFT } from '@/lib/solapi/alimtalk-variables';
import { getAlimtalkReadiness } from '@/lib/solapi/readiness';

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
      templateId: Boolean(c.templateId),
    },
    templateVariables: ALIMTALK_VARIABLE_KEYS,
    templateDraft: KAKAO_TEMPLATE_DRAFT,
    docs: '/docs/SOLAPI_KAKAO_SETUP.md',
  });
}

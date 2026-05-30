import { buildSolapiAuthorization, getSolapiConfig, isSolapiKakaoConfigured } from './auth';

export type SendResult = { ok: true; messageId?: string } | { ok: false; reason: string };

/** 카카오 알림톡만 발송 (SMS 대체 발송 없음) */
export async function sendKakaoAlimtalk(
  to: string,
  variables: Record<string, string>,
  templateIdOverride?: string
): Promise<SendResult> {
  if (!isSolapiKakaoConfigured()) {
    return { ok: false, reason: 'not_configured' };
  }

  const { from, pfId, templateId } = getSolapiConfig();
  const auth = buildSolapiAuthorization();
  if (!auth || !from || !pfId || !templateId) {
    return { ok: false, reason: 'not_configured' };
  }

  const templateIdToUse = templateIdOverride?.trim() || templateId;

  try {
    const res = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      body: JSON.stringify({
        message: {
          to,
          from,
          kakaoOptions: {
            pfId,
            templateId: templateIdToUse,
            variables,
            disableSms: true,
          },
        },
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg =
        (data as { errorMessage?: string }).errorMessage ||
        (data as { message?: string }).message ||
        JSON.stringify(data);
      return { ok: false, reason: errMsg || `http_${res.status}` };
    }

    const messageId =
      (data as { messageId?: string }).messageId ||
      (data as { groupInfo?: { groupId?: string } }).groupInfo?.groupId;

    return { ok: true, messageId };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : 'network_error' };
  }
}

export function getTemplateIdForSlot(slot: 1 | 2 | 3): string | undefined {
  const key = `SOLAPI_KAKAO_TEMPLATE_SLOT_${slot}` as const;
  const perSlot = process.env[key]?.trim();
  return perSlot || process.env.SOLAPI_KAKAO_TEMPLATE_ID?.trim();
}

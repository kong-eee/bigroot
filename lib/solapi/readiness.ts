import { getSolapiConfig } from './auth';
import {
  areAllSlotTemplatesReady,
  getSlotTemplateStatus,
  missingSlotNumbers,
} from './template-slots';

export type AlimtalkReadiness = {
  credentialsReady: boolean;
  templateReady: boolean;
  sendEnabled: boolean;
  reservationEnabled: boolean;
  status: 'pending_template' | 'ready_to_send' | 'missing_credentials';
  message: string;
};

function isTruthyEnv(name: string): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

export function isAlimtalkSendEnabled(): boolean {
  if (!isTruthyEnv('SOLAPI_KAKAO_SEND_ENABLED')) return false;
  const { apiKey, apiSecret, from, pfId } = getSolapiConfig();
  if (!apiKey || !apiSecret || !from || !pfId) return false;
  return areAllSlotTemplatesReady();
}

export function getAlimtalkReadiness(): AlimtalkReadiness {
  const { apiKey, apiSecret, from, pfId } = getSolapiConfig();
  const credentialsReady = Boolean(apiKey && apiSecret && from && pfId);
  const templateReady = areAllSlotTemplatesReady();
  const sendEnabled = isAlimtalkSendEnabled();
  const reservationEnabled = true;
  const missingSlots = missingSlotNumbers();

  if (sendEnabled) {
    return {
      credentialsReady,
      templateReady: true,
      sendEnabled: true,
      reservationEnabled,
      status: 'ready_to_send',
      message: '카카오 알림톡 자동 발송이 활성화되어 있습니다. (템플릿 3개)',
    };
  }

  if (credentialsReady && !templateReady) {
    const slotHint =
      missingSlots.length > 0
        ? `미설정 슬롯: ${missingSlots.map((s) => `SLOT_${s}`).join(', ')}`
        : '승인된 templateId를 SLOT_1~3에 설정하세요.';
    return {
      credentialsReady: true,
      templateReady: false,
      sendEnabled: false,
      reservationEnabled,
      status: 'pending_template',
      message: `예약은 저장됩니다. 알림톡 템플릿 3개 승인 ID를 Vercel에 등록하고 SOLAPI_KAKAO_SEND_ENABLED=true 후 재배포하세요. ${slotHint}`,
    };
  }

  if (credentialsReady && templateReady && !isTruthyEnv('SOLAPI_KAKAO_SEND_ENABLED')) {
    return {
      credentialsReady: true,
      templateReady: true,
      sendEnabled: false,
      reservationEnabled,
      status: 'pending_template',
      message:
        '템플릿 3개가 설정되어 있습니다. Vercel에 SOLAPI_KAKAO_SEND_ENABLED=true를 추가하고 재배포하세요.',
    };
  }

  return {
    credentialsReady,
    templateReady,
    sendEnabled: false,
    reservationEnabled,
    status: 'missing_credentials',
    message:
      '예약은 가능합니다. Solapi API·발신번호·카카오 pfId·템플릿 SLOT_1~3을 설정하면 자동 발송을 켤 수 있습니다.',
  };
}

export { getSlotTemplateStatus };

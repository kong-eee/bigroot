import { getSolapiConfig } from './auth';

export type AlimtalkReadiness = {
  /** Solapi 키·발신번호·채널 pfId */
  credentialsReady: boolean;
  /** 승인된 templateId 설정됨 */
  templateReady: boolean;
  /** 실제 카카오 발송 허용 (env + template) */
  sendEnabled: boolean;
  /** 예약 저장·크론 스케줄은 항상 가능 */
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
  const { apiKey, apiSecret, from, pfId, templateId } = getSolapiConfig();
  if (!apiKey || !apiSecret || !from || !pfId || !templateId) return false;
  const tid = templateId.toUpperCase();
  if (tid === 'PENDING' || tid === 'TBD' || tid === '심사중') return false;
  return true;
}

export function getAlimtalkReadiness(): AlimtalkReadiness {
  const { apiKey, apiSecret, from, pfId, templateId } = getSolapiConfig();
  const credentialsReady = Boolean(apiKey && apiSecret && from && pfId);
  const templateReady = Boolean(
    templateId && !['PENDING', 'TBD', '심사중'].includes(templateId.toUpperCase())
  );
  const sendEnabled = isAlimtalkSendEnabled();
  const reservationEnabled = true;

  if (sendEnabled) {
    return {
      credentialsReady,
      templateReady,
      sendEnabled: true,
      reservationEnabled,
      status: 'ready_to_send',
      message: '카카오 알림톡 자동 발송이 활성화되어 있습니다.',
    };
  }

  if (credentialsReady && !templateReady) {
    return {
      credentialsReady: true,
      templateReady: false,
      sendEnabled: false,
      reservationEnabled,
      status: 'pending_template',
      message:
        '예약은 지금 저장됩니다. 알림톡 템플릿 심사 통과 후 SOLAPI_KAKAO_TEMPLATE_ID와 SOLAPI_KAKAO_SEND_ENABLED=true를 설정하면 자동 발송됩니다.',
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
        '템플릿 ID는 설정되어 있습니다. 발송 전 Vercel에 SOLAPI_KAKAO_SEND_ENABLED=true를 추가하세요.',
    };
  }

  return {
    credentialsReady,
    templateReady,
    sendEnabled: false,
    reservationEnabled,
    status: 'missing_credentials',
    message:
      '예약은 가능합니다. Solapi·카카오 채널 env 설정 후 템플릿 심사가 끝나면 자동 발송을 켤 수 있습니다.',
  };
}

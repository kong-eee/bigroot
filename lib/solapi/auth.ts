import crypto from 'crypto';
import { areAllSlotTemplatesReady } from './template-slots';

export function getSolapiConfig() {
  const apiKey = process.env.SOLAPI_API_KEY?.trim();
  const apiSecret = process.env.SOLAPI_API_SECRET?.trim();
  const from = process.env.SOLAPI_SENDER_PHONE?.trim();
  const pfId = process.env.SOLAPI_KAKAO_PF_ID?.trim();
  const templateId = process.env.SOLAPI_KAKAO_TEMPLATE_ID?.trim();

  return { apiKey, apiSecret, from, pfId, templateId };
}

export function isSolapiKakaoConfigured(): boolean {
  const c = getSolapiConfig();
  return Boolean(c.apiKey && c.apiSecret && c.from && c.pfId && areAllSlotTemplatesReady());
}

export function buildSolapiAuthorization(): string | null {
  const { apiKey, apiSecret } = getSolapiConfig();
  if (!apiKey || !apiSecret) return null;

  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString('hex');
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(date + salt)
    .digest('hex');

  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

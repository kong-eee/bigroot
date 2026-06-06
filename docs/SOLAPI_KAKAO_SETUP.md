# Solapi + 카카오 알림톡 연동 (빅루트 골든타임)

골든타임 알림은 **SMS가 아닌 카카오 알림톡**으로만 발송됩니다 (`disableSms: true`).

## 1. Solapi 계정

1. [https://solapi.com](https://solapi.com) 가입
2. **API Key** 발급 (콘솔 → API Keys)
3. **발신번호** 등록·승인 (알림톡 API에도 `from` 필수)

## 2. 카카오 비즈니스 채널

1. [카카오 비즈니스](https://business.kakao.com)에서 채널 개설
2. Solapi 콘솔 → **카카오톡** → 채널 연동
3. 연동 후 **pfId** 복사 (예: `PFxxxxxxxx`)

## 3. 알림톡 템플릿 등록·심사

Solapi → 카카오 알림톡 → **템플릿 등록**

아래 문구를 그대로 넣고, 변수명이 **정확히 일치**해야 합니다.

```
[빅루트 골든타임]

#{안내제목}

임대차 유형: #{유형}
계약 만기: #{만기일}
오늘 안내일: #{기한일}
통보 가능 기간: #{통보시작} ~ #{통보마감}

#{안내내용}

자세히 보기
#{링크}
```

- 카테고리: **기타** 또는 **부동산/임대** 관련
- 심사 통과 후 **templateId** 복사 (예: `KA01TPxxxxxxxx`)

코드에 정의된 변수 목록: `lib/solapi/alimtalk-variables.ts` 의 `ALIMTALK_VARIABLE_KEYS`

## 4. Vercel 환경 변수

| 변수 | 설명 |
|------|------|
| `SOLAPI_API_KEY` | Solapi API Key |
| `SOLAPI_API_SECRET` | Solapi API Secret |
| `SOLAPI_SENDER_PHONE` | 등록된 발신번호 (하이픈 없이 `010...`) |
| `SOLAPI_KAKAO_PF_ID` | 카카오 채널 pfId |
| `SOLAPI_KAKAO_TEMPLATE_ID` | 승인된 알림톡 templateId (심사 중이면 `PENDING`) |
| `SOLAPI_KAKAO_SEND_ENABLED` | `true`일 때만 실제 발송 (심사 전에는 `false` 또는 미설정) |
| `CRON_SECRET` | 크론 인증용 임의 문자열 |
| `SUPABASE_SERVICE_ROLE_KEY` | 예약 조회·발송 기록 |
| `NEXT_PUBLIC_SITE_URL` | (선택) 알림톡 링크, 예: `https://bigroot.vercel.app/golden-time` |

슬롯별 다른 템플릿 (선택):

- `SOLAPI_KAKAO_TEMPLATE_SLOT_1`
- `SOLAPI_KAKAO_TEMPLATE_SLOT_2`
- `SOLAPI_KAKAO_TEMPLATE_SLOT_3`

## 5. 로컬 `.env.local` 예시

```env
SOLAPI_API_KEY=your_key
SOLAPI_API_SECRET=your_secret
SOLAPI_SENDER_PHONE=01012345678
SOLAPI_KAKAO_PF_ID=PFxxxxxxxx
SOLAPI_KAKAO_TEMPLATE_ID=PENDING
SOLAPI_KAKAO_SEND_ENABLED=false
CRON_SECRET=long_random_string
```

심사 통과 후:

```env
SOLAPI_KAKAO_TEMPLATE_ID=KA01TPxxxxxxxx
SOLAPI_KAKAO_SEND_ENABLED=true
```

## 심사 대기 중에도 할 일

1. `/golden-time`에서 **알림 예약**은 지금부터 가능 (Supabase 저장)
2. 크론은 **dry_run** 모드 — 오늘 보낼 예정 건수만 집계, 발송은 안 함
3. `GET /api/golden-time/config` — 연동 상태 확인 (비밀키 불필요)
4. 템플릿 승인 후 `SOLAPI_KAKAO_SEND_ENABLED=true` + 재배포

Git에 올리지 마세요.

## 6. Supabase

`supabase/migrations/20260529000000_golden_time_reminders.sql` 실행

## 7. 연동 확인

배포 후 (관리자만):

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://bigroot.vercel.app/api/golden-time/solapi-status
```

테스트 발송 (본인 번호, 개발 시):

```bash
curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"phone":"01012345678","slot":1,"contractEndDate":"2027-12-31","propertyType":"주택"}' \
  https://bigroot.vercel.app/api/golden-time/test-alimtalk
```

## 8. 크론

`vercel.json` — 매일 UTC 0:00 (KST 09:00) `/api/cron/golden-time-reminders` 실행

## 문제 해결

| 증상 | 확인 |
|------|------|
| `not_configured` | 위 env 5개 모두 Vercel Production에 설정 |
| 템플릿 불일치 | 변수명 `#{안내제목}` 등 오타 |
| 발송 실패 | 채널·템플릿 심사 상태, 수신번호가 채널 친구 아님도 알림톡은 가능 |
| 문자로 옴 | `disableSms: true` 적용됨 — Solapi 대시보드 템플릿이 SMS 대체발송 설정인지 확인 |

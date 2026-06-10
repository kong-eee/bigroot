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

## 3. 알림톡 템플릿 등록·심사 (3개 분리)

카카오 검수 기준상 **발송 목적별로 템플릿을 분리** 등록합니다.  
`lib/solapi/alimtalk-variables.ts` 의 `KAKAO_TEMPLATE_DRAFTS` 또는 `/golden-time` 페이지 **「심사용 템플릿 복사」** 버튼을 사용하세요.

### 공통 말머리 (고정)

```
[빅루트 임대차 갱신·통보 기한 알림]
```

※ `안내`, `알림`만 단독 사용하는 말머리는 검수 반려 사유가 될 수 있습니다.

### 템플릿 ① 1회차 · 통보 가능 시작일

```
[빅루트 임대차 갱신·통보 기한 알림]

본 메시지는 빅루트 골든타임 서비스에서 고객님이 계약 만기일·휴대폰 번호를 등록하고 알림 수신에 동의·요청하신 경우에만 발송되는 임대차 계약갱신요구·해지통보 기한 정보 안내입니다. 등록하신 만기 일정 기준 최대 3회까지 발송될 수 있습니다.

■ 갱신·해지 통보 가능 시작일 안내

임대차 유형: #{유형}
계약 만기: #{만기일}
오늘 안내일: #{기한일}
통보 가능 기간: #{통보시작} ~ #{통보마감}

만기 6개월 전부터 임대인에게 재계약 또는 해지 의사를 통보할 수 있는 날입니다. 묵시적 갱신을 피하려면 통보 가능 기간 내 의사 표시를 준비하세요.

자세히 보기
#{링크}
```

### 템플릿 ② 2회차 · 통보 마감 7일 전

```
[빅루트 임대차 갱신·통보 기한 알림]

본 메시지는 빅루트 골든타임 서비스에서 고객님이 계약 만기일·휴대폰 번호를 등록하고 알림 수신에 동의·요청하신 경우에만 발송되는 임대차 계약갱신요구·해지통보 기한 정보 안내입니다. 등록하신 만기 일정 기준 최대 3회까지 발송될 수 있습니다.

■ 갱신·통보 마감 임박 안내 (7일 전)

임대차 유형: #{유형}
계약 만기: #{만기일}
오늘 안내일: #{기한일}
통보 가능 기간: #{통보시작} ~ #{통보마감}

통보 마감일이 7일 남았습니다. 임대인에게 갱신 또는 해지 의사를 전달했는지 확인하고, 미통보 시 묵시적 갱신 여부를 점검하세요.

자세히 보기
#{링크}
```

### 템플릿 ③ 3회차 · 통보 마감일 당일

```
[빅루트 임대차 갱신·통보 기한 알림]

본 메시지는 빅루트 골든타임 서비스에서 고객님이 계약 만기일·휴대폰 번호를 등록하고 알림 수신에 동의·요청하신 경우에만 발송되는 임대차 계약갱신요구·해지통보 기한 정보 안내입니다. 등록하신 만기 일정 기준 최대 3회까지 발송될 수 있습니다.

■ 갱신·통보 마감일 당일 안내

임대차 유형: #{유형}
계약 만기: #{만기일}
오늘 안내일: #{기한일}
통보 가능 기간: #{통보시작} ~ #{통보마감}

오늘이 갱신·해지 의사를 임대인에게 통보해야 하는 마감일입니다. 오늘 밤 12시까지 의사가 도달해야 하며, 기한 경과 시 묵시적 갱신될 수 있습니다.

자세히 보기
#{링크}
```

### 변수 예시 (등록 폼에 함께 기재)

| 변수 | 예시 |
|------|------|
| `#{유형}` | `주택` |
| `#{만기일}` | `2026년 8월 15일` |
| `#{기한일}` | `2026년 2월 15일` |
| `#{통보시작}` | `2026년 2월 15일` |
| `#{통보마감}` | `2026년 6월 15일` |
| `#{링크}` | `bigroot.vercel.app/golden-time` |

- 카테고리: **기타** 또는 **부동산/임대** 관련
- 심사 통과 후 **templateId** 3개 복사 → env 슬롯별 설정

코드 변수 목록: `ALIMTALK_VARIABLE_KEYS`

## 4. Vercel 환경 변수

| 변수 | 설명 |
|------|------|
| `SOLAPI_API_KEY` | Solapi API Key |
| `SOLAPI_API_SECRET` | Solapi API Secret |
| `SOLAPI_SENDER_PHONE` | 등록된 발신번호 (하이픈 없이 `010...`) |
| `SOLAPI_KAKAO_PF_ID` | 카카오 채널 pfId |
| `SOLAPI_KAKAO_TEMPLATE_ID` | (선택) 단일 템플릿 fallback |
| `SOLAPI_KAKAO_SEND_ENABLED` | `true`일 때만 실제 발송 |
| `SOLAPI_KAKAO_TEMPLATE_SLOT_1` | 1회차 승인 templateId |
| `SOLAPI_KAKAO_TEMPLATE_SLOT_2` | 2회차 승인 templateId |
| `SOLAPI_KAKAO_TEMPLATE_SLOT_3` | 3회차 승인 templateId |
| `CRON_SECRET` | 크론 인증용 임의 문자열 |
| `SUPABASE_SERVICE_ROLE_KEY` | 예약 조회·발송 기록 |
| `NEXT_PUBLIC_SITE_URL` | (선택) 알림톡 링크 |

## 5. 로컬 `.env.local` 예시

```env
SOLAPI_API_KEY=your_key
SOLAPI_API_SECRET=your_secret
SOLAPI_SENDER_PHONE=01012345678
SOLAPI_KAKAO_PF_ID=PFxxxxxxxx
SOLAPI_KAKAO_TEMPLATE_SLOT_1=PENDING
SOLAPI_KAKAO_TEMPLATE_SLOT_2=PENDING
SOLAPI_KAKAO_TEMPLATE_SLOT_3=PENDING
SOLAPI_KAKAO_SEND_ENABLED=false
CRON_SECRET=long_random_string
```

심사 통과 후:

```env
SOLAPI_KAKAO_TEMPLATE_SLOT_1=KA01TPxxxxxxxx
SOLAPI_KAKAO_TEMPLATE_SLOT_2=KA01TPyyyyyyyy
SOLAPI_KAKAO_TEMPLATE_SLOT_3=KA01TPzzzzzzzz
SOLAPI_KAKAO_SEND_ENABLED=true
```

## 심사 대기 중에도 할 일

1. `/golden-time`에서 **알림 예약** 가능 (Supabase 저장)
2. 크론 **dry_run** — 발송 건수만 집계
3. `GET /api/golden-time/config` — 연동 상태 확인
4. 3개 템플릿 모두 승인 후 `SOLAPI_KAKAO_SEND_ENABLED=true` + 재배포

Git에 올리지 마세요.

## 6. Supabase

`supabase/migrations/20260529000000_golden_time_reminders.sql` 실행

## 7. 연동 확인

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://bigroot.vercel.app/api/golden-time/solapi-status
```

테스트 발송:

```bash
curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"phone":"01012345678","slot":1,"contractEndDate":"2027-12-31","propertyType":"주택"}' \
  https://bigroot.vercel.app/api/golden-time/test-alimtalk
```

## 8. 크론

`vercel.json` — 매일 UTC 0:00 (KST 09:00) `/api/cron/golden-time-reminders`

## 문제 해결

| 증상 | 확인 |
|------|------|
| `not_configured` | env 키·슬롯 templateId 설정 |
| **예약됐는데 알림 안 옴** | Solapi **IP 화이트리스트** — Vercel IP는 매번 바뀌므로 **제한 해제** 필수 (아래 참고) |
| `허용되지 않은 IP` | Solapi 콘솔 → API Key → IP 제한 **끄기** 또는 전체 허용 |
| 말머리 반려 | `[빅루트 임대차 갱신·통보 기한 알림]` 고정 말머리 사용 |
| 변수 반려 | `#{안내제목}` 등 제거됨 — 위 6개 변수만 사용 |
| 발송 실패 | 슬롯별 templateId·채널 심사 상태 확인 |

### Vercel 배포 후 알림이 안 올 때 (IP 차단)

로컬 테스트는 되는데 **프로덕션 9시 크론만 실패**하면 거의 항상 이 경우입니다.

1. [Solapi 콘솔](https://console.solapi.com) → **API Keys** → 사용 중인 키
2. **IP 화이트리스트 / 허용 IP** → **사용 안 함** 또는 전체 허용
3. 저장 후 누락분 수동 발송:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://bigroot.vercel.app/api/cron/golden-time-reminders
```

`sent: 1` 이고 `errors` 가 비어 있으면 성공. `sent_at_3` 이 Supabase에 채워집니다.

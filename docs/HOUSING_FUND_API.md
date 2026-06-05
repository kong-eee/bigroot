# 기금·대출 금리 (정책 피드 ②)

`/policy-feed` 탭 **② 기금·대출 금리**에서 한국은행 기준금리와 HF(한국주택금융공사) 공공 API 금리를 표시합니다.

## 1. 공공데이터포털 인증키

1. [공공데이터포털](https://www.data.go.kr) 로그인
2. 아래 **서로 다른** API 각각 활용신청 (개발 계정)
3. 마이페이지 → **인증키** 1개 복사 (Decoding 키 권장)

| 구분 | 데이터셋 ID | 링크 |
|------|-------------|------|
| **전세자금대출 금리** | 15082033 | https://www.data.go.kr/data/15082033/openapi.do |
| **적격대출 금리** | 15082047 | https://www.data.go.kr/data/15082047/openapi.do |
| **디딤돌대출 금리** (선택) | **15082028** | https://www.data.go.kr/data/15082028/openapi.do |

⚠️ **15082033(전세)과 15082028(디딤돌)은 다른 API입니다.** 전세 링크만 신청하면 디딤돌은 나오지 않습니다.

지금 **전세 + 적격 2개만 승인**이어도 ② 탭은 동작합니다. 디딤돌 필터는 **15082028**을 추가 신청한 뒤에 채워집니다.

```env
DATA_GO_KR_SERVICE_KEY=발급받은_인증키
```

공동주택가격 API와 **동일 키**를 씁니다.

## 2. 한국은행 기준금리 (선택)

```env
BOK_ECOS_API_KEY=한국은행_ECOS_키
```

## 3. 서버 API

`GET /api/loan-rates`

| HF 경로 | 승인 API |
|---------|----------|
| `/rent-loan-rate-info/rate-list` | 전세 (15082033) |
| `/conforming-loan-rate/conforming-list` | 적격 (15082047) |
| `/didimdol-loan-rate/didimdol-info` | 디딤돌 (15082028, 선택) |

## 4. 로컬 확인

```bash
npm run dev
```

`/policy-feed` → ② 탭 · `curl http://localhost:3000/api/loan-rates`

## 5. 기금e든든 (다음 단계)

[기금e든든 상품기본금리 파일](https://www.data.go.kr/data/15134239/fileData.do) — REST가 아니라 파일 다운로드 + Cron 연동.

## 문제 해결

| 증상 | 확인 |
|------|------|
| 예시 금리만 표시 | `DATA_GO_KR_SERVICE_KEY` · 전세/적격 활용신청 승인 |
| 디딤돌만 비음 | **15082028** 별도 신청 여부 (전세와 다름) |
| 401/403 | 인증키·활용신청 상태 |

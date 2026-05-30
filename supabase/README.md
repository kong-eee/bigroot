# Supabase 마이그레이션 (빅루트)

## Data API GRANT (2026년 변경)

Supabase는 **public** 스키마에 새로 만든 테이블을 Data API(PostgREST, `supabase-js`)에 **자동 노출하지 않습니다**.

| 시점 | 영향 |
|------|------|
| **2026-05-30** | 이후 생성되는 **신규 프로젝트** 기본값 |
| **2026-10-30** | **기존 프로젝트**에도 동일 규칙 적용 |

앱은 클라이언트에서 `supabase.from('...')` 를 쓰므로 **해당됩니다.**

### 지금 할 일

1. Dashboard → **SQL Editor** 에서 `migrations/20260528000000_data_api_explicit_grants.sql` 실행
2. **Security Advisor** 에서 public 테이블 노출 상태 확인
3. 앱에서 커뮤니티·마이페이지·문의·알림 한 번씩 동작 확인

### 새 테이블 추가 시 (필수 패턴)

테이블 생성과 **같은 마이그레이션**에 아래 3단계를 넣으세요.

```sql
-- 1) GRANT (역할별 — RLS와 별개)
grant select on public.your_table to anon;  -- 공개 읽기가 필요할 때만
grant select, insert, update, delete on public.your_table to authenticated;
grant select, insert, update, delete on public.your_table to service_role;

-- 2) RLS
alter table public.your_table enable row level security;

-- 3) 정책
create policy "..." on public.your_table ...;
```

RPC 함수는 `grant execute on function public.fn_name(...) to anon, authenticated;` 를 추가하세요.

### 골든타임 알림 예약 (카카오 알림톡)

1. `migrations/20260529000000_golden_time_reminders.sql` 실행  
2. Solapi·카카오 채널·템플릿 심사 — **`docs/SOLAPI_KAKAO_SETUP.md`**  
3. Vercel env: `SOLAPI_*`, `SOLAPI_KAKAO_PF_ID`, `SOLAPI_KAKAO_TEMPLATE_ID`, `CRON_SECRET`  
4. `/golden-time`에서 예약

### 참고

- [공식 changelog](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically)
- **10월 30일 전**까지 기존 테이블도 명시적 GRANT를 두는 것이 안전합니다 (`20260528000000_...sql`).

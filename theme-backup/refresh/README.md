# 새 UI (refresh) — 보관용

2026년 UI 개편안. **운영 사이트에서는 사용하지 않습니다.**  
최종 UI는 **이전 UI (classic, 파란 톤)** 로 확정되었습니다.

## 보관 파일

| 파일 | 설명 |
|------|------|
| `HomeRefresh.tsx` | 개편 홈 (숲녹 BR 로고 톤) |
| `Navbar.tsx` | 개편 상단 네비 |
| `BrandLogo.tsx` | 개편 로고 컴포넌트 |
| `ThemeSwitcher.tsx` | 새 UI ↔ 이전 UI 전환 버튼 |
| `DepositReturnRefresh.tsx` | 보증금 반환 (개편) |
| `LeaseTimelineRefresh.tsx` | 타임라인 (개편) |
| `MoveInChecklistRefresh.tsx` | 입주 체크 (개편) |

## CSS

`app/globals.css`의 `[data-theme='refresh']` 블록이 개편 색·컴포넌트 토큰입니다.  
나중에 참고할 때 함께 보세요.

## 다시 쓰려면

1. 파일을 `app/` 아래 원래 경로로 복사
2. `lib/ui-theme.ts` 기본값·페이지 분기·ThemeSwitcher 복원
3. `app/layout.tsx`에 `data-theme="refresh"` 및 전환 UI 추가

현재 운영: **classic only** (`HomeClassic`, `NavbarClassic`, `ClassicBrandLogo`).

# 이전 UI 복구 (전체 화면 백업)

`theme-backup/classic/` 폴더에는 **UI 개편 직전의 실제 화면 파일**이 그대로 보관되어 있습니다.

| 파일 | 내용 |
|------|------|
| `Navbar.tsx` | 예전 상단 메뉴 (데스크톱 가로 메뉴) |
| `page.tsx` | 예전 홈 (큰 히어로·3D 카드) |
| `globals.css` | 예전 전역 스타일 |
| `layout.tsx` | 예전 레이아웃 |

## 1) 사이트에서 되돌리기 (권장)

화면 **오른쪽 아래 → 「이전 UI」** 를 누르면:

- **NavbarClassic** + **HomeClassic** (백업 파일 그대로) 로 전환
- 색상만이 아니라 **예전 홈·메뉴 레이아웃 전체**가 복원됩니다.

다시 **「새 UI」** 를 누르면 개편된 화면으로 돌아갑니다.

## 2) 파일로 완전 복구

```powershell
cd c:\Users\ktg80\tenant-guardian
Copy-Item theme-backup\classic\globals.css app\globals.css -Force
Copy-Item theme-backup\classic\Navbar.tsx app\components\Navbar.tsx -Force
Copy-Item theme-backup\classic\page.tsx app\page.tsx -Force
Copy-Item theme-backup\classic\layout.tsx app\layout.tsx -Force
```

이후 Git으로 `NavbarRouter`, `HomeRefresh` 등 신규 파일을 정리하거나, 개편 커밋 이전으로 되돌리세요.

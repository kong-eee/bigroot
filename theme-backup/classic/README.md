# 이전 UI 복구 방법

이 폴더는 **2026-05 UI 개편 전** 스냅샷입니다.

## 1) 사이트에서 되돌리기 (권장)

화면 오른쪽 아래 **「이전 UI」** 버튼을 누르면 클래식 테마로 전환됩니다.  
다시 **「새 UI」** 를 누르면 개편 테마로 돌아갑니다.

## 2) 파일로 완전 복구

```powershell
cd c:\Users\ktg80\tenant-guardian
Copy-Item theme-backup\classic\globals.css app\globals.css -Force
Copy-Item theme-backup\classic\Navbar.tsx app\components\Navbar.tsx -Force
Copy-Item theme-backup\classic\page.tsx app\page.tsx -Force
Copy-Item theme-backup\classic\layout.tsx app\layout.tsx -Force
```

이후 `git checkout -- app/components/ThemeProvider.tsx app/components/ThemeSwitcher.tsx` 등 신규 파일을 제거하거나, Git에서 개편 커밋 이전으로 되돌리세요.

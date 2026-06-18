'use client';

import { useEffect, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { signInWithOAuth } from '@/lib/oauth-login';
import { resetStuckBodyScroll } from '@/lib/reset-stuck-ui';
import { GoogleLoginButton, KakaoLoginButton } from '@/app/components/social-login/SocialLoginButtons';

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  variant?: 'classic' | 'refresh';
};

export default function LoginModal({ open, onClose, variant = 'refresh' }: LoginModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      resetStuckBodyScroll();
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
      resetStuckBodyScroll();
    };
  }, [open]);

  if (!open || !mounted) return null;

  const dismiss = () => onClose();

  const handleLogin = async (provider: 'google' | 'kakao') => {
    flushSync(() => onClose());
    resetStuckBodyScroll();

    try {
      await signInWithOAuth(provider);
    } catch (e) {
      const message = e instanceof Error ? e.message : '로그인에 실패했습니다.';
      alert(
        provider === 'kakao'
          ? `카카오 로그인 실패: ${message}\n\nSupabase 대시보드에서 Kakao 제공자를 켜고 REST API 키를 등록했는지 확인해 주세요.`
          : `Google 로그인 실패: ${message}`
      );
    }
  };

  const isClassic = variant === 'classic';

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      onClick={dismiss}
    >
      <div
        className={`w-full max-w-sm space-y-6 border shadow-2xl ${
          isClassic
            ? 'rounded-[2rem] border-[var(--border)] bg-[var(--bg-surface)] p-8 sm:p-10'
            : 'ui-card p-8'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center space-y-2">
          <div className="text-3xl">{isClassic ? '🌱' : '🔐'}</div>
          <h2
            id="login-modal-title"
            className={`font-black text-[var(--text-primary)] ${
              isClassic ? 'text-2xl tracking-tight' : 'text-xl'
            }`}
          >
            로그인
          </h2>
          <p className="text-sm font-bold text-[var(--text-secondary)]">
            소셜 계정으로 빅루트를 시작하세요.
          </p>
        </div>

        <div className="space-y-3" role="group" aria-label="소셜 로그인">
          <KakaoLoginButton onClick={() => void handleLogin('kakao')} />
          <GoogleLoginButton onClick={() => void handleLogin('google')} />
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="w-full text-center text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        >
          닫기
        </button>
      </div>
    </div>,
    document.body
  );
}

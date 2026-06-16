'use client';

import { useState } from 'react';
import { signInWithOAuth } from '@/lib/oauth-login';

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  variant?: 'classic' | 'refresh';
};

export default function LoginModal({ open, onClose, variant = 'refresh' }: LoginModalProps) {
  const [loading, setLoading] = useState<null | 'google' | 'kakao'>(null);

  if (!open) return null;

  const handleLogin = async (provider: 'google' | 'kakao') => {
    setLoading(provider);
    try {
      await signInWithOAuth(provider);
    } catch (e) {
      const message = e instanceof Error ? e.message : '로그인에 실패했습니다.';
      alert(
        provider === 'kakao'
          ? `카카오 로그인 실패: ${message}\n\nSupabase 대시보드에서 Kakao 제공자를 켜고 REST API 키를 등록했는지 확인해 주세요.`
          : `구글 로그인 실패: ${message}`
      );
      setLoading(null);
    }
  };

  const isClassic = variant === 'classic';

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      onClick={onClose}
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

        <div className="space-y-3">
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void handleLogin('google')}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-[var(--border)] bg-[var(--bg-surface)] px-4 py-4 text-sm font-black text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)] disabled:opacity-50"
          >
            <span className="text-lg" aria-hidden>
              G
            </span>
            {loading === 'google' ? '연결 중…' : 'Google로 로그인'}
          </button>

          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void handleLogin('kakao')}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#FEE500] px-4 py-4 text-sm font-black text-[#191919] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <span className="text-base" aria-hidden>
              💬
            </span>
            {loading === 'kakao' ? '연결 중…' : '카카오로 로그인'}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full text-center text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

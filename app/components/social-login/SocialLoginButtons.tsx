'use client';

import type { ButtonHTMLAttributes } from 'react';
import { GoogleGLogo, KakaoLoginSymbol } from './SocialLoginIcons';

type BaseProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

/**
 * 카카오 로그인 디자인 가이드
 * https://developers.kakao.com/docs/ko/kakaologin/design-guide
 * - 컨테이너 #FEE500, radius 12px, 심볼 #000, 레이블 #000 85%
 * - 완성형 문구: 「카카오 로그인」
 */
export function KakaoLoginButton({ loading, disabled, className = '', ...props }: BaseProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#FEE500] px-4 text-[15px] font-medium text-[rgba(0,0,0,0.85)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      aria-label={loading ? '카카오 로그인 연결 중' : '카카오 로그인'}
      {...props}
    >
      <KakaoLoginSymbol />
      <span>{loading ? '연결 중…' : '카카오 로그인'}</span>
    </button>
  );
}

/**
 * Sign in with Google 브랜딩 가이드
 * https://developers.google.com/identity/branding-guidelines
 * - 흰 배경 + 표준 4색 G 로고, 다른 로그인과 동등한 크기·가시성
 * - 한국어: 「Google 계정으로 로그인」(Sign in with Google 현지화)
 */
export function GoogleLoginButton({ loading, disabled, className = '', ...props }: BaseProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`flex h-12 w-full items-center justify-center gap-3 rounded border border-[#747775] bg-white px-4 text-[15px] font-medium text-[#1f1f1f] shadow-sm transition-colors hover:bg-[#f8f9fa] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      aria-label={loading ? 'Google 계정으로 로그인 연결 중' : 'Google 계정으로 로그인'}
      {...props}
    >
      <GoogleGLogo />
      <span>{loading ? '연결 중…' : 'Google 계정으로 로그인'}</span>
    </button>
  );
}

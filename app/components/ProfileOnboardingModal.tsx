'use client';

import type { GoldenPropertyType } from '@/lib/golden-time-schedule';
import { INTEREST_OPTIONS } from '@/lib/profile-interests';

type Props = {
  open: boolean;
  variant?: 'refresh' | 'classic';
  nickname: string;
  gender: '남성' | '여성' | null;
  interestTypes: GoldenPropertyType[];
  onNicknameChange: (value: string) => void;
  onGenderChange: (value: '남성' | '여성') => void;
  onInterestToggle: (type: GoldenPropertyType) => void;
  onSave: () => void;
  onSkip: () => void;
};

export default function ProfileOnboardingModal({
  open,
  variant = 'refresh',
  nickname,
  gender,
  interestTypes,
  onNicknameChange,
  onGenderChange,
  onInterestToggle,
  onSave,
  onSkip,
}: Props) {
  if (!open) return null;

  const isClassic = variant === 'classic';

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className={
          isClassic
            ? 'bg-[var(--bg-surface)] w-full max-w-md rounded-[2.5rem] p-8 sm:p-10 shadow-2xl space-y-6 border border-[var(--border)]'
            : 'ui-card w-full max-w-md p-8 sm:p-10 space-y-6'
        }
      >
        <div className="text-center space-y-2">
          <div className="text-4xl">🌱</div>
          <h2 className={`font-black ${isClassic ? 'text-3xl' : 'text-2xl'} text-[var(--text-primary)]`}>
            반가워요!
          </h2>
          <p className="text-sm font-medium text-[var(--text-secondary)] leading-relaxed">
            닉네임·성별·관심 분야를 설정하면 맞춤 안내를 받을 수 있어요.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-black text-[var(--text-muted)] mb-2">닉네임</label>
            <input
              type="text"
              placeholder="사용할 닉네임"
              value={nickname}
              onChange={(e) => onNicknameChange(e.target.value)}
              className={
                isClassic
                  ? 'w-full px-6 py-4 bg-[var(--bg-muted)] rounded-2xl border border-[var(--border)] outline-none font-black placeholder:text-[var(--text-muted)] text-base focus:bg-[var(--bg-surface)] focus:border-[var(--brand)] transition-all'
                  : 'ui-input font-bold'
              }
            />
          </div>

          <div>
            <label className="block text-xs font-black text-[var(--text-muted)] mb-2">성별</label>
            <div className="grid grid-cols-2 gap-3">
              {(['남성', '여성'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => onGenderChange(g)}
                  className={`py-3 rounded-xl font-bold border transition-all ${
                    gender === g
                      ? isClassic
                        ? 'bg-[var(--text-primary)] border-[var(--text-primary)] text-white shadow-md'
                        : 'bg-[var(--brand)] border-[var(--brand)] text-[var(--brand-on,#fff)]'
                      : isClassic
                        ? 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)]'
                        : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-secondary)]'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-[var(--text-muted)] mb-1">
              관심 분야 (복수 선택 가능)
            </label>
            <p className="text-[11px] font-medium text-[var(--text-muted)] mb-2">
              선택한 분야만 마이페이지·골든타임에서 안내해 드려요.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {INTEREST_OPTIONS.map((type) => {
                const selected = interestTypes.includes(type);
                const icon = type === '주택' ? '🏠' : '🛍️';
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onInterestToggle(type)}
                    className={`py-4 rounded-2xl font-black text-sm border transition-all flex flex-col items-center gap-1 ${
                      selected
                        ? type === '주택'
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                          : 'bg-orange-500 border-orange-500 text-white shadow-md'
                        : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <span className="text-xl">{icon}</span>
                    {type} 임대차
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onSave}
          className={isClassic ? 'w-full py-5 bg-[var(--brand)] text-[var(--brand-on,#fff)] rounded-2xl font-black text-lg hover:bg-[var(--brand-hover)]' : 'ui-btn-primary w-full text-base'}
        >
          설정 완료
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="w-full text-sm font-bold text-[var(--text-muted)]"
        >
          나중에 할게요
        </button>
      </div>
    </div>
  );
}

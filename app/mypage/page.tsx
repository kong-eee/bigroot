'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import MypageContractBlock from '@/app/components/MypageContractBlock';
import {
  formatInterestsLabel,
  parseInterestTypes,
  toggleInterest,
} from '@/lib/profile-interests';
import type { GoldenPropertyType } from '@/lib/golden-time-schedule';

export default function MyPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [phoneInput, setPhoneInput] = useState('');
  const [phoneConsent, setPhoneConsent] = useState(false);
  const [phoneSaving, setPhoneSaving] = useState(false);

  const [housingDate, setHousingDate] = useState('');
  const [commercialDate, setCommercialDate] = useState('');
  const [interestTypes, setInterestTypes] = useState<GoldenPropertyType[]>([]);
  const [interestDraft, setInterestDraft] = useState<GoldenPropertyType[]>([]);
  const [interestSaving, setInterestSaving] = useState(false);

  const fetchMyData = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    setUser(authUser);

    if (authUser) {
      const [{ data: pf }, { data: posts }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', authUser.id).single(),
        supabase
          .from('posts')
          .select('*')
          .eq('author_id', authUser.id)
          .order('created_at', { ascending: false }),
      ]);

      setProfile(pf);
      setMyPosts(posts || []);

      const profileRes = await fetch('/api/profile', { cache: 'no-store' });
      const profileApi = await profileRes.json();
      if (profileApi.success && profileApi.profile) {
        setPhoneInput(profileApi.profile.phone ?? '');
        setHousingDate(profileApi.profile.contractEndDateHousing ?? '');
        setCommercialDate(profileApi.profile.contractEndDateCommercial ?? '');
        const interests = parseInterestTypes(profileApi.profile.interestTypes);
        setInterestTypes(interests);
        setInterestDraft(interests);
      } else if (pf) {
        if (pf.phone) setPhoneInput(pf.phone);
        if (pf.contract_end_date_housing) setHousingDate(pf.contract_end_date_housing);
        else if (pf.property_type === '주택' && pf.contract_end_date)
          setHousingDate(pf.contract_end_date);
        if (pf.contract_end_date_commercial) setCommercialDate(pf.contract_end_date_commercial);
        else if (pf.property_type === '상가' && pf.contract_end_date)
          setCommercialDate(pf.contract_end_date);
        const interests = parseInterestTypes(pf.interest_types);
        setInterestTypes(interests);
        setInterestDraft(interests);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchMyData();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#notification-phone') {
      document.getElementById('notification-phone')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [loading]);

  const saveInterests = async () => {
    if (interestDraft.length === 0) {
      return alert('관심 분야(주택·상가)를 하나 이상 선택해 주세요.');
    }
    setInterestSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interestTypes: interestDraft }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || '저장에 실패했습니다.');
        return;
      }
      const interests = parseInterestTypes(data.profile?.interestTypes);
      setInterestTypes(interests);
      setInterestDraft(interests);
      alert('관심 분야가 저장되었습니다.');
    } catch {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setInterestSaving(false);
    }
  };

  const savePhone = async () => {
    if (!phoneInput.trim()) return alert('휴대폰 번호를 입력해 주세요.');
    if (!phoneConsent) return alert('휴대폰 번호 저장·알림 발송 동의가 필요합니다.');
    setPhoneSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput, phoneConsent: true }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || '저장에 실패했습니다.');
        return;
      }
      setPhoneInput(data.profile.phone ?? phoneInput);
      alert('본인 휴대폰 번호가 저장되었습니다. 골든타임 알림에 사용됩니다.');
      await fetchMyData();
    } catch {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setPhoneSaving(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      await supabase.from('posts').delete().eq('id', postId);
      setMyPosts(myPosts.filter((post) => post.id !== postId));
    }
  };

  if (loading)
    return (
      <div className="page-main flex items-center justify-center">
        <div className="text-lg font-black text-[var(--text-muted)] animate-pulse">불러오는 중...</div>
      </div>
    );
  if (!user)
    return (
      <div className="page-main flex flex-col items-center justify-center p-6 text-center space-y-4">
        <span className="text-5xl">🔒</span>
        <h2 className="text-2xl font-black">로그인이 필요합니다.</h2>
        <Link href="/" className="ui-btn-primary text-sm">
          홈으로
        </Link>
      </div>
    );

  return (
    <div className="page-main">
      <div className="page-container page-container-wide py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="ui-card p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-[var(--brand-soft)] text-[var(--brand)] text-3xl font-black rounded-full flex items-center justify-center mx-auto">
              {profile?.gender === '여성' ? '👩‍💼' : '👨‍💼'}
            </div>
            <div>
              <h3 className="text-2xl font-black">{profile?.nickname || '닉네임 미설정'}</h3>
              <p className="text-xs font-bold text-slate-400 mt-1">{user?.email}</p>
              {interestTypes.length > 0 && (
                <p className="text-[11px] font-bold text-[var(--brand)] mt-2">
                  관심 분야: {formatInterestsLabel(interestTypes)}
                </p>
              )}
            </div>
            <div className="inline-block px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-[11px] font-black text-slate-500">
              성별: {profile?.gender || '미설정'}
            </div>
          </div>

          <div className="ui-card p-6 space-y-4">
            <div>
              <h4 className="text-base font-black text-slate-900">📌 관심 분야</h4>
              <p className="text-[11px] font-medium text-slate-500 mt-1 leading-relaxed">
                선택한 분야만 아래 임대차 만기일·골든타임 안내가 표시됩니다.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['주택', '상가'] as const).map((type) => {
                const selected = interestDraft.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setInterestDraft((prev) => toggleInterest(prev, type))}
                    className={`py-3 rounded-xl text-xs font-black border transition-all ${
                      selected
                        ? type === '주택'
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-orange-500 border-orange-500 text-white'
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    {type === '주택' ? '🏠' : '🛍️'} {type}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              disabled={interestSaving}
              onClick={() => void saveInterests()}
              className="w-full py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl disabled:opacity-50"
            >
              {interestSaving ? '저장 중…' : '관심 분야 저장'}
            </button>
          </div>

          <div
            id="notification-phone"
            className="ui-card p-6 space-y-4 scroll-mt-24"
          >
            <div>
              <h4 className="text-base font-black text-slate-900">📱 알림 수신 휴대폰</h4>
              <p className="text-[11px] font-medium text-slate-500 mt-1 leading-relaxed">
                골든타임 카카오 알림톡을 받을 본인 번호입니다. 주택·상가 알림에 공통으로 사용됩니다.
              </p>
            </div>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="01012345678"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 font-bold text-sm"
            />
            <label className="flex items-start gap-2 cursor-pointer text-[11px] font-medium text-slate-600 leading-relaxed">
              <input
                type="checkbox"
                checked={phoneConsent}
                onChange={(e) => setPhoneConsent(e.target.checked)}
                className="mt-0.5"
              />
              휴대폰 번호 수집·보관 및 골든타임 카카오 알림톡 발송에 동의합니다.
            </label>
            <button
              type="button"
              disabled={phoneSaving}
              onClick={() => void savePhone()}
              className="w-full py-3 bg-[var(--brand)] text-white text-sm font-black rounded-xl disabled:opacity-50"
            >
              {phoneSaving ? '저장 중…' : profile?.phone ? '번호 수정 저장' : '본인 번호 등록'}
            </button>
            {profile?.phone && (
              <p className="text-[10px] font-bold text-emerald-700 text-center">
                등록됨: {profile.phone}
              </p>
            )}
          </div>

          {interestTypes.includes('주택') ? (
            <MypageContractBlock
              propertyType="주택"
              contractEndDate={housingDate}
              userId={user.id}
              onSaved={fetchMyData}
            />
          ) : (
            <div className="ui-card p-5 text-center text-xs font-bold text-slate-400">
              주택 임대차 관심 분야를 선택하면 만기일·알림 설정이 표시됩니다.
            </div>
          )}

          {interestTypes.includes('상가') ? (
            <MypageContractBlock
              propertyType="상가"
              contractEndDate={commercialDate}
              userId={user.id}
              onSaved={fetchMyData}
            />
          ) : (
            <div className="ui-card p-5 text-center text-xs font-bold text-slate-400">
              상가 임대차 관심 분야를 선택하면 만기일·알림 설정이 표시됩니다.
            </div>
          )}

          <Link
            href="/lease-timeline"
            className="block text-center w-full py-3 ui-card text-xs font-black text-[var(--brand)] hover:border-[var(--brand)]"
          >
            전체 타임라인 보기 📅
          </Link>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/lease-timeline" className="ui-card p-5 hover:border-[var(--brand)] transition-colors group">
              <span className="text-2xl">📅</span>
              <h4 className="font-black text-sm mt-2 group-hover:text-[var(--brand)]">개인 타임라인</h4>
              <p className="text-[11px] font-medium text-[var(--text-secondary)] mt-1">입주·만기·갱신 일정</p>
            </Link>
            <Link href="/move-in-checklist" className="ui-card p-5 hover:border-[var(--brand)] transition-colors group">
              <span className="text-2xl">✅</span>
              <h4 className="font-black text-sm mt-2 group-hover:text-[var(--brand)]">입주 체크</h4>
              <p className="text-[11px] font-medium text-[var(--text-secondary)] mt-1">입주 후 필수 항목</p>
            </Link>
            <Link href="/deposit-return" className="ui-card p-5 hover:border-[var(--brand)] transition-colors group">
              <span className="text-2xl">💸</span>
              <h4 className="font-black text-sm mt-2 group-hover:text-[var(--brand)]">보증금 반환</h4>
              <p className="text-[11px] font-medium text-[var(--text-secondary)] mt-1">분쟁 대응 가이드</p>
            </Link>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-50">
              <h3 className="text-lg font-black">
                내가 쓴 이야기 <span className="text-[#007AFF]">{myPosts.length}</span>
              </h3>
              <span className="text-xs text-slate-400 font-bold">커뮤니티 활동 내역</span>
            </div>

            {myPosts.length === 0 ? (
              <div className="text-center py-24 text-slate-300 font-bold space-y-3">
                <span className="text-4xl block">📝</span>
                <p className="text-sm">아직 커뮤니티에 작성한 게시글이 없습니다.</p>
                <Link href="/community" className="inline-block text-xs text-[#007AFF] font-black underline">
                  첫 글 쓰러 가기
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-5 bg-slate-50 rounded-2xl border border-transparent hover:border-blue-100 transition-all flex flex-col justify-between md:flex-row md:items-center gap-4 group"
                  >
                    <div className="space-y-1 flex-1">
                      <span className="text-[10px] font-bold text-slate-400">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                      <h4 className="font-black text-slate-900 text-base line-clamp-1 group-hover:text-[var(--brand)] transition-colors">
                        {post.title}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium line-clamp-1">{post.content}</p>
                    </div>
                    <div className="flex items-center gap-3 justify-end">
                      <Link
                        href="/community"
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-500 text-[11px] font-black text-slate-600 rounded-lg transition-all"
                      >
                        보기
                      </Link>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 text-[11px] font-black rounded-lg"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

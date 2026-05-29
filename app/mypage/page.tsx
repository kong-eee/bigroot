'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function MyPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 📅 계약 설정 상태 관리 (주택/상가 타입 추가)
  const [propertyType, setPropertyType] = useState<'주택' | '상가'>('주택');
  const [propertyTypeInput, setPropertyTypeInput] = useState<'주택' | '상가'>('주택');
  const [contractEndDate, setContractEndDate] = useState<string>(''); 
  const [dateInput, setDateInput] = useState<string>(''); 
  const [isEditingDate, setIsEditingDate] = useState(false); 

  // 💡 실질적 도움을 주기 위한 계산된 날짜 상태들
  const [windowStart, setWindowStart] = useState<string>('');
  const [windowEnd, setWindowEnd] = useState<string>('');
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [statusColor, setStatusColor] = useState<string>('');
  const [tipMessage, setTipMessage] = useState<string>('');

  const fetchMyData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      const { data: pf } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(pf);

      if (pf?.contract_end_date) {
        const endDateStr = pf.contract_end_date;
        const typeStr = (pf.property_type as '주택' | '상가') || '주택';
        
        setContractEndDate(endDateStr);
        setDateInput(endDateStr);
        setPropertyType(typeStr);
        setPropertyTypeInput(typeStr);
        
        // ⚙️ 주택/상가 법적 기준에 따른 골든타임 기간 계산
        const end = new Date(endDateStr);
        const startPeriod = new Date(end);
        startPeriod.setMonth(startPeriod.getMonth() - 6); // 둘 다 시작은 6달 전
        
        const endPeriod = new Date(end);
        // ⭐ 주택은 2달 전, 상가는 1달 전이 법적 마감일!
        if (typeStr === '상가') {
          endPeriod.setMonth(endPeriod.getMonth() - 1);
        } else {
          endPeriod.setMonth(endPeriod.getMonth() - 2);
        }

        setWindowStart(startPeriod.toISOString().split('T')[0]);
        setWindowEnd(endPeriod.toISOString().split('T')[0]);

        const today = new Date();
        today.setHours(0,0,0,0);
        startPeriod.setHours(0,0,0,0);
        endPeriod.setHours(0,0,0,0);
        end.setHours(0,0,0,0);

        // 💡 주택 vs 상가 3가지 상황별 완전히 다른 맞춤형 가이드 세팅
        if (today < startPeriod) {
          const diff = Math.ceil((startPeriod.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          setCurrentStatus(`☕ 아직은 조용히 계셔도 돼요 (타이밍까지 ${diff}일)`);
          setStatusColor('text-slate-400 bg-white/5 border-white/10');
          setTipMessage(
            typeStr === '상가'
              ? '💡 아직 건물주에게 이야기할 때가 아닙니다. 장사를 더 이어갈지(갱신), 권리금을 받고 나갈지 내 마음속 방향을 편하게 계산해보는 시간으로 삼으세요!'
              : '💡 아직 집주인에게 먼저 이야기할 때가 아니에요. 이사를 갈지, 재계약을 할지 내 마음속 방향을 편하게 고민해보는 시간으로 삼으세요!'
          );
        } else if (today >= startPeriod && today <= endPeriod) {
          setCurrentStatus(typeStr === '상가' ? '📢 지금이에요! 건물주에게 재계약/해지 통보하기' : '📢 지금이에요! 집주인에게 이사/갱신 통보하기');
          setStatusColor('text-blue-400 bg-blue-500/10 border-blue-500/20');
          setTipMessage(
            typeStr === '상가'
              ? '💡 상가 사장님 주목! 더 장사하고 싶다면 법적으로 총 10년간 보장받는 "계약갱신요구권"을 쓰겠다고 당당히 요구하시고, 나갈 예정이라면 지금 확실히 말해야 권리금 회수 기회(만기 6달 전부터 종료 시까지)를 완벽하게 보호받습니다.'
              : '💡 진짜 중요한 타이밍이에요! 더 살고 싶다면 "계약갱신요구권"을 쓰겠다고 말씀하시고, 나갈 예정이라면 지금 확실히 종료 의사를 전달해야 보증금을 제때 돌려받습니다. (반드시 문자나 카톡 등 증거를 남겨두세요)'
          );
        } else if (today > endPeriod && today <= end) {
          setCurrentStatus('⚠️ 아차! 통보 기한이 지나 자동 연장 중이에요');
          setStatusColor('text-amber-500 bg-amber-500/10 border-amber-500/20');
          setTipMessage(
            typeStr === '상가'
              ? '💡 기한 내에 서로 말이 없어 상가 건물 계약이 자동 연장(묵시적 갱신)되었습니다. 법적으로 임대차 기간은 [1년]으로 보장되며, 사장님이 장사하다가 나가고 싶을 때 언제든 해지 통보를 하면 딱 3개월 뒤에 건물주는 보증금을 돌려줘야 합니다!'
              : '💡 기한 내에 서로 아무 말도 없어 계약이 기존 조건 그대로 자동 연장(묵시적 갱신)되었습니다. 만약 지금이라도 나가길 희망하신다면, 집주인에게 이사 통보를 한 날로부터 딱 3개월 뒤에 법적으로 당당하게 보증금을 돌려받고 나가실 수 있습니다!'
          );
        } else {
          setCurrentStatus('계약 기간이 만료되었습니다.');
          setStatusColor('text-slate-500 bg-white/5 border-white/10');
          setTipMessage('💡 현재 지정하신 계약 만기일이 지났습니다. 새로운 시작을 빅루트가 응원합니다!');
        }
      } else {
        setContractEndDate('');
      }

      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });
      setMyPosts(posts || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMyData();
  }, []);

  const saveContractDate = async () => {
    if (!dateInput) return alert("날짜를 선택해주세요!");
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      contract_end_date: dateInput,
      property_type: propertyTypeInput, // 💾 주택/상가 타입도 함께 저장
      updated_at: new Date().toISOString(),
    });
    if (!error) { setIsEditingDate(false); await fetchMyData(); alert("만기일 및 계약 유형이 저장되었습니다! 💾"); }
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
      await supabase.from('posts').delete().eq('id', postId);
      setMyPosts(myPosts.filter(post => post.id !== postId));
    }
  };

  if (loading) return <div className="page-main flex items-center justify-center"><div className="text-lg font-black text-[var(--text-muted)] animate-pulse">불러오는 중...</div></div>;
  if (!user) return <div className="page-main flex flex-col items-center justify-center p-6 text-center space-y-4"><span className="text-5xl">🔒</span><h2 className="text-2xl font-black">로그인이 필요합니다.</h2><Link href="/" className="ui-btn-primary text-sm">홈으로</Link></div>;

  return (
    <div className="page-main">
      <div className="page-container page-container-wide py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 프로필 카드 */}
        <div className="lg:col-span-1 space-y-6">
          <div className="ui-card p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-[var(--brand-soft)] text-[var(--brand)] text-3xl font-black rounded-full flex items-center justify-center mx-auto">
              {profile?.gender === '여성' ? '👩‍💼' : '👨‍💼'}
            </div>
            <div>
              <h3 className="text-2xl font-black">{profile?.nickname || '닉네임 미설정'}</h3>
              <p className="text-xs font-bold text-slate-400 mt-1">{user?.email}</p>
            </div>
            <div className="inline-block px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-[11px] font-black text-slate-500">
              성별: {profile?.gender || '미설정'}
            </div>
          </div>

          {/* ⏳ 내 계약 골든타임 섹션 */}
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl translate-x-10 -translate-y-10" />
            
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-black text-blue-400 tracking-wider uppercase">Contract Timing</span>
                <h4 className="text-lg font-black mt-1">내 계약 골든타임</h4> 
              </div>
              {/* 주택/상가 뱃지 노출 */}
              {contractEndDate && !isEditingDate && (
                <span className="px-3 py-1 bg-blue-600 text-white font-black text-[10px] rounded-full shadow-sm">
                  {propertyType} 임대차
                </span>
              )}
            </div>

            {contractEndDate && !isEditingDate ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className={`p-4 rounded-2xl text-center border font-black text-xs ${statusColor}`}>
                  {currentStatus}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400">
                      {propertyType === '상가' ? '건물주에게 통보해야 하는 기간 (만기 6~1달 전)' : '집주인에게 통보해야 하는 기간 (만기 6~2달 전)'}
                    </p>
                    <p className="text-md font-black text-blue-400 mt-1">{windowStart} ~ {windowEnd}</p>
                  </div>
                  <div className="border-t border-white/5 pt-3">
                    <p className="text-[11px] font-bold text-slate-400">확정 만기일</p>
                    <p className="text-sm font-bold text-white mt-0.5">{contractEndDate}</p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 font-medium leading-relaxed bg-white/5 p-4 rounded-xl">
                  {tipMessage}
                </p>

                <Link href="/lease-timeline" className="block text-center w-full py-3 bg-blue-600 hover:bg-blue-500 text-xs font-black rounded-xl transition-all">
                  전체 타임라인 보기 📅
                </Link>
                <button onClick={() => setIsEditingDate(true)} className="block text-center w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-black rounded-xl transition-all">
                  설정 변경하기 ⚙️
                </button>
              </div>
            ) : (
              /* ✍️ 입력 및 수정 모드 UI (주택/상가 토글 스위치 추가) */
              <div className="space-y-5 bg-white/5 p-5 rounded-3xl border border-white/10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">1. 임대차 종류 선택</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setPropertyTypeInput('주택')} 
                      className={`py-2.5 rounded-xl font-black text-xs border transition-all ${propertyTypeInput === '주택' ? 'bg-white text-slate-900 border-white' : 'bg-transparent text-slate-400 border-white/10 hover:border-white/30'}`}
                    >🏠 주택(전월세)</button>
                    <button 
                      onClick={() => setPropertyTypeInput('상가')} 
                      className={`py-2.5 rounded-xl font-black text-xs border transition-all ${propertyTypeInput === '상가' ? 'bg-white text-slate-900 border-white' : 'bg-transparent text-slate-400 border-white/10 hover:border-white/30'}`}
                    >🛍️ 상가(매장/사무실)</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">2. 계약 만기일 선택</label>
                  <input type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} className="w-full p-3 bg-slate-800 text-white rounded-xl border border-slate-700 outline-none text-sm font-bold" />
                </div>

                <div className="flex gap-2 pt-1">
                  <button onClick={saveContractDate} className="flex-1 py-3 bg-[#007AFF] text-white font-black text-xs rounded-xl hover:bg-blue-600">설정 저장</button>
                  {contractEndDate && <button onClick={() => { setIsEditingDate(false); setDateInput(contractEndDate); setPropertyTypeInput(propertyType); }} className="px-4 py-3 bg-slate-700 text-slate-300 font-bold text-xs rounded-xl">취소</button>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 내가 쓴 글 목록 */}
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
              <h3 className="text-lg font-black">내가 쓴 이야기 <span className="text-[#007AFF]">{myPosts.length}</span></h3>
              <span className="text-xs text-slate-400 font-bold">커뮤니티 활동 내역</span>
            </div>

            {myPosts.length === 0 ? (
              <div className="text-center py-24 text-slate-300 font-bold space-y-3">
                <span className="text-4xl block">📝</span>
                <p className="text-sm">아직 커뮤니티에 작성한 게시글이 없습니다.</p>
                <Link href="/community" className="inline-block text-xs text-[#007AFF] font-black underline">첫 글 쓰러 가기</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myPosts.map((post) => (
                  <div key={post.id} className="p-5 bg-slate-50 rounded-2xl border border-transparent hover:border-blue-100 transition-all flex flex-col justify-between md:flex-row md:items-center gap-4 group">
                    <div className="space-y-1 flex-1">
                      <span className="text-[10px] font-bold text-slate-400">{new Date(post.created_at).toLocaleDateString()}</span>
                      <h4 className="font-black text-slate-900 text-base line-clamp-1 group-hover:text-[#007AFF] transition-colors">{post.title}</h4>
                      <p className="text-xs text-slate-500 font-medium line-clamp-1">{post.content}</p>
                    </div>
                    <div className="flex items-center gap-3 justify-end">
                      <Link href="/community" className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-500 text-[11px] font-black text-slate-600 rounded-lg transition-all">보기</Link>
                      <button onClick={() => handleDeletePost(post.id)} className="px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 text-[11px] font-black rounded-lg">삭제</button>
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
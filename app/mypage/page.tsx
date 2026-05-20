'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function MyPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 📅 계약 만기일 상태 관리
  const [contractEndDate, setContractEndDate] = useState<string>(''); 
  const [dateInput, setDateInput] = useState<string>(''); // 입력 창용
  const [isEditingDate, setIsEditingDate] = useState(false); // 수정 모드 토글
  const [dDay, setDDay] = useState<number | null>(null);

  // 데이터 로드 함수
  const fetchMyData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      // 1. 프로필 정보(닉네임, 성별, 만기일) 조회
      const { data: pf } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(pf);

      if (pf?.contract_end_date) {
        setContractEndDate(pf.contract_end_date);
        setDateInput(pf.contract_end_date);
        
        // ⏱️ 디데이 계산
        const targetDate = new Date(pf.contract_end_date);
        const today = new Date();
        // 시간 차이를 구하기 위해 날짜 정규화 (시/분/초 제거)
        targetDate.setHours(0,0,0,0);
        today.setHours(0,0,0,0);
        
        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDDay(diffDays);
      } else {
        setContractEndDate('');
        setDDay(null);
      }

      // 2. 내가 쓴 게시글 목록 조회
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

  // 💾 만기일 저장/수정 함수
  const saveContractDate = async () => {
    if (!dateInput) return alert("날짜를 선택해주세요!");

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        contract_end_date: dateInput,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      alert(`저장 중 오류가 발생했습니다: ${error.message}`);
    } else {
      setIsEditingDate(false);
      await fetchMyData(); // 데이터 새로고침
      alert("계약 만기일이 안전하게 저장되었습니다! 💾");
    }
  };

  // 🗑️ 내가 쓴 글 마이페이지에서 바로 삭제하기
  const handleDeletePost = async (postId: string) => {
    if (confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (!error) {
        setMyPosts(myPosts.filter(post => post.id !== postId));
        alert("성공적으로 삭제되었습니다.");
      } else {
        alert("삭제 중 오류가 발생했습니다.");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-sans">
        <div className="text-lg font-black text-slate-400 animate-pulse">정보를 안전하게 불러오는 중...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center font-sans p-6 text-center space-y-4">
        <span className="text-5xl">🔒</span>
        <h2 className="text-2xl font-black">로그인이 필요한 페이지입니다.</h2>
        <Link href="/" className="px-6 py-3 bg-[#007AFF] text-white font-black rounded-xl text-sm shadow-lg shadow-blue-100">메인으로 가기</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      {/* 글로벌 상단바 */}
      <nav className="w-full bg-white border-b border-slate-100 h-20 flex items-center">
        <div className="max-w-6xl mx-auto w-full px-6 flex justify-between items-center">
          <Link href="/" className="text-2xl font-[1000] tracking-tighter text-slate-900">
            BIG<span className="text-[#007AFF]">ROOT</span> <span className="text-slate-400 font-bold ml-1 text-sm">MyPage</span>
          </Link>
          <Link href="/" className="text-sm font-black text-slate-500 hover:text-[#007AFF] transition-colors">메인 홈으로</Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 👤 좌측: 내 프로필 정보 및 계약 만기 관리 대시보드 */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm text-center space-y-4">
            <div className="w-20 h-20 bg-blue-50 text-[#007AFF] text-3xl font-black rounded-full flex items-center justify-center mx-auto shadow-inner">
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

          {/* ⏳ 나의 계약 만기 관리 섹션 (조건부 렌더링 적용) */}
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl translate-x-10 -translate-y-10" />
            
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-black text-blue-400 tracking-wider uppercase">Contract Management</span>
                <h4 className="text-lg font-black mt-1">나의 계약 만기 관리</h4>
              </div>
              <span className="text-2xl">⏳</span>
            </div>

            {/* 1️⃣ 만기일이 등록되어 있고, 수정 모드가 아닐 때 */}
            {contractEndDate && !isEditingDate ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white/10 rounded-2xl p-5 text-center border border-white/10">
                  <p className="text-xs font-bold text-slate-300">예상 만기일까지</p>
                  <p className="text-4xl font-[1000] text-blue-400 mt-1 tracking-tight">
                    {dDay !== null && dDay >= 0 ? `D-${dDay}` : `D+${Math.abs(dDay || 0)} 지남`}
                  </p>
                </div>

                <div className="space-y-2 text-sm text-slate-300 font-bold">
                  <div className="flex justify-between">
                    <span>확정 만기일</span>
                    <span className="text-white">{contractEndDate}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setIsEditingDate(true)}
                  className="block text-center w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-black rounded-xl transition-all"
                >
                  만기일 변경하기 ⚙️
                </button>
              </div>
            ) : (
              /* 2️⃣ 만기일이 등록 안 되어 있거나, 수정 모드일 때 */
              <div className="space-y-4 bg-white/5 p-5 rounded-3xl border border-white/10 animate-in fade-in duration-300">
                <p className="text-xs font-bold text-slate-300 leading-relaxed">
                  {contractEndDate ? "변경할 새로운 만기일을 선택해주세요." : "아직 만기일이 등록되지 않았습니다. 만기 날짜를 설정하고 한눈에 관리해 보세요!"}
                </p>
                <div className="space-y-3">
                  <input 
                    type="date" 
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    className="w-full p-3 bg-slate-800 text-white rounded-xl border border-slate-700 outline-none text-sm font-bold"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={saveContractDate}
                      className="flex-1 py-3 bg-[#007AFF] text-white font-black text-xs rounded-xl hover:bg-blue-600 transition-colors"
                    >
                      {contractEndDate ? "수정 완료" : "만기일 등록"}
                    </button>
                    {contractEndDate && (
                      <button 
                        onClick={() => { setIsEditingDate(false); setDateInput(contractEndDate); }}
                        className="px-4 py-3 bg-slate-700 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-600 transition-colors"
                      >
                        취소
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 📋 우측: 내가 커뮤니티에 쓴 글 모아보기 목록 */}
        <div className="lg:col-span-2 space-y-6">
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
                      <Link href="/community" className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-500 text-[11px] font-black text-slate-600 rounded-lg transition-all">
                        보기
                      </Link>
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        className="px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 text-[11px] font-black rounded-lg transition-all"
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

      </main>
    </div>
  );
}
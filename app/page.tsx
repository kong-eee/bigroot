'use client';

import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState(''); // 확정 닉네임
  const [tempNickname, setTempNickname] = useState(''); // 입력용 임시 닉네임
  const [gender, setGender] = useState<'남성' | '여성' | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('nickname, gender')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          const dbNickname = profile.nickname || '';
          setNickname(dbNickname);
          setTempNickname(dbNickname);
          setGender(profile.gender as '남성' | '여성' || null);
        }

        if (!profile?.nickname || !profile?.gender) {
          setShowModal(true);
        }
      }
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) initAuth();
      else {
        setNickname('');
        setTempNickname('');
        setGender(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const saveProfile = async () => {
    if (!tempNickname.trim()) return alert("닉네임을 입력해주세요!");
    if (!gender) return alert("성별을 선택해주세요!");

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      nickname: tempNickname,
      gender: gender,
      avatar_url: user.user_metadata?.avatar_url || '',
      updated_at: new Date().toISOString(),
    });

    if (error) {
      if (error.code === '23505') alert("이미 사용 중인 닉네임입니다.");
      else alert(`오류 발생: ${error.message}`);
    } else {
      setNickname(tempNickname);
      setShowModal(false);
      alert(`${tempNickname}님, 설정을 완료했습니다!`);
    }
  };

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}` }
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-700">
      
      {/* 🎁 닉네임 설정 모달 */}
      {showModal && user && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-12 shadow-2xl space-y-10 border border-white/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-blue-600" />
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl text-3xl mb-2">🌱</div>
              <h2 className="text-3xl font-black tracking-tight">반가워요!</h2>
              <p className="text-slate-500 font-medium leading-relaxed">회원님의 소중한 권리를 지키기 위해<br/>기본 정보를 완성해 주세요.</p>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 ml-1">닉네임</label>
                <input 
                  type="text" 
                  placeholder="사용할 닉네임을 입력하세요"
                  value={tempNickname}
                  onChange={(e) => setTempNickname(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-bold transition-all placeholder:text-slate-300 text-lg"
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 ml-1">성별</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setGender('남성')} className={`py-4 rounded-2xl font-black border-2 transition-all ${gender === '남성' ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}>남성</button>
                  <button onClick={() => setGender('여성')} className={`py-4 rounded-2xl font-black border-2 transition-all ${gender === '여성' ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}>여성</button>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <button onClick={saveProfile} className="w-full py-5 bg-[#007AFF] text-white rounded-2xl font-black text-xl shadow-xl shadow-blue-200 hover:bg-blue-600 hover:-translate-y-1 active:scale-95 transition-all">설정 완료하기</button>
              <button onClick={() => { setTempNickname(nickname); setShowModal(false); }} className="w-full text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">나중에 할게요</button>
            </div>
          </div>
        </div>
      )}

      {/* 🌐 글로벌 내비게이션 바 */}
      <nav className="fixed top-0 z-40 w-full bg-white/70 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-16">
            <Link href="/" className="group flex items-center gap-2">
              <div className="w-10 h-10 bg-[#007AFF] rounded-xl flex items-center justify-center text-white font-black text-xl group-hover:rotate-12 transition-transform">B</div>
              <span className="text-2xl font-[1000] tracking-tighter text-slate-900">BIG<span className="text-[#007AFF]">ROOT</span></span>
            </Link>
            <div className="hidden lg:flex items-center gap-10 text-[15px] font-bold text-slate-500">
              <Link href="/contract" className="hover:text-[#007AFF] transition-colors relative group text-blue-600">계약전 체크!🔥</Link>
              <Link href="/community" className="hover:text-[#007AFF] transition-colors relative group">커뮤니티</Link>
              <Link href="/rights-guide" className="hover:text-[#007AFF] transition-colors relative group">권리백과</Link>
              <Link href="/rent-increase" className="hover:text-[#007AFF] transition-colors relative group">임대료진단</Link>
              <Link href="/golden-time" className="hover:text-[#007AFF] transition-colors relative group">골든타임</Link>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {user ? (
              <div className="flex items-center gap-6">
                {nickname ? (
                  <Link href="/mypage" className="flex items-center gap-3 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100 hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer group/nick">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-black text-slate-700 group-hover/nick:text-blue-600 transition-colors">{nickname} 님</span>
                  </Link>
                ) : (
                  <button onClick={() => setShowModal(true)} className="text-xs font-black text-red-500 bg-red-50 px-4 py-2.5 rounded-2xl border border-red-100 animate-bounce">⚠️ 닉네임 설정</button>
                )}
                <button onClick={() => supabase.auth.signOut()} className="text-sm font-bold text-slate-400 hover:text-red-500 transition-colors">로그아웃</button>
              </div>
            ) : (
              <button onClick={loginWithGoogle} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-[#007AFF] hover:shadow-xl hover:shadow-blue-200 transition-all active:scale-95">
                로그인 / 시작하기
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* 🚀 프리미엄 히어로 섹션 */}
        <section className="relative pt-32 pb-40 px-8 overflow-hidden">
          <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2" />
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1 space-y-10 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-5 py-2 bg-white rounded-full shadow-sm border border-slate-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-xs font-black text-blue-600 tracking-wider uppercase">대한민국 1위 세입자 권리 보호 플랫폼</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-[1000] text-slate-900 leading-[1.05] tracking-tight">
                세입자의<br />
                <span className="text-[#007AFF] inline-block mt-2">든든한 뿌리.</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-500 font-bold leading-relaxed max-w-2xl mx-auto lg:mx-0">
                복잡한 부동산 법률과 불합리한 상황 속에서도<br className="hidden md:block" /> 
                당신의 소중한 보증금과 권리를 단단하게 지켜드립니다.
              </p>
              <div className="flex flex-wrap gap-5 justify-center lg:justify-start">
                <Link href="/contract" className="px-12 py-6 bg-[#007AFF] text-white rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-blue-200">계약 전 체크리스트 보기 📋</Link>
                <Link href="/community" className="px-12 py-6 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all">커뮤니티 구경하기</Link>
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="w-[450px] h-[550px] bg-gradient-to-br from-blue-500 to-blue-700 rounded-[4rem] shadow-3xl rotate-3 flex items-center justify-center text-[10rem] relative overflow-hidden group">
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                🏠
                <div className="absolute bottom-10 left-10 right-10 bg-white/20 backdrop-blur-md p-6 rounded-3xl border border-white/30 -rotate-3">
                    <p className="text-white text-lg font-black italic">"내 집 마련 전까지, 내 권리부터!"</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 🏛️ 전문 서비스 그리드 섹션 */}
        <section className="bg-white py-32 px-8 border-t border-slate-100">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h3 className="text-blue-600 font-black tracking-widest text-sm uppercase">Our Services</h3>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900">전문가가 설계한 세입자 전용 솔루션</h2>
            </div>

            {/* 🔥 1층: 가장 중요한 [계약 전 필수 체크리스트] 와이드 단독 카드 배치 */}
            <div className="w-full">
              <Link href="/contract" className="group flex flex-col md:flex-row items-start md:items-center justify-between p-12 bg-blue-50/50 rounded-[3rem] border border-blue-100/60 hover:bg-white hover:border-blue-400 hover:shadow-2xl transition-all duration-500 gap-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                  <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-4xl shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">🔥</div>
                  <div className="space-y-2">
                    <div className="inline-block px-3 py-1 bg-blue-600 text-white rounded-full text-[10px] font-black tracking-widest uppercase">MUST WATCH</div>
                    <h4 className="text-3xl font-black text-slate-900">계약 전 필수 체크리스트</h4>
                    <p className="text-slate-500 font-bold leading-relaxed max-w-2xl">다세대, 다가구, 오피스텔, 상가 등 도장 찍기 전에 내 보증금을 안전하게 지키기 위해 무조건 확인해야 하는 유형별 핵심 조항 가이드</p>
                  </div>
                </div>
                <div className="text-3xl text-blue-600 font-black group-hover:translate-x-3 transition-transform duration-300 shrink-0 hidden md:block">
                  지금 확인하기 →
                </div>
              </Link>
            </div>

            {/* 2층: 기존 메뉴들을 안정적인 4열 그리드로 배치 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <ServiceCard 
                href="/community" 
                icon="🗨️" 
                title="커뮤니티" 
                desc="실시간으로 쏟아지는 부동산 고민, 같은 처지의 임차인들과 전문가가 함께 답해드립니다."
              />
              <ServiceCard 
                href="/rights-guide" 
                icon="📖" 
                title="권리백과" 
                desc="어려운 법률 용어는 이제 그만. 세입자가 꼭 알아야 할 핵심 법규를 쉽게 풀어드립니다."
              />
              <ServiceCard 
                href="/rent-increase" 
                icon="📈" 
                title="임대료 진단" 
                desc="우리 집 임대료 인상이 적정한지, 상한제 적용 대상인지 데이터로 정확히 분석합니다."
              />
              <ServiceCard 
                href="/golden-time" 
                icon="⏳" 
                title="골든타임" 
                desc="계약 갱신 요구권, 퇴거 통보 등 절대로 놓쳐선 안 될 임대차 중요 날짜를 정밀하게 추적합니다."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="py-20 px-8 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-6">
            <div className="text-3xl font-black tracking-tighter">BIG<span className="text-blue-500">ROOT</span></div>
            <p className="text-slate-400 font-medium max-w-xs">세입자가 당당한 세상을 위해 데이터와 법률로 <br/><span>뿌리를 내립니다.</span></p>
          </div>
          <div className="flex gap-20">
            <div className="space-y-4">
              <h5 className="font-black text-lg">서비스</h5>
              <div className="flex flex-col gap-2 text-slate-400 text-sm font-bold">
                <Link href="/contract">계약전체크</Link>
                <Link href="/community">커뮤니티</Link>
                <Link href="/rights-guide">권리백과</Link>
                <Link href="/rent-increase">임대료진단</Link>
                <Link href="/golden-time">골든타임</Link>
              </div>
            </div>
            <div className="space-y-4">
              <h5 className="font-black text-lg">고객지원</h5>
              <div className="flex flex-col gap-2 text-slate-400 text-sm font-bold">
                <p>문의하기</p>
                <p>이용약관</p>
                <p>개인정보처리방침</p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-20 mt-20 border-t border-slate-800 text-center text-slate-500 text-sm font-bold">
          &copy; 2026 빅루트. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function ServiceCard({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link href={href} className="group p-8 bg-slate-50 rounded-[2.5rem] border border-transparent hover:border-blue-200 hover:bg-white hover:shadow-2xl transition-all duration-500 flex flex-col justify-between">
      <div>
        <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center text-3xl shadow-sm mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">{icon}</div>
        <h4 className="text-xl font-black text-slate-900 mb-3">{title}</h4>
        <p className="text-slate-500 font-bold leading-relaxed text-xs">{desc}</p>
      </div>
      <div className="pt-6 flex items-center gap-2 text-blue-600 text-xs font-black opacity-0 group-hover:opacity-100 transition-all">
        자세히 보기 <span>→</span>
      </div>
    </Link>
  );
}
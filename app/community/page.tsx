'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function CommunityPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  
  // ✍️ 글쓰기 관련 상태
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<'주택' | '상가'>('주택');
  
  // 🔍 조회 및 필터링 관련 상태
  const [filterCategory, setFilterCategory] = useState<'all' | '주택' | '상가'>('all');
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');

  // 🔔 알림 관련 핵심 상태 추가
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotiDropdown, setShowNotiDropdown] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: pf } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(pf);
        fetchNotifications(user.id); // 로그인 시 내 알림창 로드
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [user, sortBy]);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles (nickname),
        comments (*, profiles(nickname)),
        post_likes (user_id)
      `);

    if (error) return console.error("데이터 로드 실패:", error.message);

    if (data) {
      let sortedData = data.map(post => ({
        ...post,
        like_count: post.post_likes?.length || 0,
        is_liked: post.post_likes?.some((l: any) => l.user_id === user?.id),
        comments: post.comments || []
      }));

      if (sortBy === 'latest') {
        sortedData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else {
        sortedData.sort((a, b) => b.like_count - a.like_count);
      }
      setPosts(sortedData);
    }
  };

  // 🔔 내 알림 목록 가져오기 함수
  const fetchNotifications = async (userId: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:profiles!notifications_actor_id_fkey(nickname),
        posts(title)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.is_read).length);
    }
  };

  // 🔔 알림 전체 읽음 처리 함수
  const markAllAsRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    fetchNotifications(user.id);
  };

  // 👀 아코디언 오픈 + 조회수 실시간 카운트 업 연동 함수
  const handlePostAccordion = async (postId: string, currentViews: number) => {
    if (activePostId === postId) {
      setActivePostId(null);
    } else {
      setActivePostId(postId);
      
      // DB 내 조회수 카운트 1 증가시킴
      const nextViews = (currentViews || 0) + 1;
      await supabase.from('posts').update({ view_count: nextViews }).eq('id', postId);
      
      // 로컬 화면 상태에 즉시 반영 (리렌더링 최소화)
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, view_count: nextViews } : p));
    }
  };

  const handleCreatePost = async () => {
    if (!user || !profile?.nickname) return alert("닉네임 설정이 필요합니다.");
    if (!newPostTitle.trim() || !newPostContent.trim()) return alert("제목과 내용을 입력해주세요.");

    const { error } = await supabase.from('posts').insert({
      author_id: user.id, title: newPostTitle, content: newPostContent, category: newPostCategory
    });
    
    if (error) alert(`등록 실패: ${error.message}`);
    else {
      setNewPostTitle(''); setNewPostContent(''); fetchPosts();
    }
  };

  const toggleLike = async (e: React.MouseEvent, post: any) => {
    e.stopPropagation();
    if (!user) return alert("로그인이 필요합니다.");
    
    if (post.is_liked) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
      
      // 🔔 좋아요 알림 전송 (내가 내 글에 누른 게 아닐 때만)
      if (post.author_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: post.author_id, actor_id: user.id, post_id: post.id, type: 'like'
        });
      }
    }
    fetchPosts();
  };

  const addComment = async (post: any) => {
    if (!user || !profile?.nickname) return alert("닉네임 설정이 필요합니다.");
    if (!commentContent.trim()) return alert("댓글 내용을 입력해주세요.");

    const { error } = await supabase.from('comments').insert({
      post_id: post.id, author_id: user.id, content: commentContent
    });
    
    if (error) {
      alert(`답글 등록 실패: ${error.message}`);
    } else {
      // 🔔 댓글 알림 전송 (내가 내 글에 남긴 게 아닐 때만)
      if (post.author_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: post.author_id, actor_id: user.id, post_id: post.id, type: 'comment'
        });
      }
      setCommentContent('');
      fetchPosts();
    }
  };

  const deleteItem = async (e: React.MouseEvent, table: string, id: string, hasComments: boolean = false) => {
    e.stopPropagation(); 
    if (table === 'posts' && hasComments) return alert("답글이 달린 게시글은 삭제할 수 없습니다. 🔒");
    if (!confirm("정말로 삭제하시겠습니까?")) return;

    const { status } = await supabase.from(table).delete().eq('id', id);
    if (status === 200 || status === 204) { alert("삭제되었습니다."); fetchPosts(); }
  };

  const filteredPosts = posts.filter(post => filterCategory === 'all' ? true : post.category === filterCategory);
  const isAllowed = user && profile?.nickname;

  // 🔔 알림 숫자가 5개를 넘어가면 5++로 포맷팅해 주는 연산 로직
  const formatBadgeCount = (count: number) => {
    if (count === 0) return null;
    return count > 5 ? '5++' : count.toString();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center p-6 font-sans text-slate-900">
      <div className="w-full max-w-2xl space-y-6">
        
        {/* 상단 헤더 부분 (🔔 알림 센터 결합) */}
        <div className="flex justify-between items-end w-full pb-2 relative">
          <Link href="/" className="text-3xl font-[1000] tracking-tighter text-slate-900">
            BIG<span className="text-[#007AFF]">ROOT</span> <span className="text-slate-400 font-bold text-sm ml-1">Community</span>
          </Link>
          
          <div className="flex items-center gap-3">
            {/* 🔔 알림 벨 아이콘 및 배지 컴포넌트 */}
            {user && (
              <div className="relative">
                <button 
                  onClick={() => { setShowNotiDropdown(!showNotiDropdown); if(!showNotiDropdown) markAllAsRead(); }}
                  className="p-2.5 bg-white border border-slate-200 hover:border-slate-400 rounded-xl shadow-sm text-lg relative transition-all"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full ring-2 ring-white animate-pulse">
                      {formatBadgeCount(unreadCount)}
                    </span>
                  )}
                </button>

                {/* 📂 알림 레이어 팝업창 */}
                {showNotiDropdown && (
                  <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                      <span className="font-black text-xs text-slate-800">최신 알림 센터</span>
                      <button onClick={() => setShowNotiDropdown(false)} className="text-[10px] text-slate-400 font-bold hover:text-slate-600">닫기</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-8 font-medium">아직 도착한 알림이 없습니다. 🌱</p>
                      ) : (
                        notifications.map((noti) => (
                          <div key={noti.id} className={`p-3.5 border-b border-slate-50 last:border-0 flex gap-2 items-start text-xs ${!noti.is_read ? 'bg-blue-50/40' : ''}`}>
                            <span className="text-sm">{noti.type === 'comment' ? '💬' : '👍'}</span>
                            <div className="space-y-0.5 flex-1">
                              <p className="text-slate-700 font-medium">
                                <span className="font-black text-slate-900">{noti.actor?.nickname || '세입자'}</span>님이{' '}
                                {noti.type === 'comment' ? '댓글을 달았습니다.' : '내 글을 추천했습니다.'}
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold truncate max-w-[220px]">원문: {noti.posts?.title}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <button onClick={() => setSortBy('latest')} className={`px-4 py-1.5 rounded-lg text-[11px] font-black ${sortBy === 'latest' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>최신순</button>
              <button onClick={() => setSortBy('popular')} className={`px-4 py-1.5 rounded-lg text-[11px] font-black ${sortBy === 'popular' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>인기순</button>
            </div>
          </div>
        </div>

        {/* 🗂️ 주택/상가 게시판 상단 토글 탭 바 */}
        <div className="flex bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-sm gap-1 w-full">
          <button onClick={() => { setFilterCategory('all'); setActivePostId(null); }} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${filterCategory === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}>🌏 전체보기</button>
          <button onClick={() => { setFilterCategory('주택'); setActivePostId(null); }} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${filterCategory === '주택' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}>🏠 주택 게시판</button>
          <button onClick={() => { setFilterCategory('상가'); setActivePostId(null); }} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${filterCategory === '상가' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}>🛍️ 상가 게시판</button>
        </div>

        {/* ✍️ 글쓰기 구역 */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 relative overflow-hidden">
          {!isAllowed && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-6">
              <p className="font-black text-slate-900">로그인 및 닉네임 설정 후 이용 가능합니다.</p>
              <Link href="/" className="mt-3 text-xs font-black text-[#007AFF] underline">메인으로 가기</Link>
            </div>
          )}
          <div className="flex items-center gap-3 mb-4 pl-1">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">글 종류:</span>
            <button onClick={() => setNewPostCategory('주택')} className={`px-4 py-1.5 rounded-xl text-xs font-black border transition-all ${newPostCategory === '주택' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-slate-50 border-transparent text-slate-400'}`}>🏠 주택 관련</button>
            <button onClick={() => setNewPostCategory('상가')} className={`px-4 py-1.5 rounded-xl text-xs font-black border transition-all ${newPostCategory === '상가' ? 'bg-orange-50 border-orange-500 text-orange-600' : 'bg-slate-50 border-transparent text-slate-400'}`}>🛍️ 상가 관련</button>
          </div>
          <input type="text" placeholder="고민이나 정보를 공유해 주세요" value={newPostTitle} onChange={(e) => setNewPostTitle(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-black text-slate-900 mb-3 placeholder:text-slate-300" />
          <textarea placeholder="상세한 내용을 입력해 주세요" rows={2} value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-slate-700 text-sm resize-none mb-3 placeholder:text-slate-300" />
          <button onClick={handleCreatePost} className="w-full py-4 bg-[#007AFF] text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all">게시물 올리기</button>
        </div>

        {/* 📋 게시글 목록 */}
        <div className="space-y-3">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100 text-slate-300 font-bold text-sm">등록된 게시글이 없습니다. 📝</div>
          ) : (
            filteredPosts.map((post) => (
              <div 
                key={post.id} 
                onClick={() => handlePostAccordion(post.id, post.view_count)}
                className={`bg-white p-6 rounded-[2rem] border transition-all shadow-sm cursor-pointer hover:shadow-md ${activePostId === post.id ? 'border-[#007AFF] ring-4 ring-blue-50' : 'border-slate-100/70'}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h4 className="text-base font-black text-slate-900 leading-tight tracking-tight flex-1">{post.title}</h4>

                  {/* 우측 메타 정보 그룹 (👀 조회수 탑재) */}
                  <div className="flex items-center gap-3 shrink-0 text-[10px] font-bold text-slate-400 self-start sm:self-center">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border ${post.category === '상가' ? 'bg-orange-50 text-orange-500 border-orange-100' : 'bg-blue-50 text-blue-500 border-blue-100'}`}>{post.category === '상가' ? '🛍️ 상가' : '🏠 주택'}</span>
                    <span className="font-black text-slate-700 bg-slate-50 px-2.5 py-1 rounded-full">{post.profiles?.nickname}</span>
                    
                    {/* ✅ 상시 노출: 조회수 데이터 추가(👀) */}
                    <span className="text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md font-extrabold">👀 {post.view_count || 0}</span>

                    {activePostId !== post.id && (
                      <div className="flex items-center gap-2 border-r border-slate-100 pr-3 animate-in fade-in duration-200">
                        <span>👍 {post.like_count}</span>
                        <span>💬 {post.comments?.length || 0}</span>
                      </div>
                    )}
                    <span className="text-slate-300">{new Date(post.created_at).toLocaleDateString()}</span>
                    
                    {activePostId === post.id && user?.id === post.author_id && (
                      <button onClick={(e) => deleteItem(e, 'posts', post.id, post.comments?.length > 0)} className="font-black text-red-400 hover:text-red-600 transition-colors pl-1 animate-in fade-in duration-200">삭제</button>
                    )}
                  </div>
                </div>

                {/* 🔓 펼쳐지는 상세 본문 */}
                {activePostId === post.id && (
                  <div onClick={(e) => e.stopPropagation()} className="mt-5 pt-5 border-t border-slate-100 space-y-5 cursor-default animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">{post.content}</p>

                    <div className="flex items-center gap-6 border-t border-b border-slate-50 py-3">
                      <button onClick={(e) => toggleLike(e, post)} className="flex items-center gap-1.5 group">
                        <span className={`text-lg transition-transform group-hover:scale-125 ${post.is_liked ? 'grayscale-0' : 'grayscale'}`}>👍</span>
                        <span className={`text-xs font-black ${post.is_liked ? 'text-blue-600' : 'text-slate-400'}`}>{post.like_count} 명 추천</span>
                      </button>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">💬</span>
                        <span className="text-xs font-black text-slate-400">답글 {post.comments?.length || 0}개</span>
                      </div>
                    </div>

                    {/* 댓글 리스트 */}
                    <div className="space-y-4 bg-slate-50 p-6 rounded-3xl">
                      {post.comments?.length === 0 ? (
                        <p className="text-xs text-slate-400 font-bold text-center py-1">첫 의견을 남겨보세요! 🌱</p>
                      ) : (
                        post.comments?.map((comment: any) => (
                          <div key={comment.id} className="flex justify-between items-start border-b border-white pb-3 last:border-0 last:pb-0">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-black text-slate-400">{comment.profiles?.nickname}</span>
                              <p className="text-sm font-bold text-slate-700">{comment.content}</p>
                            </div>
                            {user?.id === comment.author_id && (
                              <button onClick={(e) => deleteItem(e, 'comments', comment.id)} className="text-[9px] font-black text-red-400 hover:text-red-600">삭제</button>
                            )}
                          </div>
                        ))
                      )}
                      <div className="flex gap-2 mt-4 pt-1">
                        <input type="text" placeholder="따뜻한 댓글을 남겨주세요" value={commentContent} onChange={(e) => setCommentContent(e.target.value)} className="flex-1 p-3 bg-white rounded-2xl border-none outline-none text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-300" />
                        <button onClick={() => addComment(post)} className="px-5 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-black transition-colors">등록</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
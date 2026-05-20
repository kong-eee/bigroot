'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function CommunityPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  
  // ✍️ 글쓰기 관련 상태 (카테고리 선택 추가)
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<'주택' | '상가'>('주택');
  
  // 🔍 조회 및 정렬 관련 상태 (필터링 탭 추가)
  const [filterCategory, setFilterCategory] = useState<'all' | '주택' | '상가'>('all');
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: pf } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(pf);
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

    if (error) {
      console.error("데이터 로드 실패:", error.message);
      return;
    }

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

  const handleCreatePost = async () => {
    if (!user || !profile?.nickname) return alert("닉네임 설정이 필요합니다.");
    if (!newPostTitle.trim() || !newPostContent.trim()) return alert("제목과 내용을 입력해주세요.");

    // 💾 글 저장 시 선택한 카테고리(category)도 함께 패키징해서 Supabase로 전송
    const { error } = await supabase.from('posts').insert({
      author_id: user.id, 
      title: newPostTitle, 
      content: newPostContent,
      category: newPostCategory
    });
    
    if (error) {
      alert(`등록 실패: ${error.message}`);
    } else {
      setNewPostTitle('');
      setNewPostContent('');
      fetchPosts();
    }
  };

  const toggleLike = async (e: React.MouseEvent, postId: string, isLiked: boolean) => {
    e.stopPropagation();
    if (!user) return alert("로그인이 필요합니다.");
    if (isLiked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
    }
    fetchPosts();
  };

  const addComment = async (postId: string) => {
    if (!user || !profile?.nickname) return alert("닉네임 설정이 필요합니다.");
    if (!commentContent.trim()) return alert("댓글 내용을 입력해주세요.");

    const { error } = await supabase.from('comments').insert({
      post_id: postId, author_id: user.id, content: commentContent
    });
    
    if (error) {
      alert(`답글 등록 실패: ${error.message}`);
    } else {
      setCommentContent('');
      fetchPosts();
    }
  };

  const deleteItem = async (e: React.MouseEvent, table: string, id: string, hasComments: boolean = false) => {
    e.stopPropagation(); 
    
    if (table === 'posts' && hasComments) {
      return alert("답글(댓글)이 달린 게시글은 삭제할 수 없습니다. 🔒\n(다른 세입자들의 소중한 의견을 보호하기 위함입니다)");
    }

    if (!confirm("정말로 삭제하시겠습니까?")) return;

    const { error, status } = await supabase.from(table).delete().eq('id', id);
    
    if (error) {
      alert(`삭제 실패: ${error.message}`);
      return;
    }

    if (status === 200 || status === 204) {
      alert("정상적으로 삭제되었습니다.");
      fetchPosts(); 
    } else {
      alert("삭제 권한이 없거나 서버에서 거부되었습니다.");
    }
  };

  // 🔍 탭 선택에 따라 리스트를 실시간 필터링하는 로직
  const filteredPosts = posts.filter(post => {
    if (filterCategory === 'all') return true;
    return post.category === filterCategory;
  });

  const isAllowed = user && profile?.nickname;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center p-6 font-sans text-slate-900">
      <div className="w-full max-w-2xl space-y-6">
        
        {/* 상단 헤더 부분 */}
        <div className="flex justify-between items-end w-full pb-2">
          <Link href="/" className="text-3xl font-[1000] tracking-tighter text-slate-900">
            BIG<span className="text-[#007AFF]">ROOT</span> <span className="text-slate-400 font-bold text-sm ml-1">Community</span>
          </Link>
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button onClick={() => setSortBy('latest')} className={`px-4 py-1.5 rounded-lg text-[11px] font-black ${sortBy === 'latest' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>최신순</button>
            <button onClick={() => setSortBy('popular')} className={`px-4 py-1.5 rounded-lg text-[11px] font-black ${sortBy === 'popular' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>인기순</button>
          </div>
        </div>

        {/* 🗂️ 대개편: 주택/상가 게시판 상단 토글 탭 바 추가 */}
        <div className="flex bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-sm gap-1 w-full">
          <button onClick={() => { setFilterCategory('all'); setActivePostId(null); }} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${filterCategory === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}>🌏 전체보기</button>
          <button onClick={() => { setFilterCategory('주택'); setActivePostId(null); }} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${filterCategory === '주택' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}>🏠 주택 게시판</button>
          <button onClick={() => { setFilterCategory('상가'); setActivePostId(null); }} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${filterCategory === '상가' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}>🛍️ 상가 게시판</button>
        </div>

        {/* ✍️ 글쓰기 구역 (카테고리 선택 라디오 버튼 추가) */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 relative overflow-hidden">
          {!isAllowed && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-6">
              <p className="font-black text-slate-900">로그인 및 닉네임 설정 후 이용 가능합니다.</p>
              <Link href="/" className="mt-3 text-xs font-black text-[#007AFF] underline">메인으로 가기</Link>
            </div>
          )}
          
          {/* 글 작성 시 카테고리 태깅 버튼 */}
          <div className="flex items-center gap-3 mb-4 pl-1">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">글 종류:</span>
            <button onClick={() => setNewPostCategory('주택')} className={`px-4 py-1.5 rounded-xl text-xs font-black border transition-all ${newPostCategory === '주택' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-slate-50 border-transparent text-slate-400'}`}>🏠 주택 관련</button>
            <button onClick={() => setNewPostCategory('상가')} className={`px-4 py-1.5 rounded-xl text-xs font-black border transition-all ${newPostCategory === '상가' ? 'bg-orange-50 border-orange-500 text-orange-600' : 'bg-slate-50 border-transparent text-slate-400'}`}>🛍️ 상가 관련</button>
          </div>

          <input type="text" placeholder="고민이나 정보를 공유해 주세요 (예: 보증보험, 권리금 분쟁 등)" value={newPostTitle} onChange={(e) => setNewPostTitle(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-black text-slate-900 mb-3 placeholder:text-slate-300" />
          <textarea placeholder="상세한 내용을 입력해 주세요" rows={2} value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-slate-700 text-sm resize-none mb-3 placeholder:text-slate-300" />
          <button onClick={handleCreatePost} className="w-full py-4 bg-[#007AFF] text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all">게시물 올리기</button>
        </div>

        {/* 📋 게시글 목록 (filteredPosts 기반으로 렌더링) */}
        <div className="space-y-3">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100 text-slate-300 font-bold text-sm">
              선택하신 게시판에 아직 등록된 게시글이 없습니다. 📝
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div 
                key={post.id} 
                onClick={() => setActivePostId(activePostId === post.id ? null : post.id)}
                className={`bg-white p-6 rounded-[2rem] border transition-all shadow-sm cursor-pointer hover:shadow-md ${activePostId === post.id ? 'border-[#007AFF] ring-4 ring-blue-50' : 'border-slate-100/70'}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* 왼쪽: 게시글 제목 */}
                  <h4 className="text-base font-black text-slate-900 leading-tight tracking-tight flex-1">
                    {post.title}
                  </h4>

                  {/* 우측: 통합 메타 정보 그룹 (주택/상가 분류 뱃지 추가) */}
                  <div className="flex items-center gap-3 shrink-0 text-[10px] font-bold text-slate-400 self-start sm:self-center">
                    
                    {/* 🏷️ 카테고리 종류 뱃지 분기처리 */}
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border ${post.category === '상가' ? 'bg-orange-50 text-orange-500 border-orange-100' : 'bg-blue-50 text-blue-500 border-blue-100'}`}>
                      {post.category === '상가' ? '🛍️ 상가' : '🏠 주택'}
                    </span>

                    {/* 닉네임 배너 */}
                    <span className="font-black text-slate-700 bg-slate-50 px-2.5 py-1 rounded-full">{post.profiles?.nickname}</span>
                    
                    {/* 닫혀있을 때만 노출되는 미니 통계 수치 */}
                    {activePostId !== post.id && (
                      <div className="flex items-center gap-2 border-r border-slate-100 pr-3 animate-in fade-in duration-200">
                        <span>👍 {post.like_count}</span>
                        <span>💬 {post.comments?.length || 0}</span>
                      </div>
                    )}
                    
                    {/* 날짜 */}
                    <span className="text-slate-300">{new Date(post.created_at).toLocaleDateString()}</span>
                    
                    {/* 삭제 버튼 */}
                    {activePostId === post.id && user?.id === post.author_id && (
                      <button 
                        onClick={(e) => deleteItem(e, 'posts', post.id, post.comments?.length > 0)} 
                        className="font-black text-red-400 hover:text-red-600 transition-colors pl-1 animate-in fade-in duration-200"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>

                {/* 🔓 클릭 시 하단으로 펼쳐지는 상세내용 */}
                {activePostId === post.id && (
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="mt-5 pt-5 border-t border-slate-100 space-y-5 cursor-default animate-in fade-in slide-in-from-top-2 duration-200"
                  >
                    {/* 본문 */}
                    <p className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">{post.content}</p>

                    {/* 하단 좋아요 수치 표시 바 */}
                    <div className="flex items-center gap-6 border-t border-b border-slate-50 py-3">
                      <button onClick={(e) => toggleLike(e, post.id, post.is_liked)} className="flex items-center gap-1.5 group">
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
                        <p className="text-xs text-slate-400 font-bold text-center py-1">아직 작성된 답글이 없습니다. 첫 의견을 남겨보세요! 🌱</p>
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
                        <input 
                          type="text" placeholder="따뜻한 댓글을 남겨주세요" value={commentContent}
                          onChange={(e) => setCommentContent(e.target.value)}
                          className="flex-1 p-3 bg-white rounded-2xl border-none outline-none text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-300"
                        />
                        <button onClick={() => addComment(post.id)} className="px-5 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-black transition-colors">등록</button>
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
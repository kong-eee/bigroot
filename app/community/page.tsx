'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  createNotification,
  notifyNavbarRefresh,
} from '@/lib/notifications-client';

export default function CommunityPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<'주택' | '상가'>('주택');
  
  const [filterCategory, setFilterCategory] = useState<'all' | '주택' | '상가'>('all');
  const [searchQuery, setSearchQuery] = useState(''); // 🔍 [신기능] 검색어 상태 추가
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

  useEffect(() => {
    if (typeof window === 'undefined' || posts.length === 0) return;
    const postId = new URLSearchParams(window.location.search).get('post');
    if (postId) setActivePostId(postId);
  }, [posts]);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`*, profiles(nickname), comments(*, profiles(nickname)), post_likes(user_id)`);

    if (error) return console.error("데이터 로드 실패:", error.message);

    if (data) {
      let sortedData = data.map((post: any) => ({
        ...post,
        like_count: post.post_likes?.length || 0,
        is_liked: post.post_likes?.some((l: any) => l.user_id === user?.id),
        comments: post.comments || []
      }));

      if (sortBy === 'latest') {
        sortedData.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else {
        sortedData.sort((a: any, b: any) => b.like_count - a.like_count);
      }
      setPosts(sortedData);
    }
  };

  const handlePostAccordion = async (postId: string, currentViews: number) => {
    if (activePostId === postId) {
      setActivePostId(null);
    } else {
      setActivePostId(postId);
      
      const { error } = await supabase.rpc('increment_view_count', { post_id: postId });
      if (error) console.error("조회수 증가 실패:", error.message);
      
      const nextViews = (currentViews || 0) + 1;
      setPosts(prev => prev.map((p: any) => p.id === postId ? { ...p, view_count: nextViews } : p));
    }
  };

  const handleCreatePost = async () => {
    if (!user || !profile?.nickname) return alert("닉네임 설정이 필요합니다.");
    if (!newPostTitle.trim() || !newPostContent.trim()) return alert("제목과 내용을 입력해주세요.");

    const { error } = await supabase.from('posts').insert({
      author_id: user.id,
      title: newPostTitle,
      content: newPostContent,
      category: newPostCategory,
    });
    
    if (error) alert(`등록 실패: ${error.message}`);
    else {
      setNewPostTitle('');
      setNewPostContent('');
      alert('게시글이 등록되었습니다.');
      fetchPosts();
    }
  };

  const sendNotification = async (
    targetWriterId: string | undefined,
    postId: string,
    type: 'comment' | 'like'
  ) => {
    if (!user || !targetWriterId || targetWriterId === user.id) return;

    try {
      await createNotification({
        target_user_id: targetWriterId,
        post_id: postId,
        type,
      });
      notifyNavbarRefresh();
    } catch (error) {
      console.error('알림 저장 실패:', error);
    }
  };

  const toggleLike = async (e: React.MouseEvent, post: any) => {
    e.stopPropagation();
    if (!user) return alert('로그인이 필요합니다.');

    const targetWriterId = post.author_id;

    if (post.is_liked) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
      await sendNotification(targetWriterId, post.id, 'like');
    }
    fetchPosts();
  };

  const addComment = async (post: any) => {
    if (!user || !profile?.nickname) return alert('닉네임 설정이 필요합니다.');
    if (!commentContent.trim()) return alert('댓글 내용을 입력해주세요.');

    const { error } = await supabase.from('comments').insert({
      post_id: post.id,
      author_id: user.id,
      content: commentContent,
    });
    if (error) {
      alert(`답글 등록 실패: ${error.message}`);
    } else {
      await sendNotification(post.author_id, post.id, 'comment');
      setCommentContent('');
      fetchPosts();
    }
  };

  const deleteItem = async (e: React.MouseEvent, table: string, id: string, hasComments: boolean = false) => {
    e.stopPropagation(); 
    if (table === 'posts' && hasComments) return alert("답글이 달린 게시글은 삭제할 수 없습니다. 🔒");
    if (!confirm('정말로 삭제하시겠습니까?')) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) {
      alert('삭제되었습니다.');
      fetchPosts();
    } else {
      alert(`삭제 실패: ${error.message}`);
    }
  };

  // 🔍 [신기능] 카테고리 필터링과 검색어 필터링을 체이닝하여 다중 연산합니다.
  const filteredPosts = posts.filter((post: any) => {
    const matchesCategory = filterCategory === 'all' ? true : post.category === filterCategory;
    
    // 제목, 내용, 작성자 닉네임 중 하나라도 검색어를 포함하면 통과!
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = query === '' ? true : (
      post.title?.toLowerCase().includes(query) ||
      post.content?.toLowerCase().includes(query) ||
      post.profiles?.nickname?.toLowerCase().includes(query)
    );

    return matchesCategory && matchesSearch;
  });

  const isAllowed = user && profile?.nickname;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center p-6 pt-28 font-sans text-slate-900">
      <div className="w-full max-w-2xl space-y-6">
        
        <div className="flex justify-between items-end w-full pb-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">커뮤니티 광장</h2>
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button onClick={() => setSortBy('latest')} className={`px-4 py-1.5 rounded-lg text-[11px] font-black ${sortBy === 'latest' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>최신순</button>
            <button onClick={() => setSortBy('popular')} className={`px-4 py-1.5 rounded-lg text-[11px] font-black ${sortBy === 'popular' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>인기순</button>
          </div>
        </div>

        {/* 🔍 [신기능] 프리미엄 검색 바 디자인 빌트인 */}
        <div className="relative w-full">
          <input 
            type="text" 
            placeholder="🔍 제목, 내용 또는 작성자 닉네임으로 검색하세요" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-6 py-4 bg-white rounded-2xl border border-slate-200 outline-none font-bold text-slate-900 placeholder:text-slate-300 text-sm focus:border-blue-500 shadow-sm transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 hover:text-slate-600 transition-colors"
            >
              X 지우기
            </button>
          )}
        </div>

        <div className="flex bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-sm gap-1 w-full">
          <button onClick={() => { setFilterCategory('all'); setActivePostId(null); }} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${filterCategory === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}>🌏 전체보기</button>
          <button onClick={() => { setFilterCategory('주택'); setActivePostId(null); }} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${filterCategory === '주택' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}>🏠 주택 게시판</button>
          <button onClick={() => { setFilterCategory('상가'); setActivePostId(null); }} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${filterCategory === '상가' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}>🛍️ 상가 게시판</button>
        </div>

        {/* 글쓰기 구역 */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 relative overflow-hidden">
          {!isAllowed && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-6">
              <p className="font-black text-slate-900">로그인 및 닉네임 설정 후 이용 가능합니다.</p>
            </div>
          )}
          <div className="flex items-center gap-3 mb-4 pl-1">
            <span className="text-[11px] font-black text-slate-400 tracking-wider">글 종류:</span>
            <button onClick={() => setNewPostCategory('주택')} className={`px-4 py-1.5 rounded-xl text-xs font-black border transition-all ${newPostCategory === '주택' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-slate-50 border-transparent text-slate-400'}`}>🏠 주택 관련</button>
            <button onClick={() => setNewPostCategory('상가')} className={`px-4 py-1.5 rounded-xl text-xs font-black border transition-all ${newPostCategory === '상가' ? 'bg-orange-50 border-orange-500 text-orange-600' : 'bg-slate-50 border-transparent text-slate-400'}`}>🛍️ 상가 관련</button>
          </div>
          <input type="text" placeholder="고민이나 정보를 공유해 주세요" value={newPostTitle} onChange={(e) => setNewPostTitle(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-black text-slate-900 mb-3 placeholder:text-slate-300" />
          <textarea placeholder="상세한 내용을 입력해 주세요" rows={2} value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-slate-700 text-sm resize-none mb-3 placeholder:text-slate-300" />
          <button onClick={handleCreatePost} className="w-full py-4 bg-[#007AFF] text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all">게시물 올리기</button>
        </div>

        {/* 게시글 목록 구역 */}
        <div className="space-y-3">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100 text-slate-300 font-bold text-sm">
              {searchQuery ? '🔍 검색 결과와 일치하는 게시글이 없습니다.' : '등록된 게시글이 없습니다. 📝'}
            </div>
          ) : (
            filteredPosts.map((post: any) => (
              <div 
                key={post.id} 
                onClick={() => handlePostAccordion(post.id, post.view_count)}
                className={`bg-white p-6 rounded-[2rem] border transition-all shadow-sm cursor-pointer hover:shadow-md ${activePostId === post.id ? 'border-[#007AFF] ring-4 ring-blue-50' : 'border-slate-100/70'}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h4 className="text-base font-black text-slate-900 leading-tight tracking-tight flex-1">{post.title}</h4>

                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border ${post.category === '상가' ? 'bg-orange-50 text-orange-500 border-orange-100' : 'bg-blue-50 text-blue-500 border-blue-100'}`}>{post.category === '상가' ? '🛍️ 상가' : '🏠 주택'}</span>
                    <span className="text-[10px] font-black text-slate-700 bg-slate-50 px-2.5 py-1 rounded-full">{post.profiles?.nickname}</span>
                    
                    {activePostId !== post.id && (
                      <div className="flex items-center gap-2 border-r border-slate-100 pr-3 text-[10px] font-bold text-slate-400">
                        <span>👍 {post.like_count}</span>
                        <span>💬 {post.comments?.length || 0}</span>
                      </div>
                    )}
                    
                    <div className="flex flex-col items-end gap-0.5 text-[10px] font-bold text-slate-300 min-w-[70px]">
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      <span className="text-slate-400 font-semibold">조회수 {post.view_count || 0}</span>
                    </div>
                    
                    {activePostId === post.id && user?.id === post.author_id && (
                      <button onClick={(e) => deleteItem(e, 'posts', post.id, post.comments?.length > 0)} className="text-[10px] font-black text-red-400 hover:text-red-600 pl-1">삭제</button>
                    )}
                  </div>
                </div>

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
                        <input type="text" placeholder="따뜻한 댓글을 남겨주세요" value={commentContent} onChange={(e) => setCommentContent(e.target.value)} className="flex-1 p-3 bg-white rounded-2xl border-none outline-none text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500" />
                        <button onClick={() => addComment(post)} className="px-5 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-black">등록</button>
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
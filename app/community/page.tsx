'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';

const INITIAL_POSTS = [
  { 
    id: 1, title: "집주인이 실거주한다고 나가라는데 확인 방법 있나요?", 
    content: "만기가 3개월 남았는데 갑자기 문자로 실거주 통보를 받았습니다. 정말 들어와서 사는지 확인할 방법이 있을까요?",
    author: "익명 세입자", date: Date.now() - 3600000, likes: 12, comments: [
      { id: 101, author: "빅루트 가디언", text: "확정일자 부여현황을 열람해보시면 실거주 여부를 알 수 있습니다!", date: "방금 전" }
    ]
  },
  { 
    id: 2, title: "보일러 수리비 관련 질문입니다.", 
    content: "노후 보일러 교체비를 제가 내야 하나요? 집주인은 반반 부담하자고 합니다.",
    author: "평범한 임차인", date: Date.now() - 7200000, likes: 5, comments: []
  },
];

export default function CommunityPage() {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [filter, setFilter] = useState<'recent' | 'popular'>('recent');
  const [newTitle, setNewTitle] = useState('');
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [newComment, setNewComment] = useState('');
  const [likedPosts, setLikedPosts] = useState<number[]>([]);

  // 1. 질문 삭제 기능 (본인 글만)
  const handleDeletePost = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("정말 이 질문을 삭제하시겠습니까?")) {
      setPosts(posts.filter(p => p.id !== id));
    }
  };

  // 2. 댓글 삭제 기능 (본인 댓글만)
  const handleDeleteComment = (postId: number, commentId: number) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;

    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments.filter((c: any) => c.id !== commentId)
        };
      }
      return post;
    });

    setPosts(updatedPosts);
    // 모달창 데이터도 동기화
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost({
        ...selectedPost,
        comments: selectedPost.comments.filter((c: any) => c.id !== commentId)
      });
    }
  };

  const handleLikeToggle = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const isLiked = likedPosts.includes(id);
    setPosts(posts.map(p => p.id === id ? { ...p, likes: isLiked ? p.likes - 1 : p.likes + 1 } : p));
    isLiked ? setLikedPosts(likedPosts.filter(pid => pid !== id)) : setLikedPosts([...likedPosts, id]);
  };

  const sortedPosts = useMemo(() => {
    const list = [...posts];
    return filter === 'recent' ? list.sort((a, b) => b.date - a.date) : list.sort((a, b) => b.likes - a.likes);
  }, [posts, filter]);

  const handlePostSubmit = () => {
    if (!newTitle.trim()) return;
    const newPost = {
      id: Date.now(),
      title: newTitle,
      content: "상세 내용은 상담을 통해 채워질 예정입니다.",
      author: "나", // 본인 작성 표시
      date: Date.now(),
      likes: 0,
      comments: []
    };
    setPosts([newPost, ...posts]);
    setNewTitle('');
  };

  const handleCommentSubmit = () => {
    if (!newComment.trim() || !selectedPost) return;
    const updatedPost = {
      ...selectedPost,
      comments: [...selectedPost.comments, {
        id: Date.now(),
        author: "나 (세입자)", // 본인 작성 표시
        text: newComment,
        date: "방금 전"
      }]
    };
    setPosts(posts.map(p => p.id === selectedPost.id ? updatedPost : p));
    setSelectedPost(updatedPost);
    setNewComment('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 pb-20">
      <header className="p-6 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">←</Link>
          <h1 className="text-xl font-black text-blue-600 tracking-tighter">빅루트 소통로</h1>
        </div>
      </header>

      <main className="p-5 md:p-8 max-w-2xl mx-auto w-full space-y-8">
        {/* 질문 창 */}
        <section className="bg-white p-7 rounded-[2.5rem] shadow-xl shadow-blue-100/30 border-2 border-blue-500 space-y-4">
          <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">🛡️ 무엇이든 물어보세요</h2>
          <textarea 
            placeholder="고민 내용을 입력해주세요."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full h-28 p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm border-none resize-none"
          />
          <button onClick={handlePostSubmit} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg hover:bg-blue-700 transition-all active:scale-[0.98]">질문 등록하기</button>
        </section>

        {/* 필터 탭 */}
        <div className="flex gap-4 border-b border-gray-100 pb-2">
          {['recent', 'popular'].map((f) => (
            <button key={f} onClick={() => setFilter(f as any)} className={`text-sm font-black pb-2 px-1 transition-all ${filter === f ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>
              {f === 'recent' ? '최신순' : '추천순 🔥'}
            </button>
          ))}
        </div>

        {/* 게시글 리스트 */}
        <div className="space-y-4">
          {sortedPosts.map((post) => {
            const isLiked = likedPosts.includes(post.id);
            const isMyPost = post.author === "나";
            return (
              <div key={post.id} onClick={() => setSelectedPost(post)} className="bg-white p-6 rounded-[2rem] border border-gray-100 hover:border-blue-200 shadow-sm transition-all cursor-pointer group relative">
                {isMyPost && (
                  <button onClick={(e) => handleDeletePost(post.id, e)} className="absolute top-6 right-6 text-xs font-bold text-gray-300 hover:text-red-500 transition-colors">삭제</button>
                )}
                <h3 className="text-lg font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors pr-10">{post.title}</h3>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <span className="text-[11px] font-bold text-gray-400">{post.author} | {post.comments.length}개의 답변</span>
                  <button 
                    onClick={(e) => handleLikeToggle(post.id, e)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all cursor-pointer ${isLiked ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                  >
                    <span className="text-sm">🛡️</span>
                    <span className="text-xs font-black">{post.likes}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* 상세 보기 모달 */}
      {selectedPost && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center">
          <div className="bg-white w-full max-w-xl rounded-t-[3rem] md:rounded-[3rem] h-[85vh] md:h-auto md:max-h-[85vh] flex flex-col shadow-2xl animate-slide-up">
            <div className="p-6 border-b flex justify-between items-center bg-white rounded-t-[3rem]">
              <h4 className="font-black text-gray-800">상세 보기</h4>
              <button onClick={() => setSelectedPost(null)} className="p-2 bg-gray-100 rounded-full text-sm font-bold cursor-pointer">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <h2 className="text-2xl font-black text-gray-900 leading-tight">{selectedPost.title}</h2>
              <p className="text-gray-600 font-medium">{selectedPost.content}</p>

              <div className="pt-6 border-t border-gray-50 space-y-4">
                <p className="text-xs font-black text-blue-600 uppercase">답변들 ({selectedPost.comments.length})</p>
                {selectedPost.comments.map((c: any) => {
                  const isMyComment = c.author === "나 (세입자)";
                  return (
                    <div key={c.id} className="bg-blue-50/50 p-5 rounded-[2rem] border-l-4 border-blue-500 relative group/comment">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-black text-blue-800">{c.author}</p>
                        {isMyComment && (
                          <button onClick={() => handleDeleteComment(selectedPost.id, c.id)} className="text-[10px] font-bold text-gray-400 hover:text-red-500 cursor-pointer">삭제</button>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 font-medium">{c.text}</p>
                    </div>
                  )
                })}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex gap-2">
              <input type="text" placeholder="댓글을 입력하세요" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()} className="flex-1 p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold text-sm" />
              <button onClick={handleCommentSubmit} className="px-6 py-4 bg-gray-900 text-white font-black rounded-2xl shadow-lg cursor-pointer">등록</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
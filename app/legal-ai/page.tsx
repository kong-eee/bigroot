'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
// 🚨 [필수] 마크다운 부품들을 가져오는 코드가 추가되었습니다.
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import lawData from '@/data/housing_law.json';

interface Message {
  id: number;
  role: 'user' | 'ai';
  content: string;
  lawTitle?: string;
}

export default function LegalAIPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'ai', content: '안녕하세요! 주택임대차보호법 기반 근방 AI입니다. 궁금하신 내용을 말씀해 주세요.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const findRelevantLaw = (query: string) => {
    const cleanQuery = query.replace(/\s+/g, '').toLowerCase();
    const synonymMap: { [key: string]: string[] } = {
      "차임": ["월세", "임대료", "집세", "돈"],
      "증액": ["인상", "올려", "올린", "상승"],
      "기간": ["2년", "1년", "미만", "연장", "더살"],
      "갱신": ["요구", "다시", "한번더"]
    };
    let expandedQuery = cleanQuery;
    Object.entries(synonymMap).forEach(([official, populars]) => {
      if (populars.some(p => cleanQuery.includes(p))) expandedQuery += official;
    });
    const results = lawData.filter((law: any) => {
      const title = law.title.replace(/\s+/g, '').toLowerCase();
      const content = law.content.replace(/\s+/g, '').toLowerCase();
      const keywords = law.keywords.map((k: string) => k.replace(/\s+/g, '').toLowerCase());
      return (
        keywords.some((k: string) => expandedQuery.includes(k) || k.includes(cleanQuery)) ||
        title.includes(cleanQuery) || title.includes(expandedQuery) ||
        content.includes(cleanQuery) || content.includes(expandedQuery)
      );
    });
    return results.length > 0 ? results.sort((a: any, b: any) => a.title.length - b.title.length)[0] : null;
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userQuery = input;
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: userQuery }]);
    setInput('');
    setIsTyping(true);
    const foundLaw = findRelevantLaw(userQuery);
    let aiResponse = "";
    let lawTitle = foundLaw?.title;
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: userQuery, 
          lawText: foundLaw ? foundLaw.content : "관련된 특정 조문을 찾지 못했습니다. 일반적인 주택임대차보호법 지식으로 답변해 주세요." 
        }),
      });
      const data = await response.json();
      aiResponse = response.ok ? data.text : (data.error || "에러 발생");
    } catch (error) {
      aiResponse = "서버 연결에 실패했습니다.";
    }
    setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', content: aiResponse, lawTitle: lawTitle }]);
    setIsTyping(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <header className="p-6 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:text-blue-600 transition-colors p-2 rounded-xl hover:bg-gray-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-xl font-extrabold tracking-tighter">근방 부동산 AI 🤖</h1>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-3xl mx-auto w-full">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            {/* --- 말풍선 박스 유지 --- */}
            <div className={`p-5 rounded-3xl shadow-sm max-w-[85%]
              ${msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}
            >
              {/* --- 마크다운 엔진 적용 부분 --- */}
              <div className={`prose prose-sm md:prose-base max-w-none 
                ${msg.role === 'user' ? 'prose-invert text-white' : 'text-gray-800'}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
            
            {msg.lawTitle && (
              <div className="mt-2 text-xs bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 w-[80%] opacity-80">
                <p className="font-bold mb-1">📜 참고 법령: {msg.lawTitle}</p>
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="bg-white rounded-3xl p-5 border border-gray-100 flex gap-2 w-16 animate-pulse">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
          </div>
        )}
      </div>

      <footer className="p-4 bg-white border-t border-gray-100 mt-auto">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="relative flex items-center bg-gray-100 p-2 rounded-3xl focus-within:ring-2 focus-within:ring-blue-500 transition-all shadow-inner">
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="w-full p-4 bg-transparent outline-none text-gray-900"
              placeholder="질문을 입력하세요..."
            />
            <button 
              onClick={handleSend} 
              className="absolute right-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:bg-gray-400" 
              disabled={isTyping}
            >
              전송
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
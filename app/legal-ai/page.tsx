'use client';

import React, { useState, useEffect, useRef } from 'react';
// 🚨 [필수] 마크다운 부품들을 가져오는 코드가 추가되었습니다.
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import lawData from '@/data/housing_law.json';
import {
  findRelevantLaws,
  formatLawExcerpt,
  formatLawTitles,
  type HousingLawArticle,
} from '@/lib/legal-ai';
import PageHero from '@/app/components/layout/PageHero';

interface Message {
  id: number;
  role: 'user' | 'ai';
  content: string;
  lawTitle?: string;
}

export default function LegalAIPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'ai', content: '안녕하세요! 주택임대차보호법 조문을 바탕으로 쉽게 풀어 드리는 근방 AI예요. 변호사가 아닌 안내 도우미이니, 궁금한 점을 편하게 물어봐 주세요.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userQuery = input;
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: userQuery }]);
    setInput('');
    setIsTyping(true);
    const foundLaws = findRelevantLaws(userQuery, lawData as HousingLawArticle[]);
    let aiResponse = "";
    let lawTitle = foundLaws.length > 0 ? formatLawTitles(foundLaws) : undefined;
    const lawExcerpt = foundLaws.length > 0 ? formatLawExcerpt(foundLaws) : "";
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userQuery,
          lawExcerpt,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        aiResponse = data.text ?? "응답을 받지 못했습니다.";
        if (data.lawRefs) lawTitle = data.lawRefs;
      } else if (data.error === "GEMINI_KEY_NOT_CONFIGURED") {
        aiResponse =
          data.message ??
          "AI 서비스 키가 배포 환경에 등록되지 않았습니다. 관리자에게 GOOGLE_GEMINI_API_KEY 설정을 요청해 주세요.";
      } else {
        aiResponse = data.message || data.details || data.error || "일시적인 오류가 발생했습니다.";
      }
    } catch (error) {
      aiResponse = "서버 연결에 실패했습니다.";
    }
    setMessages(prev => [...prev, {
      id: Date.now() + 1,
      role: 'ai',
      content: aiResponse,
      lawTitle,
    }]);
    setIsTyping(false);
  };

  return (
    <div className="page-main flex flex-col min-h-[calc(100vh-var(--nav-height))]">
      <div className="page-container max-w-3xl w-full flex flex-col flex-1 min-h-0">
      <PageHero
        badge="근방 AI"
        title="주택임대차보호법, 쉽게 물어보기"
        description="조문을 바탕으로 안내해 드려요. 법률 자문이 아닌 정보 제공 서비스입니다."
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-4 space-y-6 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            {/* --- 말풍선 박스 유지 --- */}
            <div className={`p-5 rounded-3xl shadow-sm max-w-[85%]
              ${msg.role === 'user' 
                ? 'bg-[var(--brand)] text-white rounded-br-none' 
                : 'ui-card rounded-bl-none'}`}
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

      <footer className="pt-4 border-t border-[var(--border)] mt-auto shrink-0">
        <div className="space-y-3">
          <div className="relative flex items-center bg-[var(--bg-muted)] p-2 rounded-2xl border border-[var(--border)]">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="ui-input border-0 bg-transparent shadow-none min-h-0"
              placeholder="질문을 입력하세요..."
            />
            <button
              type="button"
              onClick={handleSend}
              className="ui-btn-primary shrink-0 text-sm"
              disabled={isTyping}
            >
              전송
            </button>
          </div>
          <p className="text-center text-xs text-[var(--text-muted)] font-medium">
            법령 조문 기반 안내이며 법률 자문이 아닙니다.
          </p>
        </div>
      </footer>
      </div>
    </div>
  );
}
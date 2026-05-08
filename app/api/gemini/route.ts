import { GoogleGenAI } from "@google/genai"; // @google/genai 패키지 사용
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API Key Missing" }, { status: 500 });

  try {
    const { query, lawText } = await request.json();

    /**
     * [🚨 해결의 핵심] 
     * 가이드에 따르면, Gemini 3 시리즈 같은 프리뷰 모델은 
     * 반드시 apiVersion을 'v1beta'로 명시해야만 구글 서버가 인식합니다.
     */
    const client = new GoogleGenAI({ 
      apiKey: apiKey,
      apiVersion: 'v1beta' // 404 에러를 잡는 마법의 한 줄입니다.
    });

    /**
     * [🚨 모델명 매칭]
     * 2026년 4월 가이드 기준, 프리뷰 모델은 이름 뒤에 반드시 '-preview'가 붙어야 합니다.
     * 2.0 모델이 신규 유저에게 차단되었다면, 아래 3.0 프리뷰가 유일한 답입니다.
     */
    const modelName = "gemini-3-flash-preview"; 

    const response = await client.models.generateContent({
      model: modelName,
      contents: [{
        role: "user",
        parts: [{
          text: `당신은 주택임대차보호법 전문 변호사입니다.\n세입자 질문: ${query}\n참고 법령: ${lawText}`
        }]
      }]
    });

    // 신형 SDK는 response.text()가 아니라 .text 속성을 바로 사용합니다.
    return NextResponse.json({ text: response.text });

  } catch (error: any) {
    console.error("🚨 가이드 기반 최종 에러:", error.message);
    
    // 503 에러 발생 시 재시도 안내
    return NextResponse.json({ 
      error: "AI 서버 응답 지연", 
      details: "현재 사용자가 많습니다. 5초 뒤에 다시 시도해 주세요." 
    }, { status: 503 });
  }
}
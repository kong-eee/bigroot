import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { GEMINI_KEY_ENV_NAME, getGeminiApiKey } from "@/lib/gemini-env";
import {
  buildLegalAiPrompt,
  LEGAL_AI_MAX_OUTPUT_TOKENS,
  sanitizeLegalAiResponse,
} from "@/lib/legal-ai";

export async function POST(request: Request) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "GEMINI_KEY_NOT_CONFIGURED",
        message:
          "Gemini API 키가 서버에 설정되지 않았습니다. Vercel 대시보드 → Settings → Environment Variables에 GOOGLE_GEMINI_API_KEY를 추가한 뒤 재배포해 주세요.",
        envName: GEMINI_KEY_ENV_NAME,
      },
      { status: 503 }
    );
  }

  try {
    const { query, lawExcerpt } = await request.json();
    const q = typeof query === "string" ? query.trim() : "";
    const excerpt = typeof lawExcerpt === "string" ? lawExcerpt.trim() : "";

    if (!q) {
      return NextResponse.json({ error: "질문이 비어 있습니다." }, { status: 400 });
    }

    if (!excerpt) {
      return NextResponse.json({
        text:
          "질문과 관련된 조문을 찾지 못했어요. ‘갱신’, ‘보증금’, ‘퇴실 통보’처럼 조금 더 구체적으로 다시 물어봐 주세요. (법령 JSON 기준으로만 안내해요)",
        skippedApi: true,
      });
    }

    const client = new GoogleGenAI({
      apiKey,
      apiVersion: "v1beta",
    });

    const modelName = "gemini-3-flash-preview";

    const response = await client.models.generateContent({
      model: modelName,
      contents: [
        {
          role: "user",
          parts: [{ text: buildLegalAiPrompt(q, excerpt) }],
        },
      ],
      config: {
        maxOutputTokens: LEGAL_AI_MAX_OUTPUT_TOKENS,
        temperature: 0.35,
      },
    });

    // 신형 SDK는 response.text()가 아니라 .text 속성을 바로 사용합니다.
    const raw = response.text ?? "";
    return NextResponse.json({ text: sanitizeLegalAiResponse(raw) || raw });

  } catch (error: any) {
    console.error("🚨 가이드 기반 최종 에러:", error.message);
    
    // 503 에러 발생 시 재시도 안내
    return NextResponse.json({ 
      error: "AI 서버 응답 지연", 
      details: "현재 사용자가 많습니다. 5초 뒤에 다시 시도해 주세요." 
    }, { status: 503 });
  }
}
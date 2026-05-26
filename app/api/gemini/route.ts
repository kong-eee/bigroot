import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { GEMINI_KEY_ENV_NAME, getGeminiApiKey } from "@/lib/gemini-env";
import lawData from "@/data/housing_law.json";
import {
  buildLegalAiPrompt,
  formatLawTitles,
  LEGAL_AI_MAX_OUTPUT_TOKENS,
  resolveLawContext,
  sanitizeLegalAiResponse,
  type HousingLawArticle,
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
    const clientExcerpt = typeof lawExcerpt === "string" ? lawExcerpt : "";

    if (!q) {
      return NextResponse.json({ error: "질문이 비어 있습니다." }, { status: 400 });
    }

    const { excerpt, laws } = resolveLawContext(
      q,
      lawData as HousingLawArticle[],
      clientExcerpt
    );

    if (!excerpt) {
      return NextResponse.json({
        text:
          "관련 조문을 찾기 어려워요. ‘보증금 반환’, ‘월세 인상’, ‘퇴실 통보’처럼 상황을 한 줄 더 적어 주시면 조문을 읽고 답해 드릴게요.",
        skippedApi: true,
        lawRefs: [],
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
    let text = sanitizeLegalAiResponse(raw) || raw;

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason === "MAX_TOKENS" && text.length > 0) {
      text += "\n\n_(답변이 길어 일부만 표시됐을 수 있어요. 더 궁금한 점을 이어서 질문해 주세요.)_";
    }

    const lawRefs = laws.length > 0 ? formatLawTitles(laws) : undefined;
    return NextResponse.json({ text, lawRefs });

  } catch (error: any) {
    console.error("🚨 가이드 기반 최종 에러:", error.message);
    
    // 503 에러 발생 시 재시도 안내
    return NextResponse.json({ 
      error: "AI 서버 응답 지연", 
      details: "현재 사용자가 많습니다. 5초 뒤에 다시 시도해 주세요." 
    }, { status: 503 });
  }
}
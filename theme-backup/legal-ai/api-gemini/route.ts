import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { GEMINI_KEY_ENV_NAME, getGeminiApiKey } from "@/lib/gemini-env";
import lawData from "@/data/housing_law.json";
import {
  buildLegalAiPrompt,
  buildOfflineLegalAnswer,
  formatLawTitles,
  LEGAL_AI_MAX_OUTPUT_TOKENS,
  resolveLawContext,
  sanitizeLegalAiResponse,
  type HousingLawArticle,
} from "@/lib/legal-ai";

const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-3-flash-preview"] as const;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseGeminiError(error: unknown): { status?: number; code?: string; message: string } {
  const err = error as { status?: number; message?: string };
  const raw = err.message ?? String(error);
  try {
    const parsed = JSON.parse(raw) as {
      error?: { code?: number | string; message?: string; status?: string };
    };
    return {
      status: err.status ?? (Number(parsed.error?.code) || undefined),
      code: parsed.error?.status,
      message: parsed.error?.message ?? raw,
    };
  } catch {
    return { status: err.status, message: raw };
  }
}

function isQuotaError(error: ReturnType<typeof parseGeminiError>): boolean {
  return (
    error.status === 429 ||
    /RESOURCE_EXHAUSTED|quota|credit|billing|depleted/i.test(error.message)
  );
}

function isRetryableError(error: ReturnType<typeof parseGeminiError>): boolean {
  return (
    error.status === 503 ||
    error.status === 500 ||
    error.code === "UNAVAILABLE" ||
    /overloaded|try again|temporarily/i.test(error.message)
  );
}

async function generateWithGemini(
  client: GoogleGenAI,
  prompt: string
): Promise<{ text: string; model: string }> {
  let lastError: ReturnType<typeof parseGeminiError> = { message: "unknown" };

  for (const modelName of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            maxOutputTokens: LEGAL_AI_MAX_OUTPUT_TOKENS,
            temperature: 0.35,
          },
        });

        const raw = response.text ?? "";
        let text = sanitizeLegalAiResponse(raw) || raw;
        const finishReason = response.candidates?.[0]?.finishReason;
        if (finishReason === "MAX_TOKENS" && text.length > 0) {
          text +=
            "\n\n_(답변이 길어 일부만 표시됐을 수 있어요. 더 궁금한 점을 이어서 질문해 주세요.)_";
        }
        if (text.trim()) return { text, model: modelName };
      } catch (error) {
        lastError = parseGeminiError(error);
        if (isQuotaError(lastError)) break;
        if (isRetryableError(lastError) && attempt === 0) {
          await sleep(1200);
          continue;
        }
        break;
      }
    }
    if (isQuotaError(lastError)) break;
  }

  throw lastError;
}

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

  let query = "";
  let laws: HousingLawArticle[] = [];

  try {
    const { query: rawQuery, lawExcerpt } = await request.json();
    query = typeof rawQuery === "string" ? rawQuery.trim() : "";
    const clientExcerpt = typeof lawExcerpt === "string" ? lawExcerpt : "";

    if (!query) {
      return NextResponse.json({ error: "질문이 비어 있습니다." }, { status: 400 });
    }

    const context = resolveLawContext(query, lawData as HousingLawArticle[], clientExcerpt);
    laws = context.laws;
    const { excerpt } = context;

    if (!excerpt) {
      return NextResponse.json({
        text:
          "관련 조문을 찾기 어려워요. ‘보증금 반환’, ‘월세 인상’, ‘퇴실 통보’처럼 상황을 한 줄 더 적어 주시면 조문을 읽고 답해 드릴게요.",
        skippedApi: true,
        lawRefs: [],
      });
    }

    const lawRefs = laws.length > 0 ? formatLawTitles(laws) : undefined;
    const offlineAnswer = buildOfflineLegalAnswer(query, laws);

    try {
      const client = new GoogleGenAI({ apiKey, apiVersion: "v1beta" });
      const { text, model } = await generateWithGemini(
        client,
        buildLegalAiPrompt(query, excerpt)
      );
      return NextResponse.json({ text, lawRefs, source: "gemini", model });
    } catch (geminiError) {
      const parsed = parseGeminiError(geminiError);
      console.error("Gemini legal-ai error:", parsed.status, parsed.message);

      if (offlineAnswer) {
        return NextResponse.json({
          text: offlineAnswer,
          lawRefs,
          source: "offline",
          notice: isQuotaError(parsed)
            ? "AI 서버 사용량 한도로 조문 기반 안내를 표시합니다."
            : "AI 서버 응답 지연으로 조문 기반 안내를 표시합니다.",
        });
      }

      if (isQuotaError(parsed)) {
        return NextResponse.json(
          {
            error: "GEMINI_QUOTA_EXCEEDED",
            message:
              "AI 서버 사용 한도에 도달했습니다. Google AI Studio에서 결제·크레딧을 확인해 주세요. 잠시 후 다시 시도해 주세요.",
          },
          { status: 503 }
        );
      }

      if (isRetryableError(parsed)) {
        return NextResponse.json(
          {
            error: "AI_SERVER_BUSY",
            message: "AI 서버가 일시적으로 바쁩니다. 잠시 후 다시 시도해 주세요.",
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error: "AI_GENERATION_FAILED",
          message: "답변 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Legal AI route error:", error);
    const offlineAnswer = query ? buildOfflineLegalAnswer(query, laws) : null;
    if (offlineAnswer) {
      return NextResponse.json({
        text: offlineAnswer,
        lawRefs: laws.length > 0 ? formatLawTitles(laws) : undefined,
        source: "offline",
        notice: "일시 오류로 조문 기반 안내를 표시합니다.",
      });
    }
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "일시적인 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

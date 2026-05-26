/** Gemini 입력·과금 절감용 상수 */
export const LEGAL_AI_MAX_LAW_CHARS = 2_400;
export const LEGAL_AI_MAX_OUTPUT_TOKENS = 900;
export const LEGAL_AI_MAX_ARTICLES = 2;

export type HousingLawArticle = {
  id?: string;
  title: string;
  content: string;
  keywords: string[];
};

export function formatLawTitles(articles: HousingLawArticle[]): string {
  return articles
    .map((law) => {
      const m = law.title.match(/^제\d+조(?:의\d+)?/);
      return m ? m[0] : law.title.slice(0, 24);
    })
    .join(", ");
}

export function formatLawExcerpt(articles: HousingLawArticle[]): string {
  const parts = articles.map((law) => {
    const body = [law.title.trim(), law.content.trim()].filter(Boolean).join("\n");
    return body;
  });
  const combined = parts.join("\n\n---\n\n");
  if (combined.length <= LEGAL_AI_MAX_LAW_CHARS) return combined;
  return `${combined.slice(0, LEGAL_AI_MAX_LAW_CHARS)}…(발췌)`;
}

export const LEGAL_AI_SYSTEM_RULES = `역할: 주택임대차보호법을 쉽게 풀어 주는 안내 도우미 "근방 AI"입니다.
말투: 친근한 존댓말(해요체). 딱딱한 법률 문서 말투는 피하고, 세입자가 이해하기 쉽게 설명합니다.
금지: "변호사", "법률 자문", "법률 대리" 등 전문가·자문 표현. 법령에 없는 내용 추측·창작.
시작: "안녕하세요", "전문 변호사", 자기소개 문장으로 답변을 시작하지 마세요. 바로 핵심부터 설명하세요.
규칙:
- 아래 [법령 발췌]만 근거로 답합니다. 발췌에 없는 세부는 "이 부분은 제공된 조문만으로는 확실히 말씀드리기 어려워요"라고 합니다.
- 답변 맨 아래 한 줄: ※ 본 안내는 정보 제공이며, 중요한 결정은 주민센터·법률구조공단(132) 등에 확인하세요.
- 500자 전후로 간결히, 필요 시 번호 목록 사용.`;

/** 모델이 금지 표현을 쓴 경우 배포 응답에서 제거 */
export function sanitizeLegalAiResponse(text: string): string {
  return text
    .replace(
      /^안녕하세요[.!]?\s*(주택임대차보호법\s*)?(전문\s*)?변호사입니다[.!]?\s*/i,
      ""
    )
    .replace(/전문\s*변호사/g, "안내 도우미")
    .replace(/변호사입니다/g, "안내 도우미예요")
    .trim();
}

export function buildLegalAiPrompt(query: string, lawExcerpt: string): string {
  return `${LEGAL_AI_SYSTEM_RULES}

[법령 발췌]
${lawExcerpt}

[질문]
${query.trim()}`;
}

export function findRelevantLaws(
  query: string,
  lawData: HousingLawArticle[]
): HousingLawArticle[] {
  const cleanQuery = query.replace(/\s+/g, "").toLowerCase();
  const synonymMap: Record<string, string[]> = {
    차임: ["월세", "임대료", "집세", "돈"],
    증액: ["인상", "올려", "올린", "상승"],
    기간: ["2년", "1년", "미만", "연장", "더살", "만기", "끝나"],
    갱신: ["요구", "다시", "한번더", "묵시", "자동연장"],
    해지: ["퇴실", "이사", "나가", "통보", "알리", "말을", "얘기"],
  };

  let expandedQuery = cleanQuery;
  for (const [official, populars] of Object.entries(synonymMap)) {
    if (populars.some((p) => cleanQuery.includes(p))) expandedQuery += official;
  }

  const scored = lawData
    .map((law) => {
      const title = law.title.replace(/\s+/g, "").toLowerCase();
      const content = law.content.replace(/\s+/g, "").toLowerCase();
      const keywords = law.keywords.map((k) => k.replace(/\s+/g, "").toLowerCase());

      let score = 0;
      if (keywords.some((k) => expandedQuery.includes(k) || k.includes(cleanQuery))) score += 3;
      if (title.includes(cleanQuery) || title.includes(expandedQuery)) score += 2;
      if (content.includes(cleanQuery) || content.includes(expandedQuery)) score += 1;

      return { law, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.law.title.length - b.law.title.length);

  const top = scored.slice(0, LEGAL_AI_MAX_ARTICLES).map((s) => s.law);
  return top;
}

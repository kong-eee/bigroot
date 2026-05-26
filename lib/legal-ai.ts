/** Gemini 입력·과금 절감용 상수 */
export const LEGAL_AI_MAX_LAW_CHARS = 3_200;
/** 한글은 토큰 소모가 커서 1000이면 문장 중간에 잘림 → 2048 권장 */
export const LEGAL_AI_MAX_OUTPUT_TOKENS = 2_048;
export const LEGAL_AI_MAX_ARTICLES = 3;

export type HousingLawArticle = {
  id?: string;
  title: string;
  content: string;
  keywords: string[];
};

/** 질문에서 검색용 토큰 추출 (2글자 이상 한글·숫자구) */
export function extractQueryTokens(query: string): string[] {
  const normalized = query.replace(/\s+/g, " ").trim().toLowerCase();
  const tokens = new Set<string>();
  for (const w of normalized.match(/[가-힣]{2,}/g) ?? []) tokens.add(w);
  for (const w of normalized.match(/\d+개월|\d+년/g) ?? []) tokens.add(w);
  if (normalized.length <= 12) tokens.add(normalized.replace(/\s/g, ""));
  return [...tokens].filter((t) => t.length >= 2);
}

const SYNONYM_MAP: Record<string, string[]> = {
  차임: ["월세", "임대료", "집세", "집세", "돈"],
  증액: ["인상", "올려", "올린", "상승", "인상"],
  기간: ["2년", "1년", "미만", "연장", "더살", "만기", "끝나", "만료", "만든"],
  갱신: [
    "요구",
    "다시",
    "한번더",
    "묵시",
    "자동연장",
    "연장",
    "계약끝",
    "끝나기",
    "6개월",
    "2개월",
    "통지",
    "통보",
    "말못",
    "말을",
    "알리",
  ],
  해지: ["퇴실", "이사", "나가", "나갈", "퇴거", "해지", "나가기"],
  보증금: ["전세", "보증", "반환", "돌려"],
};

/** 퇴실·만기·2개월 등이 같이 나오면 갱신·해지 조문 후보에 가산 */
function expandTokens(tokens: string[]): string[] {
  const set = new Set(tokens);
  const joined = tokens.join("");

  for (const [canonical, aliases] of Object.entries(SYNONYM_MAP)) {
    if (tokens.some((t) => t === canonical || aliases.some((a) => joined.includes(a) || t.includes(a)))) {
      set.add(canonical);
      aliases.forEach((a) => set.add(a));
    }
  }

  if (["퇴실", "만기", "2개월", "6개월", "통지", "통보", "나가", "이사"].some((h) => joined.includes(h))) {
    set.add("갱신");
    set.add("묵시");
    set.add("해지");
    set.add("2개월");
    set.add("6개월");
  }

  return [...set];
}

function lawHaystack(law: HousingLawArticle): string {
  return `${law.title} ${law.content} ${law.keywords.join(" ")}`
    .replace(/\s+/g, "")
    .toLowerCase();
}

function scoreLaw(law: HousingLawArticle, tokens: string[]): number {
  const hay = lawHaystack(law);
  let score = 0;

  for (const token of tokens) {
    const t = token.replace(/\s+/g, "").toLowerCase();
    if (t.length < 2) continue;
    if (hay.includes(t)) score += t.length >= 4 ? 4 : 3;
  }

  for (const kw of law.keywords) {
    const kn = kw.replace(/\s+/g, "").toLowerCase();
    for (const token of tokens) {
      const t = token.replace(/\s+/g, "").toLowerCase();
      if (t.length < 2) continue;
      if (kn.includes(t) || t.includes(kn)) score += 5;
    }
  }

  const articleNo = law.title.match(/^제\d+조(?:의\d+)?/)?.[0] ?? "";
  if (articleNo === "제6조" && tokens.some((t) => ["갱신", "묵시", "2개월", "6개월", "만기", "퇴실"].includes(t))) {
    score += 6;
  }
  if (articleNo === "제6조의2" && tokens.some((t) => ["퇴실", "해지", "나가", "갱신", "묵시"].includes(t))) {
    score += 5;
  }

  return score;
}

function pickByTitlePrefix(
  lawData: HousingLawArticle[],
  matchers: RegExp[]
): HousingLawArticle[] {
  const picked: HousingLawArticle[] = [];
  for (const re of matchers) {
    const found = lawData.find((l) => re.test(l.title));
    if (found && !picked.includes(found)) picked.push(found);
  }
  return picked;
}

/** 점수 0일 때 주제별 기본 조문 (과금 최소·답변 확실) */
function fallbackLaws(lawData: HousingLawArticle[], tokens: string[]): HousingLawArticle[] {
  const joined = tokens.join("");

  if (/퇴실|만기|갱신|묵시|2개월|6개월|통지|통보|해지|이사|나가|연장|만료/.test(joined)) {
    return pickByTitlePrefix(lawData, [
      /^제6조\(계약의 갱신\)/,
      /^제6조의2\(묵시적 갱신/,
    ]);
  }
  if (/보증금|전세|반환/.test(joined)) {
    return pickByTitlePrefix(lawData, [/^제3조의2\(보증금/, /^제4조/]);
  }
  if (/월세|차임|증액|인상|집세/.test(joined)) {
    return pickByTitlePrefix(lawData, [/^제7조/, /^제6조의3/]);
  }
  if (/대항|전입|등기|우선/.test(joined)) {
    return pickByTitlePrefix(lawData, [/^제3조\(대항력/]);
  }

  return [];
}

export function findRelevantLaws(
  query: string,
  lawData: HousingLawArticle[]
): HousingLawArticle[] {
  const rawTokens = extractQueryTokens(query);
  const tokens = expandTokens(rawTokens);
  if (tokens.length === 0) return [];

  const scored = lawData
    .map((law) => ({ law, score: scoreLaw(law, tokens) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.law.title.length - b.law.title.length);

  let top = scored.slice(0, LEGAL_AI_MAX_ARTICLES).map((s) => s.law);

  if (top.length === 0) {
    top = fallbackLaws(lawData, tokens).slice(0, LEGAL_AI_MAX_ARTICLES);
  }

  if (top.length === 0 && rawTokens.length === 1) {
    const single = rawTokens[0]!.replace(/\s+/g, "").toLowerCase();
    const loose = lawData
      .map((law) => {
        const hay = lawHaystack(law);
        return { law, hit: hay.includes(single) ? single.length : 0 };
      })
      .filter((x) => x.hit > 0)
      .sort((a, b) => b.hit - a.hit);
    top = loose.slice(0, LEGAL_AI_MAX_ARTICLES).map((x) => x.law);
  }

  return top;
}

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

export const LEGAL_AI_SYSTEM_RULES = `역할: 주택임대차보호법 조문을 읽고 세입자 질문에 맞게 풀어 쓰는 안내 도우미 "근방 AI"입니다.
말투: 친근한 존댓말(해요체). 질문 상황을 먼저 짚고, 조문 근거로 실질적인 답을 해요.
금지: "변호사", "법률 자문", "법률 대리" 표현. 조문에 없는 내용은 추측하지 말고 그렇게 밝혀요.
시작: 인사·자기소개 없이 바로 답변. "안녕하세요, 변호사입니다" 금지.
규칙:
- [법령 발췌]를 꼼꼼히 읽고 질문(언제 퇴실, 만기일 퇴실 가능 여부 등)에 직접 답하세요.
- 발췌에 근거가 있으면 "불가능" "가능" "○개월 전 통지" 등을 분명히 말하세요.
- 발췌에 없는 세부만 "조문만으로는 확실히 어렵다"고 하세요.
- 질문에 여러 쟁점(예: 묵시적 갱신, 퇴실 시점, 만기일 퇴실)이 있으면 번호 목록으로 빠짐없이 답하고, 문장을 중간에 끊지 말고 끝까지 완결하세요.
- 마지막 한 줄: ※ 정보 안내이며, 중요한 결정은 주민센터·법률구조공단(132)에 확인하세요.`;

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

export function resolveLawContext(
  query: string,
  lawData: HousingLawArticle[],
  clientExcerpt?: string
): { excerpt: string; laws: HousingLawArticle[] } {
  const trimmed = clientExcerpt?.trim() ?? "";
  const laws = findRelevantLaws(query, lawData);
  const excerpt = trimmed || (laws.length > 0 ? formatLawExcerpt(laws) : "");
  return { excerpt, laws };
}

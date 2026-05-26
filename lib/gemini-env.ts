/** Server-only: Gemini API key from env (Vercel / .env.local). */
export function getGeminiApiKey(): string | undefined {
  const key =
    process.env.GOOGLE_GEMINI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim();
  return key || undefined;
}

export const GEMINI_KEY_ENV_NAME = "GOOGLE_GEMINI_API_KEY";

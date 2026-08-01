import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createLovableAI() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey: key,
    headers: {
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });

}

export const DEFAULT_MODEL = "google/gemini-3.6-flash";

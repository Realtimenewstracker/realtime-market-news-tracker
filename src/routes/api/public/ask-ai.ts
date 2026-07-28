import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { createLovableAI, DEFAULT_MODEL } from "@/lib/ai-gateway.server";

export const Route = createFileRoute("/api/public/ask-ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as
          | { articleId?: string; question?: string }
          | null;
        if (!body?.articleId || !body?.question) {
          return new Response("Missing articleId or question", { status: 400 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: article } = await supabaseAdmin
          .from("news_articles")
          .select("title,summary,ai_summary,source,category,tickers,regions,published_at,url")
          .eq("id", body.articleId)
          .maybeSingle();
        if (!article) return new Response("Article not found", { status: 404 });

        const ai = createLovableAI();
        const result = streamText({
          model: ai(DEFAULT_MODEL),
          system: `You are an assistant for Indian-market traders. Be concise, factual, and quantitative when possible. If uncertain, say so. Never invent prices, news, or numbers.`,
          prompt: `Article:
Title: ${article.title}
Source: ${article.source} (${article.category})
Published: ${article.published_at}
Summary: ${article.ai_summary || article.summary || "n/a"}
Tickers: ${(article.tickers ?? []).join(", ") || "n/a"}
Regions: ${(article.regions ?? []).join(", ") || "n/a"}
URL: ${article.url}

User question: ${body.question}

Answer in 4-8 sentences.`,
          temperature: 0.3,
        });
        return result.toTextStreamResponse();
      },
    },
  },
});

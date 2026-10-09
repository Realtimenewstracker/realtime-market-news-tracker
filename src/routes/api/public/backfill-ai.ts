import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createLovableAI, DEFAULT_MODEL } from "@/lib/ai-gateway.server";
import { REGIONS, articleRegions } from "@/lib/regions";
import { classifyText } from "@/lib/classify";
import { requireCronSecret } from "@/lib/cron-auth.server";

/**
 * Backfills ai_summary / impact / sentiment / tickers / regions for older rows
 * that were ingested before AI enrichment worked. Processes one batch per call
 * so it can be driven by cron until `remaining` reaches 0.
 */
export const Route = createFileRoute("/api/public/backfill-ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauthorized = await requireCronSecret(request);
        if (unauthorized) return unauthorized;

        const url = new URL(request.url);
        const limit = Math.max(1, Math.min(50, Number(url.searchParams.get("limit")) || 25));

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: rows, error } = await supabaseAdmin
          .from("news_articles")
          .select("id,title,summary,tickers")
          .is("ai_summary", null)
          .order("published_at", { ascending: false })
          .limit(limit);
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
        if (!rows?.length) return Response.json({ ok: true, processed: 0, remaining: 0 });

        let provider: ReturnType<typeof createLovableAI> | null = null;
        try {
          provider = createLovableAI();
        } catch {
          return Response.json({ ok: false, error: "Missing LOVABLE_API_KEY" }, { status: 500 });
        }

        let processed = 0;
        let failed = 0;
        const valid = new Set<string>(REGIONS);

        // Sequential: the AI gateway rate-limits bursts, and a 429 storm would
        // leave the whole batch unclassified.
        for (const row of rows) {
          const guess = classifyText(row.title, row.summary ?? "");
          let aiSummary = (row.summary ?? row.title).slice(0, 240);
          let sentiment: string = guess.sentiment;
          let impact = guess.impact;
          let tickers: string[] = row.tickers ?? [];
          let aiRegions: string[] = [];

          try {
            const { text } = await generateText({
              model: provider!(DEFAULT_MODEL),
              prompt: `You classify Indian-market news for traders.
Return STRICT JSON with keys: summary (<=180 chars, plain English, no hype), sentiment (bullish|bearish|neutral), impact (0-3 integer, 3 = market-moving), tickers (array of NSE/BSE symbols like RELIANCE, TCS if clearly implied, else []), regions (array from: India, US, China, Europe, Middle East, Global).

Headline: ${row.title}
Body: ${row.summary ?? ""}`,
              maxOutputTokens: 300,
              temperature: 0.2,
            });
            const parsed = extractJson(text);
            if (parsed) {
              const sent = String(parsed.sentiment ?? "");
              if (sent === "bullish" || sent === "bearish" || sent === "neutral") sentiment = sent;
              const imp = Number(parsed.impact);
              if (Number.isFinite(imp)) impact = Math.max(0, Math.min(3, imp));
              if (Array.isArray(parsed.tickers)) {
                tickers = parsed.tickers.filter((t: unknown): t is string => typeof t === "string").slice(0, 6);
              }
              const s = String(parsed.summary ?? "").slice(0, 240);
              if (s) aiSummary = s;
              aiRegions = (Array.isArray(parsed.regions) ? parsed.regions : [])
                .filter((r: unknown): r is string => typeof r === "string" && valid.has(r))
                .slice(0, 4);
            }
          } catch (e) {
            failed += 1;
            console.warn("[backfill-ai] AI failed, using heuristic", row.id, e);
          }

          const { error: upErr } = await supabaseAdmin
            .from("news_articles")
            .update({
              ai_summary: aiSummary,
              sentiment,
              impact,
              tickers,
              regions: aiRegions.length
                ? aiRegions
                : articleRegions({ title: row.title, summary: row.summary, ai_summary: aiSummary, tickers }),
            })
            .eq("id", row.id);
          if (upErr) console.warn("[backfill-ai] update failed", row.id, upErr.message);
          else processed += 1;
        }


        const { count } = await supabaseAdmin
          .from("news_articles")
          .select("id", { count: "exact", head: true })
          .is("ai_summary", null);

        return Response.json({ ok: true, processed, failed, remaining: count ?? 0 });
      },
    },
  },
});

function extractJson(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

import { createFileRoute } from "@tanstack/react-router";
import { XMLParser } from "fast-xml-parser";
import { generateText } from "ai";
import { createLovableAI, DEFAULT_MODEL } from "@/lib/ai-gateway.server";
import { RSS_SOURCES } from "@/lib/rss-sources";
import { REGIONS, articleRegions } from "@/lib/regions";

export const Route = createFileRoute("/api/public/ingest-rss")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

        type Item = {
          hash: string; source: string; category: string; title: string;
          url: string; summary: string; published_at: string;
        };

        const items: Item[] = [];
        await Promise.all(
          RSS_SOURCES.map(async (src) => {
            try {
              const res = await fetch(src.url, {
                headers: { "User-Agent": "Mozilla/5.0 TrackIndiaBot/1.0" },
                signal: AbortSignal.timeout(8000),
              });
              if (!res.ok) return;
              const xml = await res.text();
              const parsed = parser.parse(xml);
              const entries = parsed?.rss?.channel?.item ?? parsed?.feed?.entry ?? [];
              const list = Array.isArray(entries) ? entries : [entries];
              for (const it of list.slice(0, 25)) {
                const title = String(it.title?.["#text"] ?? it.title ?? "").trim();
                const link = String(it.link?.["@_href"] ?? it.link ?? it.guid ?? "").trim();
                const desc = stripTags(String(it.description ?? it.summary ?? it["content:encoded"] ?? ""));
                const dateStr = String(it.pubDate ?? it.published ?? it.updated ?? "");
                if (!title || !link) continue;
                const published = safeDate(dateStr);
                const hash = await sha1(link);
                items.push({
                  hash, source: src.name, category: src.category, title,
                  url: link, summary: desc.slice(0, 800), published_at: published,
                });
              }
            } catch (e) {
              console.warn(`[ingest] source failed ${src.name}`, e);
            }
          }),
        );

        if (items.length === 0) {
          return Response.json({ ok: true, fetched: 0, inserted: 0 });
        }

        // Filter to only new (hash not present)
        const hashes = items.map((i) => i.hash);
        const { data: existing } = await supabaseAdmin
          .from("news_articles")
          .select("hash")
          .in("hash", hashes);
        const existingSet = new Set((existing ?? []).map((r) => r.hash));
        const fresh = items.filter((i) => !existingSet.has(i.hash)).slice(0, 30);

        // AI enrich (best-effort)
        const provider = safeCreateAI();
        const enriched = await Promise.all(
          fresh.map(async (it) => {
            const base = { ...it, ai_summary: null as string | null, impact: 1, sentiment: "neutral", tickers: [] as string[], regions: [] as string[] };
            if (!provider) return base;
            try {
              const { text } = await generateText({
                model: provider(DEFAULT_MODEL),
                prompt: `You classify Indian-market news for traders.
Return STRICT JSON with keys: summary (<=180 chars, plain English, no hype), sentiment (bullish|bearish|neutral), impact (0-3 integer, 3 = market-moving), tickers (array of NSE/BSE symbols like RELIANCE, TCS if clearly implied, else []), regions (array from: India, US, China, Europe, Middle East, Global).

Headline: ${it.title}
Body: ${it.summary}`,
                maxOutputTokens: 300,
                temperature: 0.2,
              });
              const parsed = extractJson(text);
              if (parsed) {
                base.ai_summary = String(parsed.summary ?? "").slice(0, 240);
                const sent = String(parsed.sentiment ?? "");
                base.sentiment = sent === "bullish" || sent === "bearish" ? sent : "neutral";
                base.impact = Math.max(0, Math.min(3, Number(parsed.impact) || 1));
                base.tickers = Array.isArray(parsed.tickers) ? parsed.tickers.filter((t: unknown): t is string => typeof t === "string").slice(0, 6) : [];
                base.regions = Array.isArray(parsed.regions) ? parsed.regions.filter((t: unknown): t is string => typeof t === "string").slice(0, 4) : [];
              }
            } catch (e) {
              console.warn("[ingest] AI enrich failed", e);
            }
            // Always persist geography tags at ingest time (indexed DB field).
            const valid = new Set<string>(REGIONS);
            const aiRegions = base.regions.filter((r) => valid.has(r));
            base.regions = aiRegions.length
              ? aiRegions
              : articleRegions({
                  title: base.title,
                  summary: base.summary,
                  ai_summary: base.ai_summary,
                  tickers: base.tickers,
                });
            return base;
          }),
        );

        const { data: insertedRows, error } = await supabaseAdmin
          .from("news_articles")
          .insert(enriched)
          .select("id,title,summary,ai_summary,impact,tickers");
        if (error) {
          console.error("[ingest] insert failed", error);
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }

        const { scanNewsAlerts } = await import("@/lib/alert-scan.server");
        const alerts = await scanNewsAlerts(insertedRows ?? []);

        return Response.json({ ok: true, fetched: items.length, inserted: enriched.length, alerts });
      },
    },
  },
});

function safeCreateAI() {
  try { return createLovableAI(); } catch { return null; }
}
function stripTags(s: string) { return s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim(); }
function safeDate(s: string) {
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}
async function sha1(s: string) {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function extractJson(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { isMarketRelevant } from "@/lib/news-relevance";
import { requireActiveMember } from "../supabase";

export default defineTool({
  name: "search_market_news",
  title: "Search market news",
  description: "Find sourced India-relevant market headlines with publication dates and impact tags.",
  inputSchema: {
    query: z.string().trim().max(80).optional().describe("Optional company, ticker, or market topic."),
    limit: z.number().int().min(1).max(20).default(10),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    const db = await requireActiveMember(ctx);
    let request = db.from("news_articles")
      .select("title,source,url,published_at,ai_summary,summary,impact,sentiment,tickers")
      .order("published_at", { ascending: false }).limit(Math.min(100, limit * 5));
    if (query?.trim()) {
      const term = query.trim().replace(/[%_,()]/g, " ");
      request = request.or(`title.ilike.%${term}%,summary.ilike.%${term}%`);
    }
    const { data, error } = await request;
    if (error) throw new Error("Market news is temporarily unavailable.");
    const articles = (data ?? []).filter((row) => isMarketRelevant(row.title, row.summary ?? ""))
      .slice(0, limit).map((row) => ({ title: row.title, source: row.source, url: row.url,
        published_at: row.published_at, summary: row.ai_summary ?? row.summary,
        impact: row.impact, sentiment: row.sentiment, tickers: row.tickers }));
    return { content: [{ type: "text", text: JSON.stringify(articles) }], structuredContent: { articles } };
  },
});
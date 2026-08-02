import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function serverPublicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const listSchema = z.object({
  category: z.string().nullable().optional(),
  sentiment: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  impact: z.number().int().nullable().optional(),
  q: z.string().nullable().optional(),
  tickers: z.array(z.string()).nullable().optional(),
  keywords: z.array(z.string()).nullable().optional(),
  limit: z.number().int().min(1).max(100).default(60),
});

export const listNews = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => listSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const supabase = serverPublicClient();
    const needsRegion = !!data.region && data.region !== "all";
    let query = supabase.from("news_articles")
      .select("id,source,category,title,url,summary,ai_summary,impact,sentiment,tickers,regions,published_at")
      .order("published_at", { ascending: false })
      .limit(needsRegion ? Math.min(200, data.limit * 4) : data.limit);
    if (data.category && data.category !== "all") query = query.eq("category", data.category);
    if (data.sentiment && data.sentiment !== "all") query = query.eq("sentiment", data.sentiment);
    if (typeof data.impact === "number") query = query.gte("impact", data.impact);
    if (data.q) {
      const term = data.q.replace(/[%_,()]/g, " ").trim();
      if (term) query = query.or(`title.ilike.%${term}%,summary.ilike.%${term}%,ai_summary.ilike.%${term}%`);
    }
    if (data.tickers?.length) query = query.overlaps("tickers", data.tickers);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    let list = rows ?? [];
    if (data.keywords?.length) {
      const kws = data.keywords.map((k) => k.toLowerCase());
      list = list.filter((r) => kws.some((k) => (r.title + " " + (r.ai_summary ?? r.summary ?? "")).toLowerCase().includes(k)));
    }
    if (needsRegion) {
      const { matchesRegion } = await import("@/lib/regions");
      list = list.filter((r) => matchesRegion(r, data.region!)).slice(0, data.limit);
    }
    return list;
  });


export const listTickers = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = serverPublicClient();
  const { data, error } = await supabase.from("tickers")
    .select("symbol,alias,label,kind,last,change,change_pct,updated_at")
    .order("kind")
    .order("symbol");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listHotspots = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = serverPublicClient();
  const { data, error } = await supabase.from("hotspots")
    .select("id,name,region,lat,lng,severity,summary,market_impact")
    .order("severity", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

// ---- User-scoped ----

const addPositionSchema = z.object({
  symbol: z.string().min(1).max(24),
  label: z.string().max(64).nullable().optional(),
  quantity: z.number().nonnegative(),
  avg_price: z.number().nonnegative(),
});

export const listPortfolio = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("portfolio_positions")
      .select("id,symbol,label,quantity,avg_price,created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertPosition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => addPositionSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("portfolio_positions").upsert({
      user_id: context.userId,
      symbol: data.symbol.toUpperCase(),
      label: data.label ?? data.symbol.toUpperCase(),
      quantity: data.quantity,
      avg_price: data.avg_price,
    }, { onConflict: "user_id,symbol" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePosition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("portfolio_positions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listWatchlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("watchlist_items")
      .select("id,kind,value,created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addWatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ kind: z.enum(["symbol", "keyword"]), value: z.string().min(1).max(64) }).parse(input))
  .handler(async ({ data, context }) => {
    const value = data.kind === "symbol" ? data.value.toUpperCase() : data.value.toLowerCase();
    const { error } = await context.supabase.from("watchlist_items").insert({
      user_id: context.userId, kind: data.kind, value,
    });
    if (error && !String(error.message).includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

export const removeWatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("watchlist_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

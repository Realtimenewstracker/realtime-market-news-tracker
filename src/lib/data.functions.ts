import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { dedupeByTitle } from "@/lib/dedupe";
import { isMarketRelevant } from "@/lib/news-relevance";


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
    // Over-fetch so collapsing wire duplicates still fills the requested page.
    const fetchLimit = Math.min(200, data.limit * 3);
    let query = supabase.from("news_articles")
      .select("id,source,category,title,url,summary,ai_summary,impact,sentiment,tickers,regions,published_at")
      .gte("published_at", new Date(Date.now() - 7 * 86_400_000).toISOString())
      .order("impact", { ascending: false, nullsFirst: false })
      .order("published_at", { ascending: false })
      .limit(fetchLimit);
    // Region tags are stored on every row (indexed), so filter in the database.
    if (needsRegion && data.region) query = query.contains("regions", [data.region]);
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
    return dedupeByTitle(list.filter((r) => isMarketRelevant(r.title, r.summary ?? ""))).slice(0, data.limit);
  });

/** India's current calendar day, ordered by the recorded market impact and recency. */
export const listTodayTopNews = createServerFn({ method: "GET" }).handler(async () => {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  const start = new Date(`${today}T00:00:00+05:30`);
  const end = new Date(start.getTime() + 86_400_000);
  const { data, error } = await serverPublicClient().from("news_articles")
    .select("id,source,category,title,url,summary,ai_summary,impact,sentiment,tickers,regions,published_at")
    .gte("published_at", start.toISOString())
    .lt("published_at", end.toISOString())
    .order("impact", { ascending: false, nullsFirst: false })
    .order("published_at", { ascending: false })
    .limit(150);
  if (error) throw new Error(error.message);
  return dedupeByTitle((data ?? []).filter((item) => isMarketRelevant(item.title, item.summary ?? ""))).slice(0, 5);
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

export type IpoHeat = { score: number; label: "Hot" | "Warm" | "Cool"; gmp_pct: number | null };

function heatFor(row: {
  analyst_score: number | null;
  gmp: number | null;
  price_max: number | null;
  subscription_x: number | null;
  listing_gain_pct: number | null;
}): IpoHeat {
  const gmpPct =
    row.gmp != null && row.price_max != null && row.price_max > 0
      ? Math.round((row.gmp / row.price_max) * 1000) / 10
      : null;
  // Analyst sentiment (0-100) blended with market reaction: GMP premium,
  // subscription demand and (once listed) actual listing performance.
  const analyst = row.analyst_score ?? 50;
  const gmpPart = gmpPct == null ? 50 : clamp(50 + gmpPct * 1.4, 0, 100);
  const subsPart = row.subscription_x == null ? 50 : clamp(30 + row.subscription_x * 6, 0, 100);
  const listPart = row.listing_gain_pct == null ? null : clamp(50 + row.listing_gain_pct * 1.2, 0, 100);
  const parts: Array<[number, number]> = [
    [analyst, 0.35],
    [gmpPart, 0.25],
    [subsPart, 0.25],
    [listPart ?? analyst, 0.15],
  ];
  const total = parts.reduce((s, [v, w]) => s + v * w, 0);
  const score = Math.round(clamp(total, 0, 100));
  return { score, label: score >= 72 ? "Hot" : score >= 55 ? "Warm" : "Cool", gmp_pct: gmpPct };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export const listIpos = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = serverPublicClient();
  const { data, error } = await supabase
    .from("ipos")
    .select(
      "id,name,symbol,board,status,price_min,price_max,lot_size,issue_size,open_date,close_date,listing_date,gmp,subscription_x,listing_gain_pct,detail_url,analyst_score,analyst_note",
    )
    .order("open_date", { ascending: false });
  if (error) throw new Error(error.message);
  const today = new Date().toISOString().slice(0, 10);
  return (data ?? []).map((row) => {
    let status = row.status;
    if (row.open_date && row.close_date) {
      if (today < row.open_date) status = "upcoming";
      else if (today <= row.close_date) status = "open";
      else if (row.listing_date && today >= row.listing_date) status = "listed";
      else status = "closed";
    }
    return { ...row, status, heat: heatFor(row) };
  });
});


export const listIpoWatchlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("ipo_watchlist").select("ipo_id");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => r.ipo_id);
  });

export const toggleIpoWatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ ipo_id: z.string().uuid(), on: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    if (data.on) {
      const { error } = await context.supabase
        .from("ipo_watchlist")
        .upsert({ user_id: context.userId, ipo_id: data.ipo_id }, { onConflict: "user_id,ipo_id" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("ipo_watchlist")
        .delete()
        .eq("ipo_id", data.ipo_id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });


// ---- Government policy tracker ----

export type PolicyHeat = { score: number; label: "Hot" | "Warm" | "Cool" };

function policyHeat(row: {
  heat_score: number | null;
  impact: number | null;
  announced_at: string;
  beneficiaries: { benefit_score: number | null }[];
}): PolicyHeat {
  const base = row.heat_score ?? 50;
  const impactPart = clamp(((row.impact ?? 2) / 3) * 100, 0, 100);
  const days = Math.max(0, (Date.now() - new Date(row.announced_at).getTime()) / 86_400_000);
  const freshPart = clamp(100 - days * 1.6, 0, 100);
  const scores = row.beneficiaries.map((b) => b.benefit_score ?? 50);
  const benefitPart = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 50;
  const score = Math.round(
    clamp(base * 0.4 + impactPart * 0.25 + freshPart * 0.15 + benefitPart * 0.2, 0, 100),
  );
  return { score, label: score >= 72 ? "Hot" : score >= 55 ? "Warm" : "Cool" };
}

export const listPolicies = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = serverPublicClient();
  const { data, error } = await supabase
    .from("policies")
    .select(
      "id,title,authority,category,status,summary,detail,source_url,announced_at,effective_from,outlay_cr,impact,sentiment,heat_score,sectors,policy_beneficiaries(id,company,symbol,sector,rationale,benefit_score)",
    )
    .order("announced_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const beneficiaries = [...(row.policy_beneficiaries ?? [])].sort(
      (a, b) => (b.benefit_score ?? 0) - (a.benefit_score ?? 0),
    );
    return {
      ...row,
      policy_beneficiaries: undefined,
      beneficiaries,
      heat: policyHeat({ ...row, beneficiaries }),
    };
  });
});

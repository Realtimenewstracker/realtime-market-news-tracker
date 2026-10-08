import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { loadLiveIpos } from "@/lib/exchange.server";

type AlertRow = {
  user_id: string;
  kind: "price" | "news" | "ipo";
  subject: string;
  title: string;
  body: string | null;
  direction: "up" | "down" | null;
  change_pct: number | null;
  article_id: string | null;
  dedupe_key: string;
};

type Settings = {
  price_enabled: boolean;
  news_enabled: boolean;
  price_threshold_pct: number;
  min_impact: number;
};

const DEFAULTS: Settings = {
  price_enabled: true,
  news_enabled: true,
  price_threshold_pct: 2,
  min_impact: 3,
};

type UserWatch = { symbols: string[]; keywords: string[]; settings: Settings };

async function loadWatchers(): Promise<Map<string, UserWatch>> {
  const [{ data: watch }, { data: settings }] = await Promise.all([
    supabaseAdmin.from("watchlist_items").select("user_id,kind,value"),
    supabaseAdmin
      .from("alert_settings")
      .select("user_id,price_enabled,news_enabled,price_threshold_pct,min_impact"),
  ]);

  const settingsMap = new Map<string, Settings>();
  for (const s of settings ?? []) {
    settingsMap.set(s.user_id, {
      price_enabled: s.price_enabled,
      news_enabled: s.news_enabled,
      price_threshold_pct: Number(s.price_threshold_pct) || DEFAULTS.price_threshold_pct,
      min_impact: s.min_impact ?? DEFAULTS.min_impact,
    });
  }

  const map = new Map<string, UserWatch>();
  for (const w of watch ?? []) {
    let entry = map.get(w.user_id);
    if (!entry) {
      entry = { symbols: [], keywords: [], settings: settingsMap.get(w.user_id) ?? DEFAULTS };
      map.set(w.user_id, entry);
    }
    if (w.kind === "symbol") entry.symbols.push(w.value.toUpperCase());
    else entry.keywords.push(w.value.toLowerCase());
  }
  return map;
}

async function insertAlerts(rows: AlertRow[]) {
  if (rows.length === 0) return 0;
  const { error } = await supabaseAdmin
    .from("alerts")
    .upsert(rows, { onConflict: "user_id,dedupe_key", ignoreDuplicates: true });
  if (error) {
    console.error("[alerts] insert failed", error);
    return 0;
  }
  return rows.length;
}

export type PriceTick = {
  alias: string;
  label: string;
  kind: string;
  last: number | null;
  change_pct: number | null;
};

export async function scanPriceAlerts(ticks: PriceTick[]) {
  try {
    const watchers = await loadWatchers();
    if (watchers.size === 0) return 0;
    const day = new Date().toISOString().slice(0, 10);
    const rows: AlertRow[] = [];

    for (const [userId, w] of watchers) {
      if (!w.settings.price_enabled || w.symbols.length === 0) continue;
      const threshold = Math.max(0.1, w.settings.price_threshold_pct);
      for (const t of ticks) {
        const pct = t.change_pct;
        if (pct == null || !w.symbols.includes(t.alias.toUpperCase())) continue;
        if (Math.abs(pct) < threshold) continue;
        const up = pct >= 0;
        const bucket = Math.floor(Math.abs(pct) / threshold);
        rows.push({
          user_id: userId,
          kind: "price",
          subject: t.alias,
          title: `${t.label} ${up ? "up" : "down"} ${Math.abs(pct).toFixed(2)}%`,
          body: t.last != null ? `Last traded at ${t.last.toLocaleString("en-IN")}` : null,
          direction: up ? "up" : "down",
          change_pct: pct,
          article_id: null,
          dedupe_key: `price:${t.alias}:${day}:${up ? "up" : "down"}:${bucket}`,
        });
      }
    }
    return await insertAlerts(rows);
  } catch (e) {
    console.warn("[alerts] price scan failed", e);
    return 0;
  }
}

export type NewsHit = {
  id: string;
  title: string;
  summary: string | null;
  ai_summary: string | null;
  impact: number | null;
  tickers: string[] | null;
};

export async function scanNewsAlerts(articles: NewsHit[]) {
  try {
    if (articles.length === 0) return 0;
    const watchers = await loadWatchers();
    if (watchers.size === 0) return 0;
    const rows: AlertRow[] = [];

    for (const [userId, w] of watchers) {
      if (!w.settings.news_enabled) continue;
      if (w.symbols.length === 0 && w.keywords.length === 0) continue;
      for (const a of articles) {
        if ((a.impact ?? 0) < w.settings.min_impact) continue;
        const tickers = (a.tickers ?? []).map((t) => t.toUpperCase());
        const haystack = `${a.title} ${a.ai_summary ?? a.summary ?? ""}`.toLowerCase();
        const symbolHit = w.symbols.find(
          (s) => tickers.includes(s) || haystack.includes(s.toLowerCase()),
        );
        const keywordHit = w.keywords.find((k) => haystack.includes(k));
        const subject = symbolHit ?? keywordHit;
        if (!subject) continue;
        rows.push({
          user_id: userId,
          kind: "news",
          subject: subject.toUpperCase(),
          title: a.title.slice(0, 240),
          body: (a.ai_summary ?? a.summary ?? "").slice(0, 400) || null,
          direction: null,
          change_pct: null,
          article_id: a.id,
          dedupe_key: `news:${a.id}`,
        });
      }
    }
    return await insertAlerts(rows);
  } catch (e) {
    console.warn("[alerts] news scan failed", e);
    return 0;
  }
}

// ---- IPO alerts (live NSE feed + the user's watchlist) ----

type LiveIpo = Awaited<ReturnType<typeof loadLiveIpos>>["issues"][number];

const IPO_SCAN_MIN_GAP_MS = 60_000;
let lastIpoScanAt = 0;

const istDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" });

function addDays(day: string, days: number) {
  const midnight = new Date(`${day}T00:00:00+05:30`).getTime();
  return istDay.format(new Date(midnight + days * 86_400_000));
}

function ipoKey(ipo: LiveIpo) {
  return (ipo.symbol ?? ipo.name)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

/** Which alert-worthy moments apply to this IPO today (India time). */
function ipoEvents(ipo: LiveIpo, today: string, tomorrow: string) {
  const events: Array<{ title: string; dedupe: string }> = [];
  const open = ipo.openDate;
  const close = ipo.closeDate;
  if (!open) return events;

  if (open === tomorrow) {
    events.push({ title: `${ipo.name} IPO opens tomorrow`, dedupe: `opens-soon:${open}` });
  }

  const isOpen = open <= today && (!close || close >= today);
  if (isOpen) {
    if (close === today) {
      events.push({ title: `${ipo.name} IPO closes today`, dedupe: `closing-0:${close}` });
    } else {
      events.push({ title: `${ipo.name} IPO is now open`, dedupe: `open:${open}` });
      if (close === tomorrow) {
        events.push({ title: `${ipo.name} IPO closes tomorrow`, dedupe: `closing-1:${close}` });
      }
    }
  }
  return events;
}

/**
 * Alerts users who watch an IPO's symbol (or a keyword in its name) when it
 * opens tomorrow, is open, or is about to close. Uses the same live NSE feed
 * as the IPO tracker page. Safe to call repeatedly: alerts are de-duplicated.
 */
export async function scanIpoAlerts() {
  try {
    // The endpoint is public, so avoid hammering the exchange feed.
    const now = Date.now();
    if (now - lastIpoScanAt < IPO_SCAN_MIN_GAP_MS) return 0;
    lastIpoScanAt = now;

    const [watchers, live] = await Promise.all([loadWatchers(), loadLiveIpos()]);
    if (watchers.size === 0 || live.issues.length === 0) return 0;

    const today = istDay.format(new Date());
    const tomorrow = addDays(today, 1);
    const rows: AlertRow[] = [];

    for (const ipo of live.issues) {
      const events = ipoEvents(ipo, today, tomorrow);
      if (events.length === 0) continue;

      const id = ipoKey(ipo);
      const symbol = ipo.symbol?.toUpperCase() ?? null;
      const name = ipo.name.toLowerCase();
      const details =
        [
          ipo.priceBand && ipo.priceBand !== "Not announced" ? `Price band ${ipo.priceBand}` : null,
          ipo.subscription != null ? `${ipo.subscription.toFixed(2)}x subscribed` : null,
          ipo.closeDate ? `Closes ${ipo.closeDate}` : null,
        ]
          .filter(Boolean)
          .join(" · ") || null;

      for (const [userId, w] of watchers) {
        const watching =
          (symbol != null && w.symbols.includes(symbol)) ||
          w.keywords.some((k) => k.length >= 3 && name.includes(k));
        if (!watching) continue;
        for (const event of events) {
          rows.push({
            user_id: userId,
            kind: "ipo",
            subject: (ipo.symbol ?? ipo.name).toUpperCase().slice(0, 24),
            title: event.title.slice(0, 240),
            body: details,
            direction: null,
            change_pct: null,
            article_id: null,
            dedupe_key: `ipo:${id}:${event.dedupe}`,
          });
        }
      }
    }
    return await insertAlerts(rows);
  } catch (e) {
    console.warn("[alerts] ipo scan failed", e);
    return 0;
  }
}

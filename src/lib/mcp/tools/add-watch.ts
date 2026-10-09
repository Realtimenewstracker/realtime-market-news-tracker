import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { requireActiveMember } from "../supabase";

export default defineTool({
  name: "add_watchlist_item",
  title: "Add to watchlist",
  description: "Save a stock symbol or news keyword to the connected account's watchlist.",
  inputSchema: {
    kind: z.enum(["symbol", "keyword"]).describe("Type of item to watch."),
    value: z.string().trim().min(1).max(64).describe("Stock symbol or news keyword."),
    watchlist_name: z.string().trim().min(1).max(40).optional().describe("Watchlist name. Defaults to Default."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ kind, value, watchlist_name }, ctx) => {
    const { db, userId } = await requireActiveMember(ctx);
    const normalized = kind === "symbol" ? value.trim().toUpperCase() : value.trim().toLowerCase();
    const { data: watchlist, error: watchlistError } = await db.from("watchlists")
      .upsert({ user_id: userId, name: watchlist_name?.trim() || "Default" }, { onConflict: "user_id,name" })
      .select("id,name").single();
    if (watchlistError || !watchlist) throw new Error("Could not find or create that watchlist.");
    const { data: existing, error: lookupError } = await db.from("watchlist_items")
      .select("id").eq("user_id", userId).eq("watchlist_id", watchlist.id).eq("kind", kind).eq("value", normalized).maybeSingle();
    if (lookupError) throw new Error("Could not check the watchlist.");
    if (existing) return { content: [{ type: "text", text: `Already watching ${normalized} in ${watchlist.name}.` }], structuredContent: { kind, value: normalized, watchlist: watchlist.name } };
    const { error } = await db.from("watchlist_items").insert({ user_id: userId, watchlist_id: watchlist.id, kind, value: normalized });
    if (error) throw new Error("Could not save the watchlist item.");
    return { content: [{ type: "text", text: `Watching ${normalized} in ${watchlist.name}.` }], structuredContent: { kind, value: normalized, watchlist: watchlist.name } };
  },
});

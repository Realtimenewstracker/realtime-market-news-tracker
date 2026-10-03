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
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ kind, value }, ctx) => {
    const { db, userId } = await requireActiveMember(ctx);
    const normalized = kind === "symbol" ? value.trim().toUpperCase() : value.trim().toLowerCase();
    const { data: existing, error: lookupError } = await db.from("watchlist_items")
      .select("id").eq("user_id", userId).eq("kind", kind).eq("value", normalized).maybeSingle();
    if (lookupError) throw new Error("Could not check the watchlist.");
    if (existing) return { content: [{ type: "text", text: `Already watching ${normalized}.` }], structuredContent: { kind, value: normalized } };
    const { error } = await db.from("watchlist_items").insert({ user_id: userId, kind, value: normalized });
    if (error) throw new Error("Could not save the watchlist item.");
    return { content: [{ type: "text", text: `Watching ${normalized}.` }], structuredContent: { kind, value: normalized } };
  },
});
import { defineTool } from "@lovable.dev/mcp-js";
import { requireActiveMember } from "../supabase";

export default defineTool({
  name: "list_watchlist",
  title: "List watchlist",
  description: "Read the connected account's saved stock symbols and news keywords.",
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    const { db, userId } = await requireActiveMember(ctx);
    const { data, error } = await db.from("watchlist_items")
      .select("kind,value,created_at,watchlists(name)").eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(100);
    if (error) throw new Error("Watchlist is temporarily unavailable.");
    const items = (data ?? []).map(({ kind, value, created_at, watchlists }) => ({ kind, value, created_at, watchlist: (watchlists as { name?: string } | null)?.name ?? "Default" }));
    return { content: [{ type: "text", text: JSON.stringify(items) }], structuredContent: { items } };
  },
});

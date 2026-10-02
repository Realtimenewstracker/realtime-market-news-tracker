import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchNews from "./tools/search-news";
import listWatchlist from "./tools/watchlist";
import addWatch from "./tools/add-watch";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "stock-pulse-tracker",
  title: "Stock Pulse Tracker",
  version: "0.1.0",
  instructions: "Use these tools for sourced market headlines and the signed-in person's watchlist. Headlines may be delayed; respect source timestamps. An active trial or subscription is required.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchNews, listWatchlist, addWatch],
});
import { Link, useRouter } from "@tanstack/react-router";
import { RefreshCw, LogIn, LogOut, Waves, Menu } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { AlertsBell } from "@/components/alerts-bell";

async function refreshFeeds() {
  const res = await fetch("/api/public/ingest-rss", { method: "POST" });
  if (!res.ok) throw new Error("failed");
  return res.json() as Promise<{ inserted: number }>;
}

export function TopBar() {
  const { user } = useSession();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const r = await refreshFeeds();
      toast.success(r.inserted ? `+${r.inserted} new stories` : "Feed is up to date");
      router.invalidate();
    } catch {
      toast.error("Refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.navigate({ to: "/" });
  };

  return (
    <header className="px-4 md:px-8 pt-4 flex items-center justify-between gap-3">
      <Link to="/" className="flex items-center gap-2.5 group">
        <div className="w-9 h-9 rounded-2xl glass flex items-center justify-center">
          <Waves size={16} className="text-primary" />
        </div>
        <span className="font-display font-semibold text-foreground text-lg tracking-tight">
          Track{" "}
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(120deg,#EA580C,#0EA5E9,#059669)" }}
          >
            India
          </span>
        </span>
      </Link>

      <nav className="hidden md:flex items-center gap-1 text-sm">
        <NavLink to="/">Feed</NavLink>
        <NavLink to="/portfolio">Portfolio</NavLink>
        <NavLink to="/watchlist">Watchlist</NavLink>
        <NavLink to="/geopolitics">Geopolitics</NavLink>
        {user && <NavLink to="/account">Account</NavLink>}
      </nav>

      <div className="flex items-center gap-2">
        <AlertsBell />
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="glass glass-hover rounded-full w-10 h-10 flex items-center justify-center text-foreground disabled:opacity-60"
          title="Refresh feed"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
        </button>

        {user ? (
          <div className="flex items-center gap-1">
            <div className="glass rounded-full pl-1.5 pr-3 py-1 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-semibold">
                {(user.email ?? "?").slice(0, 1).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-foreground max-w-[120px] truncate hidden md:inline">
                {user.email}
              </span>
            </div>
            <button
              onClick={signOut}
              className="glass glass-hover rounded-full w-10 h-10 flex items-center justify-center text-foreground"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="rounded-full px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-1.5 hover:opacity-90"
          >
            <LogIn size={14} /> Sign in
          </Link>
        )}
      </div>
    </header>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="px-3 py-1.5 rounded-full text-foreground/70 hover:text-foreground hover:bg-white/50"
      activeProps={{ className: "px-3 py-1.5 rounded-full text-foreground bg-white/70 shadow-sm" }}
    >
      {children}
    </Link>
  );
}

export function BottomDock() {
  const { user } = useSession();
  return (
    <nav className="md:hidden fixed bottom-3 inset-x-3 z-50 glass-strong rounded-full px-2 py-1.5 flex items-center justify-around">
      <DockItem to="/" label="Feed" />
      <DockItem to="/portfolio" label="Book" />
      <DockItem to="/watchlist" label="Watch" />
      <DockItem to="/geopolitics" label="Geo" />
      <DockItem to={user ? "/account" : "/auth"} label={user ? "Me" : "In"} />
    </nav>
  );
}
function DockItem({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="px-3 py-1.5 rounded-full text-xs font-medium text-foreground/70"
      activeProps={{ className: "px-3 py-1.5 rounded-full text-xs font-semibold bg-white/80 text-foreground" }}
    >
      {label}
    </Link>
  );
}

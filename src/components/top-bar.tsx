import { Link, useRouter } from "@tanstack/react-router";
import { RefreshCw, LogIn, LogOut, Waves, Newspaper, Star, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { AlertsBell } from "@/components/alerts-bell";
import { MobileAlertsDockItem } from "@/components/mobile-alerts-sheet";

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
    <header className="px-3 md:px-8 pt-3 md:pt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 md:flex md:justify-between md:gap-3">
      <Link to="/" className="flex min-w-0 items-center gap-2 group">
        <div className="w-8 h-8 md:w-9 md:h-9 shrink-0 rounded-2xl glass flex items-center justify-center">
          <Waves size={15} className="text-primary" />
        </div>
        <span className="font-display font-semibold text-foreground text-base md:text-lg tracking-tight truncate">
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
        <NavLink to="/ipo">IPO</NavLink>
        <NavLink to="/portfolio">Portfolio</NavLink>
        <NavLink to="/watchlist">Watchlist</NavLink>
        <NavLink to="/geopolitics">Geopolitics</NavLink>
        {user && <NavLink to="/account">Account</NavLink>}
      </nav>


      <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
        <div className="hidden md:block">
          <AlertsBell />
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="glass glass-hover rounded-full w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-foreground disabled:opacity-60"
          title="Refresh feed"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
        </button>

        {user ? (
          <div className="flex items-center gap-1.5">
            <Link
              to="/account"
              className="md:hidden glass glass-hover rounded-full w-9 h-9 flex items-center justify-center text-foreground"
              title="Settings"
            >
              <Settings size={15} />
            </Link>
            <div className="hidden md:flex glass rounded-full p-1 md:pl-1.5 md:pr-3 md:py-1 items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-semibold">
                {(user.email ?? "?").slice(0, 1).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-foreground max-w-[120px] truncate hidden md:inline">
                {user.email}
              </span>
            </div>
            <button
              onClick={signOut}
              className="glass glass-hover rounded-full w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-foreground"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>

        ) : (
          <Link
            to="/auth"
            className="glass glass-hover rounded-full h-9 md:h-10 px-3 md:px-4 text-foreground text-sm font-semibold flex items-center gap-1.5"
          >
            <LogIn size={14} /> <span className="hidden sm:inline">Sign in</span>
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
      activeProps={{ className: "px-3 py-1.5 rounded-full text-foreground glass-chip" }}
    >
      {children}
    </Link>
  );
}

export function BottomDock() {
  return (
    <nav
      className="md:hidden fixed inset-x-2 z-50 glass-strong rounded-[28px] px-1.5 py-1.5 grid grid-cols-4 items-stretch gap-1"
      style={{ bottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <DockItem to="/" label="Feed" icon={<Newspaper size={16} />} />
      <DockItem to="/ipo" label="IPO" icon={<Rocket size={16} />} />
      <DockItem to="/watchlist" label="Watch" icon={<Star size={16} />} />
      <MobileAlertsDockItem />
    </nav>
  );
}

function DockItem({ to, label, icon }: { to: string; label: string; icon?: React.ReactNode }) {
  const base =
    "min-h-12 w-full px-1 py-1 rounded-3xl text-[10px] font-medium text-foreground/70 flex flex-col items-center justify-center gap-0.5 leading-none";
  return (
    <Link
      to={to}
      className={base}
      activeProps={{ className: `${base} bg-white/80 text-foreground font-semibold` }}
    >
      {icon}
      <span className="truncate max-w-full">{label}</span>
    </Link>
  );
}

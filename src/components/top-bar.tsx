import { Link } from "@tanstack/react-router";
import { LogIn, House, Search, Star, UserRound, Settings } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { AlertsBell } from "@/components/alerts-bell";
import { MobileAlertsDockItem } from "@/components/mobile-alerts-sheet";
import { AlertRealtimeBridge } from "@/components/alert-realtime-bridge";
import logo from "@/assets/trackindia-official-logo.jpg.asset.json";

export function TopBar() {
  const { user } = useSession();

  return (
    <>
    {user && <AlertRealtimeBridge />}
    <header className="px-3 md:px-8 pt-3 md:pt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 md:flex md:justify-between md:gap-3">
      <Link to="/" className="flex min-w-0 md:shrink-0 items-center gap-2 group">
        <img src={logo.url} alt="TrackIndia logo" className="w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-full object-contain bg-card" />
        <span className="font-display font-semibold text-foreground text-base md:text-lg tracking-tight truncate md:whitespace-nowrap">
          Track{" "}
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(120deg,#EA580C,#0EA5E9,#059669)" }}
          >
            India
          </span>
        </span>
      </Link>

      <nav className="hidden md:flex flex-1 items-center gap-1 text-xs overflow-x-auto min-w-0 whitespace-nowrap">
        <NavLink to="/">Feed</NavLink>
        <NavLink to="/ipo">IPO</NavLink>
        <NavLink to="/events">Events</NavLink>
        <NavLink to="/policies">Policies</NavLink>
        {user && <>
          <NavLink to="/portfolio">Portfolio</NavLink>
          <NavLink to="/watchlist">Watchlist</NavLink>
        </>}
        <NavLink to="/geopolitics">Geopolitics</NavLink>
        <NavLink to="/crypto">Crypto & FX</NavLink>
        <NavLink to="/commodities">Commodities</NavLink>
        <NavLink to="/pricing">Pricing</NavLink>
        {user && <NavLink to="/account">Account</NavLink>}
      </nav>


      <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
         <Link to="/search" search={{ q: "" }} aria-label="Search markets" title="Search markets" className="hidden md:flex glass rounded-full w-9 h-9 items-center justify-center"><Search size={16} /></Link>
        <div className="hidden md:block">
          <AlertsBell />
        </div>
        {user ? (
          <div className="flex items-center gap-1.5">
            <Link
              to="/account"
              className="md:hidden glass glass-hover rounded-full w-9 h-9 flex items-center justify-center text-foreground"
              title="Settings"
            >
              <Settings size={15} />
            </Link>
            <Link to="/account" className="hidden md:flex glass rounded-full p-1 md:pl-1.5 md:pr-3 md:py-1 items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-semibold">
                {(user.email ?? "?").slice(0, 1).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-foreground max-w-[120px] truncate hidden md:inline">
                {user.email}
              </span>
            </Link>
          </div>

        ) : (
          <Link
            to="/auth"
            search={{}}
            className="glass glass-hover rounded-full h-9 md:h-10 px-3 md:px-4 text-foreground text-sm font-semibold flex items-center gap-1.5"
          >
            <LogIn size={14} /> <span className="hidden sm:inline">Sign in</span>
          </Link>
        )}
      </div>

    </header>
    </>
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
      className="md:hidden fixed inset-x-2 z-50 glass-strong rounded-2xl px-1.5 py-1.5 grid grid-cols-5 items-stretch gap-1"
      style={{ bottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <DockItem to="/" label="Home" icon={<House size={18} />} />
       <DockItem to="/search" label="Search" icon={<Search size={18} />} />
      <DockItem to="/watchlist" label="Watchlist" icon={<Star size={18} />} />
      <MobileAlertsDockItem />
      <DockItem to="/account" label="Account" icon={<UserRound size={18} />} />
    </nav>
  );
}

function DockItem({ to, label, icon }: { to: string; label: string; icon?: React.ReactNode }) {
  const base =
    "min-h-12 w-full px-1 py-1 rounded-xl text-[10px] font-medium text-foreground/70 flex flex-col items-center justify-center gap-0.5 leading-none";
  return (
    <Link
       to={to}
       search={to === "/search" ? { q: "" } : undefined}
      className={base}
      activeProps={{ className: `${base} glass-chip text-foreground font-semibold` }}
    >
      {icon}
      <span className="truncate max-w-full">{label}</span>
    </Link>
  );
}

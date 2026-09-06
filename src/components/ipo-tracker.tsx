import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { CalendarDays, IndianRupee, TrendingUp, ExternalLink, Flame, Star } from "lucide-react";
import { toast } from "sonner";
import { listIpos, listIpoWatchlist, toggleIpoWatch } from "@/lib/data.functions";
import { useSession } from "@/hooks/use-session";
import { FilterMenu } from "@/components/filter-bar";

type Ipo = Awaited<ReturnType<typeof listIpos>>[number];

const STATUSES = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "upcoming", label: "Upcoming" },
  { id: "closed", label: "Closed" },
  { id: "listed", label: "Listed" },
];
const BOARDS = [
  { id: "all", label: "All boards" },
  { id: "mainboard", label: "Mainboard" },
  { id: "sme", label: "SME" },
];
const SORTS = [
  { id: "date", label: "By date" },
  { id: "heat", label: "By heat" },
];

export function IpoTracker() {
  const { user } = useSession();
  const qc = useQueryClient();
  const listIposFn = useServerFn(listIpos);
  const listWatchFn = useServerFn(listIpoWatchlist);
  const toggleFn = useServerFn(toggleIpoWatch);
  const [status, setStatus] = useState("open");
  const [board, setBoard] = useState("all");
  const [sort, setSort] = useState("date");
  const [onlyWatched, setOnlyWatched] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["ipos"],
    queryFn: () => listIposFn(),
    refetchInterval: 300_000,
  });

  const { data: watched } = useQuery({
    queryKey: ["ipo-watchlist"],
    queryFn: () => listWatchFn(),
    enabled: !!user,
  });
  const watchedSet = useMemo(() => new Set(watched ?? []), [watched]);

  const toggle = useMutation({
    mutationFn: (v: { ipo_id: string; on: boolean }) => toggleFn({ data: v }),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: ["ipo-watchlist"] });
      toast(v.on ? "Added to IPO watchlist" : "Removed from IPO watchlist", {
        description: v.on ? "We'll alert you when it opens." : undefined,
      });
    },
  });

  const rows = useMemo(() => {
    let list = (data ?? []) as Ipo[];
    if (status !== "all") list = list.filter((i) => i.status === status);
    if (board !== "all") list = list.filter((i) => i.board === board);
    if (onlyWatched) list = list.filter((i) => watchedSet.has(i.id));
    if (sort === "heat") list = [...list].sort((a, b) => b.heat.score - a.heat.score);
    return list;
  }, [data, status, board, sort, onlyWatched, watchedSet]);

  return (
    <div className="flex flex-col gap-4">
      <div className="glass rounded-full p-1.5 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterMenu label="Status" options={STATUSES} value={status} onChange={(v) => setStatus(String(v))} />
        <FilterMenu label="Board" options={BOARDS} value={board} onChange={(v) => setBoard(String(v))} />
        <FilterMenu label="Sort" options={SORTS} value={sort} onChange={(v) => setSort(String(v))} />
        <button
          onClick={() => setOnlyWatched((v) => !v)}
          className={`shrink-0 min-h-8 rounded-full px-3 text-xs font-medium flex items-center gap-1.5 ${
            onlyWatched ? "bg-accent-tint" : "glass-chip text-foreground"
          }`}
        >
          <Star size={12} className={onlyWatched ? "fill-current" : ""} /> Watchlist
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-3xl h-48 animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="glass rounded-3xl p-8 md:p-12 text-center">
          <p className="font-display text-xl text-foreground">No IPOs in this bucket</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {onlyWatched ? "Star an IPO to track it here." : "Try another status or board."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((ipo) => (
            <IpoCard
              key={ipo.id}
              ipo={ipo}
              watched={watchedSet.has(ipo.id)}
              canWatch={!!user}
              onToggle={(on) => toggle.mutate({ ipo_id: ipo.id, on })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function IpoCard({
  ipo,
  watched,
  canWatch,
  onToggle,
}: {
  ipo: Ipo;
  watched: boolean;
  canWatch: boolean;
  onToggle: (on: boolean) => void;
}) {
  const gain = ipo.listing_gain_pct;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass glass-hover rounded-3xl p-5 flex flex-col gap-3 relative overflow-hidden"
    >
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="min-w-0">
          <h3 className="font-display text-base md:text-lg font-semibold tracking-tight text-foreground break-words">
            {ipo.name}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            <span>{ipo.board === "sme" ? "SME" : "Mainboard"}</span>
            {ipo.symbol && (
              <>
                <span>·</span>
                <span className="font-mono">{ipo.symbol}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() =>
              canWatch
                ? onToggle(!watched)
                : toast("Sign in to track IPOs", { description: "Watchlisted IPOs trigger alerts on open." })
            }
            aria-label={watched ? "Remove from IPO watchlist" : "Add to IPO watchlist"}
            className={`glass-chip rounded-full w-8 h-8 flex items-center justify-center ${
              watched ? "text-amber-500" : "text-muted-foreground"
            }`}
          >
            <Star size={14} className={watched ? "fill-current" : ""} />
          </button>
          <StatusBadge status={ipo.status} />
        </div>
      </div>

      <HeatMeter heat={ipo.heat} analyst={ipo.analyst_score} />

      <div className="grid grid-cols-2 gap-2">
        <Cell icon={<IndianRupee size={12} />} label="Price band" value={band(ipo.price_min, ipo.price_max)} />
        <Cell label="Lot size" value={ipo.lot_size ? String(ipo.lot_size) : "—"} />
        <Cell label="Issue size" value={ipo.issue_size ?? "—"} />
        <Cell
          icon={<CalendarDays size={12} />}
          label={ipo.status === "listed" ? "Listed on" : "Dates"}
          value={ipo.status === "listed" ? fmtDate(ipo.listing_date) : `${fmtDate(ipo.open_date)} – ${fmtDate(ipo.close_date)}`}
        />
      </div>

      {ipo.analyst_note && (
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{ipo.analyst_note}</p>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-1 min-w-0 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {ipo.gmp != null && (
            <span className="glass-chip rounded-full px-2.5 py-0.5 text-[10px] font-semibold font-mono text-foreground">
              GMP ₹{ipo.gmp}
              {ipo.heat.gmp_pct != null ? ` (${ipo.heat.gmp_pct > 0 ? "+" : ""}${ipo.heat.gmp_pct}%)` : ""}
            </span>
          )}
          {ipo.subscription_x != null && (
            <span className="glass-chip rounded-full px-2.5 py-0.5 text-[10px] font-semibold font-mono text-foreground">
              {ipo.subscription_x}x subs
            </span>
          )}
          {gain != null && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold font-mono flex items-center gap-1 ${
                gain >= 0 ? "bg-bull-tint" : "bg-bear-tint"
              }`}
            >
              <TrendingUp size={11} /> {gain >= 0 ? "+" : ""}
              {gain}%
            </span>
          )}
        </div>
        {ipo.detail_url && (
          <a
            href={ipo.detail_url}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Open IPO details"
          >
            <ExternalLink size={15} />
          </a>
        )}
      </div>
    </motion.div>
  );
}

function HeatMeter({ heat, analyst }: { heat: Ipo["heat"]; analyst: number | null }) {
  const tone =
    heat.label === "Hot" ? "bg-bear-tint" : heat.label === "Warm" ? "bg-accent-tint" : "bg-neu-tint";
  const bar =
    heat.label === "Hot" ? "bg-rose-500" : heat.label === "Warm" ? "bg-amber-500" : "bg-slate-400";
  return (
    <div className="glass-chip rounded-2xl px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
          Heat score
        </span>
        <span className={`${tone} rounded-full px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1`}>
          <Flame size={10} /> {heat.label} · {heat.score}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-white/50 overflow-hidden">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${heat.score}%` }} />
      </div>
      <div className="mt-1 text-[9px] text-muted-foreground">
        Analyst {analyst ?? "—"} · market reaction from GMP & subscription
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "open" ? "bg-bull-tint" :
    status === "upcoming" ? "bg-accent-tint" :
    status === "listed" ? "bg-neu-tint" : "glass-chip text-foreground";
  return (
    <span className={`${tone} rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide shrink-0`}>
      {status}
    </span>
  );
}

function Cell({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-chip rounded-2xl px-2.5 py-1.5 min-w-0">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1">
        {icon} {label}
      </div>
      <div className="text-xs font-mono text-foreground truncate">{value}</div>
    </div>
  );
}

function band(min: number | null, max: number | null) {
  if (min == null && max == null) return "—";
  if (min == null || max == null) return `₹${min ?? max}`;
  return `₹${min}–${max}`;
}
function fmtDate(d: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day} ${months[Number(m) - 1]} ${y.slice(2)}`;
}

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { CalendarDays, IndianRupee, TrendingUp, ExternalLink } from "lucide-react";
import { listIpos } from "@/lib/data.functions";
import { FilterMenu } from "@/components/filter-bar";

type Ipo = Awaited<ReturnType<typeof listIpos>>[number];

const STATUSES = [
  { id: "open", label: "Open" },
  { id: "upcoming", label: "Upcoming" },
  { id: "closed", label: "Closed" },
  { id: "listed", label: "Listed" },
  { id: "all", label: "All" },
];
const BOARDS = [
  { id: "all", label: "All boards" },
  { id: "mainboard", label: "Mainboard" },
  { id: "sme", label: "SME" },
];

export function IpoTracker() {
  const listIposFn = useServerFn(listIpos);
  const [status, setStatus] = useState("open");
  const [board, setBoard] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["ipos"],
    queryFn: () => listIposFn(),
    refetchInterval: 300_000,
  });

  const rows = useMemo(() => {
    let list = (data ?? []) as Ipo[];
    if (status !== "all") list = list.filter((i) => i.status === status);
    if (board !== "all") list = list.filter((i) => i.board === board);
    return list;
  }, [data, status, board]);

  return (
    <div className="flex flex-col gap-4">
      <div className="glass rounded-full p-1.5 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterMenu label="Status" options={STATUSES} value={status} onChange={(v) => setStatus(String(v))} />
        <FilterMenu label="Board" options={BOARDS} value={board} onChange={(v) => setBoard(String(v))} />
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
          <p className="mt-1 text-sm text-muted-foreground">Try another status or board.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((ipo) => (
            <IpoCard key={ipo.id} ipo={ipo} />
          ))}
        </div>
      )}
    </div>
  );
}

function IpoCard({ ipo }: { ipo: Ipo }) {
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
        <StatusBadge status={ipo.status} />
      </div>

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

      <div className="mt-auto flex items-center justify-between gap-2 pt-1 min-w-0 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {ipo.gmp != null && (
            <span className="glass-chip rounded-full px-2.5 py-0.5 text-[10px] font-semibold font-mono text-foreground">
              GMP ₹{ipo.gmp}
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

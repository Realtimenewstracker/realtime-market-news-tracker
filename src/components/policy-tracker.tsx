import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Landmark, ExternalLink, Flame, CalendarDays, Building2 } from "lucide-react";
import { listPolicies } from "@/lib/data.functions";
import { FilterMenu } from "@/components/filter-bar";

type Policy = Awaited<ReturnType<typeof listPolicies>>[number];

const STATUSES = [
  { id: "all", label: "All status" },
  { id: "announced", label: "Announced" },
  { id: "proposed", label: "Proposed" },
  { id: "implemented", label: "Implemented" },
];

const SORTS = [
  { id: "heat", label: "By heat" },
  { id: "date", label: "By date" },
  { id: "impact", label: "By impact" },
];

export function PolicyTracker() {
  const listPoliciesFn = useServerFn(listPolicies);
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("heat");

  const { data, isLoading } = useQuery({
    queryKey: ["policies"],
    queryFn: () => listPoliciesFn(),
    refetchInterval: 300_000,
  });

  const categories = useMemo(() => {
    const set = new Set((data ?? []).map((p) => p.category));
    return [{ id: "all", label: "All areas" }, ...[...set].sort().map((c) => ({ id: c, label: c }))];
  }, [data]);

  const rows = useMemo(() => {
    let list = (data ?? []) as Policy[];
    if (status !== "all") list = list.filter((p) => p.status === status);
    if (category !== "all") list = list.filter((p) => p.category === category);
    list = [...list].sort((a, b) =>
      sort === "heat"
        ? b.heat.score - a.heat.score
        : sort === "impact"
          ? (b.impact ?? 0) - (a.impact ?? 0)
          : new Date(b.announced_at).getTime() - new Date(a.announced_at).getTime(),
    );
    return list;
  }, [data, status, category, sort]);

  return (
    <div className="flex flex-col gap-4">
      <div className="glass rounded-full p-1.5 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterMenu label="Status" options={STATUSES} value={status} onChange={(v) => setStatus(String(v))} />
        <FilterMenu label="Area" options={categories} value={category} onChange={(v) => setCategory(String(v))} />
        <FilterMenu label="Sort" options={SORTS} value={sort} onChange={(v) => setSort(String(v))} />
      </div>

      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-3xl h-56 animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="glass rounded-3xl p-8 md:p-12 text-center">
          <p className="font-display text-xl text-foreground">No policies in this bucket</p>
          <p className="mt-1 text-sm text-muted-foreground">Try another area or status.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => (
            <PolicyCard key={p.id} policy={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function PolicyCard({ policy }: { policy: Policy }) {
  const [open, setOpen] = useState(false);
  const shown = open ? policy.beneficiaries : policy.beneficiaries.slice(0, 3);
  return (
    <div
      className="glass glass-hover rounded-3xl p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            <Landmark size={11} />
            <span className="truncate">{policy.authority}</span>
          </div>
          <h3 className="mt-1 font-display text-base md:text-lg font-semibold tracking-tight text-foreground break-words">
            {policy.title}
          </h3>
        </div>
        <StatusPill status={policy.status} />
      </div>

      <HeatMeter score={policy.heat.score} label={policy.heat.label} impact={policy.impact ?? 2} />

      {policy.summary && (
        <p className="text-sm text-muted-foreground leading-relaxed">{policy.summary}</p>
      )}

      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <span className="glass-chip rounded-full px-2 py-1">{policy.category}</span>
        <span className="glass-chip rounded-full px-2 py-1 flex items-center gap-1">
          <CalendarDays size={10} /> {fmtDate(policy.announced_at)}
        </span>
        {policy.outlay_cr != null && (
          <span className="glass-chip rounded-full px-2 py-1">₹{fmtCr(policy.outlay_cr)} cr</span>
        )}
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1.5">
          <Building2 size={11} /> Possible beneficiaries
        </div>
        <ul className="mt-2 flex flex-col gap-1.5">
          {shown.map((b) => (
            <li key={b.id} className="glass-chip rounded-2xl px-3 py-2 flex items-center gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground truncate">
                  {b.company}
                  {b.symbol && <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">{b.symbol}</span>}
                </div>
                {b.rationale && (
                  <div className="text-[11px] text-muted-foreground truncate">{b.rationale}</div>
                )}
              </div>
              <span className="font-mono text-xs font-semibold text-bull shrink-0">
                {b.benefit_score ?? 50}
              </span>
            </li>
          ))}
        </ul>
        {policy.beneficiaries.length > 3 && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="mt-2 text-xs font-semibold text-accent"
          >
            {open ? "Show less" : `+${policy.beneficiaries.length - 3} more companies`}
          </button>
        )}
      </div>

      {policy.source_url && (
        <a
          href={policy.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          Official source <ExternalLink size={11} />
        </a>
      )}
    </div>
  );
}

function HeatMeter({ score, label, impact }: { score: number; label: string; impact: number }) {
  const tone = label === "Hot" ? "text-bear" : label === "Warm" ? "text-accent" : "text-muted-foreground";
  return (
    <div className="flex items-center gap-2">
      <span className={`glass-chip rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${tone}`}>
        <Flame size={11} /> {label} {score}
      </span>
      <div className="h-1.5 flex-1 rounded-full bg-white/60 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, backgroundImage: "linear-gradient(90deg,#0EA5E9,#EA580C)" }}
        />
      </div>
      <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground shrink-0">
        {impact >= 3 ? "High" : impact === 2 ? "Med" : "Low"} impact
      </span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className="glass-chip shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-foreground">
      {status}
    </span>
  );
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}
function fmtCr(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

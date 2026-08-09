import { Search, X, RotateCcw } from "lucide-react";
import { REGIONS } from "@/lib/regions";

export type Filters = {
  q: string;
  category: string;
  sentiment: string;
  impact: number;
  region: string;
};

export const DEFAULT_FILTERS: Filters = { q: "", category: "all", sentiment: "all", impact: 0, region: "all" };

export function isFiltered(f: Filters) {
  return f.q !== "" || f.category !== "all" || f.sentiment !== "all" || f.impact !== 0 || f.region !== "all";
}

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "stocks", label: "Stocks" },
  { id: "macro", label: "Macro" },
  { id: "commodities", label: "Commodities" },
  { id: "crypto", label: "Crypto" },
];
const SENTIMENTS = [
  { id: "all", label: "All" },
  { id: "bullish", label: "Bullish" },
  { id: "bearish", label: "Bearish" },
  { id: "neutral", label: "Neutral" },
];
const IMPACTS = [
  { id: 0, label: "Any" },
  { id: 1, label: "≥ Low" },
  { id: 2, label: "≥ Med" },
  { id: 3, label: "High only" },
];
const GEOS = [{ id: "all", label: "Worldwide" }, ...REGIONS.map((r) => ({ id: r, label: r }))];

export function FilterBar({ value, onChange }: { value: Filters; onChange: (f: Filters) => void }) {
  const update = (patch: Partial<Filters>) => onChange({ ...value, ...patch });
  const dirty = isFiltered(value);

  return (
    <div className="glass rounded-3xl p-3 md:p-4 flex flex-col gap-3 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center gap-2.5 md:gap-3 min-w-0">
        <div className="relative min-w-0 flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={value.q}
            onChange={(e) => update({ q: e.target.value })}
            placeholder="Search headlines…"
            className="glass-input w-full rounded-full pl-9 pr-8 py-2 text-sm outline-none"
          />
          {value.q && (
            <button
              aria-label="Clear search"
              onClick={() => update({ q: "" })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={() => update({ region: "India", impact: 2 })}
          className={`min-h-9 px-3 py-1.5 rounded-full text-xs font-semibold border shrink-0 ${
            value.region === "India" && value.impact >= 2
              ? "bg-accent text-accent-foreground border-accent"
              : "glass-chip text-foreground/80 hover:text-foreground"
          }`}
        >
          <span className="truncate">India high-impact</span>
        </button>
        {dirty && (
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="px-3 py-1.5 rounded-full text-xs font-medium glass-chip text-muted-foreground hover:text-foreground shrink-0 flex items-center gap-1"
          >
            <RotateCcw size={12} /> Reset
          </button>
        )}
        </div>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-x-4 md:gap-y-2 min-w-0">
        <ChipGroup label="Category" options={CATEGORIES} value={value.category} onChange={(v) => update({ category: String(v) })} />
        <ChipGroup label="Geography" options={GEOS} value={value.region} onChange={(v) => update({ region: String(v) })} />
        <ChipGroup label="Impact" options={IMPACTS} value={value.impact} onChange={(v) => update({ impact: Number(v) })} />
        <ChipGroup label="Mood" options={SENTIMENTS} value={value.sentiment} onChange={(v) => update({ sentiment: String(v) })} />
      </div>
    </div>
  );
}


function ChipGroup<T extends string | number>({
  label, options, value, onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 min-w-0 overflow-x-auto -mx-1 px-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mr-1 shrink-0">{label}</span>
      {options.map((o) => (
        <button
          key={String(o.id)}
          onClick={() => onChange(o.id)}
          className={`min-h-8 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 whitespace-nowrap ${
            value === o.id
              ? "glass-btn-primary border-transparent"
              : "glass-chip text-foreground/70 hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

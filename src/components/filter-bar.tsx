import { Search, X, RotateCcw, ChevronDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  { id: "bullish", label: "Positive tone" },
  { id: "bearish", label: "Negative tone" },
  { id: "neutral", label: "Neutral tone" },
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
    <div className="flex flex-col gap-2.5">
      <div className="relative min-w-0">
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

      <div className="glass rounded-3xl p-2 flex flex-wrap items-center gap-1.5">
        <FilterMenu label="Category" options={CATEGORIES} value={value.category} onChange={(v) => update({ category: String(v) })} />
        <FilterMenu label="Geography" options={GEOS} value={value.region} onChange={(v) => update({ region: String(v) })} />
        <FilterMenu label="Impact" options={IMPACTS} value={value.impact} onChange={(v) => update({ impact: Number(v) })} />
        <FilterMenu label="Tone" options={SENTIMENTS} value={value.sentiment} onChange={(v) => update({ sentiment: String(v) })} />
        <button
          onClick={() => update({ region: "India", impact: 2 })}
          className={`min-h-9 px-3 rounded-full text-xs font-semibold shrink-0 whitespace-nowrap border ${
            value.region === "India" && value.impact >= 2
              ? "bg-accent text-accent-foreground border-accent"
              : "glass-chip text-foreground/80 hover:text-foreground"
          }`}
        >
          India high-impact
        </button>
        {dirty && (
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="min-h-9 px-3 rounded-full text-xs font-medium glass-chip text-muted-foreground hover:text-foreground shrink-0 flex items-center gap-1"
          >
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>
    </div>
  );
}

export function FilterMenu<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const active = options.find((o) => o.id === value);
  const isDefault = value === options[0]?.id;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`min-h-9 px-3 rounded-full text-xs font-semibold shrink-0 whitespace-nowrap flex items-center gap-1.5 border ${
            isDefault ? "glass-chip text-foreground/75 hover:text-foreground" : "glass-btn-primary border-transparent"
          }`}
        >
          <span className="text-[10px] uppercase tracking-widest opacity-70">{label}</span>
          <span>{active?.label ?? ""}</span>
          <ChevronDown size={13} className="opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-48 p-1.5 rounded-2xl">
        <div className="flex flex-col gap-0.5 max-h-[50dvh] overflow-y-auto">
          {options.map((o) => (
            <button
              key={String(o.id)}
              onClick={() => onChange(o.id)}
              className={`min-h-9 px-3 rounded-xl text-sm text-left flex items-center justify-between gap-2 ${
                value === o.id ? "bg-white/70 font-semibold text-foreground" : "text-foreground/80 hover:bg-white/50"
              }`}
            >
              <span className="truncate">{o.label}</span>
              {value === o.id && <Check size={14} className="shrink-0" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

import { Search, X } from "lucide-react";

export type Filters = {
  q: string;
  category: string;
  sentiment: string;
  impact: number;
};

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
  { id: 2, label: "≥ Med" },
  { id: 3, label: "High" },
];

export function FilterBar({ value, onChange }: { value: Filters; onChange: (f: Filters) => void }) {
  const update = (patch: Partial<Filters>) => onChange({ ...value, ...patch });
  return (
    <div className="glass rounded-3xl p-3 md:p-4 flex flex-col md:flex-row md:items-center gap-3">
      <div className="relative flex-1">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={value.q}
          onChange={(e) => update({ q: e.target.value })}
          placeholder="Search headlines…"
          className="w-full bg-white/70 border border-white/70 rounded-full pl-9 pr-8 py-2 text-sm outline-none focus:border-accent"
        />
        {value.q && (
          <button
            onClick={() => update({ q: "" })}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <ChipGroup label="Category" options={CATEGORIES} value={value.category} onChange={(v) => update({ category: String(v) })} />
      <ChipGroup label="Mood" options={SENTIMENTS} value={value.sentiment} onChange={(v) => update({ sentiment: String(v) })} />
      <ChipGroup label="Impact" options={IMPACTS} value={value.impact} onChange={(v) => update({ impact: Number(v) })} />
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
    <div className="flex items-center gap-1">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mr-1">{label}</span>
      {options.map((o) => (
        <button
          key={String(o.id)}
          onClick={() => onChange(o.id)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
            value === o.id
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-white/60 border-white/70 text-foreground/70 hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

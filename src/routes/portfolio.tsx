import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus, Upload } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { listPortfolio, upsertPosition, importPortfolioPositions, deletePosition, listTickers } from "@/lib/data.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — TrackIndia" },
      { name: "description", content: "Track your Indian stock portfolio and P&L against live market data." },
      { property: "og:title", content: "Portfolio — TrackIndia" },
      { property: "og:description", content: "Track your Indian stock portfolio against market quotes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const { user, loading } = useSession();
  const listFn = useServerFn(listPortfolio);
  const upsertFn = useServerFn(upsertPosition);
  const importFn = useServerFn(importPortfolioPositions);
  const deleteFn = useServerFn(deletePosition);
  const tickersFn = useServerFn(listTickers);
  const qc = useQueryClient();

  const { data: tickers, isPending: tickersPending, isError: tickersError } = useQuery({ queryKey: ["tickers"], queryFn: () => tickersFn(), enabled: !!user });
  const { data: positions, isPending: positionsPending, isError: positionsError } = useQuery({
    queryKey: ["portfolio"], queryFn: () => listFn(), enabled: !!user,
  });

  const upsert = useMutation({
    mutationFn: (v: { symbol: string; quantity: number; avg_price: number; label?: string }) =>
      upsertFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["portfolio"] }); toast.success("Position saved"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["portfolio"] }); toast.success("Removed"); },
  });

  const [symbol, setSymbol] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [csvRows, setCsvRows] = useState<CsvPosition[]>([]);
  const [csvIssues, setCsvIssues] = useState<string[]>([]);
  const [csvFileName, setCsvFileName] = useState("");

  const importCsv = useMutation({
    mutationFn: (positions: CsvPosition[]) => importFn({ data: { positions } }),
    onSuccess: ({ imported }) => {
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      setCsvRows([]);
      setCsvIssues([]);
      setCsvFileName("");
      toast.success(`${imported} positions imported`, { description: "Matching symbols were updated in your portfolio." });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not import the CSV"),
  });

  const readCsv = async (file: File) => {
    setCsvFileName(file.name);
    setCsvRows([]);
    setCsvIssues([]);
    try {
      const records = parseCsv(await file.text());
      const headers = (records[0] ?? []).map((value, index) => (index === 0 && value.charCodeAt(0) === 0xfeff ? value.slice(1) : value).trim().toLowerCase().replace(/[ _-]+/g, ""));
      const symbolIndex = headers.findIndex((header) => ["symbol", "ticker"].includes(header));
      const quantityIndex = headers.findIndex((header) => ["quantity", "qty"].includes(header));
      const averageIndex = headers.findIndex((header) => ["avgprice", "averageprice", "averagebuyprice"].includes(header));
      if (symbolIndex < 0 || quantityIndex < 0 || averageIndex < 0) {
        setCsvIssues(["CSV needs headers: symbol, quantity, avg_price"]);
        return;
      }
      const aggregated = new Map<string, CsvPosition>();
      const issues: string[] = [];
      for (const [offset, row] of records.slice(1).entries()) {
        if (row.every((value) => !value.trim())) continue;
        const symbolValue = (row[symbolIndex]?.trim().toUpperCase() ?? "").replace(/\.NS$/, "");
        const quantityValue = Number((row[quantityIndex] ?? "").replaceAll(",", "").trim());
        const averageText = (row[averageIndex] ?? "").replaceAll(",", "").trim();
        const averageValue = Number(averageText);
        const line = offset + 2;
        if (!/^[A-Z0-9^=.-]{1,24}$/.test(symbolValue) || !Number.isFinite(quantityValue) || quantityValue <= 0 || !averageText || !Number.isFinite(averageValue) || averageValue < 0) {
          issues.push(`Line ${line}: use a valid symbol, positive quantity and non-negative average price.`);
          continue;
        }
        const prior = aggregated.get(symbolValue);
        if (prior) {
          const totalQuantity = prior.quantity + quantityValue;
          prior.avg_price = (prior.quantity * prior.avg_price + quantityValue * averageValue) / totalQuantity;
          prior.quantity = totalQuantity;
        } else aggregated.set(symbolValue, { symbol: symbolValue, quantity: quantityValue, avg_price: averageValue });
      }
      const valid = [...aggregated.values()];
      if (valid.length > 500) issues.push("A single import can contain up to 500 unique symbols.");
      setCsvRows(valid.slice(0, 500));
      setCsvIssues(issues.slice(0, 4));
    } catch {
      setCsvIssues(["This file could not be read as a CSV. Save it as comma-separated text and try again."]);
    }
  };

  if (loading) return <PageBox>Loading…</PageBox>;
  if (!user) return (
    <PageBox>
      <h1 className="font-display text-2xl">Sign in to build your book</h1>
      <p className="text-muted-foreground text-sm mt-1">Positions are saved to your account.</p>
      <Link to="/auth" search={{}} className="inline-block mt-4 rounded-full glass-btn-primary px-4 py-2 text-sm font-semibold">Sign in</Link>
    </PageBox>
  );

  const tMap = new Map((tickers ?? []).map((t) => [t.alias, t]));
  let totalMv = 0, totalCost = 0, totalPnl = 0;
  const rows = (positions ?? []).map((p) => {
    const t = tMap.get(p.symbol);
    const last = t?.last ?? null;
    const mv = last == null ? null : last * Number(p.quantity);
    const cost = Number(p.avg_price) * Number(p.quantity);
    totalMv += mv ?? 0;
    totalCost += cost;
    const pnl = mv == null ? null : mv - cost;
    if (pnl != null) totalPnl += pnl;
    return { ...p, last, mv, cost, pnl };
  });
  const unquotedSymbols = rows.filter((row) => row.last == null).map((row) => row.symbol);
  const totalsLoading = positionsPending || tickersPending;
  const totalsComplete = !totalsLoading && !positionsError && !tickersError && unquotedSymbols.length === 0;

  return (
    <section className="max-w-5xl mx-auto px-3 md:px-8 pt-6 md:pt-8">
      <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Portfolio</h1>
      <p className="text-sm text-muted-foreground mt-1">Portfolio values use the latest available quotes.</p>

      <div className="mt-6 grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-3">
        <StatCard label="Market value" value={totalsLoading ? "Loading…" : totalsComplete ? inr(totalMv) : "Unavailable"} />
        <StatCard label="Cost basis" value={positionsPending ? "Loading…" : positionsError ? "Unavailable" : inr(totalCost)} />
        <StatCard label="Unrealized P&amp;L" value={totalsLoading ? "Loading…" : totalsComplete ? inr(totalPnl) : "Unavailable"} tone={totalsComplete ? (totalPnl >= 0 ? "bull" : "bear") : undefined} />
      </div>
      {positionsError && <p role="alert" className="mt-3 text-sm text-destructive">Portfolio positions could not be loaded. Refresh the page to try again.</p>}
      {tickersError && <p role="status" className="mt-3 text-sm text-muted-foreground">Market quotes are unavailable right now. Portfolio market value and P&amp;L are hidden until quotes load.</p>}
      {!totalsLoading && !positionsError && !tickersError && unquotedSymbols.length > 0 && (
        <p role="status" className="mt-3 text-sm text-muted-foreground">
          Market value and P&amp;L are unavailable until quotes load for {unquotedSymbols.join(", ")}. These positions are not counted as ₹0.
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!symbol || !qty || !price) return;
          upsert.mutate({ symbol: symbol.trim().toUpperCase(), quantity: Number(qty), avg_price: Number(price) });
          setSymbol(""); setQty(""); setPrice("");
        }}
        className="mt-6 glass rounded-3xl p-3 md:p-4 grid grid-cols-2 md:flex md:flex-row gap-2 items-stretch md:items-end"
      >
        <div className="col-span-2 md:flex-1 min-w-0"><label className="text-xs text-muted-foreground">Symbol (e.g. RELIANCE)</label>
          <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} />
        </div>
        <div className="min-w-0 md:w-32"><label className="text-xs text-muted-foreground">Quantity</label>
          <Input type="number" step="any" value={qty} onChange={(e) => setQty(e.target.value)} />
        </div>
        <div className="min-w-0 md:w-32"><label className="text-xs text-muted-foreground">Avg price</label>
          <Input type="number" step="any" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <Button type="submit" className="col-span-2 rounded-full"><Plus size={14} /> Add / update</Button>
      </form>

      <div className="mt-3 glass rounded-3xl p-4 md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Import from CSV</h2>
            <p className="mt-1 text-xs text-muted-foreground">Use columns <code>symbol,quantity,avg_price</code>. Duplicate symbols are combined using a weighted average.</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Existing positions with matching symbols will be replaced by the imported total.</p>
          </div>
          <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-full glass-btn px-4 py-2 text-sm font-semibold">
            <Upload size={14} /> Choose CSV
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void readCsv(file); event.currentTarget.value = ""; }} />
          </label>
        </div>
        {csvFileName && <div className="mt-3 text-xs font-medium text-foreground">{csvFileName} · {csvRows.length} valid symbols ready</div>}
        {csvIssues.length > 0 && <ul className="mt-2 list-disc pl-5 text-xs text-destructive">{csvIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}
        {csvRows.length > 0 && <>
          <div className="mt-3 flex flex-wrap gap-2">{csvRows.slice(0, 5).map((row) => <span key={row.symbol} className="rounded-full bg-muted px-3 py-1 text-[11px]">{row.symbol} · {row.quantity} @ {row.avg_price.toFixed(2)}</span>)}{csvRows.length > 5 && <span className="px-2 py-1 text-[11px] text-muted-foreground">+{csvRows.length - 5} more</span>}</div>
          <Button type="button" onClick={() => importCsv.mutate(csvRows)} disabled={importCsv.isPending || csvIssues.length > 0} className="mt-3 rounded-full"><Upload size={14} /> {importCsv.isPending ? "Importing…" : `Import ${csvRows.length} symbols`}</Button>
        </>}
      </div>

      <div className="mt-6 glass rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-white/40 backdrop-blur-md text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr><Th>Symbol</Th><Th>Qty</Th><Th>Avg</Th><Th>Last</Th><Th>MV</Th><Th>P&amp;L</Th><Th /></tr>
          </thead>
          <tbody>
            {positionsPending && (
              <tr><td colSpan={7} className="text-center text-muted-foreground py-8">Loading positions…</td></tr>
            )}
            {positionsError && (
              <tr><td colSpan={7} className="text-center text-muted-foreground py-8">Positions could not be loaded.</td></tr>
            )}
            {!positionsPending && !positionsError && rows.length === 0 && (
              <tr><td colSpan={7} className="text-center text-muted-foreground py-8">No positions yet.</td></tr>
            )}
            {!positionsPending && !positionsError && rows.map((r) => (
              <tr key={r.id} className="border-t border-white/60">
                <Td className="font-mono font-semibold">{r.symbol}</Td>
                <Td>{Number(r.quantity)}</Td>
                <Td>{Number(r.avg_price).toFixed(2)}</Td>
                <Td>{r.last?.toFixed(2) ?? "—"}</Td>
                <Td>{r.mv == null ? "—" : inr(r.mv)}</Td>
                <Td className={r.pnl == null ? "text-muted-foreground" : r.pnl >= 0 ? "text-bull" : "text-bear"}>{r.pnl == null ? "—" : inr(r.pnl)}</Td>
                <Td className="text-right">
                  <button onClick={() => remove.mutate(r.id)} aria-label={`Remove ${r.symbol} from portfolio`} className="text-muted-foreground hover:text-bear"><Trash2 size={14} /></button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </section>
  );
}

function Th({ children }: { children?: React.ReactNode }) { return <th className="text-left px-3 md:px-4 py-2.5 font-semibold whitespace-nowrap">{children}</th>; }
function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) { return <td className={`px-3 md:px-4 py-2.5 whitespace-nowrap ${className}`}>{children}</td>; }
function StatCard({ label, value, tone }: { label: string; value: string; tone?: "bull" | "bear" }) {
  return (
    <div className="glass rounded-3xl p-4 md:p-5 min-w-0">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</div>
      <div className={`mt-1 font-mono text-xl md:text-2xl font-semibold truncate ${tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : "text-foreground"}`}>{value}</div>
    </div>
  );
}
function PageBox({ children }: { children: React.ReactNode }) {
  return <section className="max-w-md mx-auto px-4 mt-16 text-center glass-strong rounded-3xl p-8">{children}</section>;
}
function inr(n: number) {
  if (!Number.isFinite(n)) return "—";
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

type CsvPosition = { symbol: string; quantity: number; avg_price: number };

function parseCsv(input: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const character = input[i];
    if (character === '"') {
      if (quoted && input[i + 1] === '"') { value += '"'; i++; }
      else quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(value); value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && input[i + 1] === "\n") i++;
      row.push(value); rows.push(row); row = []; value = "";
    } else value += character;
  }
  if (value.length || row.length) { row.push(value); rows.push(row); }
  return rows;
}

import type { ReactNode } from "react";

export function LegalPage({
  title,
  intro,
  updated = "5 September 2026",
  children,
}: {
  title: string;
  intro?: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <section className="max-w-3xl mx-auto px-3 md:px-8 pt-6 md:pt-8 pb-10">
      <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {intro && <p className="mt-2 text-sm md:text-base text-muted-foreground">{intro}</p>}
      <p className="mt-1 text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">
        Last updated {updated}
      </p>
      <div className="mt-5 flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="glass rounded-3xl p-5 md:p-6">
      <h2 className="font-display text-lg md:text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="mt-2 flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground [&_a]:text-accent [&_a]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">
        {children}
      </div>
    </div>
  );
}

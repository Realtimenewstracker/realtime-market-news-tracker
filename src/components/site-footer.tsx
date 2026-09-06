import { Link } from "@tanstack/react-router";

const LINKS = [
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact Us" },
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/cancellation", label: "Cancellation & Refunds" },
  { to: "/pricing", label: "Pricing" },
] as const;

export function SiteFooter() {
  return (
    <footer className="px-3 md:px-8 pb-6 pt-8">
      <div className="max-w-7xl mx-auto glass rounded-3xl p-5 md:p-6 flex flex-col gap-3">
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="text-foreground/70 hover:text-foreground font-medium">
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-muted-foreground leading-relaxed">
          TrackIndia is an information product, not investment advice. We are not a SEBI-registered adviser or research
          analyst. Markets carry risk — do your own research before investing.
        </p>
        <p className="text-[11px] text-muted-foreground">© {new Date().getFullYear()} TrackIndia</p>
      </div>
    </footer>
  );
}

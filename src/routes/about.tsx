import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, Section } from "@/components/legal-page";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About TrackIndia — Indian market news and context" },
      {
        name: "description",
        content:
          "TrackIndia brings market-focused news, IPO updates and policy-related headlines together with source links and AI-generated summaries and tags.",
      },
      { property: "og:title", content: "About TrackIndia" },
      {
        property: "og:description",
        content: "Who we are and why we built a source-linked news, IPO and policy tracker for Indian markets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <LegalPage title="About TrackIndia" intro="Market news and context for Indian investors, with links back to the original sources.">
      <Section title="What we do">
        <p>
          TrackIndia brings headlines from public news feeds into one market-focused feed, alongside exchange-sourced
          IPO updates and policy-related news. AI-generated summaries and tags help organise stories; they do not prove
          that an event caused a price move or that a company will benefit.
        </p>
      </Section>
      <Section title="Why we built it">
        <p>
          Market-moving information is scattered across dozens of sites, press releases and exchange filings. Traders
          lose time checking multiple sources. We want to help users see what happened, open the original source, and
          assess possible market context for themselves.
        </p>
      </Section>
      <Section title="How the data works">
        <p>
          News comes from public feeds and may be summarised or tagged with AI; those summaries and tags can be
          incomplete or wrong. IPO information is drawn from available exchange feeds and may be delayed or
          unavailable. Company links on policy-related stories indicate possible exposure and should be checked against
          the cited source. Impact and sentiment labels are estimates, not forecasts or recommendations.
        </p>
      </Section>
      <Section title="Important disclaimer">
        <p>
          TrackIndia is an information and research product. We are not a SEBI-registered investment adviser or
          research analyst, and nothing on this site is investment advice, a recommendation, or an offer to buy or sell
          any security. Markets carry risk. Please do your own research or speak to a registered adviser before
          investing.
        </p>
      </Section>
      <Section title="Get in touch">
        <p>
          Questions, corrections or partnership ideas are welcome — see the Contact page.
        </p>
      </Section>
    </LegalPage>
  );
}

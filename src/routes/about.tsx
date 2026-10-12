import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, Section } from "@/components/legal-page";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About TrackIndia — Real-time market news for Indian traders" },
      {
        name: "description",
        content:
          "TrackIndia tracks Indian and global news, IPOs and government policy in real time, with AI tagging that shows what may move NSE and BSE stocks.",
      },
      { property: "og:title", content: "About TrackIndia" },
      {
        property: "og:description",
        content: "Who we are and why we built a real-time news, IPO and policy tracker for Indian markets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <LegalPage title="About Us" intro="A real-time market intelligence desk built for Indian traders and investors.">
      <Section title="What we do">
        <p>
          TrackIndia pulls headlines from Indian and global newswires around the clock, tags each story with a
          category, sentiment, market impact and region, and puts it in one fast feed. Alongside the feed we run an IPO
          tracker with live price bands and dates, and a government policy tracker that lists the listed companies most
          likely to benefit from each decision.
        </p>
      </Section>
      <Section title="Why we built it">
        <p>
          Market-moving information is scattered across dozens of sites, press releases and exchange filings. Traders
          lose the first hour of a story searching for it. We wanted a single screen that shows what happened, how
          strongly it may hit the market, and which names are involved.
        </p>
      </Section>
      <Section title="How the data works">
        <p>
          News is ingested continuously from public feeds and summarised with AI. IPO details come from public issue
          documents and exchange announcements. Policy entries link to the official Government of India, PIB, RBI or
          ministry source so you can verify everything yourself. Heat and impact scores are our own estimates, not
          recommendations.
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

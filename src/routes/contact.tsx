import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, Section } from "@/components/legal-page";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — TrackIndia" },
      {
        name: "description",
        content:
          "Reach the TrackIndia team for support, billing questions, data corrections or partnership enquiries about our market news, IPO and policy tracker.",
      },
      { property: "og:title", content: "Contact Us — TrackIndia" },
      { property: "og:description", content: "Support, billing and partnership contacts for TrackIndia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <LegalPage
      title="Contact Us"
      intro="We read everything. Support and billing queries are answered within 2 working days."
    >
      <Section title="Email">
        <ul>
          <li>
            Support and account help: <a href="mailto:support@trackindia.app">support@trackindia.app</a>
          </li>
          <li>
            Billing and refunds: <a href="mailto:billing@trackindia.app">billing@trackindia.app</a>
          </li>
          <li>
            Data corrections and partnerships: <a href="mailto:hello@trackindia.app">hello@trackindia.app</a>
          </li>
        </ul>
      </Section>
      <Section title="Response times">
        <p>
          Support: within 2 working days. Billing and refund requests: within 5 working days. Privacy and data deletion
          requests: within 30 days, as required by law.
        </p>
      </Section>
      <Section title="Reporting an error in our data">
        <p>
          If an IPO date, price band, policy detail or headline looks wrong, email us with the link and what you think
          is incorrect. We check against the official source and correct it.
        </p>
      </Section>
      <Section title="Grievance officer">
        <p>
          For complaints under Indian IT rules, write to{" "}
          <a href="mailto:grievance@trackindia.app">grievance@trackindia.app</a> with your registered email and a
          description of the issue.
        </p>
      </Section>
    </LegalPage>
  );
}

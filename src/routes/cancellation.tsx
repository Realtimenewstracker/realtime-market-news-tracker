import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, Section } from "@/components/legal-page";

export const Route = createFileRoute("/cancellation")({
  head: () => ({
    meta: [
      { title: "Cancellation & Refund Policy — TrackIndia" },
      {
        name: "description",
        content:
          "TrackIndia currently offers free access. Billing, cancellation and refund terms will be published before paid plans are enabled.",
      },
      { property: "og:title", content: "Cancellation & Refund Policy — TrackIndia" },
      { property: "og:description", content: "TrackIndia is currently free to use. Paid billing, cancellation and refund terms will be published before checkout is enabled." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CancellationPage,
});

function CancellationPage() {
  return (
    <LegalPage
      title="Cancellation & Refund Policy"
      intro="Current access is free. This page will be updated before any paid checkout is enabled."
      updated="10 October 2026"
    >
      <Section title="Current access">
        <p>
          Registered users currently have free access. TrackIndia does not take payment or automatically renew a paid
          plan, so there is no current cancellation action or refund process.
        </p>
      </Section>
      <Section title="If paid plans are introduced">
        <p>
          Before checkout is enabled, we will publish the plan prices, billing frequency, renewal and cancellation
          steps, and refund terms here and in the checkout flow. No paid plan will start from saving a plan preference.
        </p>
      </Section>
      <Section title="Questions">
        <p>For account questions, use the contact details on our Contact page.</p>
      </Section>
    </LegalPage>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, Section } from "@/components/legal-page";

export const Route = createFileRoute("/cancellation")({
  head: () => ({
    meta: [
      { title: "Cancellation & Refund Policy — TrackIndia" },
      {
        name: "description",
        content:
          "How to cancel your TrackIndia membership, what happens to your access, and when refunds are issued on monthly and annual plans.",
      },
      { property: "og:title", content: "Cancellation & Refund Policy — TrackIndia" },
      { property: "og:description", content: "Cancellation, billing and refund rules for TrackIndia memberships." },
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
      intro="Plain rules for cancelling your TrackIndia membership and when money comes back."
    >
      <Section title="Free trial">
        <p>
          Every new account gets 7 days of full access free from the day you sign up. No payment is taken during the
          trial. If you do nothing, the trial simply ends and access pauses until you choose a plan — you are never
          charged automatically for the trial.
        </p>
      </Section>
      <Section title="Plans and billing">
        <ul>
          <li>Monthly membership: ₹199, billed every month.</li>
          <li>Annual membership: ₹1,800, billed once a year.</li>
          <li>All prices are in Indian rupees and include applicable taxes unless stated otherwise.</li>
        </ul>
      </Section>
      <Section title="How to cancel">
        <p>
          Go to your Account page and cancel your membership, or write to us from your registered email. Cancellation
          takes effect at the end of the period you have already paid for — you keep full access until then, and no
          further payment is taken.
        </p>
      </Section>
      <Section title="Refunds">
        <ul>
          <li>
            Monthly plan: charges already made are non-refundable, because the trial lets you evaluate the product
            before paying.
          </li>
          <li>
            Annual plan: you may request a refund within 7 days of the charge if you have not used the service in a
            meaningful way. After that, the year runs to its end and is non-refundable.
          </li>
          <li>
            Duplicate or failed charges are refunded in full. Approved refunds are sent back to the original payment
            method within 5-7 working days of approval.
          </li>
        </ul>
      </Section>
      <Section title="Service interruptions">
        <p>
          If TrackIndia is unavailable for an extended period due to a fault on our side, write to us and we will
          extend your membership or refund the affected days at our discretion.
        </p>
      </Section>
      <Section title="Questions">
        <p>Billing questions can be sent through our Contact page; we reply within 2 working days.</p>
      </Section>
    </LegalPage>
  );
}

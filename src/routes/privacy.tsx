import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, Section } from "@/components/legal-page";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — TrackIndia" },
      {
        name: "description",
        content:
          "How TrackIndia collects, uses, stores and protects your personal data, including account details, watchlists, alerts and payment information.",
      },
      { property: "og:title", content: "Privacy Policy — TrackIndia" },
      { property: "og:description", content: "How we handle your data on TrackIndia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="This policy explains what information TrackIndia collects, why we collect it, and the choices you have."
    >
      <Section title="Information we collect">
        <ul>
          <li>Account details you give us: email address, username and password (stored encrypted).</li>
          <li>Product data you create: named watchlists and their symbols or topics, IPO watchlist, portfolio entries and alert settings.</li>
          <li>Subscription data: plan, status, trial dates and payment reference IDs from our payment partner.</li>
          <li>Technical data: device type, browser, approximate location from IP, and basic usage logs.</li>
        </ul>
      </Section>
      <Section title="How we use it">
        <ul>
          <li>To run your account, show your feed, and deliver price, news and IPO alerts in the app.</li>
          <li>To process subscription payments and manage free trials.</li>
          <li>To keep the service secure, detect abuse and fix bugs.</li>
          <li>To send service emails. We only send marketing email if you opt in.</li>
        </ul>
      </Section>
      <Section title="Card and payment data">
        <p>
          We never see or store your full card, UPI or bank credentials. Payments are processed by our payment gateway
          partner, who handles that data under their own security standards. We only keep the transaction reference and
          your plan status.
        </p>
      </Section>
      <Section title="Sharing">
        <p>
          We do not sell your personal data. We share it only with service providers who help us run TrackIndia —
          hosting, database, email delivery, payment processing and AI summarisation — and only to the extent needed.
          We may disclose data if required by Indian law or a valid legal request.
        </p>
      </Section>
      <Section title="Cookies and storage">
        <p>
          We use essential cookies and browser storage to keep you signed in and remember your preferences. We do not
          use third-party advertising trackers. If you opt in, TrackIndia stores a browser notification preference on
          this device and uses the browser permission to show new alerts while the app is open.
        </p>
      </Section>
      <Section title="Data retention and security">
        <p>
          Your data is stored on managed cloud infrastructure with encryption in transit and row-level access controls
          so that only you can read your own watchlists, alerts and portfolio. We keep account data while your account
          is active and for a reasonable period afterwards to meet legal and accounting obligations.
        </p>
      </Section>
      <Section title="Your rights">
        <p>
          You can access, correct, export or delete your account data at any time. Write to us from your registered
          email and we will act on the request within 30 days.
        </p>
      </Section>
      <Section title="Children">
        <p>TrackIndia is not intended for anyone under 18 years of age.</p>
      </Section>
      <Section title="Changes and contact">
        <p>
          We will post any changes to this policy on this page and update the date above. Questions about privacy can
          be sent through our Contact page.
        </p>
      </Section>
    </LegalPage>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { scanIpoAlerts } from "@/lib/alert-scan.server";
import { requireCronSecret } from "@/lib/cron-auth.server";

export const Route = createFileRoute("/api/public/ipo-alerts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauthorized = await requireCronSecret(request);
        if (unauthorized) return unauthorized;

        const created = await scanIpoAlerts();
        return Response.json({ ok: true, created });
      },
      GET: async () => {
        return new Response(null, { status: 405, headers: { Allow: "POST" } });
      },
    },
  },
});

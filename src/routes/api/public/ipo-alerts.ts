import { createFileRoute } from "@tanstack/react-router";
import { scanIpoAlerts } from "@/lib/alert-scan.server";

export const Route = createFileRoute("/api/public/ipo-alerts")({
  server: {
    handlers: {
      POST: async () => {
        const created = await scanIpoAlerts();
        return Response.json({ ok: true, created });
      },
      GET: async () => {
        const created = await scanIpoAlerts();
        return Response.json({ ok: true, created });
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { db } from "~/server/db";

export const Route = createFileRoute("/api/health")({
  loader: async () => {
    try {
      await db.run("SELECT 1");
      return new Response(JSON.stringify({ status: "healthy", database: "connected", timestamp: new Date().toISOString() }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ status: "unhealthy", error: String(e), timestamp: new Date().toISOString() }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
  component: () => null,
});

import { useLoaderData } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { db, ensureSeeded } from "~/server/db";

export const Route = createFileRoute("/api/health")({
  loader: async () => {
    await ensureSeeded();
    try {
      await db.run("SELECT 1");
      return { status: "healthy", database: "connected", timestamp: new Date().toISOString() };
    } catch (e) {
      return { status: "unhealthy", error: String(e), timestamp: new Date().toISOString() };
    }
  },
  component: HealthPage,
});

function HealthPage() {
  const data = useLoaderData({ from: Route.id });
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}

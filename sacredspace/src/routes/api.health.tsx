import { useLoaderData, createFileRoute } from "@tanstack/react-router";
import { RouteErrorFallback } from "~/components/RouteErrorFallback";

export const Route = createFileRoute("/api/health")({
  errorComponent: () => <RouteErrorFallback />,
  loader: async () => {
    const { db, ensureSeeded } = await import("~/server/db");
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

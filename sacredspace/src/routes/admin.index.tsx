import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { auth } from "@clerk/tanstack-react-start/server";
import { RouteErrorFallback } from "~/components/RouteErrorFallback";

const checkAuth = createServerFn({ method: "GET" }).handler(async () => {
  const { userId } = await auth();
  return { authenticated: !!userId };
});

export const Route = createFileRoute("/admin/")({
  component: AdminIndexPage,
  loader: async () => await checkAuth(),
  errorComponent: () => <RouteErrorFallback title="Access Error" />,
});

function AdminIndexPage() {
  const { authenticated } = Route.useLoaderData();

  if (authenticated) {
    return <Navigate to="/admin/dashboard" />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg">
      <div className="text-center max-w-sm">
        <h1 className="font-serif text-3xl font-semibold text-on-surface">
          Admin
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Sign in to manage mantras and stotras.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            to="/"
            className="rounded-md bg-accent-gold px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-saffron"
          >
            Go to homepage to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}

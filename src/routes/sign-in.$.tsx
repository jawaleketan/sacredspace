import { SignIn } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";
import { RouteErrorFallback } from "~/components/RouteErrorFallback";

export const Route = createFileRoute("/sign-in/$")({
  component: Page,
  errorComponent: () => <RouteErrorFallback />,
});

function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}

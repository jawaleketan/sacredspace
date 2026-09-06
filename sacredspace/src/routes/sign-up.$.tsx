import { SignUp } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";
import { RouteErrorFallback } from "~/components/RouteErrorFallback";

export const Route = createFileRoute("/sign-up/$")({
  component: Page,
  errorComponent: () => <RouteErrorFallback />,
  head: () => ({
    meta: [
      { title: "Sign Up — SacredSpace" },
    ],
  }),
});

function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}

import { Link } from "@tanstack/react-router";

interface RouteErrorFallbackProps {
  title?: string;
  error?: Error;
  reset?: () => void;
}

export function RouteErrorFallback({ title, error, reset }: RouteErrorFallbackProps = {}) {
  const displayTitle = title ?? "Something went wrong";
  const message = error?.message ?? "Please try again later.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg">
      <div className="text-center">
        <h1 className="font-serif text-3xl font-semibold text-on-surface">{displayTitle}</h1>
        <p className="mt-2 max-w-md text-sm text-on-surface-variant">{message}</p>
        <div className="mt-4 flex items-center justify-center gap-3">
          {reset && (
            <button
              onClick={reset}
              className="rounded-md border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
            >
              Try again
            </button>
          )}
          <Link to="/" className="text-sm text-accent-gold hover:text-accent-saffron">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
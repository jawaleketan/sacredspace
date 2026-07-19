import { Link } from "@tanstack/react-router";

export function RouteErrorFallback({ title = "Something went wrong" }: { title?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg">
      <div className="text-center">
        <h1 className="font-serif text-3xl font-semibold text-on-surface">{title}</h1>
        <p className="mt-2 text-sm text-on-surface-variant">Please try again later.</p>
        <Link to="/" className="mt-4 inline-block text-accent-gold hover:text-accent-saffron">
          Back to home
        </Link>
      </div>
    </main>
  );
}
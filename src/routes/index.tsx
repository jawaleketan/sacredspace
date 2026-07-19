import { useState, useEffect, useRef } from "react";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/tanstack-react-start";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { db, ensureSeeded } from "~/server/db";
import { deities } from "~/server/db/schema";
import { DeityCard } from "~/components/DeityCard";

const getDeities = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSeeded();
  return await db.select().from(deities).orderBy(deities.name).all();
});

export const Route = createFileRoute("/")({
  component: HomePage,
  loader: async () => await getDeities(),
});

function HomePage() {
  const deityList = Route.useLoaderData();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  function toggleTheme() {
    setDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return next;
    });
  }

  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-12 md:py-12">
        <nav className="mb-16 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-on-surface md:text-5xl">
              SacredSpace
            </h1>
            <p className="mt-2 text-base text-on-surface-variant">
              Discover mantras and stotras
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/saved"
              className="rounded-md border border-outline-variant px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container"
            >
              Saved
            </Link>
            <button
              onClick={toggleTheme}
              className="rounded-md border border-outline-variant px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container"
              aria-label="Toggle theme"
            >
              {dark ? "\u2600" : "\u263E"}
            </button>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-md border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded-md bg-accent-gold px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-saffron">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </nav>

        <section className="mb-20">
          <div className="max-w-2xl">
            <h2 className="font-serif text-3xl font-semibold text-on-surface md:text-4xl">
              A sanctuary for sacred chants
            </h2>
            <p className="mt-4 text-base leading-relaxed text-on-surface-variant">
              Explore a curated collection of mantras and stotras from the Hindu
              tradition. Each chant is presented in Devanagari script alongside
              its meaning, inviting you to read, reflect, and connect.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const val = searchRef.current?.value.trim();
              if (val) navigate({ to: "/search", search: { q: val, deity: "", type: "" } as { q: string; deity: string; type: string } });
            }}
            className="relative max-w-md"
          >
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
              &#x1F50D;
            </span>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search mantras and stotras..."
              className="w-full rounded-full border border-outline-variant bg-surface-container-lowest py-2.5 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant outline-none transition-colors focus:border-accent-gold focus:ring-1 focus:ring-accent-gold/30"
            />
          </form>
        </section>

        <section>
          <div className="mb-8 flex items-center justify-between">
            <h3 className="font-serif text-2xl font-semibold text-on-surface">
              Deities
            </h3>
            <div className="flex items-center gap-4">
              <Link
                to="/search"
                search={{ q: "", deity: "", type: "" }}
                className="text-sm text-on-surface-variant transition-colors hover:text-accent-gold"
              >
                Browse all
              </Link>
              <span className="text-sm text-on-surface-variant">
                {deityList.length} deities
              </span>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {deityList.map((deity) => (
              <DeityCard
                key={deity.id}
                name={deity.name}
                slug={deity.slug}
                description={deity.description}
                imageUrl={deity.imageUrl}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

import { ClerkProvider } from "@clerk/tanstack-react-start";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "@tanstack/react-router";
import { AudioProvider } from "~/components/AudioProvider";
import { ToastProvider } from "~/components/Toast";
import { ConfirmModal } from "~/components/ConfirmModal";
import { BackToTop } from "~/components/BackToTop";
import { SITE_URL } from "~/lib/constants";
import appCss from "~/styles/app.css?url";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SacredSpace — Mantras & Stotras" },
      { name: "description", content: "Explore a sacred collection of Sanskrit mantras and stotras. Read, listen, and connect with ancient Vedic chants." },
      { property: "og:title", content: "SacredSpace — Mantras & Stotras" },
      { property: "og:description", content: "Explore a sacred collection of Sanskrit mantras and stotras. Read, listen, and connect with ancient Vedic chants." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "stylesheet", href: appCss },
    ],
    scripts: [
      { children: "try{let t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  const router = useRouter();
  const mainRef = useRef<HTMLDivElement>(null);
  const [pwaUpdate, setPwaUpdate] = useState<(() => void) | null>(null);

  useEffect(() => {
    mainRef.current?.focus();
  }, [router.state.location]);

  useEffect(() => {
    import("virtual:pwa-register").then(({ registerSW }) => {
      const updateSW = registerSW({
        onNeedRefresh() {
          setPwaUpdate(() => () => updateSW(true));
        },
        onOfflineReady() {
          console.log("App ready for offline use");
        },
      });
    }).catch((e) => { console.error("PWA registration failed", e); });
  }, []);

  const handlePwaReload = useCallback(() => {
    pwaUpdate?.();
    setPwaUpdate(null);
  }, [pwaUpdate]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-on-surface font-sans antialiased">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-accent-gold focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white">
          Skip to content
        </a>
        <ClerkProvider>
          <QueryClientProvider client={queryClient}>
            <AudioProvider>
              <ToastProvider>
                <div ref={mainRef} id="main-content" tabIndex={-1} className="outline-none">
                  <Outlet />
                </div>
              </ToastProvider>
            </AudioProvider>
            <Scripts />
          </QueryClientProvider>
        </ClerkProvider>
        <ConfirmModal
          open={pwaUpdate !== null}
          title="Update available"
          message="A new version of SacredSpace is available. Reload to get the latest updates?"
          confirmLabel="Reload"
          onConfirm={handlePwaReload}
          onCancel={() => setPwaUpdate(null)}
        />
        <BackToTop />
      </body>
    </html>
  );
}

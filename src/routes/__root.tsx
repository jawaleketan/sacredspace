import { ClerkProvider } from "@clerk/tanstack-react-start";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { AudioProvider } from "~/components/AudioProvider";
import appCss from "~/styles/app.css?url";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SacredSpace — Mantras & Stotras" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-on-surface font-sans antialiased">
        <ClerkProvider>
          <QueryClientProvider client={queryClient}>
            <AudioProvider>
              <Outlet />
            </AudioProvider>
            <Scripts />
          </QueryClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

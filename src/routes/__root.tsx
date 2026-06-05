import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, useRouter, HeadContent, Scripts, useRouterState } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/wag/Navbar";
import Footer from "@/components/wag/Footer";
import { DiamondBackground } from "@/components/wag/DiamondBackground";

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="text-7xl font-display font-bold text-primary">404</div>
      <h1 className="mt-3 font-ui font-semibold text-xl">Page not found</h1>
      <p className="mt-2 text-sm text-warm-muted">The page you're looking for doesn't exist or has moved.</p>
      <a href="/" className="mt-6 inline-flex px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium">Go home</a>
    </div>
  );
}

function ErrorComp({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="font-ui font-semibold text-xl">Something went wrong</h1>
      <p className="mt-2 text-sm text-warm-muted">{error.message}</p>
      <div className="mt-5 flex gap-2">
        <button onClick={() => { router.invalidate(); reset(); }} className="px-4 py-2 rounded-lg bg-primary text-white text-sm">Try again</button>
        <a href="/" className="px-4 py-2 rounded-lg border border-warm text-sm">Go home</a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "We Are Going — Aapni Samaj, Aapnu Network" },
      { name: "description", content: "Community ERP and social network for Indian samaj communities — members, events, matrimony, jobs, donations and more." },
      { name: "author", content: "We Are Going" },
      { property: "og:title", content: "We Are Going — Connect Your Samaj Digitally" },
      { property: "og:description", content: "Community ERP and social network for Indian samaj communities." },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lora:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ErrorComp,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const path = useRouterState({ select: s => s.location.pathname });
  const isAuthArea = path.startsWith("/dashboard") || path.startsWith("/community-admin") || path.startsWith("/admin") || path === "/login";
  const hideNavbarAndFooter = isAuthArea || path === "/";
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Global floating diamond background — fixed, behind all content */}
        <DiamondBackground />
        <div style={{ position: "relative", zIndex: 1 }}>
          {!hideNavbarAndFooter && <Navbar />}
          <AnimatePresence mode="wait">
            <main key={path} className="min-h-[60vh]">
              <Outlet />
            </main>
          </AnimatePresence>
          {!hideNavbarAndFooter && <Footer />}
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

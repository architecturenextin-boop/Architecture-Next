import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
} from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import {
  KEYWORDS,
  OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_TITLE,
  SITE_URL,
  organizationJsonLd,
  siteNavigationJsonLd,
  stripStaticHeadFallback,
  websiteJsonLd,
} from "@/lib/seo";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: any; reset: () => void }) {
  console.error("[Application Error]:", error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { title: SITE_TITLE },
      { name: "description", content: SITE_DESCRIPTION },
      { name: "author", content: "ArchitectureNext" },
      { name: "keywords", content: KEYWORDS },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { name: "theme-color", content: "#294398" },
      { name: "geo.region", content: "IN-KL" },
      { name: "geo.placename", content: "Kozhikode, Kerala" },
      { property: "og:title", content: SITE_TITLE },
      { property: "og:description", content: "Architectural design, 3D visualisation and AI design courses taught by practising architects, with live projects, internship certification and lifetime access." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "ArchitectureNext" },
      { property: "og:locale", content: "en_IN" },
      { property: "og:url", content: `${SITE_URL}/` },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "ArchitectureNext — architecture and interior design courses in Kerala" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SITE_TITLE },
      { name: "twitter:description", content: "Architectural design, 3D visualisation and AI design courses with live projects, internship certification and lifetime access." },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(organizationJsonLd),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(websiteJsonLd),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(siteNavigationJsonLd),
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

import { Toaster } from "sonner";
import { WhatsAppWidget } from "@/components/whatsapp-widget";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useSmoothScroll();

  // Drop the pre-JS copy of the SEO tags from index.html once React has hoisted
  // the route-managed ones, so the rendered DOM has no duplicate title/meta/JSON-LD.
  useEffect(() => {
    stripStaticHeadFallback();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <HeadContent />
      <Outlet />
      <WhatsAppWidget />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

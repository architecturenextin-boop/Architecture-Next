import { createFileRoute, Link } from "@tanstack/react-router";
import { Home, ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/$")({
  head: () => ({ meta: [{ title: "Page Not Found — ArchitectureNext" }] }),
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto flex max-w-3xl flex-col items-center justify-center px-6 py-24 text-center">
        <div className="text-7xl font-extrabold text-primary">404</div>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">
          Page not found
        </h1>
        <p className="mt-3 text-muted-foreground">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" /> Go Home
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Wrench, Home } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance — ArchitectureNext" }] }),
  component: MaintenancePage,
});

function MaintenancePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto flex max-w-3xl flex-col items-center justify-center px-6 py-24 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Wrench className="h-10 w-10" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">
          We'll be right back
        </h1>
        <p className="mt-3 text-muted-foreground">
          ArchitectureNext is undergoing scheduled maintenance. Please check back
          shortly.
        </p>
        <div className="mt-8">
          <Button asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" /> Go Home
            </Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

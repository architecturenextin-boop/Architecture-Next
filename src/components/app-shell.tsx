import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Receipt,
  User,
  Loader2,
  Globe,
  MessageSquareQuote,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, profile, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: "/auth" });
    }
  }, [user, isLoading, navigate]);

  const nav = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/dashboard/courses", label: "My Courses", icon: BookOpen },
    { to: "/dashboard/purchases", label: "Purchases", icon: Receipt },
    { to: "/dashboard/testimonials", label: "Testimonials", icon: MessageSquareQuote },
    { to: "/dashboard/profile", label: "Profile", icon: User },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-soft">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[240px_1fr] md:px-6">
        <aside className="hidden md:block">
          <nav className="sticky top-20 space-y-1 rounded-2xl border border-border bg-card p-2 shadow-soft">
            {nav.map((n) => {
              const active = path === n.to || (n.to !== "/dashboard" && path.startsWith(n.to));
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  <span className="inline-flex items-center gap-2.5">
                    <n.icon className="h-4 w-4" /> {n.label}
                  </span>
                  {active && <ChevronRight className="h-4 w-4" />}
                </Link>
              );
            })}
            <Link
              to="/"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Globe className="h-4 w-4" /> Back to website
            </Link>
            <button
              onClick={handleSignOut}
              className="mt-2 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </nav>
        </aside>
        <main className="min-w-0 pb-20 md:pb-0">{children}</main>
      </div>
      <nav aria-label="Mobile Navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {nav.map((n) => {
            const active = path === n.to || (n.to !== "/dashboard" && path.startsWith(n.to));
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-1 py-1.5 text-xs transition-colors ${active ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"}`}
              >
                <n.icon className="h-5 w-5" />
                <span className="text-[10px] leading-tight">{n.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="h-16 md:hidden" />
    </div>
  );
}

import { createFileRoute, Link, Outlet, useRouterState, redirect, isRedirect, useNavigate } from "@tanstack/react-router";
import { BookOpen, CreditCard, LayoutDashboard, Users, Loader2, MessageSquareQuote, Tag, ChevronRight, Globe, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { ProfileCard } from "@/components/profile-card";
import { authService } from "@/lib/services/auth.service";
import { tokenStorage } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const token = tokenStorage.get();
    if (!token) throw redirect({ to: "/auth" });

    try {
      const { user } = await authService.getMe();
      if (user?.role !== "admin") {
        throw redirect({ to: "/dashboard" });
      }
    } catch (err: any) {
      if (isRedirect(err)) throw err;
      tokenStorage.clear();
      throw redirect({ to: "/auth" });
    }
  },
  component: () => <AdminShell><Outlet /></AdminShell>,
});

function AdminShell({ children }: { children: ReactNode }) {
  const { user, profile, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface-soft">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || profile?.role !== "admin") {
    navigate({ to: "/dashboard" });
    return null;
  }

  const nav = [
    { to: "/admin", label: "Overview", icon: LayoutDashboard },
    { to: "/admin/students", label: "Students", icon: Users },
    { to: "/admin/payments", label: "Payments", icon: CreditCard },
    { to: "/admin/courses", label: "Courses", icon: BookOpen },
    { to: "/admin/coupons", label: "Coupons", icon: Tag },
    { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-surface-soft">
      {/* Slim brand-only top bar — nav lives in the sidebar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandLogo size="md" />
            <span className="rounded-md bg-gradient-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-xs">
              Admin
            </span>
          </div>
          <ProfileCard />
        </div>
      </header>
      {/* Same layout pattern as student AppShell: sidebar on desktop, full width on mobile */}
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[240px_1fr] md:px-6">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block">
          <nav className="sticky top-20 space-y-1 rounded-2xl border border-border bg-card p-2 shadow-soft">
            {nav.map((n) => {
              const active = n.to === "/admin" ? path === "/admin" : path.startsWith(n.to);
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
            <div className="my-1.5 border-t border-border/60" />
            <Link
              to="/"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Globe className="h-4 w-4" /> Back to website
            </Link>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </nav>
        </aside>
        <main className="min-w-0 pb-20 md:pb-0">{children}</main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav aria-label="Admin Mobile Navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
        <div className="flex items-center justify-around overflow-x-auto no-scrollbar py-1">
          {nav.map((n) => {
            const active = n.to === "/admin" ? path === "/admin" : path.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex min-h-[52px] min-w-[50px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1 text-xs transition-colors ${active ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
              >
                <n.icon className="h-4.5 w-4.5" />
                <span className="text-[9px] leading-tight font-medium truncate max-w-[56px]">{n.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="h-16 md:hidden" />
    </div>
  );
}

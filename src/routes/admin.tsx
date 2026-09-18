import { createFileRoute, Link, Outlet, useRouterState, redirect, isRedirect, useNavigate } from "@tanstack/react-router";
import { BookOpen, CreditCard, LayoutDashboard, Users, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { AdminHeader } from "@/components/admin-header";
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
  const { user, profile, isLoading } = useAuth();
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
  ];
  
  return (
    <div className="min-h-screen bg-surface-soft">
      <AdminHeader />
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-background/95 backdrop-blur md:hidden">
        {nav.map((n) => {
          const active = n.to === "/admin" ? path === "/admin" : path.startsWith(n.to);
          return (
            <Link key={n.to} to={n.to} className={`flex flex-col items-center gap-1 py-2.5 text-xs ${active ? "text-primary" : "text-muted-foreground"}`}>
              <n.icon className="h-5 w-5" /><span className="text-[10px] font-medium">{n.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="h-16 md:hidden" />
    </div>
  );
}

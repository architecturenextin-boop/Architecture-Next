import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, CreditCard, LayoutDashboard, Users, Globe, Database, ExternalLink } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ProfileCard } from "@/components/profile-card";

export function AdminHeader() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  const nav = [
    { to: "/admin", label: "Overview", icon: LayoutDashboard },
    { to: "/admin/students", label: "Students", icon: Users },
    { to: "/admin/payments", label: "Payments", icon: CreditCard },
    { to: "/admin/courses", label: "Courses", icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 md:px-8">
        {/* Left: Brand Logo + Admin Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <BrandLogo size="md" />
          <span className="rounded-md bg-gradient-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-xs">
            Admin
          </span>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => {
            const active = n.to === "/admin" ? path === "/admin" : path.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold tracking-wide transition-all ${
                  active
                    ? "bg-primary/10 text-primary shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions + Profile */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-primary"
          >
            <Globe className="h-3.5 w-3.5" /> Back to Website
          </Link>
          <div className="hidden sm:block h-4 w-px bg-border/80" />
          <ProfileCard />
        </div>
      </div>
    </header>
  );
}

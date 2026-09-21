import { Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { BookOpen, CreditCard, LayoutDashboard, Users, Globe, Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ProfileCard } from "@/components/profile-card";

export function AdminHeader() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

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
        <nav aria-label="Admin Navigation" className="hidden items-center gap-1 md:flex">
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

        {/* Right: Actions + Profile + Mobile Trigger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-primary"
          >
            <Globe className="h-3.5 w-3.5" /> Back to Website
          </Link>
          <div className="hidden sm:block h-4 w-px bg-border/80" />
          <ProfileCard />

          {/* Mobile Hamburger Trigger (< 768px) */}
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? "Close admin navigation menu" : "Open admin navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-admin-drawer"
            className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-border/70 bg-card/80 text-foreground shadow-xs transition-colors hover:bg-muted hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 transition-transform duration-200" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5 transition-transform duration-200" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Backdrop Overlay (< 768px) */}
      <div
        className={`fixed inset-0 top-20 z-40 bg-background/80 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Menu Slide-Down Drawer (< 768px) */}
      <div
        id="mobile-admin-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Admin Navigation"
        className={`fixed inset-x-0 top-20 z-50 border-b border-border bg-card/95 px-4 py-6 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-in-out md:hidden ${
          mobileMenuOpen
            ? "translate-y-0 opacity-100 visible"
            : "-translate-y-4 opacity-0 invisible pointer-events-none"
        }`}
      >
        <nav aria-label="Mobile Admin Navigation" className="mx-auto max-w-md">
          <ul className="flex flex-col gap-1.5">
            {nav.map((n) => {
              const active = n.to === "/admin" ? path === "/admin" : path.startsWith(n.to);
              return (
                <li key={n.to}>
                  <Link
                    to={n.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex min-h-[48px] items-center gap-3.5 rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                      active
                        ? "bg-primary/10 text-primary font-semibold shadow-xs"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/80"
                    }`}
                  >
                    <n.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span>{n.label}</span>
                  </Link>
                </li>
              );
            })}
            <li className="mt-2 pt-2 border-t border-border/70">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[48px] items-center gap-3.5 rounded-xl px-4 py-3 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/80"
              >
                <Globe className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>Back to Website</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

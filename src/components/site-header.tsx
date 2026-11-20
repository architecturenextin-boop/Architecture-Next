import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import {
  Menu,
  X,
  Home,
  BookOpen,
  Layers,
  Award,
  HelpCircle,
  LayoutDashboard,
  ShieldAlert,
  User,
  LogOut,
  LogIn,
  MessageSquareQuote,
  Sparkles,
  Database,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ProfileCard } from "@/components/profile-card";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useModalScrollLock } from "@/hooks/use-modal-scroll-lock";

type SiteHeaderProps = {
  /** Optional route-specific action, such as course enrolment or checkout back navigation. */
  action?: ReactNode;
};

/**
 * Shared navigation for learner-facing pages with responsive mobile menu drawer.
 */
export function SiteHeader({ action }: SiteHeaderProps) {
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useModalScrollLock(mobileMenuOpen);

  // Track scroll position for frosted-glass & scroll direction for hide/show effect (desktop only)
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Clamp negative values from iOS elastic pull-to-refresh overscroll
          const currentScrollY = Math.max(0, window.scrollY);

          // Hysteresis threshold to prevent toggle flicker
          setIsScrolled(currentScrollY > 15);

          // On mobile screens (< 768px), ALWAYS keep navbar visible to prevent iOS address-bar shivering
          if (window.innerWidth < 768 || mobileMenuOpen) {
            setIsVisible(true);
            lastScrollY.current = currentScrollY;
            ticking = false;
            return;
          }

          const scrollHeight = document.documentElement.scrollHeight;
          const clientHeight = document.documentElement.clientHeight;
          const maxScrollY = Math.max(0, scrollHeight - clientHeight);

          // Always show navbar when near the top of the page (<= 80px) or during bottom overscroll
          if (currentScrollY <= 80 || currentScrollY >= maxScrollY - 20) {
            setIsVisible(true);
          } else {
            const delta = currentScrollY - lastScrollY.current;
            // Generous threshold for desktop hide/show
            if (delta > 20) {
              setIsVisible(false);
            } else if (delta < -15) {
              setIsVisible(true);
            }
          }

          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mobileMenuOpen]);

  const name = profile?.full_name || "Learner";
  const email = profile?.email || user?.email || "";
  const isAdmin = profile?.role === "admin";
  const initial = (name[0] || "U").toUpperCase();

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await signOut();
    navigate({ to: "/" });
  };

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

  const navLinks = [
    { to: "/", label: "Home", icon: Home, isAnchor: false },
    { to: "/courses", label: "Courses", icon: BookOpen, isAnchor: false },
    { href: "/#features", label: "Program", icon: Layers, isAnchor: true },
    { href: "/#instructor", label: "Mentor", icon: Award, isAnchor: true },
    { href: "/#testimonials", label: "Testimonials", icon: MessageSquareQuote, isAnchor: true },
    { href: "/#faq", label: "FAQ", icon: HelpCircle, isAnchor: true },
  ];

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out ${
        isVisible ? "translate-y-0" : "max-md:translate-y-0 -translate-y-full"
      } ${
        isScrolled
          ? "border-border/70 bg-white/90 dark:bg-background/90 shadow-xs"
          : "border-transparent bg-white/60 dark:bg-background/60 shadow-none"
      }`}
      style={{
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
      }}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 md:px-8">
        {/* Left: Brand Logo */}
        <div className="shrink-0">
          <BrandLogo size="md" />
        </div>

        {/* Center: 6 Nav Links (Desktop >= 768px) */}
        <nav
          aria-label="Desktop Navigation"
          className="hidden items-center justify-center gap-3 md:flex lg:gap-6 xl:gap-8"
        >
          <Link
            to="/"
            activeProps={{ className: "text-primary font-semibold" }}
            inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
            activeOptions={{ exact: true }}
            className="inline-flex min-h-[44px] items-center px-2 py-2 text-xs lg:text-sm font-medium transition-colors"
          >
            Home
          </Link>
          <Link
            to="/courses"
            activeProps={{ className: "text-primary font-semibold" }}
            inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
            className="inline-flex min-h-[44px] items-center px-2 py-2 text-xs lg:text-sm font-medium transition-colors"
          >
            Courses
          </Link>
          <a
            href="/#features"
            className="inline-flex min-h-[44px] items-center px-2 py-2 text-xs lg:text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Program
          </a>
          <a
            href="/#instructor"
            className="inline-flex min-h-[44px] items-center px-2 py-2 text-xs lg:text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Mentor
          </a>
          <a
            href="/#testimonials"
            className="inline-flex min-h-[44px] items-center px-2 py-2 text-xs lg:text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Testimonials
          </a>
          <a
            href="/#faq"
            className="inline-flex min-h-[44px] items-center px-2 py-2 text-xs lg:text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            FAQ
          </a>
        </nav>

        {/* Right Section: Action (Desktop), Profile Card / CTA, and Mobile Menu Toggle */}
        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-3">
          {action && <div className="hidden md:block">{action}</div>}
          
          {/* Profile Card */}
          <ProfileCard />

          {/* Mobile Hamburger Trigger (< 768px) */}
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
            className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-border/70 bg-card/80 text-foreground shadow-xs transition-colors hover:bg-muted hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 transition-transform duration-200" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5 transition-transform duration-200" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Portal (Mounted to document.body to prevent sticky/backdrop-filter containing block bugs) */}
      {isMounted &&
        createPortal(
          <div
            className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${
              mobileMenuOpen ? "visible pointer-events-auto" : "invisible pointer-events-none"
            }`}
          >
            {/* Backdrop overlay */}
            <div
              className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
                mobileMenuOpen ? "opacity-100" : "opacity-0"
              }`}
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-over Drawer from right */}
            <div
              id="mobile-navigation-drawer"
              ref={menuRef}
              role="dialog"
              aria-modal="true"
              aria-label="Site Navigation"
              className={`fixed inset-y-0 right-0 z-50 w-full max-w-[340px] sm:max-w-[380px] bg-background/98 dark:bg-card/98 backdrop-blur-2xl border-l border-border/80 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out ${
                mobileMenuOpen ? "translate-x-0" : "translate-x-full"
              }`}
            >
              {/* Top Drawer Header with Brand Logo and Close Button */}
              <div className="flex items-center justify-between p-5 border-b border-border/60 shrink-0">
                <BrandLogo size="sm" />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="grid h-10 w-10 place-items-center rounded-xl bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Navigation Body */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 overscroll-contain">
                {/* User Profile Card if logged in */}
                {user && (
                  <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-muted/40 p-3 shadow-xs">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-base font-bold text-primary-foreground shadow-soft shrink-0">
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-foreground leading-snug">{name}</div>
                      <div className="truncate text-xs text-muted-foreground">{email}</div>
                    </div>
                    {isAdmin && (
                      <span className="rounded-md bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent shrink-0">
                        Admin
                      </span>
                    )}
                  </div>
                )}

                {/* Primary Site Navigation Links */}
                <ul className="flex flex-col gap-1">
                  {navLinks.map((item) => (
                    <li key={item.label}>
                      {item.isAnchor ? (
                        <a
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex min-h-[46px] items-center gap-3.5 rounded-xl px-4 py-2.5 text-sm sm:text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted/80"
                        >
                          <item.icon className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden="true" />
                          <span>{item.label}</span>
                        </a>
                      ) : (
                        <Link
                          to={item.to}
                          onClick={() => setMobileMenuOpen(false)}
                          activeProps={{ className: "bg-primary/10 text-primary font-semibold shadow-xs" }}
                          inactiveProps={{ className: "text-muted-foreground hover:bg-muted hover:text-foreground" }}
                          activeOptions={{ exact: item.to === "/" }}
                          className="flex min-h-[46px] items-center gap-3.5 rounded-xl px-4 py-2.5 text-sm sm:text-base font-medium transition-colors active:bg-muted/80"
                        >
                          <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                          <span>{item.label}</span>
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>

                {/* Authenticated Links if logged in */}
                {user && (
                  <div className="border-t border-border/70 pt-3">
                    <ul className="flex flex-col gap-1">
                      <li>
                        <Link
                          to="/dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex min-h-[46px] items-center gap-3.5 rounded-xl px-4 py-2.5 text-sm sm:text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <LayoutDashboard className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden="true" />
                          <span>Student Dashboard</span>
                        </Link>
                      </li>
                      {isAdmin && (
                        <>
                          <li>
                            <Link
                              to="/admin"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex min-h-[46px] items-center gap-3.5 rounded-xl px-4 py-2.5 text-sm sm:text-base font-semibold text-accent transition-colors hover:bg-accent/10"
                            >
                              <ShieldAlert className="h-5 w-5 text-accent shrink-0" aria-hidden="true" />
                              <span>Admin Dashboard</span>
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="/admin/backup"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex min-h-[46px] items-center gap-3.5 rounded-xl px-4 py-2.5 text-sm sm:text-base font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              <Database className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden="true" />
                              <span>Backup Data</span>
                            </Link>
                          </li>
                        </>
                      )}
                      <li>
                        <Link
                          to="/dashboard/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex min-h-[46px] items-center gap-3.5 rounded-xl px-4 py-2.5 text-sm sm:text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <User className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden="true" />
                          <span>My Profile</span>
                        </Link>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Bottom Drawer Actions */}
              <div className="border-t border-border/70 p-5 bg-muted/20 shrink-0">
                {user ? (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full min-h-[46px] items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="w-full min-h-[46px] rounded-xl font-semibold border-border text-foreground hover:bg-muted cursor-pointer"
                    >
                      <Link
                        to="/auth"
                        search={
                          typeof window !== "undefined" &&
                          window.location.pathname !== "/auth" &&
                          window.location.pathname !== "/"
                            ? { redirect: window.location.pathname + window.location.search }
                            : undefined
                        }
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <LogIn className="h-4 w-4 mr-2" /> Sign in
                      </Link>
                    </Button>

                    <Button
                      asChild
                      size="lg"
                      className="w-full min-h-[46px] rounded-xl bg-gradient-primary font-bold text-primary-foreground shadow-soft transition-all hover:brightness-110 active:scale-[0.99] cursor-pointer"
                    >
                      <Link to="/courses" onClick={() => setMobileMenuOpen(false)}>
                        <Sparkles className="h-4 w-4 mr-2" /> Enroll Now
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}

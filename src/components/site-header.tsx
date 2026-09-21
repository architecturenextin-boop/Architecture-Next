import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
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
  Sparkles,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ProfileCard } from "@/components/profile-card";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

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
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  // Track scroll position for frosted-glass & scroll direction for hide/show effect
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Immediately activate frosted-glass as soon as user starts scrolling (> 10px)
      // This eliminates the bug where content scrolls under a transparent header
      setIsScrolled(currentScrollY > 10);

      // Keep navbar visible if mobile drawer is active
      if (mobileMenuOpen) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Always show navbar when near the top of the page (<= 80px)
      if (currentScrollY <= 80) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current + 8) {
        // Scrolling down -> hide navbar
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current - 4) {
        // Scrolling up -> reveal navbar
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
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

  const navLinks = [
    { to: "/", label: "Home", icon: Home, isAnchor: false },
    { to: "/courses", label: "Courses", icon: BookOpen, isAnchor: false },
    { href: "/#features", label: "Program", icon: Layers, isAnchor: true },
    { href: "/#instructor", label: "Mentor", icon: Award, isAnchor: true },
    { href: "/#faq", label: "FAQ", icon: HelpCircle, isAnchor: true },
  ];

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      } ${
        isScrolled
          ? "border-[#E5E0D8]/60 bg-white/85 backdrop-blur-[12px] shadow-[0_1px_20px_rgba(0,0,0,0.08)]"
          : "border-transparent bg-transparent backdrop-blur-none shadow-none"
      }`}
      style={{
        transition:
          "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease, backdrop-filter 0.3s ease, -webkit-backdrop-filter 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
      }}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 md:px-8">
        {/* Left: Brand Logo */}
        <div className="shrink-0">
          <BrandLogo size="md" />
        </div>

        {/* Center: 5 Nav Links (Desktop >= 768px) */}
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
        id="mobile-navigation-drawer"
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site Navigation"
        className={`fixed inset-x-0 top-20 z-50 max-h-[calc(100vh-5rem)] overflow-y-auto border-b border-border bg-card/95 px-4 py-5 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-in-out md:hidden ${
          mobileMenuOpen
            ? "translate-y-0 opacity-100 visible"
            : "-translate-y-4 opacity-0 invisible pointer-events-none"
        }`}
      >
        <nav aria-label="Mobile Navigation" className="mx-auto max-w-md space-y-4">
          {/* If Logged In: Compact Mobile User Header Card */}
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
                    className="flex min-h-[48px] items-center gap-3.5 rounded-xl px-4 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted/80"
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
                    className="flex min-h-[48px] items-center gap-3.5 rounded-xl px-4 py-3 text-base font-medium transition-colors active:bg-muted/80"
                  >
                    <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {/* Bottom Drawer Section: Authenticated shortcuts OR Guest CTA Buttons */}
          <div className="border-t border-border/70 pt-3">
            {user ? (
              <ul className="flex flex-col gap-1">
                <li>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-[48px] items-center gap-3.5 rounded-xl px-4 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <LayoutDashboard className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden="true" />
                    <span>Student Dashboard</span>
                  </Link>
                </li>

                {isAdmin && (
                  <li>
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex min-h-[48px] items-center gap-3.5 rounded-xl px-4 py-3 text-base font-semibold text-accent transition-colors hover:bg-accent/10"
                    >
                      <ShieldAlert className="h-5 w-5 text-accent shrink-0" aria-hidden="true" />
                      <span>Admin Dashboard</span>
                    </Link>
                  </li>
                )}

                <li>
                  <Link
                    to="/dashboard/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-[48px] items-center gap-3.5 rounded-xl px-4 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <User className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden="true" />
                    <span>My Profile</span>
                  </Link>
                </li>

                <li>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full min-h-[48px] items-center gap-3.5 rounded-xl px-4 py-3 text-left text-base font-medium text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <LogOut className="h-5 w-5 text-destructive shrink-0" aria-hidden="true" />
                    <span>Sign out</span>
                  </button>
                </li>
              </ul>
            ) : (
              <div className="flex flex-col gap-2.5 pt-1">
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full min-h-[48px] rounded-xl font-semibold border-border text-foreground hover:bg-muted"
                >
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <LogIn className="h-4 w-4 mr-2" /> Sign in
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  className="w-full min-h-[48px] rounded-xl bg-gradient-primary font-semibold text-primary-foreground shadow-soft transition-all hover:scale-[1.01] hover:brightness-110"
                >
                  <Link to="/courses" onClick={() => setMobileMenuOpen(false)}>
                    <Sparkles className="h-4 w-4 mr-2" /> Enroll Now
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

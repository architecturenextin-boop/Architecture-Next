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
  Volume2,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ProfileCard } from "@/components/profile-card";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useModalScrollLock } from "@/hooks/use-modal-scroll-lock";
import { courseService } from "@/lib/services/course.service";

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
  const [accurateCount, setAccurateCount] = useState<number>(102);
  const [studentList, setStudentList] = useState<string[]>([
    "Mohamed",
    "Ramees",
    "Dini",
    "Malu",
    "Ansar",
    "Shahul",
    "Imayavarman",
    "Viswa",
    "Fasalu",
    "Nandhana",
    "Aparna",
    "Arun",
    "Jithin",
    "Sneha",
    "Rahul",
    "Devika",
    "Kavya",
    "Sreerag",
    "Bilal",
    "Fathima",
  ]);
  const [studentIndex, setStudentIndex] = useState<number>(0);
  const addedUserRef = useRef<string | null>(null);
  const lastScrollY = useRef(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setIsMounted(true);
    let active = true;
    courseService.getEnrollmentStats().then((stats) => {
      if (!active) return;
      const countVal = stats.totalRegisteredCount ?? stats.activeCount ?? stats.count;
      if (typeof countVal === "number" && countVal > 0) {
        setAccurateCount(countVal);
      }
      if (stats.recentStudents && stats.recentStudents.length > 0) {
        setStudentList((prev) => {
          const combined = [...stats.recentStudents, ...prev];
          const seen = new Set<string>();
          const unique: string[] = [];
          for (const name of combined) {
            const trimmed = name.trim();
            const lower = trimmed.toLowerCase();
            if (trimmed && !seen.has(lower) && lower !== "admin" && lower !== "learner") {
              seen.add(lower);
              unique.push(trimmed);
            }
          }
          return unique.length > 0 ? unique : prev;
        });
        // Immediately start with the newest / last student from the database
        setStudentIndex(0);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Include the current logged in user in the learner rotation pool (only if student, only once, never lock cycling)
  useEffect(() => {
    const userRole = (profile?.role || user?.role || "").toLowerCase();
    if (userRole === "admin") return;

    const rawName = profile?.first_name || profile?.full_name || profile?.username || user?.name || "";
    const myFirstName = rawName.trim().split(/\s+/)[0];
    if (
      myFirstName &&
      myFirstName.toLowerCase() !== "admin" &&
      myFirstName.toLowerCase() !== "learner" &&
      addedUserRef.current !== myFirstName.toLowerCase()
    ) {
      addedUserRef.current = myFirstName.toLowerCase();
      setStudentList((prev) => {
        const filtered = prev.filter((n) => n.toLowerCase() !== myFirstName.toLowerCase());
        return [myFirstName, ...filtered];
      });
    }
  }, [profile?.first_name, profile?.full_name, profile?.username, profile?.role, user?.name, user?.role]);

  // Smoothly cycle real enrolled & registered students every 3.5 seconds across all learners
  useEffect(() => {
    if (studentList.length === 0) return;
    const interval = setInterval(() => {
      setStudentIndex((prev) => (prev + 1) % studentList.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [studentList.length]);

  // Listen for real-time live enrollment events
  useEffect(() => {
    const handleEvent = (event: Event) => {
      const custom = event as CustomEvent<{ studentName?: string; name?: string }>;
      const name = custom.detail?.studentName || custom.detail?.name;
      if (name) {
        const first = name.trim().split(/\s+/)[0];
        if (first) {
          setStudentList((prev) => [first, ...prev.filter((n) => n.toLowerCase() !== first.toLowerCase())]);
          setStudentIndex(0);
          setAccurateCount((prev) => prev + 1);
        }
      }
    };
    window.addEventListener("enrollment_created", handleEvent);
    return () => window.removeEventListener("enrollment_created", handleEvent);
  }, []);

  useModalScrollLock(mobileMenuOpen);

  const mobileMenuOpenRef = useRef(mobileMenuOpen);
  useEffect(() => {
    mobileMenuOpenRef.current = mobileMenuOpen;
  }, [mobileMenuOpen]);

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
          if (window.innerWidth < 768 || mobileMenuOpenRef.current) {
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
  }, []);

  const name = profile?.full_name || "Learner";
  const email = profile?.email || user?.email || "";
  const isAdmin = profile?.role === "admin";
  const initial = (name[0] || "U").toUpperCase();

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await signOut();
    navigate({ to: "/" });
  };

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setMobileMenuOpen(false);
    if (href.startsWith("/#") && (window.location.pathname === "/" || window.location.pathname === "")) {
      e.preventDefault();
      const targetId = href.replace("/#", "");
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 150);
    }
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

  const currentStudent = studentList[studentIndex % studentList.length] || "Ramees";

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
      {/* Phone-style Live Enrollment Header Notification with Architectural Grid Theme */}
      <div
        className="relative h-[24px] border-b border-brand-blue/10 bg-[#f8faff] dark:bg-[#0c1222] text-xs text-foreground backdrop-blur-md transition-colors overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(41, 67, 152, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(41, 67, 152, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "8px 8px",
        }}
      >
        {/* Subtle Brand Theme Gradient Wash */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/3 via-brand-purple/3 to-brand-blue/3 pointer-events-none" />

        <div className="relative mx-auto flex h-full max-w-7xl items-center justify-between gap-1.5 sm:gap-4 px-4 sm:px-6 md:px-8">
          <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-hidden">
            {/* Live Indicator: Emerald dot with soft mint aura */}
            <span className="relative flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500/15 shrink-0" aria-hidden="true">
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>

            {/* Notification / Speaker Icon in Brand Color */}
            <Volume2 className="h-3 w-3 text-brand-blue dark:text-brand-lilac shrink-0" aria-hidden="true" />

            {/* Notification Text (High Contrast & Maximum Legibility) */}
            <div className="flex items-center gap-2 text-xs truncate">
              <span className="font-bold text-slate-900 dark:text-white shrink-0 tracking-tight">
                {accurateCount}+ Already In
              </span>
              <span className="h-3 w-px bg-slate-300 dark:bg-slate-700 shrink-0" aria-hidden="true" />
              <span className="truncate text-slate-600 dark:text-slate-300 font-medium">
                <strong className="font-bold text-slate-900 dark:text-white">{currentStudent}</strong> joined the learning fam!
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 md:px-8">
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
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
            className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-border/70 bg-card/80 text-foreground shadow-xs transition-colors hover:bg-muted hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden cursor-pointer active:scale-95"
          >
            <Menu className="h-5 w-5 transition-transform duration-200" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Portal (Mounted to document.body to prevent sticky/backdrop-filter containing block bugs) */}
      {isMounted &&
        createPortal(
          <div
            className={`fixed inset-0 z-50 md:hidden transition-[visibility] duration-300 ${
              mobileMenuOpen ? "visible pointer-events-auto" : "invisible pointer-events-none delay-300"
            }`}
          >
            {/* Backdrop overlay */}
            <div
              className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 cursor-pointer ${
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
              className={`fixed inset-y-0 right-0 z-50 w-[85vw] max-w-[340px] sm:max-w-[380px] bg-background/98 dark:bg-card/98 backdrop-blur-2xl border-l border-border/80 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out ${
                mobileMenuOpen ? "translate-x-0" : "translate-x-full"
              }`}
            >
              {/* Top Drawer Header with Brand Logo and Close Button */}
              <div className="flex h-16 items-center justify-between px-5 border-b border-border/60 shrink-0">
                <BrandLogo size="sm" />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-border/70 bg-card/80 text-foreground shadow-xs hover:bg-muted hover:text-primary active:scale-95 transition-all cursor-pointer"
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
                          onClick={(e) => handleAnchorClick(e, item.href)}
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

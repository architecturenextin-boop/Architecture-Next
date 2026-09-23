import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { LayoutDashboard, ShieldAlert, User, LogOut, LogIn, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function ProfileCard() {
  const { user, profile, signOut, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate({ to: "/" });
  };

  if (isLoading) {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
    );
  }

  // Not authenticated state: Show Sign In button area (hidden on small screens)
  if (!user) {
    return (
      <div className="hidden md:flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="font-semibold transition-colors hover:text-primary">
          <Link to="/auth">Sign in</Link>
        </Button>
        <Button
          asChild
          size="sm"
          className="bg-gradient-primary px-5 font-semibold text-primary-foreground shadow-soft transition-all hover:scale-[1.02] hover:shadow-elevated hover:brightness-110"
        >
          <Link to="/courses">Enroll Now</Link>
        </Button>
      </div>
    );
  }

  const name = profile?.full_name || "Learner";
  const email = profile?.email || user.email || "";
  const isAdmin = profile?.role?.toUpperCase() === "ADMIN" || user?.role?.toUpperCase() === "ADMIN";
  const initial = name[0].toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Clickable Profile Button: Compact 36x36px avatar on mobile, full pill on desktop */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="User profile menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-xl sm:rounded-2xl border border-border/80 bg-card/65 p-1 sm:p-1.5 md:pr-3 text-left shadow-soft backdrop-blur-md transition-all hover:border-primary/30 hover:bg-card/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-primary text-xs sm:text-sm font-bold text-primary-foreground shadow-soft shrink-0">
          {initial}
        </div>
        <div className="hidden max-w-[120px] text-xs md:block">
          <div className="truncate font-bold text-foreground leading-snug">{name}</div>
          <div className="truncate text-[10px] text-muted-foreground font-medium capitalize">
            {profile?.role || "Student"}
          </div>
        </div>
        <ChevronDown className={`hidden md:block h-3.5 w-3.5 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Structured Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2.5 w-64 origin-top-right rounded-2xl border border-border bg-card/95 p-2.5 shadow-elevated backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 z-50">
          {/* User Details Header */}
          <div className="border-b border-border/60 px-3 py-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-primary text-base font-bold text-primary-foreground shadow-soft">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-foreground leading-none">{name}</div>
                <div className="truncate text-xs text-muted-foreground mt-1 leading-none">{email}</div>
              </div>
            </div>
            
            {/* Admin Badge Indicator */}
            {isAdmin && (
              <div className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-bold text-accent">
                <ShieldAlert className="h-3 w-3" /> Admin Account
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="space-y-0.5">
            <Link
              to="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Student Dashboard</span>
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold text-accent transition-colors hover:bg-accent/10"
              >
                <ShieldAlert className="h-4 w-4" />
                <span>Admin Dashboard</span>
              </Link>
            )}

            <Link
              to="/dashboard/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <User className="h-4 w-4" />
              <span>My Profile</span>
            </Link>

            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

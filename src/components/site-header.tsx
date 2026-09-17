import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { ProfileCard } from "@/components/profile-card";

type SiteHeaderProps = {
  /** Optional route-specific action, such as course enrolment or checkout back navigation. */
  action?: ReactNode;
};

/**
 * Shared navigation for learner-facing pages. Admin owns its own isolated header.
 */
export function SiteHeader({ action }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 md:px-8">
        <BrandLogo size="md" />

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            to="/"
            activeProps={{ className: "text-primary font-semibold" }}
            inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
            activeOptions={{ exact: true }}
            className="text-sm font-medium transition-colors"
          >
            Home
          </Link>
          <Link
            to="/courses"
            activeProps={{ className: "text-primary font-semibold" }}
            inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
            className="text-sm font-medium transition-colors"
          >
            Courses
          </Link>
          <a
            href="/#features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Program
          </a>
          <a
            href="/#instructor"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Mentor
          </a>
          <a
            href="/#faq"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            FAQ
          </a>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {action}
          <ProfileCard />
        </div>
      </div>
    </header>
  );
}

import { useRouterState } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { brand } from "@/lib/brand";

/**
 * Format course slug into a human-readable title
 * e.g. "architecture-plan-presentation-animation" -> "Architecture Plan Presentation & Animation"
 */
function formatSlugToTitle(slug: string): string {
  if (!slug) return "";
  return slug
    .split("-")
    .map((word) => {
      const lower = word.toLowerCase();
      if (lower === "ai") return "AI";
      if (lower === "bim") return "BIM";
      if (lower === "3d") return "3D";
      if (lower === "cad") return "CAD";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

/**
 * Global floating WhatsApp support widget for student and visitor facing routes.
 * Automatically hidden on admin routes (/admin/*).
 */
export function WhatsAppWidget() {
  const [isHovered, setIsHovered] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  // Generate dynamic prefilled message based on current page context
  const prefilledMessage = useMemo(() => {
    if (path.startsWith("/learn/")) {
      const slug = path.replace("/learn/", "").split("/")[0].split("?")[0];
      const courseName = formatSlugToTitle(slug);
      return courseName
        ? `Hi ArchitectureNext team! I need help with my lessons in the "${courseName}" course.`
        : "Hi ArchitectureNext team! I need help with my course lessons.";
    }

    if (path.startsWith("/courses/") && path !== "/courses" && path !== "/courses/") {
      const slug = path.replace("/courses/", "").split("/")[0].split("?")[0];
      const courseName = formatSlugToTitle(slug);
      return courseName
        ? `Hi ArchitectureNext team! I have a question regarding the "${courseName}" course.`
        : "Hi ArchitectureNext team! I have a question about your courses.";
    }

    if (path.startsWith("/checkout")) {
      return "Hi ArchitectureNext team! I need quick help with course checkout & payment.";
    }

    if (path.startsWith("/dashboard")) {
      return "Hi ArchitectureNext team! I need assistance with my student account and courses.";
    }

    if (path.startsWith("/auth") || path.startsWith("/signup") || path.startsWith("/verify-otp")) {
      return "Hi ArchitectureNext team! I need help with signing into my student account.";
    }

    return "Hi ArchitectureNext team! I would like to know more about your architecture courses & internship program.";
  }, [path]);

  // Determine phone number (strips all non-digit characters)
  const rawPhone = brand.contact.whatsapp || brand.contact.phone || "918891091894";
  const cleanPhone = rawPhone.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(prefilledMessage)}`;

  // Mobile position offset: on dashboard/course detail pages with sticky bottom bars, raise button above them
  const hasBottomBar =
    path.startsWith("/dashboard") ||
    (path.startsWith("/courses/") && path !== "/courses" && path !== "/courses/") ||
    path.startsWith("/learn/");

  const bottomPositionClass = hasBottomBar
    ? "bottom-20 right-4 sm:bottom-6 sm:right-6"
    : "bottom-6 right-4 sm:bottom-6 sm:right-6";

  // Hide on admin routes and learning classroom routes to prevent overlaying lesson navigation arrows
  if (path.startsWith("/admin") || path.startsWith("/learn")) {
    return null;
  }

  return (
    <aside
      aria-label="WhatsApp Chat Support"
      className={`fixed ${bottomPositionClass} z-50 flex items-center gap-3 transition-all duration-300`}
    >
      {/* Interactive Tooltip (Desktop Hover / Focus) */}
      <div
        className={`pointer-events-none hidden sm:flex items-center rounded-xl border border-border/80 bg-card/95 px-3.5 py-2 text-xs font-bold text-foreground shadow-elevated backdrop-blur-md transition-all duration-200 ${
          isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
        }`}
      >
        <span>Chat with us on WhatsApp</span>
        <span className="ml-1.5 text-xs text-[#25D366]">● Online</span>
      </div>

      {/* Floating WhatsApp Action Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        aria-label="Chat with us on WhatsApp"
        title="Chat with us on WhatsApp"
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_4px_20px_rgba(37,211,102,0.45)] transition-all duration-300 hover:scale-110 hover:shadow-[0_6px_28px_rgba(37,211,102,0.6)] active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40 animate-wa-pulse"
      >
        {/* Subtle Ping Wave Ring */}
        <span
          className="absolute inset-0 -z-10 rounded-full bg-[#25D366] opacity-40 animate-ping [animation-duration:3s]"
          aria-hidden="true"
        />

        {/* Official WhatsApp SVG Logo */}
        <svg
          viewBox="0 0 24 24"
          width="30"
          height="30"
          fill="currentColor"
          className="drop-shadow-xs transition-transform duration-300 group-hover:scale-105"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>

        {/* Small Online Indicator Dot */}
        <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full border border-white bg-emerald-400" />
        </span>
      </a>
    </aside>
  );
}

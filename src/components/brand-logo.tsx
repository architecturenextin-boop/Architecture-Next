import { Link } from "@tanstack/react-router";
import { brand } from "@/lib/brand";

type Props = {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  variant?: "default" | "compact";
  className?: string;
};

const sizes = {
  sm: "h-6 sm:h-7 w-auto",
  md: "h-7 sm:h-8 md:h-9 w-auto",
  lg: "h-10 sm:h-11 md:h-12 w-auto",
};

export function BrandLogo({ size = "md", showWordmark = true, variant = "default", className = "" }: Props) {
  return (
    <Link to="/" className={`group inline-flex items-center gap-3 shrink-0 ${className}`}>
      <img
        src={brand.logoUrl}
        alt={`${brand.fullName} logo`}
        width={388}
        height={79}
        className={`${sizes[size]} object-contain transition-transform duration-300 group-hover:scale-[1.02]`}
      />
      {showWordmark && variant === "compact" && (
        <span className="hidden font-display text-base font-extrabold tracking-tight text-foreground sm:inline">
          {brand.shortName}
        </span>
      )}
    </Link>
  );
}

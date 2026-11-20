import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { testimonialService } from "@/lib/services/testimonial.service";

/**
 * Real learner quote for the auth split panel: the approved testimonials shown on
 * the website, served by the same public endpoint as the testimonials section.
 */
export function AuthTestimonial() {
  const { data = [] } = useQuery({
    queryKey: ["auth-testimonial"],
    queryFn: () => testimonialService.getPublicTestimonials(),
    staleTime: 10 * 60 * 1000,
  });

  // Keep the panel balanced: prefer the shortest substantive approved quote.
  const candidates = data
    .filter((item) => item.quote && item.quote.trim().length >= 60)
    .sort((a, b) => a.quote.length - b.quote.length);
  const testimonial = candidates[0] ?? data[0];
  const rating = Math.max(1, Math.min(5, Math.round(testimonial?.rating || 5)));

  return (
    <blockquote className="min-h-[7.5rem] space-y-3">
      {testimonial && (
        <>
          <div className="flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
            {Array.from({ length: rating }).map((_, index) => (
              <Star key={index} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="line-clamp-7 max-w-lg text-base font-medium leading-relaxed text-white/95 drop-shadow-xs sm:text-lg">
            “{testimonial.quote}”
          </p>
          <footer className="text-xs font-semibold text-white/75 sm:text-sm">
            — {testimonial.name}
            {testimonial.role ? `, ${testimonial.role}` : ""}
          </footer>
        </>
      )}
    </blockquote>
  );
}

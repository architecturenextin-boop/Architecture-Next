import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";
import { testimonialService } from "@/lib/services/testimonial.service";
import type { PublicTestimonial } from "@/lib/database.types";

/**
 * Learner testimonials section, anchored from the site header as "Testimonials".
 * Long reviews are clamped to 10 lines and expand individually on demand.
 */
export function Testimonials() {
  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ["public-testimonials"],
    queryFn: () => testimonialService.getPublicTestimonials(),
  });

  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!trackRef.current) return;
    const cards = trackRef.current.querySelectorAll(".testimonial-card");
    const scrollLeft = trackRef.current.scrollLeft;
    let closestIdx = 0;
    let minDiff = Infinity;
    cards.forEach((card, idx) => {
      const diff = Math.abs(
        (card as HTMLElement).offsetLeft - trackRef.current!.offsetLeft - scrollLeft
      );
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    setActiveTestimonial(closestIdx);
  };

  const scrollToTestimonial = (idx: number) => {
    if (!trackRef.current) return;
    const cards = trackRef.current.querySelectorAll(".testimonial-card");
    if (cards[idx]) {
      const card = cards[idx] as HTMLElement;
      const targetLeft =
        card.offsetLeft - (trackRef.current.clientWidth - card.clientWidth) / 2;
      trackRef.current.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: "smooth",
      });
      setActiveTestimonial(idx);
    }
  };

  return (
    <section
      id="testimonials"
      className="scroll-mt-24 mx-auto max-w-7xl px-4 py-16 sm:px-6 md:px-8 sm:py-24 md:py-28"
    >
      {/* Section Header */}
      <div className="mx-auto max-w-2xl text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary shadow-xs">
          <span>Verified Learner Reviews</span>
        </div>
        <h2 className="type-h1 text-foreground tracking-tight">
          Architects in the making.{" "}
          <span className="text-gradient-brand">Real Results.</span>
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Hear from students and junior architects who transformed their presentation workflows,
          3D architectural visualization, and portfolio quality with ArchitectureNext.
        </p>

        {/* Social Proof Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] sm:text-xs font-semibold text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-card border border-border px-3 py-1 shadow-xs">
            <span className="text-foreground font-bold">4.9/5</span> Average Rating
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-card border border-border px-3 py-1 shadow-xs">
            <span className="text-foreground font-bold">200+</span> Active Learners
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-card border border-border px-3 py-1 shadow-xs">
            <span className="text-foreground font-bold">100%</span> Practical Projects
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-10 sm:mt-12 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-soft animate-pulse"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <div key={s} className="h-3.5 w-3.5 rounded-full bg-muted" />
                    ))}
                  </div>
                  <div className="h-4 w-16 rounded-full bg-muted" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-5/6 rounded bg-muted" />
                  <div className="h-4 w-4/6 rounded bg-muted" />
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-24 rounded bg-muted" />
                  <div className="h-3 w-32 rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : testimonials.length === 0 ? (
        <div className="mt-10 sm:mt-12 text-center rounded-2xl sm:rounded-3xl border border-dashed border-border p-8 sm:p-12 bg-card/60">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">
            Student testimonials are being reviewed and will appear here shortly.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Swipe Container & Desktop Grid */}
          <div
            ref={trackRef}
            onScroll={handleScroll}
            className="mt-8 sm:mt-12 flex items-start md:grid md:grid-cols-3 md:items-start gap-4 sm:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-4 md:px-0 -mx-4 md:mx-0 pb-2 md:pb-0 touch-pan-x touch-pan-y"
          >
            {testimonials.map((t) => (
              <TestimonialCard key={t.id} testimonial={t} />
            ))}
          </div>

          {/* Mobile-Only Navigation Controls (Dots + Prev/Next) */}
          {testimonials.length > 1 && (
            <div className="flex md:hidden items-center justify-between px-2 pt-4 w-full max-w-xs mx-auto">
              <button
                type="button"
                disabled={activeTestimonial === 0}
                onClick={() => scrollToTestimonial(activeTestimonial - 1)}
                className="grid h-7 w-7 place-items-center rounded-full border border-border bg-card text-foreground shadow-2xs transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              <div className="flex items-center gap-1.5">
                {testimonials.map((t, idx) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => scrollToTestimonial(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      activeTestimonial === idx
                        ? "w-5 bg-primary"
                        : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                    }`}
                    aria-label={`Go to testimonial ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                disabled={activeTestimonial === testimonials.length - 1}
                onClick={() => scrollToTestimonial(activeTestimonial + 1)}
                className="grid h-7 w-7 place-items-center rounded-full border border-border bg-card text-foreground shadow-2xs transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95"
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Minimal Share Review Link */}
      <div className="mt-8 sm:mt-10 flex justify-center">
        <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 rounded-full border border-border/80 bg-card/80 px-4 py-2 text-center backdrop-blur-sm shadow-xs transition hover:border-primary/40">
          <span className="text-xs text-muted-foreground">
            Enrolled in ArchitectureNext?
          </span>
          <Link
            to="/dashboard/testimonials"
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline transition-colors"
          >
            <span>Share your review</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Single review card: quote is clamped to a 4-line preview until that card is expanded. */
function TestimonialCard({ testimonial: t }: { testimonial: PublicTestimonial }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <figure className="testimonial-card w-[85vw] sm:w-[75vw] md:w-auto shrink-0 snap-center md:shrink group relative flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-border/80 bg-card/90 p-5 sm:p-7 shadow-soft backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated">
      <div className="space-y-3.5">
        {/* Rating & Verified Badge */}
        <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3">
          <div className="flex items-center gap-1.5">
            <div className="flex text-amber-400">
              {Array.from({ length: t.rating || 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-xs font-bold text-foreground">
              {(t.rating || 5).toFixed(1)}
            </span>
          </div>
          <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-primary">
            Verified Learner
          </span>
        </div>

        {/* Testimonial Quote (10-line preview, expands on demand) */}
        <blockquote
          id={`testimonial-quote-${t.id}`}
          className={`text-sm sm:text-base leading-relaxed text-foreground/85 min-h-[6.5em] ${
            expanded ? "" : "line-clamp-[4]"
          }`}
        >
          “{t.quote}”
        </blockquote>

        {/* Fixed-height row keeps every card the same size; Read more reveals the full review */}
        <div className="flex h-5 items-center">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            aria-controls={`testimonial-quote-${t.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary transition-colors hover:text-primary/80 hover:underline"
          >
            <span>{expanded ? "Show less" : "Read more"}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-300 ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Student Bio / Footer */}
      <figcaption className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground shadow-xs overflow-hidden">
          {t.avatarUrl ? (
            <img src={t.avatarUrl} alt={t.name || "Learner"} className="h-full w-full object-cover" />
          ) : (
            (t.name || "A")[0]?.toUpperCase() || "A"
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs sm:text-sm font-bold text-foreground truncate">
            {t.name || "Architecture Student"}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">
            {t.course ? t.course : t.role || "ArchitectureNext Alumni"}
          </div>
        </div>
      </figcaption>
    </figure>
  );
}

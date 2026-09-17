import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, BookOpen, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Course } from "@/lib/database.types";
import { getMediaUrl } from "@/lib/utils";

interface CourseCardProps {
  course: Course;
  badge?: string;
}

export function CourseCard({ course, badge }: CourseCardProps) {
  // Calculate discount percentage
  const originalPrice = course.original_price || 10000;
  const price = course.price || 0;
  const discount = originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-border/80 bg-card/90 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-elevated">
      {/* Cover Image Container */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        <img
          src={getMediaUrl(course.cover_url)}
          alt={course.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Top-left Language / Course Tag Badge */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {course.language && (
            <span className="rounded-md bg-gradient-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-md backdrop-blur-md">
              {course.language}
            </span>
          )}
        </div>

        {/* Floating Price Offer Badge (Bottom Right of Image) */}
        <div className="absolute bottom-3 right-3 rounded-lg bg-background/90 border border-primary/40 px-3 py-1.5 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
            <span>{course.currency}{price.toLocaleString()}/- Offer</span>
            <span className="text-xs text-muted-foreground font-semibold">[Today Only]</span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-6">
        {/* Rating and Metadata row */}
        <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-muted-foreground">
          <div className="flex items-center gap-1 text-amber-500 font-semibold">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span>{course.rating || 4.9}</span>
            <span className="text-muted-foreground font-normal">
              ({course.review_count || 100}+ reviews)
            </span>
          </div>
          <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold text-primary">
            {course.level}
          </span>
        </div>

        {/* Title */}
        <h3 className="mt-3 font-display text-lg font-bold leading-snug tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {course.title}
        </h3>

        {/* Tagline */}
        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground line-clamp-2">
          {course.tagline || course.description}
        </p>

        {/* Meta Stats: Duration & Lessons */}
        <div className="mt-4 flex items-center gap-4 text-xs sm:text-sm font-medium text-muted-foreground border-t border-border/60 pt-4">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>{course.total_duration}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span>{course.total_lessons} Lessons</span>
          </div>
        </div>

        {/* Pricing & CTA Row */}
        <div className="mt-6 flex items-center justify-between gap-3 pt-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
                {course.currency}{price.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground line-through">
                {course.currency}{originalPrice.toLocaleString()}
              </span>
            </div>
            <span className="text-xs font-semibold text-primary">
              Save {discount}% OFF
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              className="bg-gradient-primary font-semibold text-primary-foreground shadow-soft transition-all hover:brightness-110 hover:shadow-elevated"
            >
              <Link
                to="/courses/$courseId"
                params={{ courseId: course.slug || course.id }}
              >
                Enroll <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

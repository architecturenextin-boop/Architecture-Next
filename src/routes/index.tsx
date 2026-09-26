import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  Check,
  ChevronDown,
  Compass,
  Layers,
  Leaf,
  PencilRuler,
  PlayCircle,
  Sparkles,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { brand } from "@/lib/brand";
import {
  faqs,
  features,
  heroStats,
  instructor,
  pricingFeatures,
} from "@/lib/static-data";
import { useQuery } from "@tanstack/react-query";
import { courseService } from "@/lib/services/course.service";
import { testimonialService } from "@/lib/services/testimonial.service";
import { useAuth } from "@/hooks/use-auth";
import { useEnrolledCourses } from "@/hooks/use-enrolled-courses";
import heroImg from "@/assets/hero-learner.jpeg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ArchitectureNext — School of Internship" },
      {
        name: "description",
        content:
          "Join ArchitectureNext School of Internship and learn directly from practising architects through real projects, BIM workflows, mentorship and portfolio-driven education.",
      },
      { property: "og:title", content: "ArchitectureNext — School of Internship" },
      {
        property: "og:description",
        content:
          "Premium architecture internship program with live industry projects, BIM workflows and mentorship.",
      },
    ],
  }),
  component: Landing,
});

const mainCourseFallback = {
  price: 1999,
  original_price: 5999,
  currency: "₹",
  id: "398c12aa-8f25-5ef7-ba51-6a99bfe7d58f",
  slug: "architecture-plan-presentation-animation",
};

const featureIcons = [Compass, Layers, PencilRuler, Users, Leaf, Trophy];

function Landing() {
  const { data: courses = [] } = useQuery({
    queryKey: ["landing-courses"],
    queryFn: async () => {
      try {
        const raw = await courseService.getCourses();
        return (Array.isArray(raw) ? raw : []).filter((c: any) => {
          if (c.status === "draft" || c.status === "archived") return false;
          if (typeof c.published === "boolean" && !c.published) return false;
          return true;
        });
      } catch {
        return [];
      }
    },
  });

  const { data: mainCourse } = useQuery({
    queryKey: ["landing-main-course"],
    queryFn: async () => {
      try {
        const data = await courseService.getCourse("architecture-plan-presentation-animation");
        if (data && (data.status === "draft" || data.status === "archived" || data.published === false)) {
          return null;
        }
        return data;
      } catch {
        return null;
      }
    },
  });

  const activeCourse = courses[0] || mainCourse || mainCourseFallback;

  return (
    <div className="min-h-screen bg-background animate-fade-in overflow-x-clip">
      <SiteHeader />
      <Hero />
      <TrustBar />
      <Features />
      <Instructor />
      <Testimonials />
      <Pricing course={activeCourse} />
      <FAQ />
      <Footer />
    </div>
  );
}

function Hero() {
  const { user } = useAuth();
  const { hasAnyEnrollments } = useEnrolledCourses();

  return (
    <section className="relative overflow-hidden bg-gradient-hero border-b border-border">
      <div className="pointer-events-none absolute -top-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-brand-blue/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-brand-purple/15 blur-[120px]" />
      <div className="relative mx-auto grid max-w-7xl gap-14 px-5 pt-16 pb-24 md:grid-cols-2 md:items-center md:px-8 md:pt-24 md:pb-32">
        <div className="space-y-7 animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-primary shadow-soft backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-primary" />
            New cohort enrolling now
          </span>
          <h1 className="type-display text-foreground">
            Accelerate Your Architecture Career with{" "}
            <span className="text-gradient-brand">Real Experience</span>
          </h1>
          <p className="type-body max-w-xl text-muted-foreground">
            Join Architecture Next to master industry-standard architecture software,{" "}
            <strong className="font-bold text-foreground">AI-powered workflows</strong>, and real
            project execution through flexible online and classroom training designed for future
            architects and designers.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              asChild
              size="lg"
              className="h-12 bg-gradient-primary px-7 font-semibold text-primary-foreground shadow-glow transition-all hover:scale-[1.02] hover:brightness-110"
            >
              {user && hasAnyEnrollments ? (
                <Link to="/dashboard/courses">
                  Continue <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              ) : (
                <Link to="/courses">
                  Enroll Now <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              )}
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 border-foreground/15 bg-surface/70 px-6 font-semibold backdrop-blur transition-all hover:bg-surface"
            >
              <Link to="/courses/$courseId" params={{ courseId: "architecture-plan-presentation-animation" }} hash="preview">
                <PlayCircle className="mr-1.5 h-4 w-4" /> Watch Program Overview
              </Link>
            </Button>
          </div>
          <dl className="grid max-w-xl grid-cols-2 gap-4 pt-6 sm:grid-cols-4">
            {heroStats.map((s) => (
              <div key={s.label} className="border-l-2 border-primary/20 pl-3">
                <dt className="type-h3 font-extrabold text-foreground">
                  {s.value}
                </dt>
                <dd className="mt-0.5 type-small text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative animate-fade-up [animation-delay:120ms]">
          <div className="absolute -inset-6 rounded-[2rem] bg-gradient-primary opacity-25 blur-3xl" />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-surface shadow-elevated">
            <img
              src={heroImg}
              alt="Architecture student working on BIM and design drawings"
              width={1280}
              height={1280}
              className="aspect-square w-full object-cover md:aspect-[4/5]"
            />
          </div>
          <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-2xl border border-border bg-surface/90 p-3 pr-5 shadow-elevated backdrop-blur sm:flex">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
              <Award className="h-5 w-5" />
            </div>
            <div className="text-sm">
              <div className="type-small font-bold text-foreground">Internship Certificate</div>
              <div className="type-small text-xs text-muted-foreground">Verifiable & industry-mentored</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const items = [
    "AI Workflow",
    "360 Rendering",
    "Presentation",
    "Animation",
    "Portfolio",
    "Skill Development",
  ];

  return (
    <div className="border-y border-border bg-surface/60 py-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-3 px-5 type-small font-semibold uppercase tracking-widest text-muted-foreground sm:text-sm md:gap-x-10 md:px-8">
        {items.map((item, index) => (
          <div key={item} className="flex items-center gap-x-6 md:gap-x-10">
            <span className="opacity-75 transition-opacity hover:opacity-100">{item}</span>
            {index < items.length - 1 && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary/40" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="scroll-mt-24 mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-primary">
          The Program
        </span>
        <h2 className="mt-3 type-h1 text-foreground tracking-tight">
          Learn beyond the classroom, <br className="hidden sm:block" />
          <span className="text-gradient-brand">design for the real world.</span>
        </h2>
        <p className="mt-4 type-body text-muted-foreground">
          Master architecture with affordable online courses designed by industry professionals.
          Learn at your own pace through practical projects, expert mentorship, and real-world
          workflows that prepare you for a successful career.
        </p>
      </div>
      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((it, i) => {
          const Icon = featureIcons[i % featureIcons.length];
          return (
            <div
              key={it.title}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-elevated"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft transition-transform duration-300 group-hover:scale-110">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 type-h3 text-foreground tracking-tight">{it.title}</h3>
              <p className="mt-2 type-small leading-relaxed text-muted-foreground">{it.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Instructor() {
  return (
    <section id="instructor" className="scroll-mt-24 border-y border-border bg-surface py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 md:grid-cols-12 md:px-8">
        {/* Left Mentor Image Card (5 Cols) */}
        <div className="relative md:col-span-5">
          <div className="relative overflow-hidden rounded-[2.25rem] border border-border/80 bg-card shadow-elevated transition-transform duration-500 hover:scale-[1.01]">
            <img
              src={instructor.image}
              alt={instructor.name}
              width={800}
              height={1000}
              loading="lazy"
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
        </div>

        {/* Right Details & Stats Content (7 Cols) */}
        <div className="md:col-span-7 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Your Mentor
            </span>
            <h2 className="mt-2 type-h1 text-foreground tracking-tight">
              {instructor.name}
            </h2>
            <p className="mt-2 type-body font-semibold text-muted-foreground">
              {instructor.title} · {instructor.experience}
            </p>
          </div>

          <div className="space-y-4 type-body leading-relaxed text-muted-foreground">
            {instructor.bio.split("\n\n").map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 sm:gap-4">
            {instructor.stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-border/80 bg-card/80 p-4 text-center shadow-soft backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
              >
                <div className="type-h2 font-black text-foreground">
                  {s.value}
                </div>
                <div className="mt-1 type-small text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ["public-testimonials"],
    queryFn: () => testimonialService.getPublicTestimonials(),
  });

  return (
    <section id="testimonials" className="scroll-mt-24 mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-28">
      {/* Section Header */}
      <div className="mx-auto max-w-2xl text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary shadow-xs">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Verified Alumni Stories</span>
        </div>
        <h2 className="type-h1 text-foreground tracking-tight">
          Architects in the making. <span className="text-gradient-brand">Real Results.</span>
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Hear from students and junior architects who transformed their presentation workflows, BIM coordination, and portfolio quality with ArchitectureNext.
        </p>

        {/* Social Proof Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] sm:text-xs font-semibold text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-card border border-border px-3 py-1 shadow-xs">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-foreground font-bold">4.9/5</span> Average Rating
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-card border border-border px-3 py-1 shadow-xs">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span className="text-foreground font-bold">200+</span> Active Learners
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-card border border-border px-3 py-1 shadow-xs">
            <Award className="h-3.5 w-3.5 text-emerald-500" />
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
        <div className="mt-10 sm:mt-12 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.id}
              className="group relative flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-border/80 bg-card/90 p-5 sm:p-7 shadow-soft backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated"
            >
              <div className="space-y-3.5">
                {/* Rating & Verified Badge */}
                <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3">
                  <div className="flex items-center gap-1.5">
                    <div className="flex text-amber-400">
                      {Array.from({ length: t.rating || 5 }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-foreground">
                      {(t.rating || 5).toFixed(1)}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Check className="h-2.5 w-2.5" /> Verified Learner
                  </span>
                </div>

                {/* Testimonial Quote */}
                <blockquote className="type-body leading-relaxed text-foreground/90 text-xs sm:text-sm italic">
                  "{t.quote}"
                </blockquote>
              </div>

              {/* Student Bio / Footer */}
              <figcaption className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground shadow-xs overflow-hidden">
                  {t.avatarUrl || (t as any).avatar ? (
                    <img src={t.avatarUrl || (t as any).avatar} alt={t.name} className="h-full w-full object-cover" />
                  ) : (
                    (t.name || "A")[0]?.toUpperCase() || "A"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-bold text-foreground truncate">{t.name || "Architecture Student"}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {t.course ? t.course : t.role || "ArchitectureNext Alumni"}
                  </div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {/* Minimal Share Story Link */}
      <div className="mt-8 sm:mt-10 flex justify-center">
        <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 rounded-full border border-border/80 bg-card/80 px-4 py-2 text-center backdrop-blur-sm shadow-xs transition hover:border-primary/40">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
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

function Pricing({ course }: { course: any }) {
  const { isEnrolledIn } = useEnrolledCourses();
  const isEnrolled = isEnrolledIn(course.id) || isEnrolledIn(course.slug);

  const originalPrice = course.original_price || 5999;
  const price = course.price || 1999;
  const currency = course.currency || "₹";

  const discount = originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  // Parse course highlights if present, otherwise fallback to static features
  let featuresList = pricingFeatures;
  if (course.highlights && Array.isArray(course.highlights) && course.highlights.length > 0) {
    featuresList = course.highlights;
  } else if (course.what_you_will_learn && Array.isArray(course.what_you_will_learn)) {
    featuresList = course.what_you_will_learn;
  }

  return (
    <section id="pricing" className="scroll-mt-24 bg-surface py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Pricing</span>
          <h2 className="mt-3 type-h1 text-foreground tracking-tight">
            One enrolment. <span className="text-gradient-brand">Lifetime access.</span>
          </h2>
          <p className="mt-4 type-body text-muted-foreground">
            {course.tagline || course.description || "Transparent pricing. No subscriptions. Yours forever."}
          </p>
        </div>
        <div className="relative mt-12 overflow-hidden rounded-[1.75rem] border border-border bg-card p-8 shadow-elevated md:p-12">
          <div className="relative">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">
                {course.level || "Complete Course"}
              </span>
              {isEnrolled ? (
                <span className="rounded-md bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                  ✓ Enrolled in Course
                </span>
              ) : course.language ? (
                <span className="rounded-md bg-gradient-primary px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground shadow-sm">
                  {course.language}
                </span>
              ) : null}
            </div>

            <h3 className="mt-3 max-w-2xl type-h2 text-foreground tracking-tight">
              {course.title || "Architecture Plan Presentation & Animation"}
            </h3>

            {(course.total_duration || course.total_lessons) && (
              <div className="mt-3 flex items-center gap-4 type-small text-xs font-semibold text-muted-foreground">
                {course.total_duration && <span>⏱ {course.total_duration}</span>}
                {course.total_lessons && <span>📚 {course.total_lessons} Lessons</span>}
                {course.rating && <span>⭐ {course.rating} ({course.review_count || 100}+ reviews)</span>}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-end gap-4">
              <span className="type-display text-foreground">
                {currency}
                {price.toLocaleString()}
              </span>
              <span className="pb-1 text-lg font-medium text-muted-foreground line-through">
                {currency}
                {originalPrice.toLocaleString()}
              </span>
              <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
                {discount > 0 ? `Save ${discount}% OFF` : "Limited launch price"}
              </span>
            </div>
            <ul className="mt-10 grid gap-3.5 sm:grid-cols-2">
              {featuresList.slice(0, 6).map((f) => (
                <li key={f} className="flex items-start gap-2.5 type-body text-sm font-medium">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            {isEnrolled ? (
              <Button
                asChild
                size="lg"
                className="mt-10 h-13 w-full bg-emerald-600 hover:bg-emerald-700 py-3.5 text-base font-bold text-white shadow-glow transition-all hover:scale-[1.01] hover:brightness-110 cursor-pointer"
              >
                <Link to="/learn/$courseId" params={{ courseId: course.slug || course.id }}>
                  <PlayCircle className="mr-2 h-5 w-5" /> Continue Learning
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="mt-10 h-13 w-full bg-gradient-primary py-3.5 text-base font-semibold text-primary-foreground shadow-glow transition-all hover:scale-[1.01] hover:brightness-110"
              >
                <Link to="/courses/$courseId" params={{ courseId: course.slug || course.id }}>
                  Enroll Now <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            )}
            <p className="mt-4 text-center type-small text-xs text-muted-foreground">
              7-day refund · Internship certificate · Lifetime updates
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="scroll-mt-24 mx-auto max-w-3xl px-5 py-24 md:px-8 md:py-32">
      <div className="text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-primary">FAQ</span>
        <h2 className="mt-3 type-h1 text-foreground tracking-tight">
          Questions, answered.
        </h2>
      </div>
      <div className="mt-12 space-y-3">
        {faqs.map((f, i) => {
          const active = open === i;
          return (
            <div
              key={f.q}
              className={`overflow-hidden rounded-2xl border bg-card shadow-soft transition-all duration-300 ${
                active ? "border-primary/30 shadow-elevated" : "border-border"
              }`}
            >
              <button
                onClick={() => setOpen(active ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="type-h3 text-base sm:text-lg font-bold tracking-tight text-foreground">{f.q}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-primary transition-transform duration-300 ${
                    active ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ${
                  active ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-6 type-body text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}



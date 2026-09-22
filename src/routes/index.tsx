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
import { CourseCard } from "@/components/course-card";
import { SiteHeader } from "@/components/site-header";
import { brand } from "@/lib/brand";
import {
  faqs,
  features,
  heroStats,
  instructor,
  pricingFeatures,
  testimonials,
} from "@/lib/static-data";
import { useQuery } from "@tanstack/react-query";
import { courseService } from "@/lib/services/course.service";
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
        return await courseService.getCourses();
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
      <CoursesSection />
      <Instructor />
      <Testimonials />
      <Pricing course={activeCourse} />
      <FAQ />
      <Footer />
    </div>
  );
}

function Hero() {
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
          <h1 className="font-display text-[2.6rem] font-extrabold leading-[1.05] tracking-tight text-foreground md:text-6xl">
            Accelerate Your Architecture Career with{" "}
            <span className="text-gradient-brand">Real Experience</span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
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
              <Link to="/courses">
                Enroll Now <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 border-foreground/15 bg-surface/70 px-6 font-semibold backdrop-blur transition-all hover:bg-surface"
            >
              <a href="#instructor">
                <PlayCircle className="mr-1.5 h-4 w-4" /> Watch Program Overview
              </a>
            </Button>
          </div>
          <dl className="grid max-w-xl grid-cols-2 gap-4 pt-6 sm:grid-cols-4">
            {heroStats.map((s) => (
              <div key={s.label} className="border-l-2 border-primary/20 pl-3">
                <dt className="font-display text-xl font-extrabold text-foreground md:text-2xl">
                  {s.value}
                </dt>
                <dd className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
              <div className="font-display font-bold">Internship Certificate</div>
              <div className="text-xs text-muted-foreground">Verifiable & industry-mentored</div>
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
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-3 px-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:text-sm md:gap-x-10 md:px-8">
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
        <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight md:text-5xl">
          Learn beyond the classroom, <br className="hidden sm:block" />
          <span className="text-gradient-brand">design for the real world.</span>
        </h2>
        <p className="mt-4 text-base text-muted-foreground md:text-lg">
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
              <h3 className="mt-5 font-display text-lg font-bold tracking-tight">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it.body}</p>
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
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {instructor.name}
            </h2>
            <p className="mt-2 text-sm sm:text-base font-semibold text-muted-foreground">
              {instructor.title} · {instructor.experience}
            </p>
          </div>

          <div className="space-y-4 text-sm sm:text-base leading-relaxed text-muted-foreground">
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
                <div className="font-display text-2xl font-black text-foreground sm:text-3xl">
                  {s.value}
                </div>
                <div className="mt-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-primary">
          Alumni Stories
        </span>
        <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight md:text-5xl">
          Architects in the making.
        </h2>
      </div>
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {testimonials.map((t) => (
          <figure
            key={t.name}
            className="flex flex-col rounded-3xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated"
          >
            <div className="flex gap-0.5 text-accent">
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-foreground/90">
              "{t.quote}"
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
                {t.name[0]}
              </div>
              <div>
                <div className="font-display text-sm font-bold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function Pricing({ course }: { course: any }) {
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
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight md:text-5xl">
            One enrolment. <span className="text-gradient-brand">Lifetime access.</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            {course.tagline || course.description || "Transparent pricing. No subscriptions. Yours forever."}
          </p>
        </div>
        <div className="relative mt-12 overflow-hidden rounded-[1.75rem] border border-border bg-card p-8 shadow-elevated md:p-12">
          <div className="relative">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">
                {course.level || "Complete Course"}
              </span>
              {course.language && (
                <span className="rounded-md bg-gradient-primary px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground shadow-sm">
                  {course.language}
                </span>
              )}
            </div>

            <h3 className="mt-3 max-w-2xl font-display text-2xl font-black leading-tight tracking-[-0.025em] text-foreground sm:text-3xl md:text-4xl">
              {course.title || "Architecture Plan Presentation & Animation"}
            </h3>

            {(course.total_duration || course.total_lessons) && (
              <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                {course.total_duration && <span>⏱ {course.total_duration}</span>}
                {course.total_lessons && <span>📚 {course.total_lessons} Lessons</span>}
                {course.rating && <span>⭐ {course.rating} ({course.review_count || 100}+ reviews)</span>}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-end gap-4">
              <span className="font-display text-5xl font-black tracking-[-0.04em] text-foreground md:text-6xl">
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
                <li key={f} className="flex items-start gap-2.5 text-sm font-medium">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <Button
              asChild
              size="lg"
              className="mt-10 h-13 w-full bg-gradient-primary py-3.5 text-base font-semibold text-primary-foreground shadow-glow transition-all hover:scale-[1.01] hover:brightness-110"
            >
              <Link to="/courses/$courseId" params={{ courseId: course.slug || course.id }}>
                Enroll Now <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <p className="mt-4 text-center text-xs text-muted-foreground">
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
        <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight md:text-5xl">
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
                <span className="font-display font-bold tracking-tight">{f.q}</span>
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
                  <p className="px-6 pb-6 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CoursesSection() {
  const { data: allCourses = [] } = useQuery({
    queryKey: ["public-courses"],
    queryFn: () => courseService.getCourses(),
  });
  return (
    <section id="courses" className="scroll-mt-24 mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-400 backdrop-blur-md mb-4">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          OUR COURSES
        </div>
        <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-5xl">
          Education for the <span className="text-gradient-brand">real world</span>
        </h2>
        <p className="mt-4 text-base text-muted-foreground md:text-lg">
          Master industry-standard software, BIM workflows, AI spatial ideation, and project
          execution with live courses led by practising architects.
        </p>
      </div>

      <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {allCourses.map((c: any, idx: number) => (
          <CourseCard
            key={c.id}
            course={c}
            badge={
              idx === 0
                ? "3 POWERFUL COURSES"
                : idx === 1
                  ? "BIM MASTERCLASS"
                  : idx === 2
                    ? "3D RENDERING SUITE"
                    : "AI DESIGN WORKFLOW"
            }
          />
        ))}
      </div>

      <div className="mt-12 text-center">
        <Button
          asChild
          size="lg"
          variant="outline"
          className="h-12 border-foreground/15 bg-surface/70 px-8 font-semibold backdrop-blur transition-all hover:bg-surface"
        >
          <Link to="/courses">
            Explore All Courses <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

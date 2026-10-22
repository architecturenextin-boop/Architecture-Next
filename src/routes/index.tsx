import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { brand } from "@/lib/brand";
import {
  faqs,
  features,
  heroStats,
  instructor,
  mentors,
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
    <div className="min-h-screen bg-background overflow-x-clip">
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
  const { data: rawEnrollmentCount = 100 } = useQuery({
    queryKey: ["public-enrollment-count"],
    queryFn: () => courseService.getEnrollmentCount(),
    initialData: 100,
    staleTime: 60 * 1000,
  });

  const enrollmentCount = rawEnrollmentCount >= 100 ? rawEnrollmentCount : 100 + (rawEnrollmentCount || 0);

  return (
    <section className="relative overflow-hidden bg-gradient-hero border-b border-border">
      <div className="pointer-events-none absolute -top-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-brand-blue/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-brand-purple/15 blur-[120px]" />
      <div className="relative mx-auto grid max-w-7xl gap-14 px-5 pt-16 pb-24 md:grid-cols-2 md:items-center md:px-8 md:pt-24 md:pb-32">
        <div className="space-y-7 animate-fade-up">
           <Link
             to="/courses"
             className="group inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/90 hover:bg-card hover:border-primary/50 px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs backdrop-blur-md transition-all duration-300 hover:shadow-xs active:scale-[0.99] cursor-pointer"
           >
             <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary border border-primary/20">
               <span className="relative flex h-1.5 w-1.5">
                 <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                 <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
               </span>
               New Cohort
             </span>
             <span className="text-muted-foreground">
               <strong className="font-semibold text-foreground">{`${enrollmentCount}+`}</strong>
               <span className="hidden sm:inline"> architects &amp; students enrolled</span>
               <span className="sm:hidden"> enrolled</span>
             </span>
             <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/70 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
           </Link>
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 w-full max-w-md sm:max-w-none">
            <Button
              asChild
              size="lg"
              className="h-12 w-full sm:w-auto justify-center rounded-xl bg-gradient-primary px-7 font-semibold text-primary-foreground shadow-glow transition-all duration-300 hover:scale-[1.02] hover:brightness-110 active:scale-[0.99]"
            >
              {user && hasAnyEnrollments ? (
                <Link to="/dashboard/courses" className="flex items-center justify-center gap-2">
                  <span>Go to Enrolled Courses</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link to="/courses" className="flex items-center justify-center gap-2">
                  <span>Enroll Now</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 w-full sm:w-auto justify-center rounded-xl border border-border/80 bg-card/60 px-6 font-semibold text-foreground/90 backdrop-blur-md shadow-2xs transition-all duration-300 hover:bg-card hover:border-primary/40 hover:text-foreground active:scale-[0.99]"
            >
              <Link
                to="/courses/$courseId"
                params={{ courseId: "architecture-plan-presentation-animation" }}
                hash="preview"
                className="flex items-center justify-center gap-2"
              >
                <PlayCircle className="h-4 w-4 text-primary shrink-0" />
                <span>Watch Program Overview</span>
              </Link>
            </Button>
          </div>
          <dl className="grid max-w-xl grid-cols-2 gap-x-6 gap-y-3.5 pt-6 sm:grid-cols-4 sm:gap-4 sm:pt-8">
            {heroStats.map((s) => (
              <div key={s.label} className="border-l-2 border-primary/20 pl-3">
                <dt className="text-base font-extrabold text-foreground sm:type-h3">
                  {s.value}
                </dt>
                <dd className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight sm:type-small sm:text-xs">
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
    { label: "AI Workflow", icon: Sparkles },
    { label: "360 Rendering", icon: Compass },
    { label: "Presentation", icon: Layers },
    { label: "Animation", icon: PlayCircle },
    { label: "Portfolio", icon: Award },
    { label: "Skill Development", icon: Trophy },
  ];

  return (
    <div className="border-y border-border bg-surface/60 py-4 md:py-6">
      {/* Small Screens (< md): Clean badges without broken trailing dots */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 px-4 sm:px-6 md:hidden">
        {items.map((item) => (
          <span
            key={item.label}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/90 px-3 py-1.5 text-xs font-semibold tracking-wide text-foreground/85 shadow-2xs"
          >
            <item.icon className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </span>
        ))}
      </div>

      {/* Large Screens (>= md): Original elegant single-line typography with dots */}
      <div className="mx-auto hidden max-w-7xl items-center justify-center gap-x-6 lg:gap-x-10 px-8 type-small font-semibold uppercase tracking-widest text-muted-foreground sm:text-sm md:flex">
        {items.map((item, index) => (
          <div key={item.label} className="flex items-center gap-x-6 lg:gap-x-10">
            <span className="opacity-75 transition-opacity hover:opacity-100">{item.label}</span>
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
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [activeMentor, setActiveMentor] = useState(0);

  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const track = trackRef.current;
    const progressBar = progressBarRef.current;
    if (!section || !track) return;

    // Mobile manual horizontal scroll listener for the bottom progress bar and active indicator
    const handleMobileScroll = () => {
      if (window.innerWidth < 768) {
        if (progressBar) {
          const maxScroll = track.scrollWidth - track.clientWidth;
          if (maxScroll > 0) {
            const progress = Math.min(1, Math.max(0, track.scrollLeft / maxScroll));
            progressBar.style.transform = `scaleX(${progress})`;
          }
        }

        // Determine active mentor card index for mobile indicators
        const cards = track.querySelectorAll(".mentor-card");
        const scrollLeft = track.scrollLeft;
        let closestIdx = 0;
        let minDiff = Infinity;
        cards.forEach((card, idx) => {
          const diff = Math.abs((card as HTMLElement).offsetLeft - track.offsetLeft - scrollLeft);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = idx;
          }
        });
        setActiveMentor(closestIdx);
      }
    };

    track.addEventListener("scroll", handleMobileScroll, { passive: true });

    const updateScrollTrigger = () => ScrollTrigger.update();
    if (typeof window !== "undefined" && (window as any).lenis) {
      (window as any).lenis.on("scroll", updateScrollTrigger);
    }

    const mm = gsap.matchMedia();

    // Desktop (>= 768px): Pinned GSAP ScrollTrigger horizontal scroll
    mm.add("(min-width: 768px)", () => {
      track.style.transform = "";
      if (progressBar) progressBar.style.transform = "scaleX(0)";

      const getScrollAmount = () => {
        const cards = track.querySelectorAll(".mentor-card");
        if (cards.length > 1) {
          const first = cards[0] as HTMLElement;
          const last = cards[cards.length - 1] as HTMLElement;
          return last.offsetLeft - first.offsetLeft;
        }
        return Math.max(0, track.scrollWidth - window.innerWidth);
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          pin: true,
          scrub: 1,
          start: "top top",
          end: "+=500",
          invalidateOnRefresh: true,
        },
      });

      tl.to(
        track,
        {
          x: () => -getScrollAmount(),
          ease: "none",
        },
        0
      );

      if (progressBar) {
        tl.to(
          progressBar,
          {
            scaleX: 1,
            ease: "none",
          },
          0
        );
      }
    });

    // Mobile (< 768px): Clear GSAP pin/transform for native manual touch scroll
    mm.add("(max-width: 767px)", () => {
      track.style.transform = "none";
      if (progressBar) progressBar.style.transform = "scaleX(0)";
    });

    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);

    return () => {
      clearTimeout(timer);
      track.removeEventListener("scroll", handleMobileScroll);
      if (typeof window !== "undefined" && (window as any).lenis) {
        (window as any).lenis.off("scroll", updateScrollTrigger);
      }
      mm.revert();
    };
  }, []);

  const scrollToMentor = (index: number) => {
    if (!trackRef.current) return;
    const cards = trackRef.current.querySelectorAll(".mentor-card");
    if (cards[index]) {
      const card = cards[index] as HTMLElement;
      const targetLeft =
        card.offsetLeft - (trackRef.current.clientWidth - card.clientWidth) / 2;
      trackRef.current.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: "smooth",
      });
      setActiveMentor(index);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (window.innerWidth >= 768 || !trackRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - trackRef.current.offsetLeft;
    scrollLeftStartRef.current = trackRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.4;
    trackRef.current.scrollLeft = scrollLeftStartRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  return (
    <section
      id="instructor"
      ref={sectionRef}
      className="relative flex w-full flex-col justify-center overflow-hidden border-y border-border bg-surface select-none py-12 sm:py-16 md:h-screen md:py-16"
    >
      {/* Mobile-Only Header Controls (Pagination & Prev/Next Arrows) */}
      <div className="flex md:hidden items-center justify-between px-6 pb-4 pt-1 w-full max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Mentors
          </span>
          <span className="text-xs font-semibold text-muted-foreground">
            ({activeMentor + 1}/{mentors.length})
          </span>
        </div>

        {/* Interactive Indicator Dots */}
        <div className="flex items-center gap-1.5">
          {mentors.map((m, idx) => (
            <button
              key={m.name}
              type="button"
              onClick={() => scrollToMentor(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeMentor === idx
                  ? "w-6 bg-primary"
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
              }`}
              aria-label={`Scroll to ${m.name}`}
            />
          ))}
        </div>

        {/* Prev / Next Quick Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={activeMentor === 0}
            onClick={() => scrollToMentor(activeMentor - 1)}
            className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-foreground shadow-2xs transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95"
            aria-label="Previous mentor"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={activeMentor === mentors.length - 1}
            onClick={() => scrollToMentor(activeMentor + 1)}
            className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-foreground shadow-2xs transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95"
            aria-label="Next mentor"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Cards Slide / Swipe Track */}
      <div className="flex-1 flex items-center w-full py-2 sm:py-4 overflow-hidden">
        <div
          ref={trackRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className="flex items-center gap-5 sm:gap-8 md:gap-16 pl-6 pr-10 sm:px-8 md:pl-[10vw] md:pr-[10vw] overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden will-change-transform touch-pan-x touch-pan-y cursor-grab active:cursor-grabbing"
        >
          {mentors.map((m) => (
            <div
              key={m.name}
              className="mentor-card w-[82vw] sm:w-[84vw] md:w-[80vw] shrink-0 snap-center grid items-center gap-6 md:gap-10 md:grid-cols-12"
            >
              {/* Left Mentor Image Card (5 Cols) */}
              <div className="relative md:col-span-5 flex justify-center">
                <div className="relative aspect-[4/5] w-full max-w-[210px] sm:max-w-[250px] md:max-w-[350px] lg:max-w-[380px] overflow-hidden rounded-[2rem] md:rounded-[2.25rem] border border-border/80 bg-card shadow-elevated transition-transform duration-500 hover:scale-[1.01]">
                  <img
                    src={m.image}
                    alt={m.name}
                    width={800}
                    height={1000}
                    className="h-full w-full object-cover object-top"
                  />
                </div>
              </div>

              {/* Right Details & Stats Content (7 Cols) */}
              <div className="md:col-span-7 space-y-4 md:space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                    Your Mentor
                  </span>
                  <h2 className="mt-1.5 md:mt-2 text-2xl sm:text-3xl md:type-h1 font-bold text-foreground tracking-tight">
                    {m.name}
                  </h2>
                  <p className="mt-1 md:mt-2 text-sm sm:text-base md:type-body font-semibold text-muted-foreground leading-normal">
                    {m.title}{m.experience ? ` · ${m.experience}` : ""}
                  </p>
                </div>

                <div className="space-y-3 md:space-y-4 text-sm sm:text-base md:type-body leading-relaxed text-muted-foreground">
                  {m.bio.split("\n\n").map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                  {m.expertise && (
                    <p className="pt-1">
                      <strong className="font-bold text-foreground">Areas of Expertise: </strong>
                      {m.expertise}
                    </p>
                  )}
                </div>

                {m.stats && m.stats.length > 0 && (
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3 md:gap-4 pt-1 sm:pt-2">
                    {m.stats.map((s) => (
                      <div
                        key={s.label}
                        className="rounded-xl md:rounded-2xl border border-border/80 bg-card/80 p-3 sm:p-3.5 md:p-4 text-center shadow-soft backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
                      >
                        <div className="text-xl sm:text-2xl md:type-h2 font-black text-foreground">
                          {s.value}
                        </div>
                        <div className="mt-0.5 md:mt-1 text-[10px] sm:text-xs md:type-small font-bold uppercase tracking-wider text-muted-foreground leading-tight">
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Horizontal Progress Bar at the bottom of the section */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 w-full bg-border/40 overflow-hidden">
        <div
          ref={progressBarRef}
          className="h-full w-full bg-gradient-primary origin-left scale-x-0"
        />
      </div>
    </section>
  );
}

function Testimonials() {
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
        <>
          {/* Mobile Swipe Container & Desktop 3-Column Grid */}
          <div
            ref={trackRef}
            onScroll={handleScroll}
            className="mt-8 sm:mt-12 flex md:grid md:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-4 md:px-0 -mx-4 md:mx-0 pb-2 md:pb-0 touch-pan-x touch-pan-y"
          >
            {testimonials.map((t) => (
              <figure
                key={t.id}
                className="testimonial-card w-[85vw] sm:w-[75vw] md:w-auto shrink-0 snap-center md:shrink group relative flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-border/80 bg-card/90 p-5 sm:p-7 shadow-soft backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated"
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
                      <span className="text-xs font-bold text-foreground">
                        {(t.rating || 5).toFixed(1)}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Check className="h-2.5 w-2.5" /> Verified Learner
                    </span>
                  </div>

                  {/* Testimonial Quote */}
                  <blockquote className="text-sm sm:text-base leading-relaxed text-foreground/85">
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



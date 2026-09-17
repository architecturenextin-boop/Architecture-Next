import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { CourseCard } from "@/components/course-card";
import { useQuery } from "@tanstack/react-query";
import { courseService } from "@/lib/services/course.service";
import type { Course } from "@/lib/database.types";

export const Route = createFileRoute("/courses/")({
  head: () => ({
    meta: [
      { title: "Our Courses — ArchitectureNext" },
      {
        name: "description",
        content:
          "Explore industry-grade architectural design, BIM Revit, SketchUp Lumion 3D rendering, and AI design courses.",
      },
    ],
  }),
  component: CoursesCatalogPage,
});

function CoursesCatalogPage() {
  const {
    data: allCourses = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["courses", "published"],
    queryFn: async () => {
      return courseService.getCourses();
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-16 md:py-24 border-b border-border/60">
        <div className="pointer-events-none absolute -top-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-brand-blue/20 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-brand-purple/20 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-5 md:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary shadow-soft backdrop-blur mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            OUR COURSES
          </div>

          <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground md:text-6xl max-w-4xl mx-auto leading-tight">
            Education for the <span className="text-gradient-brand">real world</span>
          </h1>

          <p className="mt-4 max-w-2xl mx-auto text-base text-muted-foreground md:text-lg">
            Master industry-standard design tools, BIM workflows, AI spatial ideation, and project
            execution with practical, project-based courses led by practising architects.
          </p>
        </div>
      </section>

      {/* Course Grid Section */}
      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Available Courses
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Select a course to view complete curriculum, projects, and enrolment details.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-[1.5rem] border border-border/80 bg-card p-6 h-[400px]"
              >
                <div className="aspect-[16/9] w-full rounded-xl bg-muted mb-4" />
                <div className="h-6 w-3/4 rounded bg-muted mb-2" />
                <div className="h-4 w-1/2 rounded bg-muted mb-6" />
                <div className="h-10 w-full rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive bg-destructive/10 rounded-2xl p-6">
            <p className="font-semibold">Failed to load courses</p>
            <p className="text-sm text-muted-foreground mt-1">
              Please try refreshing the page or checking your database schema.
            </p>
          </div>
        ) : allCourses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-2xl p-6">
            <p className="font-semibold">No courses available yet</p>
            <p className="text-sm mt-1">
              Please check back later or add a course from the Admin panel.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {allCourses.map((course, idx) => (
              <CourseCard
                key={course.id}
                course={course}
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
        )}
      </section>

      {/* Trust & Guarantee Banner */}
      <section className="bg-surface py-16 border-t border-border/60">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="grid gap-8 md:grid-cols-3 text-center md:text-left">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-foreground">Lifetime Access</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Enroll once and keep lifetime access to all video modules, templates, and future
                  updates.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-foreground">Verifiable Certificates</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Earn industry-recognized course & internship certificates signed by practicing
                  architects.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
                <ArrowRight className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-foreground">Portfolio Support</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Build real-world client case studies and receive 1-on-1 portfolio reviews from top
                  mentors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

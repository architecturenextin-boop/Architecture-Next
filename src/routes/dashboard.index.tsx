import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, PlayCircle, Sparkles, TrendingUp, Loader2, BookOpen, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { dashboardService } from "@/lib/services/dashboard.service";
import { courseService } from "@/lib/services/course.service";
import { useQuery } from "@tanstack/react-query";
import { getMediaUrl } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — ArchitectureNext" }] }),
  component: DashboardHome,
});

function DashboardHome() {
  const { profile } = useAuth();

  // 1. Fetch owned courses with progress
  const { data: owned = [], isLoading: ownedLoading } = useQuery({
    queryKey: ["dashboard-owned"],
    queryFn: async () => {
      return dashboardService.getMyCourses();
    }
  });

  // 2. Fetch recommended published courses
  const { data: recommended = [], isLoading: recLoading } = useQuery({
    queryKey: ["dashboard-recommended", owned],
    queryFn: async () => {
      const data = await courseService.getCourses();
      // Filter out courses that are already owned
      const ownedIds = new Set(owned.map((o) => o.course_id));
      return data.filter((c) => !ownedIds.has(c.id));
    },
    enabled: !ownedLoading,
  });

  const isLoading = ownedLoading || recLoading;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const completedLessonsTotal = owned.reduce(
    (acc, c) => acc + (Number(c.progress_count) || 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Redesigned Student Dashboard Upper Banner */}
      <section className="relative overflow-hidden rounded-[28px] border border-[#294398]/30 bg-gradient-to-br from-[#294398] via-[#223B86] to-[#192A64] p-6 sm:p-8 md:p-10 text-white shadow-elevated">
        {/* Ambient Decorative Lighting */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#4E68B8]/30 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Student Dashboard</span>
            </div>

            <h1 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-4xl">
              Welcome back, {profile?.full_name ?? "Learner"}
            </h1>

            <p className="text-sm leading-relaxed text-white/85 sm:text-base">
              {owned.length > 0
                ? "Track your lessons, master architectural software workflows, and earn verifiable certificates."
                : "Your professional learning journey starts here. Explore our industry-led architecture courses below."}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {owned.length > 0 ? (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="h-11 rounded-xl bg-white px-6 font-bold text-[#294398] shadow-soft transition-all hover:bg-white/95 hover:scale-[1.02] hover:shadow-elevated"
                  >
                    <Link
                      to="/learn/$courseId"
                      params={{ courseId: owned[0].slug || owned[0].course_id }}
                      search={
                        owned[0].last_watched_lesson_id
                          ? { lessonId: owned[0].last_watched_lesson_id }
                          : undefined
                      }
                    >
                      <PlayCircle className="mr-2 h-4 w-4" /> Resume Learning
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="h-11 rounded-xl border-white/25 bg-white/10 px-5 font-semibold text-white backdrop-blur transition hover:bg-white/20 hover:text-white"
                  >
                    <Link to="/dashboard/courses">
                      <BookOpen className="mr-2 h-4 w-4" /> My Courses ({owned.length})
                    </Link>
                  </Button>
                </>
              ) : (
                <Button
                  asChild
                  size="lg"
                  className="h-11 rounded-xl bg-white px-7 font-bold text-[#294398] shadow-soft transition-all hover:bg-white/95 hover:scale-[1.02] hover:shadow-elevated"
                >
                  <Link to="/courses">
                    Explore Courses <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Quick Metrics Badges Card */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:w-64 shrink-0">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4.5 backdrop-blur-md shadow-xs">
              <div className="text-3xl font-black text-white font-display">
                {owned.length}
              </div>
              <div className="mt-1 text-xs font-semibold text-white/75">
                Enrolled Courses
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-4.5 backdrop-blur-md shadow-xs">
              <div className="text-3xl font-black text-white font-display">
                {completedLessonsTotal}
              </div>
              <div className="mt-1 text-xs font-semibold text-white/75">
                Completed Lessons
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="My Courses" link={{ to: "/dashboard/courses", label: "View all" }} />
        {owned.length === 0 ? (
          <EmptyOwned />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {owned.map((c) => {
              const pct = c.total_lessons ? Math.round((Number(c.progress_count) / c.total_lessons) * 100) : 0;
              return (
                <article key={c.course_id} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-elevated flex flex-col justify-between">
                  <div className="relative aspect-video overflow-hidden">
                    <img src={getMediaUrl(c.cover_url)} alt={c.title} loading="lazy" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent opacity-0 transition group-hover:opacity-100" />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display text-base font-bold leading-snug">{c.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{c.total_lessons} lessons • {c.total_duration}</p>
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold text-primary">{pct}%</span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-gradient-primary transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      {c.last_watched_lesson_title && (
                        <div className="mt-3 rounded-lg bg-surface px-3 py-1.5 text-xs text-muted-foreground border border-border/50">
                          <span className="font-semibold text-foreground block mb-0.5">Last watched:</span>
                          <span className="truncate block font-medium text-foreground">{c.last_watched_lesson_title}</span>
                        </div>
                      )}
                    </div>
                    <Button asChild className="mt-4 w-full bg-gradient-primary text-primary-foreground hover:opacity-95 shrink-0">
                      <Link
                        to="/learn/$courseId"
                        params={{ courseId: c.slug || c.course_id }}
                        search={c.last_watched_lesson_id ? { lessonId: c.last_watched_lesson_id } : undefined}
                      >
                        <PlayCircle className="mr-1.5 h-4 w-4" />
                        {pct > 0 ? "Continue learning" : "Start learning"}
                      </Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {recommended.length > 0 && (
        <section>
          <SectionHeader title="Recommended for you" />
          <div className="grid gap-4 sm:grid-cols-2">
            {recommended.map((c) => (
              <article key={c.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft flex flex-col justify-between">
                <div>
                  <img src={getMediaUrl(c.cover_url)} alt={c.title} loading="lazy" className="aspect-video w-full object-cover" />
                  <div className="p-5">
                    <h3 className="font-display text-base font-bold">{c.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{c.tagline || c.description}</p>
                  </div>
                </div>
                <div className="p-5 pt-0 flex items-center justify-between mt-auto">
                  <span className="font-display text-lg font-bold">{c.currency}{c.price.toLocaleString()}</span>
                  <Button asChild size="sm" className="bg-gradient-primary text-primary-foreground">
                    <Link to="/checkout" search={{ course: c.slug || c.id }}>
                      Buy now <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHeader({ title, link }: { title: string; link?: { to: string; label: string } }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      {link && <Link to={link.to} className="text-sm font-medium text-primary hover:underline">{link.label}</Link>}
    </div>
  );
}

function EmptyOwned() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-card p-10 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><TrendingUp className="h-5 w-5" /></div>
      <h3 className="font-display text-lg font-bold">No courses yet</h3>
      <p className="max-w-sm text-sm text-muted-foreground">Unlock your first course to start learning. Lifetime access, real outcomes.</p>
      <Button asChild className="mt-2 bg-gradient-primary text-primary-foreground"><Link to="/courses">Browse courses</Link></Button>
    </div>
  );
}

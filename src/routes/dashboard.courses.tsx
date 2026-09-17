import { createFileRoute, Link } from "@tanstack/react-router";
import { PlayCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dashboardService } from "@/lib/services/dashboard.service";
import { useQuery } from "@tanstack/react-query";
import { getMediaUrl } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/courses")({
  head: () => ({ meta: [{ title: "My Courses — ArchitectureNext" }] }),
  component: MyCourses,
});

function MyCourses() {
  // Fetch owned courses with progress
  const { data: owned = [], isLoading } = useQuery({
    queryKey: ["dashboard-owned-courses"],
    queryFn: async () => {
      return dashboardService.getMyCourses();
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">My Courses</h1>
      <p className="mt-1 text-sm text-muted-foreground">All your enrolled courses in one place.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {owned.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            You haven't enrolled in any courses yet.{" "}
            <Link to="/courses" className="font-semibold text-primary hover:underline">
              Browse courses
            </Link>
          </div>
        )}
        {owned.map((c) => {
          const pct = c.total_lessons ? Math.round((Number(c.progress_count) / c.total_lessons) * 100) : 0;
          return (
            <article key={c.course_id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft flex flex-col justify-between">
              <div>
                <img src={getMediaUrl(c.cover_url)} alt={c.title} loading="lazy" className="aspect-video w-full object-cover" />
                <div className="p-5">
                  <h3 className="font-display text-base font-bold">{c.title}</h3>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold text-primary">{pct}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-gradient-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  {c.last_watched_lesson_title && (
                    <div className="mt-3 rounded-lg bg-surface px-3 py-1.5 text-xs text-muted-foreground border border-border/50">
                      <span className="font-semibold text-foreground block mb-0.5">Last watched:</span>
                      <span className="truncate block font-medium text-foreground">{c.last_watched_lesson_title}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-5 pt-0">
                <Button asChild className="w-full bg-gradient-primary text-primary-foreground">
                  <Link
                    to="/learn/$courseId"
                    params={{ courseId: c.slug || c.course_id }}
                    search={c.last_watched_lesson_id ? { lessonId: c.last_watched_lesson_id } : undefined}
                  >
                    <PlayCircle className="mr-1.5 h-4 w-4" /> {pct > 0 ? "Continue learning" : "Start learning"}
                  </Link>
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

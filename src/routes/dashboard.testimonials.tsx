import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquareQuote,
  Star,
  Plus,
  Loader2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { testimonialService } from "@/lib/services/testimonial.service";
import { dashboardService } from "@/lib/services/dashboard.service";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/testimonials")({
  head: () => ({ meta: [{ title: "My Testimonials — ArchitectureNext" }] }),
  component: StudentTestimonialsPage,
});

function StudentTestimonialsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [quote, setQuote] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  // Fetch student's submitted testimonials
  const { data: myTestimonials = [], isLoading: testimonialsLoading } = useQuery({
    queryKey: ["my-testimonials"],
    queryFn: () => testimonialService.getMyTestimonials(),
  });

  // Fetch student's enrolled courses for the course selector
  const { data: enrolledCourses = [] } = useQuery({
    queryKey: ["my-courses"],
    queryFn: () => dashboardService.getMyCourses(),
  });

  // Submit testimonial mutation
  const submitMutation = useMutation({
    mutationFn: (payload: { quote: string; rating: number; courseId?: string | null }) =>
      testimonialService.submitTestimonial(payload),
    onSuccess: () => {
      toast.success("Testimonial submitted successfully! It is now under review.");
      setQuote("");
      setRating(5);
      setSelectedCourseId("");
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["my-testimonials"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to submit testimonial");
    },
  });

  // Delete testimonial mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => testimonialService.deleteMyTestimonial(id),
    onSuccess: () => {
      toast.success("Testimonial removed");
      queryClient.invalidateQueries({ queryKey: ["my-testimonials"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete testimonial");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote.trim() || quote.trim().length < 10) {
      toast.error("Please write at least 10 characters for your testimonial");
      return;
    }
    submitMutation.mutate({
      quote: quote.trim(),
      rating,
      courseId: selectedCourseId || null,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Approved & Live
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-3 py-1 text-xs font-bold text-destructive">
            <AlertCircle className="h-3.5 w-3.5" /> Needs Revision
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-800">
            <Clock className="h-3.5 w-3.5" /> Under Review
          </span>
        );
    }
  };

  if (testimonialsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            Testimonials & Reviews
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Share your learning experience and project achievements with the ArchitectureNext community.
          </p>
        </div>

        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="self-start sm:self-auto bg-gradient-primary font-bold text-primary-foreground shadow-soft hover:brightness-110"
          >
            <Plus className="mr-2 h-4 w-4" /> Write a Testimonial
          </Button>
        )}
      </div>

      {/* Submission Form Card */}
      {showForm && (
        <section className="rounded-3xl border border-primary/30 bg-card p-6 shadow-elevated animate-fade-in md:p-8">
          <div className="flex items-center justify-between border-b border-border/70 pb-4">
            <div className="flex items-center gap-2 text-primary font-display font-bold">
              <Sparkles className="h-5 w-5" />
              <span>Share Your Learning Experience</span>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* 1. Star Rating Picker */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Your Rating
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= (hoverRating ?? rating)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-transparent text-muted-foreground/40"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-3 text-sm font-bold text-foreground">
                  {rating === 5
                    ? "⭐⭐⭐⭐⭐ Outstanding (5/5)"
                    : rating === 4
                    ? "⭐⭐⭐⭐ Great Experience (4/5)"
                    : rating === 3
                    ? "⭐⭐⭐ Good (3/5)"
                    : rating === 2
                    ? "⭐⭐ Needs Improvement (2/5)"
                    : "⭐ Poor (1/5)"}
                </span>
              </div>
            </div>

            {/* 2. Course Selection (Optional) */}
            {enrolledCourses.length > 0 && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Select Enrolled Course (Optional)
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">General ArchitectureNext School Review</option>
                  {enrolledCourses.map((c) => (
                    <option key={c.course_id} value={c.course_id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  You can link your testimonial to a specific course you are actively enrolled in.
                </p>
              </div>
            )}

            {/* 3. Testimonial Quote Textarea */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Your Testimonial / Review
                </label>
                <span className="text-xs text-muted-foreground font-mono">
                  {quote.length} / 2000 chars
                </span>
              </div>
              <textarea
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder="Tell future students about your experience with the curriculum, BIM workflow mastery, mentor guidance, and portfolio projects..."
                rows={5}
                maxLength={2000}
                required
                className="w-full rounded-2xl border border-border bg-background p-4 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Minimum 10 characters. Please provide genuine, honest feedback.
              </p>
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="rounded-xl border-border"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitMutation.isPending || quote.trim().length < 10}
                className="rounded-xl bg-gradient-primary font-bold text-primary-foreground shadow-soft hover:brightness-110"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  "Submit Testimonial"
                )}
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* Submitted Testimonials Section */}
      <div>
        <h2 className="font-display text-lg font-bold text-foreground mb-4">
          Your Submissions ({myTestimonials.length})
        </h2>

        {myTestimonials.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center shadow-soft">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary mb-4">
              <MessageSquareQuote className="h-7 w-7" />
            </div>
            <h3 className="font-display text-base font-bold text-foreground">
              You haven't submitted a testimonial yet
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Share your feedback with the ArchitectureNext community and help future architects make informed decisions.
            </p>
            {!showForm && (
              <Button
                onClick={() => setShowForm(true)}
                className="mt-6 bg-gradient-primary font-bold text-primary-foreground shadow-soft hover:brightness-110"
              >
                <Plus className="mr-2 h-4 w-4" /> Submit Your First Testimonial
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {myTestimonials.map((t) => (
              <article
                key={t.id}
                className="relative flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-soft transition hover:shadow-elevated"
              >
                <div className="space-y-4">
                  {/* Top Bar: Status + Stars */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                    <div className="flex text-amber-400">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    {getStatusBadge(t.status)}
                  </div>

                  {/* Course Tag */}
                  {t.courseTitle && (
                    <div className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                      <BookOpen className="h-3.5 w-3.5 text-primary" />
                      <span>{t.courseTitle}</span>
                    </div>
                  )}

                  {/* Quote */}
                  <blockquote className="text-sm leading-relaxed text-foreground/90 italic">
                    "{t.quote}"
                  </blockquote>

                  {/* Admin Rejection / Modification Note */}
                  {t.status === "REJECTED" && t.adminNote && (
                    <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
                      <div className="font-bold mb-0.5 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5" /> Note from ArchitectureNext Admin:
                      </div>
                      <p>{t.adminNote}</p>
                    </div>
                  )}
                </div>

                {/* Footer Metadata & Delete Action */}
                <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
                  <span>Submitted on {new Date(t.createdAt).toLocaleDateString()}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to remove this testimonial?")) {
                        deleteMutation.mutate(t.id);
                      }
                    }}
                    className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
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
  User,
  Eye,
  Send,
  X,
  Filter,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { testimonialService } from "@/lib/services/testimonial.service";
import { dashboardService } from "@/lib/services/dashboard.service";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/testimonials")({
  head: () => ({ meta: [{ title: "My Testimonials — ArchitectureNext" }] }),
  component: StudentTestimonialsPage,
});

const PROMPT_SUGGESTIONS = [
  {
    label: "🚀 BIM Workflow",
    text: "The practical BIM modeling and live project workflows completely boosted my confidence in handling real-world construction deliverables.",
  },
  {
    label: "🎓 Clear Lessons",
    text: "Clear, structured lessons from basics to advanced parametric modeling. The step-by-step guidance made complex tools very easy to learn.",
  },
  {
    label: "💡 Mentorship",
    text: "The mentor feedback on assignments was top-notch. It helped me refine my architectural presentations and portfolio quality.",
  },
  {
    label: "💼 Career Boost",
    text: "Transitioning to computational BIM design was smooth and efficient with the specialized exercises and drawing sheets covered in this course.",
  },
];

function StudentTestimonialsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [quote, setQuote] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "APPROVED" | "PENDING">("ALL");

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

  // Testimonial stats summary
  const stats = useMemo(() => {
    const total = myTestimonials.length;
    const approved = myTestimonials.filter((t) => t.status === "APPROVED").length;
    const pending = myTestimonials.filter((t) => t.status === "PENDING" || t.status === "REJECTED").length;
    const avgRating = total > 0
      ? (myTestimonials.reduce((acc, t) => acc + t.rating, 0) / total).toFixed(1)
      : "5.0";
    return { total, approved, pending, avgRating };
  }, [myTestimonials]);

  // Filtered testimonials based on tab
  const filteredTestimonials = useMemo(() => {
    if (activeTab === "APPROVED") {
      return myTestimonials.filter((t) => t.status === "APPROVED");
    }
    if (activeTab === "PENDING") {
      return myTestimonials.filter((t) => t.status === "PENDING" || t.status === "REJECTED");
    }
    return myTestimonials;
  }, [myTestimonials, activeTab]);

  // Selected course object
  const selectedCourse = useMemo(() => {
    return enrolledCourses.find((c) => c.course_id === selectedCourseId);
  }, [enrolledCourses, selectedCourseId]);

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
      setShowPreview(false);
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
      toast.error("Please write at least 10 characters for your review");
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
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Live
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-destructive border border-destructive/20">
            <AlertCircle className="h-3 w-3" /> Revision
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3" /> In Review
          </span>
        );
    }
  };

  const getRatingLabel = (val: number) => {
    switch (val) {
      case 5: return "5/5 — Outstanding";
      case 4: return "4/5 — Very Good";
      case 3: return "3/5 — Good";
      case 2: return "2/5 — Fair";
      default: return "1/5 — Needs Work";
    }
  };

  if (testimonialsLoading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5 pb-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageSquareQuote className="h-4 w-4" />
            </div>
            <h1 className="font-display text-lg sm:text-xl font-bold text-foreground tracking-tight">
              Testimonials & Reviews
            </h1>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed pl-9 sm:pl-0">
            Share feedback on your courses and BIM learning journey.
          </p>
        </div>

        {!showForm && (
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto h-8 sm:h-9 bg-gradient-primary font-bold text-primary-foreground text-xs shadow-soft hover:brightness-105 rounded-xl gap-1.5 justify-center"
          >
            <Plus className="h-3.5 w-3.5" /> Write Review
          </Button>
        )}
      </div>

      {/* Compact 3-Column Stats Row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-xl border border-border bg-card p-2.5 sm:p-3 text-center shadow-xs">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</p>
          <p className="text-sm sm:text-base font-bold text-foreground mt-0.5">{stats.total}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-2.5 sm:p-3 text-center shadow-xs">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Approved</p>
          <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.approved}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-2.5 sm:p-3 text-center shadow-xs">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-amber-500">Rating</p>
          <p className="text-sm sm:text-base font-bold text-foreground mt-0.5">{stats.avgRating} <span className="text-[10px] text-muted-foreground font-normal">/5</span></p>
        </div>
      </div>

      {/* Review Writing Form (Compact, Mobile-Friendly) */}
      {showForm && (
        <section className="rounded-2xl border border-primary/30 bg-card p-4 sm:p-5 shadow-elevated animate-fade-in space-y-3.5">
          <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
            <div className="flex items-center gap-1.5 text-primary text-xs sm:text-sm font-bold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Write a Review</span>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              aria-label="Close form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* 1. Touch-Friendly Star Rating Picker */}
            <div className="rounded-xl bg-muted/30 border border-border/60 p-2.5 sm:p-3 flex items-center justify-between gap-2">
              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Your Rating
                </label>
                <div className="flex items-center gap-0.5 sm:gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 transition-transform active:scale-90 hover:scale-110 focus:outline-none"
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        className={`h-5 w-5 sm:h-6 sm:w-6 ${
                          star <= (hoverRating ?? rating)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-transparent text-muted-foreground/25"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block rounded-md bg-background px-2 py-0.5 text-[11px] sm:text-xs font-bold text-foreground border border-border/80">
                  {getRatingLabel(hoverRating ?? rating)}
                </span>
              </div>
            </div>

            {/* 2. Course Selection Dropdown */}
            {enrolledCourses.length > 0 && (
              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Enrolled Course <span className="text-muted-foreground/70 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-border bg-background px-3 py-2 text-xs sm:text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary pr-8"
                  >
                    <option value="">General Academy Review</option>
                    {enrolledCourses.map((c) => (
                      <option key={c.course_id} value={c.course_id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                  <BookOpen className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
            )}

            {/* 3. Horizontal Scrollable Quick Inspiration Starter Chips */}
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" /> Tap to add idea
              </label>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                {PROMPT_SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (!quote) {
                        setQuote(item.text);
                      } else {
                        setQuote((prev) => `${prev.trim()} ${item.text}`);
                      }
                    }}
                    className="shrink-0 rounded-lg border border-border bg-background hover:bg-muted active:bg-muted/80 px-2.5 py-1 text-[11px] font-medium text-foreground transition"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Your Review
                </label>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px]">
                  <span
                    className={
                      quote.trim().length >= 10
                        ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                        : "text-muted-foreground"
                    }
                  >
                    {quote.trim().length >= 10 ? "✓ Met" : `${quote.trim().length}/10 min`}
                  </span>
                </div>
              </div>

              <textarea
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder="How did this course help your modeling, portfolio, or architectural career?"
                rows={3}
                maxLength={2000}
                required
                className="w-full rounded-xl border border-border bg-background p-2.5 sm:p-3 text-xs sm:text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Live Preview Toggle & Card */}
            {quote.trim().length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-primary hover:underline"
                >
                  <Eye className="h-3 w-3" />
                  {showPreview ? "Hide Preview" : "Preview how it looks live"}
                </button>

                {showPreview && (
                  <div className="mt-1.5 rounded-xl border border-border/80 bg-muted/20 p-3 space-y-1.5 animate-fade-in text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                          {user?.first_name?.[0]?.toUpperCase() || user?.full_name?.[0]?.toUpperCase() || "A"}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground leading-tight">
                            {user?.full_name || user?.first_name || "Student"}
                          </p>
                        </div>
                      </div>
                      <div className="flex text-amber-400">
                        {Array.from({ length: rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>

                    {selectedCourse && (
                      <p className="text-[10px] text-primary font-medium truncate">
                        📚 {selectedCourse.title}
                      </p>
                    )}

                    <p className="text-xs italic text-foreground/90 leading-relaxed border-l-2 border-primary/40 pl-2">
                      "{quote}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Submit Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
                className="h-8 rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitMutation.isPending || quote.trim().length < 10}
                className="h-8 rounded-lg bg-gradient-primary font-bold text-primary-foreground text-xs shadow-soft hover:brightness-105 gap-1.5"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" /> Submit Review
                  </>
                )}
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* Filter Tabs for Mobile / Desktop */}
      {myTestimonials.length > 0 && (
        <div className="flex items-center gap-1 rounded-xl bg-muted/40 p-1 border border-border/50 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`flex-1 rounded-lg py-1.5 text-center font-bold transition ${
              activeTab === "ALL"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("APPROVED")}
            className={`flex-1 rounded-lg py-1.5 text-center font-bold transition ${
              activeTab === "APPROVED"
                ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Live ({stats.approved})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("PENDING")}
            className={`flex-1 rounded-lg py-1.5 text-center font-bold transition ${
              activeTab === "PENDING"
                ? "bg-card text-amber-600 dark:text-amber-400 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            In Review ({stats.pending})
          </button>
        </div>
      )}

      {/* Submitted Reviews List */}
      <div className="space-y-3">
        {filteredTestimonials.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 p-6 sm:p-8 text-center shadow-xs">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary mb-2.5">
              <MessageCircle className="h-4 w-4" />
            </div>
            <h3 className="font-display text-xs sm:text-sm font-bold text-foreground">
              {myTestimonials.length === 0 ? "No testimonials yet" : "No testimonials in this category"}
            </h3>
            <p className="mt-1 max-w-xs text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
              {myTestimonials.length === 0
                ? "Share your feedback to inspire fellow architects."
                : "Switch tabs to view all your submissions."}
            </p>
            {!showForm && myTestimonials.length === 0 && (
              <Button
                size="sm"
                onClick={() => setShowForm(true)}
                className="mt-3.5 h-8 bg-gradient-primary font-bold text-primary-foreground text-xs shadow-soft hover:brightness-105 rounded-xl gap-1"
              >
                <Plus className="h-3 w-3" /> Write Review
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2">
            {filteredTestimonials.map((t) => (
              <article
                key={t.id}
                className="relative flex flex-col justify-between rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-xs transition hover:border-border/90 hover:shadow-soft space-y-2.5"
              >
                <div className="space-y-2">
                  {/* Card Top: Stars + Status */}
                  <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
                    <div className="flex text-amber-400">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    {getStatusBadge(t.status)}
                  </div>

                  {/* Course Tag */}
                  {t.courseTitle && (
                    <div className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-foreground">
                      <BookOpen className="h-2.5 w-2.5 text-primary shrink-0" />
                      <span className="truncate max-w-[200px]">{t.courseTitle}</span>
                    </div>
                  )}

                  {/* Review Text */}
                  <blockquote className="text-xs leading-relaxed text-foreground/90 italic">
                    "{t.quote}"
                  </blockquote>

                  {/* Admin Rejection / Modification Note */}
                  {t.status === "REJECTED" && t.adminNote && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive space-y-0.5">
                      <p className="font-bold flex items-center gap-1 text-[10px]">
                        <AlertCircle className="h-3 w-3 shrink-0" /> Note from Admin:
                      </p>
                      <p className="text-[11px] leading-normal">{t.adminNote}</p>
                    </div>
                  )}
                </div>

                {/* Footer Date & Delete */}
                <div className="flex items-center justify-between border-t border-border/50 pt-2 text-[10px] sm:text-[11px] text-muted-foreground">
                  <span>{new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Delete this review?")) {
                        deleteMutation.mutate(t.id);
                      }
                    }}
                    className="p-1 text-muted-foreground hover:text-destructive transition flex items-center gap-1"
                    title="Remove testimonial"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span className="text-[10px]">Delete</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

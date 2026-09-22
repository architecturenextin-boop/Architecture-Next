import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { testimonialService } from "@/lib/services/testimonial.service";
import type { AdminTestimonialItem, TestimonialStatus } from "@/lib/database.types";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  MessageSquareQuote,
  Star,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Filter,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  BookOpen,
  User,
  Calendar,
  Loader2,
  Eye,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/testimonials")({
  head: () => ({ meta: [{ title: "Testimonials Management — Admin" }] }),
  component: AdminTestimonialsPage,
});

function AdminTestimonialsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | TestimonialStatus>("ALL");
  const [selectedItem, setSelectedItem] = useState<AdminTestimonialItem | null>(null);
  
  // Rejection modal state
  const [rejectModalItem, setRejectModalItem] = useState<AdminTestimonialItem | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  // Fetch admin testimonials
  const { data, isLoading } = useQuery({
    queryKey: ["admin-testimonials", statusFilter],
    queryFn: () => testimonialService.getAdminTestimonials({ status: statusFilter }),
  });

  const testimonials = data?.testimonials || [];
  const counts = data?.counts || { total: 0, pending: 0, approved: 0, rejected: 0 };

  // Filter client-side by search
  const filteredTestimonials = useMemo(() => {
    if (!search.trim()) return testimonials;
    const query = search.toLowerCase();
    return testimonials.filter((t) => {
      const studentName = (t.student_name || "").toLowerCase();
      const studentEmail = (t.student_email || "").toLowerCase();
      const courseTitle = (t.course_title || "").toLowerCase();
      const quote = (t.quote || "").toLowerCase();
      return (
        studentName.includes(query) ||
        studentEmail.includes(query) ||
        courseTitle.includes(query) ||
        quote.includes(query)
      );
    });
  }, [testimonials, search]);

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id: string) => testimonialService.approveTestimonial(id),
    onSuccess: (updated) => {
      toast.success(`Testimonial by ${updated.student_name} approved and published live!`);
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["public-testimonials"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to approve testimonial");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      testimonialService.rejectTestimonial(id, note),
    onSuccess: (updated) => {
      toast.info(`Testimonial by ${updated.student_name} marked as rejected.`);
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["public-testimonials"] });
      setRejectModalItem(null);
      setRejectNote("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to reject testimonial");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => testimonialService.deleteAdminTestimonial(id),
    onSuccess: () => {
      toast.success("Testimonial permanently deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["public-testimonials"] });
      if (selectedItem) setSelectedItem(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete testimonial");
    },
  });

  const handleOpenRejectModal = (item: AdminTestimonialItem) => {
    setRejectModalItem(item);
    setRejectNote(item.admin_note || "");
  };

  const handleConfirmReject = () => {
    if (!rejectModalItem) return;
    rejectMutation.mutate({
      id: rejectModalItem.id,
      note: rejectNote.trim() || undefined,
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to permanently delete the testimonial by ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Testimonials & Reviews
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review student feedback, approve stories for the landing page, or provide feedback notes.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Submissions
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <MessageSquareQuote className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-foreground">
            {counts.total}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">All student reviews received</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending Moderation
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-amber-600 dark:text-amber-400">
            {counts.pending}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Awaiting admin review</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Live & Approved
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {counts.approved}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Publicly visible on website</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Rejected / Revisions
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-rose-600 dark:text-rose-400">
            {counts.rejected}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Filtered or feedback sent</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card/60 p-1 backdrop-blur-sm">
          {(
            [
              { id: "ALL", label: "All", count: counts.total },
              { id: "PENDING", label: "Pending", count: counts.pending },
              { id: "APPROVED", label: "Approved", count: counts.approved },
              { id: "REJECTED", label: "Rejected", count: counts.rejected },
            ] as const
          ).map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    active
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search student, course, quote..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-card border-border"
          />
        </div>
      </div>

      {/* Testimonials List / Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Loading testimonials...</p>
          </div>
        ) : filteredTestimonials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted/60 text-muted-foreground">
              <MessageSquareQuote className="h-7 w-7 opacity-50" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">No testimonials found</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              {search
                ? `No submissions matched "${search}". Try clearing your query.`
                : `There are currently no ${statusFilter !== "ALL" ? statusFilter.toLowerCase() : ""} testimonials.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Desktop Table Header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3.5 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-3">Student</div>
              <div className="col-span-2">Course / Program</div>
              <div className="col-span-1">Rating</div>
              <div className="col-span-3">Testimonial Quote</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Testimonial Rows */}
            {filteredTestimonials.map((item) => {
              const isPending = item.status === "PENDING";
              const isApproved = item.status === "APPROVED";
              const isRejected = item.status === "REJECTED";

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 p-5 lg:grid lg:grid-cols-12 lg:items-center lg:gap-4 lg:px-6 lg:py-4 transition-colors hover:bg-muted/20"
                >
                  {/* Student Info */}
                  <div className="flex items-center gap-3 lg:col-span-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-sm border border-primary/20 overflow-hidden">
                      {item.student_avatar ? (
                        <img
                          src={item.student_avatar}
                          alt={item.student_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        item.student_name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-foreground truncate">
                        {item.student_name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {item.student_email || "Student Account"}
                      </div>
                      <div className="text-[11px] text-muted-foreground/80 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Course */}
                  <div className="lg:col-span-2 text-xs">
                    {item.course_title ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/5 border border-primary/10 px-2.5 py-1 font-medium text-primary line-clamp-1">
                        <BookOpen className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{item.course_title}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">General / Platform</span>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="lg:col-span-1">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${
                            s <= item.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Testimonial Quote */}
                  <div className="lg:col-span-3">
                    <p className="text-xs text-foreground/90 italic line-clamp-3 leading-relaxed">
                      "{item.quote}"
                    </p>
                    {item.admin_note && (
                      <div className="mt-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 text-[11px] text-rose-600 dark:text-rose-400">
                        <span className="font-semibold">Rejection Note:</span> {item.admin_note}
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="lg:col-span-1">
                    {isApproved && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" />
                        Approved
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <Clock className="h-3 w-3" />
                        Pending
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        <XCircle className="h-3 w-3" />
                        Rejected
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 lg:col-span-2">
                    {isPending && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          className="h-8 gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 shadow-none"
                          onClick={() => approveMutation.mutate(item.id)}
                          disabled={approveMutation.isPending}
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/50 dark:text-rose-400 text-xs px-3"
                          onClick={() => handleOpenRejectModal(item)}
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </>
                    )}

                    {isApproved && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 rounded-xl text-xs text-muted-foreground hover:text-rose-600"
                          onClick={() => handleOpenRejectModal(item)}
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                          Unpublish
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600 rounded-xl"
                          onClick={() => handleDelete(item.id, item.student_name)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}

                    {isRejected && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 text-xs px-3"
                          onClick={() => approveMutation.mutate(item.id)}
                          disabled={approveMutation.isPending}
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600 rounded-xl"
                          onClick={() => handleDelete(item.id, item.student_name)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal Dialog */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-rose-500/10 text-rose-600">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">
                    Reject Testimonial Submission
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    by {rejectModalItem.student_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRejectModalItem(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quote Preview */}
            <div className="rounded-xl bg-muted/40 p-3 text-xs italic text-muted-foreground border border-border/50">
              "{rejectModalItem.quote}"
            </div>

            {/* Note Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Feedback / Reason for Rejection (Optional)
              </label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="e.g. Please provide a genuine learning experience without promotional links or vague phrases."
                rows={3}
                className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-[11px] text-muted-foreground">
                This note will be visible to the student in their dashboard so they can improve and resubmit.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs"
                onClick={() => setRejectModalItem(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5"
                onClick={handleConfirmReject}
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

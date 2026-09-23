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

  const testimonials: any[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray((data as any).testimonials)) return (data as any).testimonials;
    return [];
  }, [data]);

  const rawCounts = (data as any)?.counts;
  const counts = useMemo(() => {
    if (rawCounts && typeof rawCounts === "object") {
      return {
        total: rawCounts.all ?? rawCounts.total ?? rawCounts.count ?? testimonials.length,
        pending: rawCounts.pending ?? testimonials.filter((t: any) => t.status === "PENDING").length,
        approved: rawCounts.approved ?? testimonials.filter((t: any) => t.status === "APPROVED").length,
        rejected: rawCounts.rejected ?? testimonials.filter((t: any) => t.status === "REJECTED").length,
      };
    }
    return {
      total: testimonials.length,
      pending: testimonials.filter((t: any) => t.status === "PENDING").length,
      approved: testimonials.filter((t: any) => t.status === "APPROVED").length,
      rejected: testimonials.filter((t: any) => t.status === "REJECTED").length,
    };
  }, [rawCounts, testimonials]);

  // Filter client-side by search
  const filteredTestimonials = useMemo(() => {
    if (!search.trim()) return testimonials;
    const query = search.toLowerCase();
    return testimonials.filter((t: any) => {
      const studentName = (t.user?.name || t.student_name || t.studentName || t.name || "").toLowerCase();
      const studentEmail = (t.user?.email || t.student_email || t.studentEmail || t.email || "").toLowerCase();
      const courseTitle = (t.course?.title || t.course_title || t.courseTitle || "").toLowerCase();
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
    onSuccess: () => {
      toast.success("Testimonial approved and published live!");
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["public-testimonials"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to approve testimonial");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      testimonialService.rejectTestimonial(id, note),
    onSuccess: () => {
      toast.info("Testimonial marked as rejected.");
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["public-testimonials"] });
      setRejectModalItem(null);
      setRejectNote("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to reject testimonial");
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
      toast.error(err.response?.data?.message || err.message || "Failed to delete testimonial");
    },
  });

  const handleOpenRejectModal = (item: any) => {
    setRejectModalItem(item);
    setRejectNote(item.adminNote || item.admin_note || "");
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

      {/* Testimonials Table & Mobile Cards */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 shadow-soft">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Loading testimonials...</p>
        </div>
      ) : filteredTestimonials.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 text-center px-4 shadow-soft">
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
        <div className="space-y-4">
          {/* Mobile Cards (< 640px) */}
          <div className="space-y-3 sm:hidden">
            {filteredTestimonials.map((item: any) => {
              const isPending = item.status === "PENDING";
              const isApproved = item.status === "APPROVED";
              const isRejected = item.status === "REJECTED";
              const studentName = item.user?.name || item.student_name || item.studentName || item.name || "Student";
              const studentEmail = item.user?.email || item.student_email || item.studentEmail || item.email || "";
              const courseTitle = item.course?.title || item.course_title || item.courseTitle;
              const createdAt = item.createdAt || item.created_at;
              const initial = (studentName || "S")[0].toUpperCase();

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-border bg-card p-4 shadow-soft space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-foreground truncate">{studentName}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{studentEmail}</div>
                      </div>
                    </div>
                    {/* Status Pill */}
                    {isApproved && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Approved
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                        Pending
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                        Rejected
                      </span>
                    )}
                  </div>

                  {/* Rating + Course */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-[11px]">
                      <span>★</span>
                      <span>{item.rating}.0 / 5.0</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                      {courseTitle || "General Review"}
                    </span>
                  </div>

                  {/* Quote */}
                  <p
                    onClick={() => setSelectedItem(item)}
                    className="text-xs text-foreground/90 italic line-clamp-2 bg-muted/30 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    "{item.quote}"
                  </p>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs px-2 text-muted-foreground"
                      onClick={() => setSelectedItem(item)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" /> View
                    </Button>
                    {isPending && (
                      <>
                        <Button
                          size="sm"
                          className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => approveMutation.mutate(item.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2.5 text-rose-600 border-rose-200"
                          onClick={() => handleOpenRejectModal(item)}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {isApproved && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2 text-muted-foreground hover:text-rose-600"
                        onClick={() => handleOpenRejectModal(item)}
                      >
                        Unpublish
                      </Button>
                    )}
                    {isRejected && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2 text-emerald-600 border-emerald-200"
                        onClick={() => approveMutation.mutate(item.id)}
                      >
                        Approve
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                      onClick={() => handleDelete(item.id, studentName)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop & Tablet Minimal Table (>= 640px) */}
          <div className="hidden sm:block overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-3 py-3 w-24">Rating</th>
                    <th className="px-4 py-3 max-w-[200px]">Program</th>
                    <th className="px-4 py-3">Testimonial Review</th>
                    <th className="px-3 py-3 w-28">Status</th>
                    <th className="px-4 py-3 text-right w-44">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTestimonials.map((item: any) => {
                    const isPending = item.status === "PENDING";
                    const isApproved = item.status === "APPROVED";
                    const isRejected = item.status === "REJECTED";
                    const studentName = item.user?.name || item.student_name || item.studentName || item.name || "Student";
                    const studentEmail = item.user?.email || item.student_email || item.studentEmail || item.email || "";
                    const courseTitle = item.course?.title || item.course_title || item.courseTitle;
                    const createdAt = item.createdAt || item.created_at;
                    const initial = (studentName || "S")[0].toUpperCase();

                    return (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors group">
                        {/* Student */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-foreground text-xs truncate max-w-[150px]">
                                {studentName}
                              </div>
                              <div className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                                {studentEmail}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Rating */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1 font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md text-[11px]">
                            <span>★</span>
                            <span>{item.rating}.0</span>
                          </div>
                        </td>

                        {/* Course */}
                        <td className="px-4 py-3">
                          {courseTitle ? (
                            <span className="inline-flex items-center gap-1 text-primary text-xs font-medium truncate max-w-[180px] bg-primary/5 px-2 py-0.5 rounded border border-primary/10" title={courseTitle}>
                              <BookOpen className="h-3 w-3 shrink-0" />
                              <span className="truncate">{courseTitle}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs italic">Platform Review</span>
                          )}
                        </td>

                        {/* Review Quote */}
                        <td className="px-4 py-3">
                          <div
                            onClick={() => setSelectedItem(item)}
                            className="cursor-pointer group/quote max-w-sm"
                            title="Click to view full testimonial"
                          >
                            <p className="text-xs text-foreground/85 italic line-clamp-2 leading-relaxed group-hover/quote:text-primary transition-colors">
                              "{item.quote}"
                            </p>
                            {item.adminNote && (
                              <div className="text-[10px] text-rose-600 mt-0.5 truncate">
                                Note: {item.adminNote}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          {isApproved && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" /> Approved
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                              <Clock className="h-3 w-3" /> Pending
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                              <XCircle className="h-3 w-3" /> Rejected
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                              onClick={() => setSelectedItem(item)}
                              title="View full review"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>

                            {isPending && (
                              <>
                                <Button
                                  size="sm"
                                  className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                                  onClick={() => approveMutation.mutate(item.id)}
                                  disabled={approveMutation.isPending}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-2 text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg"
                                  onClick={() => handleOpenRejectModal(item)}
                                >
                                  Reject
                                </Button>
                              </>
                            )}

                            {isApproved && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] px-2 text-muted-foreground hover:text-rose-600 rounded-lg"
                                onClick={() => handleOpenRejectModal(item)}
                              >
                                Unpublish
                              </Button>
                            )}

                            {isRejected && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50 rounded-lg"
                                onClick={() => approveMutation.mutate(item.id)}
                              >
                                Approve
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 rounded-lg"
                              onClick={() => handleDelete(item.id, studentName)}
                              title="Delete permanently"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View Full Testimonial Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {((selectedItem.user?.name || selectedItem.student_name || "S")[0]).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">
                    {selectedItem.user?.name || selectedItem.student_name || "Student"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedItem.user?.email || selectedItem.student_email || "Student Account"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Rating & Course info */}
            <div className="flex items-center justify-between text-xs bg-muted/30 p-3 rounded-xl">
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <span>★</span>
                <span>{selectedItem.rating}.0 / 5.0 Rating</span>
              </div>
              <span className="text-muted-foreground font-medium">
                {selectedItem.course?.title || selectedItem.course_title || "General Platform Review"}
              </span>
            </div>

            {/* Full Quote */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-xs italic leading-relaxed text-foreground">
              "{selectedItem.quote}"
            </div>

            {/* Admin Note if any */}
            {(selectedItem.adminNote || selectedItem.admin_note) && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-600 dark:text-rose-400">
                <span className="font-bold">Rejection Note: </span>
                <span>{selectedItem.adminNote || selectedItem.admin_note}</span>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="text-[11px] text-muted-foreground">
                Submitted on {new Date(selectedItem.createdAt || selectedItem.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2">
                {selectedItem.status === "PENDING" && (
                  <>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                      onClick={() => {
                        approveMutation.mutate(selectedItem.id);
                        setSelectedItem(null);
                      }}
                    >
                      Approve & Publish
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-rose-600 border-rose-200 text-xs h-8"
                      onClick={() => {
                        handleOpenRejectModal(selectedItem);
                        setSelectedItem(null);
                      }}
                    >
                      Reject
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => setSelectedItem(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    by {(rejectModalItem as any).user?.name || (rejectModalItem as any).student_name || "Student"}
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

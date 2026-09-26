import { createLazyFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Search,
  Download,
  Flame,
  CheckCircle2,
  Phone,
  Mail,
  PlayCircle,
  Clock,
  Filter,
  Loader2,
  Calendar,
  Eye,
  MessageCircle,
  ArrowUpDown,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { leadService, type LeadItem } from "@/lib/services/lead.service";
import { toast } from "sonner";

export const Route = createLazyFileRoute("/admin/leads")({
  component: AdminLeads,
});

function AdminLeads() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [purchaseFilter, setPurchaseFilter] = useState("all");
  const [hotLeadsOnly, setHotLeadsOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "views">("recent");

  // Fetch all leads
  const { data: leads = [], isLoading } = useQuery<LeadItem[]>({
    queryKey: ["admin-leads"],
    queryFn: () => leadService.getAdminLeads(),
  });

  // Mutation to update lead status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: "viewed" | "contacted" | "converted" }) => {
      await leadService.updateLeadStatus(leadId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      toast.success("Lead status updated successfully");
    },
    onError: () => {
      toast.error("Failed to update lead status");
    },
  });

  // Unique course list for filter
  const courseOptions = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.course_title) set.add(l.course_title);
    });
    return Array.from(set);
  }, [leads]);

  // Filtered & Sorted Leads
  const filteredLeads = useMemo(() => {
    return leads
      .filter((l) => {
        // Search filter
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          const matchName = l.user_name?.toLowerCase().includes(q);
          const matchEmail = l.user_email?.toLowerCase().includes(q);
          const matchPhone = l.phone_number?.toLowerCase().includes(q);
          const matchCourse = l.course_title?.toLowerCase().includes(q);
          if (!matchName && !matchEmail && !matchPhone && !matchCourse) return false;
        }

        // Course filter
        if (selectedCourse !== "all" && l.course_title !== selectedCourse) {
          return false;
        }

        // Status filter
        if (statusFilter !== "all" && l.status !== statusFilter) {
          return false;
        }

        // Purchase filter
        if (purchaseFilter !== "all" && l.purchase_status !== purchaseFilter) {
          return false;
        }

        // Hot leads filter (>= 3 views)
        if (hotLeadsOnly && (l.view_count || 1) < 3) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "views") {
          return (b.view_count || 1) - (a.view_count || 1);
        }
        return new Date(b.last_viewed_at).getTime() - new Date(a.last_viewed_at).getTime();
      });
  }, [leads, searchTerm, selectedCourse, statusFilter, purchaseFilter, hotLeadsOnly, sortBy]);

  // Overview KPIs
  const totalLeads = leads.length;
  const hotLeadsCount = leads.filter((l) => (l.view_count || 1) >= 3).length;
  const convertedCount = leads.filter((l) => l.purchase_status === "purchased" || l.status === "converted").length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedCount / totalLeads) * 100) : 0;

  const handleExportCsv = () => {
    leadService.exportCsv(filteredLeads);
    toast.success(`Exported ${filteredLeads.length} leads to CSV`);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Preview Leads</h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
            {filteredLeads.length} leads tracked from free preview lessons
          </p>
        </div>
        <Button
          onClick={handleExportCsv}
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 border-border text-xs font-semibold shadow-2xs"
          disabled={filteredLeads.length === 0}
        >
          <Download className="h-3.5 w-3.5 text-primary" /> Export CSV ({filteredLeads.length})
        </Button>
      </div>

      {/* Minimal Filter and Search Bar */}
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-4 shadow-soft space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, phone, or course..."
              className="pl-9 h-9 bg-surface text-xs sm:text-sm"
            />
          </div>

          {/* Hot leads quick toggle */}
          <button
            type="button"
            onClick={() => setHotLeadsOnly(!hotLeadsOnly)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 h-9 text-xs font-bold transition-all cursor-pointer shrink-0 ${
              hotLeadsOnly
                ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-2xs"
                : "border-border bg-surface text-muted-foreground hover:text-foreground"
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            <span>🔥 Hot Leads</span>
          </button>
        </div>

        {/* Dropdown Filters Row */}
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
          {/* Course filter */}
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="h-8.5 w-full rounded-xl border border-input bg-surface px-2.5 text-xs shadow-2xs outline-none"
          >
            <option value="all">All Courses ({courseOptions.length})</option>
            {courseOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Lead Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8.5 w-full rounded-xl border border-input bg-surface px-2.5 text-xs shadow-2xs outline-none"
          >
            <option value="all">All Lead Statuses</option>
            <option value="viewed">Status: Viewed</option>
            <option value="contacted">Status: Contacted</option>
            <option value="converted">Status: Converted</option>
          </select>

          {/* Purchase Status filter */}
          <select
            value={purchaseFilter}
            onChange={(e) => setPurchaseFilter(e.target.value)}
            className="h-8.5 w-full rounded-xl border border-input bg-surface px-2.5 text-xs shadow-2xs outline-none"
          >
            <option value="all">All Purchases</option>
            <option value="not_purchased">Not Purchased</option>
            <option value="purchased">Purchased</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "recent" | "views")}
            className="h-8.5 w-full rounded-xl border border-input bg-surface px-2.5 text-xs shadow-2xs outline-none font-semibold text-primary"
          >
            <option value="recent">Sort: Most Recent</option>
            <option value="views">Sort: Most Views</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground space-y-2">
            <Eye className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <h3 className="font-display font-bold text-foreground text-base">No preview leads found</h3>
            <p className="text-xs max-w-sm mx-auto">
              When logged-in students watch free preview lessons, their contact details and preview intent will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/70 bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Course & Lesson</th>
                  <th className="py-3 px-4 text-center">Views</th>
                  <th className="py-3 px-4">Last Viewed</th>
                  <th className="py-3 px-4 text-center">Purchase</th>
                  <th className="py-3 px-4">Lead Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredLeads.map((l) => {
                  const isHot = (l.view_count || 1) >= 3;
                  const isPurchased = l.purchase_status === "purchased";
                  const cleanPhone = (l.phone_number || "").replace(/\D/g, "");

                  return (
                    <tr key={l.id} className="hover:bg-muted/20 transition-colors">
                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-primary font-bold text-xs text-primary-foreground shadow-xs shrink-0">
                            {(l.user_name || "S")[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-foreground flex items-center gap-1.5">
                              {l.user_name || "Learner"}
                              {isHot && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 text-amber-600 px-1.5 py-0.2 text-[9px] font-bold">
                                  <Flame className="h-2.5 w-2.5" /> Hot
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground">{l.user_email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info & WhatsApp action */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {l.phone_number ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-foreground font-semibold">{l.phone_number}</span>
                              {cleanPhone && (
                                <a
                                  href={`https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(l.user_name || "there")},%20we%20saw%20you%20checked%20out%20the%20free%20preview%20of%20${encodeURIComponent(l.course_title || "our course")}.%20Do%20you%20have%20any%20questions%20about%20the%20program?`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-md bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25 px-1.5 py-0.5 text-[10px] font-bold"
                                  title="Chat on WhatsApp"
                                >
                                  <MessageCircle className="h-3 w-3" /> WhatsApp
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic text-[11px]">No phone</span>
                          )}
                        </div>
                      </td>

                      {/* Course & Lesson */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 max-w-xs">
                          <div className="font-bold text-foreground truncate flex items-center gap-1">
                            <BookOpen className="h-3 w-3 text-primary shrink-0" />
                            <span>{l.course_title || "Course"}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                            <PlayCircle className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span>{l.lesson_title || "Preview Lesson"}</span>
                          </div>
                        </div>
                      </td>

                      {/* View Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center justify-center rounded-lg px-2 py-0.5 font-mono text-xs font-bold ${
                          isHot ? "bg-amber-500/15 text-amber-600" : "bg-muted text-foreground"
                        }`}>
                          {l.view_count || 1}x
                        </span>
                      </td>

                      {/* Last Viewed */}
                      <td className="py-3.5 px-4 text-muted-foreground">
                        <div className="font-medium text-foreground">{new Date(l.last_viewed_at).toLocaleDateString()}</div>
                        <div className="text-[10px]">{new Date(l.last_viewed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                      </td>

                      {/* Purchase Status */}
                      <td className="py-3.5 px-4 text-center">
                        {isPurchased ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-600 px-2.5 py-0.5 text-[10px] font-bold">
                            <CheckCircle2 className="h-3 w-3" /> Purchased
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-500/15 text-amber-600 px-2.5 py-0.5 text-[10px] font-bold">
                            Not Purchased
                          </span>
                        )}
                      </td>

                      {/* Lead Status Dropdown */}
                      <td className="py-3.5 px-4">
                        <select
                          value={l.status || "viewed"}
                          onChange={(e) =>
                            updateStatusMutation.mutate({
                              leadId: l.id,
                              status: e.target.value as "viewed" | "contacted" | "converted",
                            })
                          }
                          className="h-7 rounded-lg border border-input bg-surface px-2 text-[11px] font-semibold text-foreground shadow-xs outline-none cursor-pointer"
                        >
                          <option value="viewed">Viewed</option>
                          <option value="contacted">Contacted</option>
                          <option value="converted">Converted</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

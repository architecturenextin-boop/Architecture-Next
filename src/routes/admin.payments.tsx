import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/lib/services/admin.service";
import { Loader2, Search, CreditCard, ArrowUpRight, CheckCircle2, Clock, AlertTriangle, IndianRupee, Eye, X, BookOpen, User } from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({ meta: [{ title: "Payments & Revenue — Admin" }] }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending" | "failed">("all");
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);

  // 1. Fetch all payment records with joined student profiles & courses from REST API
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      return adminService.getAllPayments();
    },
  });

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p: any) => {
      const matchSearch =
        !search.trim() ||
        p.studentName.toLowerCase().includes(search.toLowerCase()) ||
        p.studentEmail.toLowerCase().includes(search.toLowerCase()) ||
        p.courseTitle.toLowerCase().includes(search.toLowerCase()) ||
        (p.orderId || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.paymentId || "").toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "all" || p.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [payments, search, statusFilter]);

  // Aggregate Metrics
  const completedPayments = payments.filter((p: any) => p.status === "completed");
  const totalRevenue = completedPayments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
  const pendingCount = payments.filter((p: any) => p.status === "pending").length;
  const avgOrderValue = completedPayments.length > 0 ? Math.round(totalRevenue / completedPayments.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold">Payments & Transactions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time transaction history, revenue analytics, and gateway order logs.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Revenue</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-success/10 text-success">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-foreground">
            ₹{totalRevenue.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">From {completedPayments.length} successful sales</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Completed Orders</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-foreground">{completedPayments.length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">100% verified transactions</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Average Order</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent/10 text-accent">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-foreground">₹{avgOrderValue.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Per paying customer</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending / Initiated</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-foreground">{pendingCount}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Awaiting checkout completion</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === "all" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({payments.length})
          </button>
          <button
            onClick={() => setStatusFilter("completed")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === "completed" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Completed ({completedPayments.length})
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === "pending" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter("failed")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === "failed" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Failed ({payments.filter((p: any) => p.status === "failed").length})
          </button>
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search order ID, student, course..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card" 
          />
        </div>
      </div>

      {/* Main Transactions List / Table */}
      {isLoading ? (
        <div className="flex h-[40vh] items-center justify-center bg-card rounded-2xl border border-border">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="text-center p-12 text-sm text-muted-foreground bg-card rounded-2xl border border-border shadow-soft">
          <CreditCard className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="font-semibold text-foreground">No transactions found</p>
          <p className="text-xs mt-1">Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <>
          {/* Mobile Transaction Cards (< 640px) */}
          <div className="space-y-3.5 sm:hidden">
            {filteredPayments.map((r: any) => {
              const date = r.created_at ? new Date(r.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "N/A";
              return (
                <article key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-[11px] font-bold text-foreground block truncate">
                        {r.orderId}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                        {r.gateway || "Razorpay"}
                      </span>
                    </div>

                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      r.status === "completed" 
                        ? "bg-success/15 text-success" 
                        : r.status === "pending" 
                        ? "bg-amber-500/15 text-amber-600" 
                        : "bg-destructive/15 text-destructive"
                    }`}>
                      {r.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground border-y border-border/60 py-2.5">
                    <div className="font-semibold text-foreground">{r.studentName} ({r.studentEmail})</div>
                    <div className="truncate font-medium text-foreground/80">{r.courseTitle}</div>
                    <div className="text-[11px] pt-0.5">{date}</div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-display font-bold text-base text-foreground">
                      {r.currency}{Number(r.amount).toLocaleString()}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedPayment(r)}
                      className="min-h-[36px] text-xs font-semibold gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" /> Inspect
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Tablet & Desktop Table (>= 640px) */}
          <div className="hidden sm:block overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3.5 text-left">Order & Gateway</th>
                    <th className="px-5 py-3.5 text-left">Student</th>
                    <th className="hidden px-5 py-3.5 text-left sm:table-cell">Course</th>
                    <th className="hidden px-5 py-3.5 text-left md:table-cell">Date</th>
                    <th className="px-5 py-3.5 text-left">Status</th>
                    <th className="px-5 py-3.5 text-right">Amount</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredPayments.map((r: any) => {
                    const date = r.created_at ? new Date(r.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "N/A";
                    return (
                      <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="space-y-0.5">
                            <span className="font-mono text-xs font-bold text-foreground block truncate max-w-[180px]">
                              {r.orderId}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                              {r.gateway || "Razorpay"}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-foreground block">{r.studentName}</span>
                            <span className="text-[11px] text-muted-foreground block truncate max-w-[160px]">{r.studentEmail}</span>
                          </div>
                        </td>

                        <td className="hidden px-5 py-3.5 text-muted-foreground sm:table-cell font-medium max-w-[200px] truncate">
                          {r.courseTitle}
                        </td>

                        <td className="hidden px-5 py-3.5 text-muted-foreground text-xs md:table-cell whitespace-nowrap">
                          {date}
                        </td>

                        <td className="px-5 py-3.5">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                            r.status === "completed" 
                              ? "bg-success/15 text-success" 
                              : r.status === "pending" 
                              ? "bg-amber-500/15 text-amber-600" 
                              : "bg-destructive/15 text-destructive"
                          }`}>
                            {r.status}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right font-display font-bold text-base text-foreground whitespace-nowrap">
                          {r.currency}{Number(r.amount).toLocaleString()}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedPayment(r)}
                            className="h-8 text-xs font-semibold gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" /> Inspect
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Transaction Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-glow">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">Transaction Details</h3>
                <p className="text-xs font-mono text-muted-foreground">ID: {selectedPayment.id}</p>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="rounded-2xl bg-muted/20 p-4 border border-border flex items-center justify-between">
                <div>
                  <span className="text-muted-foreground block">Amount Paid</span>
                  <span className="font-display text-2xl font-extrabold text-foreground">
                    {selectedPayment.currency}{Number(selectedPayment.amount).toLocaleString()}
                  </span>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  selectedPayment.status === "completed" 
                    ? "bg-success/15 text-success" 
                    : selectedPayment.status === "pending" 
                    ? "bg-amber-500/15 text-amber-600" 
                    : "bg-destructive/15 text-destructive"
                }`}>
                  {selectedPayment.status}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border p-3">
                  <span className="text-muted-foreground block font-medium">Gateway Order ID</span>
                  <span className="font-mono font-semibold text-foreground text-xs break-all">
                    {selectedPayment.orderId}
                  </span>
                </div>

                <div className="rounded-xl border border-border p-3">
                  <span className="text-muted-foreground block font-medium">Gateway Payment ID</span>
                  <span className="font-mono font-semibold text-foreground text-xs break-all">
                    {selectedPayment.paymentId || "N/A"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border p-3 space-y-1">
                <span className="text-muted-foreground block font-medium">Student / Buyer</span>
                <span className="font-semibold text-foreground block text-sm">{selectedPayment.studentName}</span>
                <span className="text-muted-foreground block">{selectedPayment.studentEmail}</span>
                {selectedPayment.studentPhone && (
                  <span className="text-muted-foreground block">+91 {selectedPayment.studentPhone}</span>
                )}
              </div>

              <div className="rounded-xl border border-border p-3">
                <span className="text-muted-foreground block font-medium">Purchased Course</span>
                <span className="font-semibold text-foreground text-sm block">{selectedPayment.courseTitle}</span>
              </div>

              <div className="rounded-xl border border-border p-3 flex justify-between">
                <span className="text-muted-foreground">Transaction Timestamp</span>
                <span className="font-semibold text-foreground font-mono">
                  {new Date(selectedPayment.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

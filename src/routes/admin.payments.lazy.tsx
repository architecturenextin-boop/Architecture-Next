import { createLazyFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/lib/services/admin.service";
import {
  Loader2,
  Search,
  CreditCard,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  IndianRupee,
  Eye,
  X,
  BookOpen,
  User,
  Calendar,
  Mail,
  Phone,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Gift,
  Tag,
  Sparkles,
} from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useModalScrollLock } from "@/hooks/use-modal-scroll-lock";

export const Route = createLazyFileRoute("/admin/payments")({
  component: PaymentsPage,
});

function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending" | "failed" | "manual" | "coupon" | "paid">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [pendingExplainerPayment, setPendingExplainerPayment] = useState<any | null>(null);
  const paymentModalScrollRef = useRef<HTMLDivElement | null>(null);

  // Lock background scroll and guarantee modal scrolling
  useModalScrollLock(!!selectedPayment, { scrollContainerRef: paymentModalScrollRef });
  useModalScrollLock(!!pendingExplainerPayment);

  // 1. Fetch all payment records with joined student profiles & courses from REST API
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      return adminService.getAllPayments();
    },
  });

  // Filter payments with Manual & Coupon entry capabilities
  const filteredPayments = useMemo(() => {
    return payments.filter((p: any) => {
      const matchSearch =
        !search.trim() ||
        p.studentName.toLowerCase().includes(search.toLowerCase()) ||
        p.studentEmail.toLowerCase().includes(search.toLowerCase()) ||
        p.courseTitle.toLowerCase().includes(search.toLowerCase()) ||
        (p.orderId || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.paymentId || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.couponCode || "").toLowerCase().includes(search.toLowerCase());

      const isManual = p.isManual || p.gateway === "manual" || (p.orderId && String(p.orderId).startsWith("MANUAL_"));
      const isCoupon = p.isCoupon || Boolean(p.couponCode || p.coupon?.code || p.couponId);
      const isPaid = !isManual && Number(p.finalAmount ?? p.amount) > 0;

      let matchFilter = true;
      if (statusFilter === "all") matchFilter = true;
      else if (statusFilter === "completed") matchFilter = p.status === "completed";
      else if (statusFilter === "pending") matchFilter = p.status === "pending";
      else if (statusFilter === "failed") matchFilter = p.status === "failed";
      else if (statusFilter === "manual") matchFilter = isManual;
      else if (statusFilter === "coupon") matchFilter = isCoupon;
      else if (statusFilter === "paid") matchFilter = isPaid;

      return matchSearch && matchFilter;
    });
  }, [payments, search, statusFilter]);

  // Reset pagination on search or status change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  // Comprehensive Analytics Breakdown ("Analyzing Current")
  const completedPayments = payments.filter((p: any) => p.status === "completed");

  // 1. Real Paid Gateway Transactions (Excludes free manual entries from revenue)
  const paidOrders = completedPayments.filter(
    (p: any) => !p.isManual && p.gateway !== "manual" && !String(p.orderId || "").startsWith("MANUAL_") && Number(p.finalAmount ?? p.amount) > 0
  );
  const realNetRevenue = paidOrders.reduce((sum: number, p: any) => sum + (Number(p.finalAmount ?? p.amount) || 0), 0);

  // 2. Manual / Free Admin Grants Analytics
  const manualOrders = payments.filter(
    (p: any) => p.isManual || p.gateway === "manual" || String(p.orderId || "").startsWith("MANUAL_")
  );
  const manualCompleted = manualOrders.filter((p: any) => p.status === "completed");
  const manualWaivedValue = manualOrders.reduce((sum: number, p: any) => sum + (Number(p.originalAmount ?? p.amount) || 0), 0);

  // 3. Coupons Redemptions Analytics
  const couponOrders = payments.filter(
    (p: any) => p.isCoupon || Boolean(p.couponCode || p.coupon?.code || p.couponId)
  );
  const totalCouponDiscounts = couponOrders.reduce((sum: number, p: any) => sum + (Number(p.discountAmount) || 0), 0);
  const uniqueCoupons = Array.from(new Set(couponOrders.map((p: any) => p.couponCode || p.coupon?.code).filter(Boolean)));

  const pendingCount = payments.filter((p: any) => p.status === "pending").length;
  const failedCount = payments.filter((p: any) => p.status === "failed").length;
  const avgOrderValue = paidOrders.length > 0 ? Math.round(realNetRevenue / paidOrders.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold">Payments &amp; Transactions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time transaction history, paid gateway analytics, free manual entries, and coupon redemption tracking.
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
            ₹{realNetRevenue.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">From {paidOrders.length} paying customers ({manualOrders.length} free)</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Completed Orders</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-foreground">{completedPayments.length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{paidOrders.length} paid • {manualOrders.length} free • {couponOrders.length} coupons</div>
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

      {/* Filter and Search Bar with Free & Coupons Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              statusFilter === "all" ? "bg-primary text-primary-foreground shadow-xs" : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({payments.length})
          </button>
          <button
            onClick={() => setStatusFilter("completed")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              statusFilter === "completed" ? "bg-primary text-primary-foreground shadow-xs" : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Completed ({completedPayments.length})
          </button>
          <button
            onClick={() => setStatusFilter("manual")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5 ${
              statusFilter === "manual" ? "bg-emerald-600 text-white shadow-xs font-bold" : "bg-card border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
            }`}
            title="Filter free manual entries"
          >
            <Gift className="h-3 w-3" /> Free ({manualOrders.length})
          </button>
          <button
            onClick={() => setStatusFilter("coupon")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5 ${
              statusFilter === "coupon" ? "bg-purple-600 text-white shadow-xs font-bold" : "bg-card border border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10"
            }`}
            title="Filter coupon applied transactions"
          >
            <Tag className="h-3 w-3" /> Coupons ({couponOrders.length})
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              statusFilter === "pending" ? "bg-primary text-primary-foreground shadow-xs" : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter("failed")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              statusFilter === "failed" ? "bg-primary text-primary-foreground shadow-xs" : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Failed ({failedCount})
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
            {paginatedPayments.map((r: any) => {
              const date = r.created_at ? new Date(r.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "N/A";
              const currSymbol = r.currency === "INR" || !r.currency ? "₹" : r.currency;
              const isManual = r.isManual || r.gateway === "manual" || (r.orderId && String(r.orderId).startsWith("MANUAL_"));
              const isCoupon = r.isCoupon || Boolean(r.couponCode);
              return (
                <article key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-[11px] font-bold text-foreground block truncate">
                        {r.orderId}
                      </span>
                      {isManual ? (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md inline-flex items-center gap-1 mt-0.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                          <Gift className="h-2.5 w-2.5" /> Manual Entry (Free)
                        </span>
                      ) : isCoupon ? (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md inline-flex items-center gap-1 mt-0.5 bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25">
                          <Tag className="h-2.5 w-2.5" /> Coupon: {r.couponCode}
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md inline-block mt-0.5 bg-muted text-muted-foreground">
                          {r.gateway || "Razorpay"}
                        </span>
                      )}
                    </div>

                    {r.status === "completed" ? (
                      <button
                        type="button"
                        onClick={() => toast.success(isManual ? `Order ${r.orderId} is free.` : `Order ${r.orderId} verified and captured.`)}
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 cursor-pointer ${
                          isManual ? "bg-emerald-500/15 text-emerald-600" : "bg-success/15 text-success"
                        }`}
                      >
                        {isManual ? "Free" : "Completed"}
                      </button>
                    ) : r.status === "pending" ? (
                      <button
                        type="button"
                        onClick={() => setPendingExplainerPayment(r)}
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-600 shrink-0 inline-flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                        title="Click to view why this payment is pending"
                      >
                        <Clock className="h-2.5 w-2.5" /> Pending
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toast.error(`Order ${r.orderId} failed authorization.`)}
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-destructive/15 text-destructive shrink-0 cursor-pointer"
                      >
                        Failed
                      </button>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground border-y border-border/60 py-2.5">
                    <div className="font-semibold text-foreground">{r.studentName} ({r.studentEmail})</div>
                    <div className="truncate font-medium text-foreground/80">{r.courseTitle}</div>
                    <div className="text-[11px] pt-0.5">{date}</div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {isManual ? (
                      <div>
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md text-xs uppercase tracking-wider">
                          <Gift className="h-3 w-3" /> Free (₹0)
                        </span>
                        <span className="ml-1.5 text-[11px] text-muted-foreground line-through">
                          {currSymbol}{Number(r.originalAmount || 0).toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="font-display font-bold text-base text-foreground">
                          {currSymbol}{Number(r.finalAmount ?? r.amount).toLocaleString()}
                        </span>
                        {r.discountAmount > 0 && (
                          <span className="ml-1.5 text-[11px] text-muted-foreground line-through">
                            {currSymbol}{Number(r.originalAmount ?? (r.amount + r.discountAmount)).toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
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
            <div
              className="table-scrollbar-x"
              onWheel={(e) => {
                const el = e.currentTarget;
                if (el.scrollWidth > el.clientWidth) {
                  if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && !e.shiftKey) {
                    const atLeft = el.scrollLeft <= 0;
                    const atRight = Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth;
                    if ((e.deltaY > 0 && !atRight) || (e.deltaY < 0 && !atLeft)) {
                      el.scrollLeft += e.deltaY;
                    }
                  }
                }
              }}
            >
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3.5 text-left">Student / User</th>
                    <th className="hidden px-5 py-3.5 text-left md:table-cell">Contact & Order</th>
                    <th className="hidden px-5 py-3.5 text-left sm:table-cell">Course</th>
                    <th className="px-5 py-3.5 text-left">Status</th>
                    <th className="hidden px-5 py-3.5 text-left lg:table-cell">Date</th>
                    <th className="px-5 py-3.5 text-right">Amount</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedPayments.map((r: any) => {
                    const date = r.created_at ? new Date(r.created_at).toLocaleDateString() : "N/A";
                    const currSymbol = r.currency === "INR" || !r.currency ? "₹" : r.currency;
                    const isManual = r.isManual || r.gateway === "manual" || (r.orderId && String(r.orderId).startsWith("MANUAL_"));
                    const isCoupon = r.isCoupon || Boolean(r.couponCode);
                    const initial = (r.studentName || r.studentEmail || "L")[0].toUpperCase();

                    return (
                      <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                        {/* Student / User */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-foreground block truncate">
                                {r.studentName || "Learner"}
                              </span>
                              <span className="text-[11px] text-muted-foreground font-mono block">
                                ID: {(r.studentId || r.userId || r.id).substring(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Contact & Order */}
                        <td className="hidden px-5 py-3.5 md:table-cell">
                          <div className="space-y-0.5 text-xs">
                            <div className="flex items-center gap-1.5 text-foreground">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate max-w-[200px]">{r.studentEmail || "No email"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
                              <span className="truncate max-w-[180px]">{r.orderId}</span>
                              {isManual ? (
                                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 inline-flex items-center gap-1">
                                  <Gift className="h-2.5 w-2.5" /> Manual (Free)
                                </span>
                              ) : isCoupon ? (
                                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25 inline-flex items-center gap-1">
                                  <Tag className="h-2.5 w-2.5" /> {r.couponCode}
                                </span>
                              ) : (
                                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                  {r.gateway || "Razorpay"}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Course */}
                        <td className="hidden px-5 py-3.5 sm:table-cell">
                          <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold bg-primary/10 text-primary truncate max-w-[200px]" title={r.courseTitle}>
                            <BookOpen className="h-3 w-3 shrink-0" />
                            <span className="truncate">{r.courseTitle}</span>
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          {r.status === "completed" ? (
                            <button
                              type="button"
                              onClick={() => toast.success(isManual ? `Order ${r.orderId} granted for free.` : `Payment verified! Order ${r.orderId} was captured successfully.`)}
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                                isManual
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25"
                                  : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                              }`}
                              title={isManual ? "Manual Free grant" : "Payment successful & captured"}
                            >
                              <CheckCircle2 className="h-3 w-3" /> {isManual ? "Free" : "Completed"}
                            </button>
                          ) : r.status === "pending" ? (
                            <button
                              type="button"
                              onClick={() => setPendingExplainerPayment(r)}
                              className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 hover:bg-amber-500/25 transition-all cursor-pointer shadow-xs active:scale-95"
                              title="Click to view why this payment is pending"
                            >
                              <Clock className="h-3 w-3" /> Pending
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toast.error(`Payment failed for Order ${r.orderId}. Bank authorization was not completed.`)}
                              className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-500/20 transition-colors cursor-pointer"
                              title="Payment failed"
                            >
                              <XCircle className="h-3 w-3" /> Failed
                            </button>
                          )}
                        </td>

                        {/* Joined / Date */}
                        <td className="hidden px-5 py-3.5 text-muted-foreground text-xs lg:table-cell">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{date}</span>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          {isManual ? (
                            <div>
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md text-xs uppercase tracking-wider">
                                <Gift className="h-3 w-3" /> Free (₹0)
                              </span>
                              <span className="block text-[11px] text-muted-foreground line-through font-normal mt-0.5">
                                {currSymbol}{Number(r.originalAmount || 0).toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="font-display font-bold text-base text-foreground">
                                {currSymbol}{Number(r.finalAmount ?? r.amount).toLocaleString()}
                              </span>
                              {r.discountAmount > 0 && (
                                <div className="flex items-center justify-end gap-1 text-[11px] font-normal">
                                  <span className="text-muted-foreground line-through">
                                    {currSymbol}{Number(r.originalAmount ?? (r.amount + r.discountAmount)).toLocaleString()}
                                  </span>
                                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                    (-{currSymbol}{Number(r.discountAmount).toLocaleString()})
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedPayment(r)}
                            className="h-8 text-xs font-semibold gap-1 cursor-pointer"
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

          {/* Pagination Controls */}
          {filteredPayments.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>
                  Showing{" "}
                  <strong className="font-semibold text-foreground">
                    {(currentPage - 1) * pageSize + 1}
                  </strong>{" "}
                  to{" "}
                  <strong className="font-semibold text-foreground">
                    {Math.min(currentPage * pageSize, filteredPayments.length)}
                  </strong>{" "}
                  of{" "}
                  <strong className="font-semibold text-foreground">
                    {filteredPayments.length}
                  </strong>{" "}
                  payments
                </span>
                <span className="hidden sm:inline text-muted-foreground/40">•</span>
                <div className="hidden sm:flex items-center gap-1.5">
                  <span>Rows:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-7 rounded-lg border border-border bg-card px-2 text-xs font-semibold text-foreground outline-none cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-2.5 text-xs font-semibold gap-1 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      return (
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - currentPage) <= 1
                      );
                    })
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev && p - prev > 1;
                      return (
                        <div key={p} className="flex items-center gap-1">
                          {showEllipsis && <span className="px-1 text-muted-foreground">...</span>}
                          <button
                            onClick={() => setCurrentPage(p)}
                            className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              currentPage === p
                                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {p}
                          </button>
                        </div>
                      );
                    })}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-2.5 text-xs font-semibold gap-1 cursor-pointer disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Why is Payment Pending? Diagnostic Modal */}
      {pendingExplainerPayment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-fade-in overflow-hidden"
          onClick={() => setPendingExplainerPayment(null)}
          data-lenis-prevent="true"
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-elevated max-h-[90vh] overflow-y-auto modal-scroll-container"
            onClick={(e) => e.stopPropagation()}
            data-lenis-prevent="true"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-500/15 text-amber-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    Why is Payment Pending?
                  </h3>
                  <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                    Order #{pendingExplainerPayment.orderId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPendingExplainerPayment(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Diagnostic Breakdown */}
            <div className="mt-4 space-y-2.5">
              <p className="text-xs text-muted-foreground">
                Payment details for <strong>{pendingExplainerPayment.studentName}</strong>:
              </p>

              {/* Gateway Status */}
              <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-primary" /> Gateway Transaction
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    Awaiting Capture
                  </span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  The order was initialized in the Razorpay checkout modal, but confirmation of funds capture has not been returned by the bank gateway.
                </p>
              </div>

              {/* Probable Reasons */}
              <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-1.5 text-xs">
                <span className="font-bold text-foreground block">Common Causes:</span>
                <ul className="text-muted-foreground text-[11px] space-y-1 list-disc list-inside">
                  <li>Student closed the browser tab before submitting OTP or UPI PIN.</li>
                  <li>Customer exited or canceled payment in their bank app.</li>
                  <li>Network latency or delayed bank webhook confirmation.</li>
                </ul>
              </div>

              {/* Next Step */}
              <div className="rounded-xl border border-border bg-primary/5 p-3 space-y-1 text-xs">
                <span className="font-bold text-primary block">Next Step for Admin:</span>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  If the student reports that amount was debited from their account, verify with Razorpay Dashboard using Order ID <code className="font-mono text-foreground font-semibold">{pendingExplainerPayment.orderId}</code>. You can also manually grant course access from the Students page.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPendingExplainerPayment(null)}
                className="text-xs h-8 cursor-pointer"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedPayment(pendingExplainerPayment);
                  setPendingExplainerPayment(null);
                }}
                className="text-xs h-8 bg-primary text-primary-foreground font-semibold cursor-pointer gap-1.5"
              >
                <Eye className="h-3.5 w-3.5" /> Inspect Full Order
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedPayment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in overflow-hidden"
          onClick={() => setSelectedPayment(null)}
          data-lenis-prevent="true"
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-border bg-card shadow-glow flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            data-lenis-prevent="true"
            onWheel={(e) => {
              const el = paymentModalScrollRef.current;
              if (el && !el.contains(e.target as Node)) {
                el.scrollTop += e.deltaY;
                e.stopPropagation();
              }
            }}
          >
            <div className="flex items-center justify-between border-b border-border p-6 shrink-0 bg-card z-10">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">Transaction Details</h3>
                <p className="text-xs font-mono text-muted-foreground">ID: {selectedPayment.id}</p>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                title="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              ref={paymentModalScrollRef}
              data-lenis-prevent="true"
              tabIndex={0}
              className="flex-1 min-h-0 modal-scroll-container p-6 space-y-4 text-xs focus:outline-none"
            >
              {(() => {
                const isManual = selectedPayment.isManual || selectedPayment.gateway === "manual" || (selectedPayment.orderId && String(selectedPayment.orderId).startsWith("MANUAL_"));
                const isCoupon = selectedPayment.isCoupon || Boolean(selectedPayment.couponCode);
                const curr = selectedPayment.currency === "INR" || !selectedPayment.currency ? "₹" : selectedPayment.currency;

                return (
                  <>
                    <div className="rounded-2xl bg-muted/20 p-4 border border-border flex items-center justify-between">
                      <div>
                        <span className="text-muted-foreground block">
                          {isManual ? "Tuition Fee Status" : "Amount Paid"}
                        </span>
                        <div className="flex items-baseline gap-2">
                          {isManual ? (
                            <span className="font-display text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1.5">
                              <Gift className="h-6 w-6" /> FREE (100% Waived)
                            </span>
                          ) : (
                            <span className="font-display text-2xl font-extrabold text-foreground">
                              {curr}{Number(selectedPayment.finalAmount ?? selectedPayment.amount).toLocaleString()}
                            </span>
                          )}
                          {Number(selectedPayment.originalAmount) > 0 && (
                            <span className="text-xs text-muted-foreground line-through">
                              {curr}{Number(selectedPayment.originalAmount).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {isManual ? (
                          <span className="inline-block mt-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded">
                            Direct Admin Free Enrollment • No Payment Required
                          </span>
                        ) : isCoupon ? (
                          <span className="inline-block mt-1 text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-500/15 border border-purple-500/25 px-2 py-0.5 rounded">
                            Coupon Applied: {selectedPayment.couponCode} (-{curr}{Number(selectedPayment.discountAmount).toLocaleString()})
                          </span>
                        ) : null}
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                        isManual
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25"
                          : selectedPayment.status === "completed" 
                          ? "bg-success/15 text-success" 
                          : selectedPayment.status === "pending" 
                          ? "bg-amber-500/15 text-amber-600" 
                          : "bg-destructive/15 text-destructive"
                      }`}>
                        {isManual ? "Free" : selectedPayment.status}
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-border p-3">
                        <span className="text-muted-foreground block font-medium">Gateway / Method</span>
                        <span className="font-semibold text-foreground text-xs uppercase inline-flex items-center gap-1">
                          {isManual ? (
                            <>
                              <Gift className="h-3.5 w-3.5 text-emerald-600" />
                              Manual Entry (Free Grant)
                            </>
                          ) : isCoupon ? (
                            <>
                              <Tag className="h-3.5 w-3.5 text-purple-600" />
                              Coupon ({selectedPayment.couponCode})
                            </>
                          ) : (
                            selectedPayment.gateway || "Razorpay"
                          )}
                        </span>
                      </div>

                      <div className="rounded-xl border border-border p-3">
                        <span className="text-muted-foreground block font-medium">Order ID</span>
                        <span className="font-mono font-semibold text-foreground text-xs break-all">
                          {selectedPayment.orderId}
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}

              <div className="rounded-xl border border-border p-3">
                <span className="text-muted-foreground block font-medium">Payment ID</span>
                <span className="font-mono font-semibold text-foreground text-xs break-all">
                  {selectedPayment.paymentId || "N/A"}
                </span>
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

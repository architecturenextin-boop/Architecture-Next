import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BookOpen,
  CreditCard,
  IndianRupee,
  Users,
  GraduationCap,
  ChevronRight,
  ChevronDown,
  Tag,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminService } from "@/lib/services/admin.service";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/")(
  {
    head: () => ({ meta: [{ title: "Admin Overview — ArchitectureNext" }] }),
    component: Overview,
  }
);

// ─── Skeleton card ────────────────────────────────────────────────────────────
function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft animate-pulse">
      <div className="h-10 w-10 rounded-xl bg-muted" />
      <div className="mt-4 h-7 w-1/2 rounded-lg bg-muted" />
      <div className="mt-2 h-3 w-2/3 rounded bg-muted/60" />
      <div className="mt-1 h-3 w-3/4 rounded bg-muted/40" />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <tr className="animate-pulse border-b border-border">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-3 rounded bg-muted" style={{ width: `${60 + (i * 15) % 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function Overview() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ["admin-overview-stats"],
    queryFn: () => adminService.getOverviewStats(),
  });

  const [transactionsExpanded, setTransactionsExpanded] = useState(true);

  const profileCount = statsData?.profileCount ?? 0;
  const enrolledStudentsCount = statsData?.enrolledStudentsCount ?? 0;
  const totalRevenue = statsData?.totalRevenue ?? 0;
  const courseCount = statsData?.courseCount ?? 0;
  const recent = statsData?.recent ?? [];

  const formatRevenue = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${val.toLocaleString()}`;
  };

  const stats = [
    { label: "Total Students", value: isLoading ? "—" : profileCount.toString(), subtext: "Registered user accounts", icon: Users, href: "/admin/students" },
    { label: "Active Learners", value: isLoading ? "—" : enrolledStudentsCount.toString(), subtext: "Enrolled in courses", icon: GraduationCap, href: "/admin/students" },
    { label: "Total Revenue", value: isLoading ? "—" : formatRevenue(totalRevenue), subtext: "From completed orders", icon: IndianRupee, href: "/admin/payments" },
    { label: "Active Courses", value: isLoading ? "—" : courseCount.toString(), subtext: "Published in catalog", icon: BookOpen, href: "/admin/courses" },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Admin Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time platform metrics, course catalog health, and revenue analytics.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? [...Array(4)].map((_, i) => <StatSkeleton key={i} />)
          : stats.map((s) => (
              <Link key={s.label} to={s.href} className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:border-primary/40 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 transition group-hover:text-primary" />
                </div>
                <div className="mt-4 font-display text-2xl font-bold text-foreground">{s.value}</div>
                <div className="mt-0.5 text-xs font-semibold text-foreground">{s.label}</div>
                <div className="text-[11px] text-muted-foreground">{s.subtext}</div>
              </Link>
            ))}
      </div>

      {/* Quick Actions Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          to="/admin/courses"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:border-primary/40 hover:bg-muted/30"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Manage Courses</p>
            <p className="text-xs text-muted-foreground">Add or edit course content</p>
          </div>
          <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
        </Link>

        {/* Coupon Quick Link */}
        <Link
          to="/admin/coupons"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:border-primary/40 hover:bg-muted/30"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Coupons & Discounts</p>
            <p className="text-xs text-muted-foreground">Create or manage promo codes</p>
          </div>
          <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
        </Link>

        <Link
          to="/admin/students"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:border-primary/40 hover:bg-muted/30"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Manage Students</p>
            <p className="text-xs text-muted-foreground">Enrollments and user access</p>
          </div>
          <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
        </Link>
      </div>

      {/* Recent Transactions – collapsible */}
      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <button
          type="button"
          onClick={() => setTransactionsExpanded((v) => !v)}
          className="flex w-full items-center justify-between border-b border-border p-5 text-left transition hover:bg-muted/20"
        >
          <div>
            <h2 className="font-display text-lg font-bold">Recent Transactions</h2>
            <p className="text-xs text-muted-foreground">Latest purchases and enrollment activity</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/payments"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              View all <ChevronRight className="h-4 w-4" />
            </Link>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${transactionsExpanded ? "rotate-180" : ""}`}
            />
          </div>
        </button>

        {transactionsExpanded && (
          <div className="overflow-x-auto">
            {isLoading ? (
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    {["Order", "Student", "Course", "Date", "Status", "Amount"].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...Array(4)].map((_, i) => <TableRowSkeleton key={i} />)}
                </tbody>
              </table>
            ) : recent.length === 0 ? (
              <div className="text-center p-12 text-sm text-muted-foreground">
                <CreditCard className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="font-semibold text-foreground">No recent transactions</p>
                <p className="text-xs mt-1">Completed orders will appear here in real-time.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3.5 text-left">Order ID</th>
                    <th className="px-5 py-3.5 text-left">Student</th>
                    <th className="hidden px-5 py-3.5 text-left sm:table-cell">Course</th>
                    <th className="hidden px-5 py-3.5 text-left md:table-cell">Date</th>
                    <th className="px-5 py-3.5 text-left">Status</th>
                    <th className="px-5 py-3.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recent.map((r: any) => {
                    const date = r.created_at
                      ? new Date(r.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })
                      : "N/A";
                    return (
                      <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs uppercase font-bold text-foreground">
                          {r.orderId}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-foreground">{r.studentName}</td>
                        <td className="hidden px-5 py-3.5 text-muted-foreground sm:table-cell truncate max-w-[200px]">
                          {r.courseTitle}
                        </td>
                        <td className="hidden px-5 py-3.5 text-muted-foreground text-xs md:table-cell whitespace-nowrap">
                          {date}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                              r.status === "completed"
                                ? "bg-success/15 text-success"
                                : r.status === "pending"
                                ? "bg-amber-500/15 text-amber-600"
                                : "bg-destructive/15 text-destructive"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-display font-bold text-foreground whitespace-nowrap">
                          {r.currency || "₹"}{Number(r.amount).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

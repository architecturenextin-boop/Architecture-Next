import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen, CreditCard, IndianRupee, Users, Loader2, GraduationCap, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/lib/services/admin.service";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Overview — ArchitectureNext" }] }),
  component: Overview,
});

function Overview() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ["admin-overview-stats"],
    queryFn: async () => {
      return adminService.getOverviewStats();
    },
  });

  const profileCount = statsData?.profileCount ?? 0;
  const enrolledStudentsCount = statsData?.enrolledStudentsCount ?? 0;
  const paymentStats = {
    count: statsData?.totalPaymentsCount ?? 0,
    revenue: statsData?.totalRevenue ?? 0,
  };
  const courseCount = statsData?.courseCount ?? 0;
  const recent = statsData?.recent ?? [];

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Format revenue helper
  const formatRevenue = (val: number) => {
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)}L`;
    }
    return `₹${val.toLocaleString()}`;
  };

  const stats = [
    { label: "Total Students", value: profileCount.toString(), subtext: "Registered user accounts", icon: Users },
    { label: "Active Learners", value: enrolledStudentsCount.toString(), subtext: "Enrolled in courses", icon: GraduationCap },
    { label: "Total Revenue", value: formatRevenue(paymentStats.revenue), subtext: `${paymentStats.count} completed orders`, icon: IndianRupee },
    { label: "Active Courses", value: courseCount.toString(), subtext: "Catalog curriculum", icon: BookOpen },
  ];

  return (
    <div className="space-y-8">
      {/* Overview Header */}
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
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-start justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 font-display text-2xl font-bold text-foreground">{s.value}</div>
            <div className="mt-0.5 text-xs font-semibold text-foreground">{s.label}</div>
            <div className="text-[11px] text-muted-foreground">{s.subtext}</div>
          </div>
        ))}
      </div>

      {/* Recent Payments Section */}
      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="font-display text-lg font-bold">Recent Transactions</h2>
            <p className="text-xs text-muted-foreground">Latest purchases and order status</p>
          </div>
          <Link to="/admin/payments" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            View all payments <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          {recent.length === 0 ? (
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
                  const date = r.created_at ? new Date(r.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "N/A";
                  return (
                    <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs uppercase font-bold text-foreground">
                        {r.orderId}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-foreground">{r.studentName}</td>
                      <td className="hidden px-5 py-3.5 text-muted-foreground sm:table-cell truncate max-w-[200px]">{r.courseTitle}</td>
                      <td className="hidden px-5 py-3.5 text-muted-foreground text-xs md:table-cell whitespace-nowrap">{date}</td>
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
      </div>
    </div>
  );
}

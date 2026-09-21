import { createFileRoute } from "@tanstack/react-router";
import { Receipt, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/lib/services/dashboard.service";

export const Route = createFileRoute("/dashboard/purchases")({
  head: () => ({ meta: [{ title: "Purchase history — ArchitectureNext" }] }),
  component: PurchasesPage,
});

function PurchasesPage() {
  // Fetch purchases with nested course details
  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ["my-purchases"],
    queryFn: async () => {
      const data = await dashboardService.getMyPurchases();
      return data.map((p) => ({
        ...p,
        courses: { title: p.course_title },
        razorpay_order_id: p.gateway_order_id || p.id.substring(0, 8),
      }));
    },
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
      <h1 className="font-display text-2xl font-bold">Purchase history</h1>
      <p className="mt-1 text-sm text-muted-foreground">A record of all your enrollments.</p>
      <div className="mt-6">
        {purchases.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center rounded-2xl border border-border bg-card shadow-soft">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <Receipt className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">No purchases yet.</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards (< 640px) */}
            <div className="space-y-3 sm:hidden">
              {purchases.map((p) => {
                const courseTitle = (p.courses as any)?.title || "Course";
                const date = new Date(p.created_at).toLocaleDateString();
                return (
                  <article key={p.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider block">
                          Order #{p.razorpay_order_id || p.id.substring(0, 8)}
                        </span>
                        <h3 className="font-display font-bold text-sm text-foreground mt-0.5">{courseTitle}</h3>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase shrink-0 ${
                        p.status === "completed" 
                          ? "bg-success/15 text-success" 
                          : p.status === "pending" 
                          ? "bg-amber-100 text-amber-700" 
                          : "bg-destructive/15 text-destructive"
                      }`}>
                        {p.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
                      <span>{date}</span>
                      <span className="font-bold text-foreground text-sm">
                        {p.currency}{p.amount.toLocaleString()}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Desktop / Tablet Table (>= 640px) */}
            <div className="hidden sm:block overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Order</th>
                    <th className="px-4 py-3 text-left">Course</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {purchases.map((p) => {
                    const courseTitle = (p.courses as any)?.title || "Course";
                    const date = new Date(p.created_at).toLocaleDateString();
                    return (
                      <tr key={p.id}>
                        <td className="px-4 py-3 font-mono text-xs truncate max-w-[120px] uppercase">
                          {p.razorpay_order_id || p.id.substring(0, 8)}
                        </td>
                        <td className="px-4 py-3 font-medium">{courseTitle}</td>
                        <td className="px-4 py-3 text-muted-foreground">{date}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            p.status === "completed" 
                              ? "bg-success/15 text-success" 
                              : p.status === "pending" 
                              ? "bg-amber-100 text-amber-700" 
                              : "bg-destructive/15 text-destructive"
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {p.currency}{p.amount.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

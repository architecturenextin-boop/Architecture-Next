import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { paymentService } from "@/lib/services/payment.service";
import { z } from "zod";

export const Route = createFileRoute("/payment-success")({
  validateSearch: (search: Record<string, unknown>) => ({
    purchase_id: typeof search.purchase_id === "string" ? search.purchase_id : undefined,
  }),
  head: () => ({ meta: [{ title: "Payment successful — ArchitectureNext" }] }),
  component: Success,
});

function Success() {
  const search = Route.useSearch();
  const purchaseId = search.purchase_id;

  // Fetch payment and course details
  const { data: purchase, isLoading, error } = useQuery({
    queryKey: ["purchase-success", purchaseId],
    queryFn: async () => {
      if (!purchaseId) throw new Error("No purchase ID specified");
      const paymentData = await paymentService.getPaymentStatus(purchaseId);
      return {
        ...paymentData,
        status: (paymentData.status || "completed").toLowerCase(),
        razorpay_order_id: paymentData.gateway_order_id || "TEST-ORDER",
        razorpay_payment_id: paymentData.gateway_payment_id || "TEST-PAYMENT",
        courses: paymentData.course || { title: "Course Access" },
      };
    },
    enabled: !!purchaseId,
  });

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-hero p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !purchase || purchase.status !== "completed") {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-hero p-6">
        <div className="w-full max-w-md text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
          <h1 className="font-display text-2xl font-bold text-destructive">Invalid Purchase</h1>
          <p className="mt-2 text-muted-foreground">The transaction record is invalid, pending, or does not exist.</p>
          <Button asChild className="mt-6 bg-gradient-primary text-primary-foreground"><Link to="/dashboard">Go to Dashboard</Link></Button>
        </div>
      </div>
    );
  }

  // Course title
  const courseTitle = (purchase.courses as any)?.title || "Course";

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-hero p-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success shadow-glow">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold">Payment successful</h1>
        <p className="mt-2 text-muted-foreground">You're in! Your course is unlocked and ready to go.</p>
        <div className="mt-8 rounded-3xl border border-border bg-card p-6 text-left shadow-elevated">
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-muted-foreground font-semibold">Course</span>
            <span className="font-medium text-foreground line-clamp-1 max-w-[200px]">{courseTitle}</span>
          </div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Order ID</span>
            <span className="font-mono font-semibold text-xs text-foreground uppercase">{purchase.razorpay_order_id || "N/A"}</span>
          </div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Payment ID</span>
            <span className="font-mono text-xs text-muted-foreground">{purchase.razorpay_payment_id || "N/A"}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success capitalize">{purchase.status}</span>
          </div>
          <div className="mt-6 flex flex-col gap-2.5">
            <Button asChild size="lg" className="w-full bg-gradient-primary text-primary-foreground font-bold shadow-soft hover:brightness-110">
              <Link 
                to={purchase.course?.slug || purchase.course?.id ? "/learn/$courseId" : "/dashboard"}
                params={purchase.course?.slug || purchase.course?.id ? { courseId: purchase.course.slug || purchase.course.id } : undefined as any}
              >
                Start Learning Now <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/dashboard">Go to Student Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

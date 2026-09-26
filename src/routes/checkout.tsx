import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { ArrowLeft, CreditCard, Lock, Shield, Tag, AlertCircle, HelpCircle, CheckCircle2, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { useAuth } from "@/hooks/use-auth";
import { tokenStorage } from "@/lib/api-client";
import { courseService } from "@/lib/services/course.service";
import { couponService } from "@/lib/services/coupon.service";
import { useQuery } from "@tanstack/react-query";
import { createOrder, loadRazorpayCheckout, verifyPayment } from "@/lib/api/payment";
import type { Course } from "@/lib/database.types";
import { getMediaUrl } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>) => ({
    course: typeof search.course === "string" ? search.course : undefined,
  }),
  head: () => ({ meta: [{ title: "Checkout — ArchitectureNext" }] }),
  beforeLoad: async () => {
    const token = tokenStorage.get();
    if (!token) throw redirect({ to: "/auth" });
  },
  component: CheckoutPage,
});

function CheckoutPage() {
  const search = Route.useSearch();
  const courseId = search.course;
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Fetch course details
  const {
    data: course,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["checkout-course", courseId],
    queryFn: async () => {
      if (!courseId) throw new Error("No course specified");
      return (await courseService.getCourse(courseId)) as Course;
    },
    enabled: !!courseId,
  });

  // Form states
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  // Sync profile details once loaded
  useEffect(() => {
    if (profile) {
      setFirstName(profile.full_name || "");
      setPhone(profile.phone || "");
      setEmail(profile.email || "");
    }
  }, [profile]);

  // Coupon state
  const [showCouponToggle, setShowCouponToggle] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    finalAmount: number;
  } | null>(null);
  const [couponSuccess, setCouponSuccess] = useState("");
  const [couponError, setCouponError] = useState("");

  // Payment states
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // Handle Coupon Application via Server
  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCouponError("");
    setCouponSuccess("");
    if (!course) return;

    const cleaned = couponInput.trim().toUpperCase();
    if (!cleaned) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setCouponLoading(true);
    try {
      const res = await couponService.validateCoupon({
        code: cleaned,
        courseId: course.id,
      });

      if (res.valid) {
        setAppliedCoupon({
          code: res.coupon?.code || cleaned,
          discount: res.discountAmount,
          finalAmount: res.finalAmount,
        });
        setCouponSuccess(res.message || "Coupon applied successfully");
        toast.success(res.message || "Coupon applied successfully");
      }
    } catch (err: any) {
      const msg = err?.message || "Invalid coupon code";
      setCouponError(msg);
      toast.error(msg);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
    setCouponSuccess("");
  };

  // Loading and error states for course fetch
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-destructive">Checkout Error</h2>
        <p className="text-muted-foreground mt-2 text-center max-w-md">
          Could not retrieve course details or no course was selected.
        </p>
        <Button asChild className="mt-6 bg-gradient-primary text-primary-foreground">
          <Link to="/courses">Browse Courses</Link>
        </Button>
      </div>
    );
  }

  // Price calculations
  const originalSubtotal = course.price;
  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalTotal = appliedCoupon ? appliedCoupon.finalAmount : originalSubtotal;
  const estimatedTax = Math.round(finalTotal * 0.18);

  // Complete Payment submission
  const handleCompletePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setPaymentError("");

    try {
      const token = tokenStorage.get();
      if (!token) throw new Error("No active session found. Please sign in.");

      // 1. Create order on server (with server-validated coupon)
      const order = await createOrder({
        courseId: course.id,
        couponCode: appliedCoupon?.code,
      });

      // 2. ZERO PAYMENT FLOW (100% discount or free course)
      if (order.free || finalTotal === 0) {
        toast.success("Course enrolled successfully!");
        navigate({ to: "/payment-success", search: { purchase_id: order.paymentId } });
        return;
      }

      // 3. Ensure valid Razorpay key is present
      if (!order.keyId || order.keyId === "rzp_test_mock_key" || order.keyId.includes("mock")) {
        throw new Error(
          "Payment gateway key is not configured. Please ensure your Razorpay Key ID and Secret are configured on the backend server."
        );
      }

      // 4. Real Razorpay checkout
      const Razorpay = await loadRazorpayCheckout();
      const checkout = new Razorpay({
        key: order.keyId,
        amount: order.amount!,
        currency: order.currency || "INR",
        name: "ArchitectureNext",
        description: course.title,
        order_id: order.orderId!,
        prefill: {
          name: firstName || undefined,
          email,
          contact: phone ? (phone.trim().startsWith("+") ? `+${phone.replace(/\D/g, "")}` : `+91${phone.replace(/\D/g, "").slice(-10)}`) : undefined,
        },
        theme: { color: "#635bff" },
        modal: { ondismiss: () => setProcessing(false) },
        handler: async (response) => {
          try {
            const verifyResult = await verifyPayment({
              purchaseId: order.paymentId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            if (!verifyResult.success) throw new Error("Payment verification failed.");
            navigate({ to: "/payment-success", search: { purchase_id: order.paymentId } });
          } catch (verifyError: any) {
            setPaymentError(verifyError?.message || "Payment completed but verification failed. Please contact support.");
            setProcessing(false);
          }
        },
      });
      checkout.open();
    } catch (err: any) {
      console.error(err);
      setPaymentError(err.message || "Payment processing failed. Please try again.");
      setProcessing(false);
    }
  };


  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <SiteHeader
        action={
          <Link
            to="/courses"
            className="inline-flex min-h-[44px] items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Courses
          </Link>
        }
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-12">
        <div className="mb-4 sm:hidden">
          <Link
            to="/courses"
            className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground backdrop-blur transition-all hover:border-primary/50 hover:bg-card hover:text-primary group shadow-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Return to Courses</span>
          </Link>
        </div>

        {/* Main Grid: Left (Billing & Order Details) | Right (Summary & Payment) */}
        <form onSubmit={handleCompletePayment} className="grid gap-6 sm:gap-8 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
          {/* Left Column */}
          <div className="space-y-6 sm:space-y-8 min-w-0">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Checkout
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Enter your billing info to complete enrollment and access your course dashboard immediately.
              </p>
            </div>

            {/* Section 1: Billing Details */}
            <div className="rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 shadow-soft">
              <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground border-b border-border/60 pb-3 sm:pb-4">
                Billing details
              </h2>

              <div className="space-y-3.5 sm:space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    First name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your name"
                    className="h-11 sm:h-12 rounded-xl bg-background text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    Phone <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="h-11 sm:h-12 rounded-xl bg-background text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    Email address <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="h-11 sm:h-12 rounded-xl bg-background text-sm"
                    required
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Additional Information */}
            <div className="rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-6 md:p-8 space-y-3.5 sm:space-y-4 shadow-soft">
              <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground border-b border-border/60 pb-3 sm:pb-4">
                Additional information
              </h2>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Order notes (optional)
                </label>
                <textarea
                  rows={3}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Notes about your order, e.g. special requests or queries."
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs sm:text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Section 3: Order Details Card */}
            <div className="rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 shadow-soft">
              <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground border-b border-border/60 pb-3 sm:pb-4">
                Order Details
              </h2>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 rounded-2xl border border-border/70 bg-surface/50 p-3.5 sm:p-4">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <img
                    src={getMediaUrl(course.cover_url)}
                    alt={course.title}
                    className="h-14 w-20 sm:h-16 sm:w-24 rounded-xl object-cover border border-border/60 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-display text-sm sm:text-base font-bold text-foreground leading-snug line-clamp-2">
                      {course.title}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                      {course.level} · {course.total_duration}
                    </p>
                  </div>
                </div>
                <div className="font-display text-base sm:text-lg font-extrabold text-foreground shrink-0 self-end sm:self-center">
                  {course.currency}
                  {course.price.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Payment Box */}
          <div className="space-y-6 min-w-0">
            <div className="rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 shadow-elevated">
              <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-foreground border-b border-border/60 pb-3 sm:pb-4">
                Summary
              </h2>

              {/* Product Subtotal Table */}
              <div className="space-y-3 text-sm border-b border-border/60 pb-5">
                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Product</span>
                  <span>Subtotal</span>
                </div>
                <div className="flex justify-between items-start pt-2 gap-4">
                  <span className="text-foreground font-medium line-clamp-2">
                    {course.title} <strong className="text-xs font-bold text-primary">× 1</strong>
                  </span>
                  <span className="font-semibold text-foreground shrink-0">
                    {course.currency}
                    {course.price.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* ── Coupon Code Section ── */}
              <div className="border-b border-border/60 pb-5 space-y-3">
                {!appliedCoupon ? (
                  <>
                    {/* Toggle trigger */}
                    {!showCouponToggle && (
                      <button
                        type="button"
                        onClick={() => setShowCouponToggle(true)}
                        className="group inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Tag className="h-3.5 w-3.5" />
                        </span>
                        Have a coupon code?
                      </button>
                    )}

                    {showCouponToggle && (
                      <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5 text-primary" /> Coupon code
                        </label>
                        {/* Input row */}
                        <div className="relative flex items-center">
                          <Input
                            id="coupon-code-input"
                            value={couponInput}
                            onChange={(e) => {
                              setCouponInput(e.target.value.toUpperCase());
                              setCouponError("");
                            }}
                            placeholder="e.g. SAVE400"
                            className="h-12 rounded-xl bg-background pr-4 text-sm font-mono uppercase tracking-widest border-border focus:border-primary"
                            disabled={couponLoading}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { e.preventDefault(); handleApplyCoupon(); }
                            }}
                            autoFocus
                          />
                        </div>
                        {/* Error message */}
                        {couponError && (
                          <div className="flex items-start gap-2 rounded-lg bg-destructive/8 px-3 py-2 text-xs font-medium text-destructive">
                            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            <span>{couponError}</span>
                          </div>
                        )}
                        {/* Action buttons */}
                        <div className="flex gap-2 pt-0.5">
                          <Button
                            type="button"
                            onClick={() => handleApplyCoupon()}
                            disabled={couponLoading || !couponInput.trim()}
                            className="flex-1 h-11 bg-gradient-primary text-primary-foreground font-bold rounded-xl shadow-sm hover:brightness-110 transition-all"
                          >
                            {couponLoading ? (
                              <span className="flex items-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Applying…
                              </span>
                            ) : "Apply Coupon"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => { setShowCouponToggle(false); setCouponInput(""); setCouponError(""); }}
                            className="h-11 px-4 rounded-xl text-sm font-semibold"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* ── Applied State Banner ── */
                  <div className="rounded-2xl border border-primary/25 bg-primary/8 p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-foreground">Coupon applied: <span className="text-primary font-mono tracking-wide">{appliedCoupon.code}</span></p>
                          {couponSuccess && (
                            <p className="text-xs text-muted-foreground mt-0.5">{couponSuccess}</p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        aria-label="Remove coupon"
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground border border-border hover:border-destructive/50 hover:bg-destructive/8 hover:text-destructive transition-all"
                      >
                        <X className="h-3 w-3" /> Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Price Breakdown ── */}
              <div className="space-y-3 text-sm border-b border-border/60 pb-5">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Course price</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    ₹{originalSubtotal.toLocaleString()}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 font-semibold text-primary">
                      <Tag className="h-3.5 w-3.5" />
                      Coupon discount ({appliedCoupon.code})
                    </span>
                    <span className="font-bold text-primary tabular-nums">
                      −₹{appliedCoupon.discount.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Total Row */}
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="font-display text-lg font-bold text-foreground">Total</span>
                  {finalTotal > 0 && (
                    <span className="block text-[11px] text-muted-foreground">
                      (includes {course.currency}
                      {estimatedTax.toLocaleString()} Tax)
                    </span>
                  )}
                </div>
                <div className="font-display text-3xl font-extrabold text-primary">
                  {course.currency}
                  {finalTotal.toLocaleString()}
                </div>
              </div>

              {/* Payment Method Selector */}
              {finalTotal > 0 ? (
                <div className="rounded-2xl border border-border bg-surface/60 p-5 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span>Pay securely by Razorpay</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Pay securely by Credit/Debit card, Net Banking, UPI, or QR Code.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>100% Free Enrollment</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    No payment details required. Click below to enroll instantly.
                  </p>
                </div>
              )}

              {/* Privacy Policy terms */}
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Your personal data will be used to process your order, support your experience
                throughout this website, and for other purposes described in our privacy policy.
              </p>

              {paymentError && (
                <div className="rounded-lg bg-destructive/10 p-3 text-xs font-semibold text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Complete Payment CTA Button */}
              <Button
                type="submit"
                size="lg"
                disabled={processing}
                className="h-13 w-full bg-gradient-primary text-base font-bold text-primary-foreground shadow-glow transition-all hover:scale-[1.01] hover:brightness-110"
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {finalTotal === 0 ? "Enrolling..." : "Processing Payment..."}
                  </span>
                ) : finalTotal === 0 ? (
                  "Enroll for Free"
                ) : (
                  `Complete Payment (${course.currency}${finalTotal.toLocaleString()})`
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5 text-emerald-500" />
                <span>7-day money-back refund guarantee</span>
              </div>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}


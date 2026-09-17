import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { ArrowLeft, CreditCard, Lock, Shield, Tag, AlertCircle, HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { useAuth } from "@/hooks/use-auth";
import { tokenStorage } from "@/lib/api-client";
import { courseService } from "@/lib/services/course.service";
import { useQuery } from "@tanstack/react-query";
import { createOrder, loadRazorpayCheckout, verifyPayment } from "@/lib/api/payment";
import type { Course } from "@/lib/database.types";
import { getMediaUrl } from "@/lib/utils";

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

  // Toggle sections
  const [showCouponToggle, setShowCouponToggle] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState("");

  // Payment states
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // Handle Coupon Application
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    if (!course) return;
    const cleaned = couponInput.trim().toUpperCase();
    if (!cleaned) return;

    if (cleaned === "JULYOFF" || cleaned === "JULY2026") {
      setAppliedCoupon({ code: cleaned, discount: Math.round(course.price * 0.4) });
    } else if (cleaned === "LAUNCH50" || cleaned === "OFFER50") {
      setAppliedCoupon({ code: cleaned, discount: Math.round(course.price * 0.5) });
    } else if (cleaned === "WELCOME10") {
      setAppliedCoupon({ code: cleaned, discount: Math.round(course.price * 0.1) });
    } else {
      setCouponError("Invalid coupon code. Try 'JULYOFF' or 'LAUNCH50'.");
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
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
  const finalTotal = Math.max(0, originalSubtotal - discountAmount);
  const estimatedTax = Math.round(finalTotal * 0.18);

  // Complete Payment submission
  const handleCompletePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setPaymentError("");

    try {
      const token = tokenStorage.get();
      if (!token) throw new Error("No active session found. Please sign in.");

      // 1. Create order
      const order = await createOrder({
        courseId: course.id,
      });

      // 2. Check if fake payment simulation is explicitly enabled in .env
      const isFakePaymentEnabled = import.meta.env.VITE_FAKE_PAYMENT === "true";

      if (isFakePaymentEnabled) {
        setTimeout(async () => {
          try {
            const mockPaymentId = `pay_dev_${Date.now()}`;
            const verifyResult = await verifyPayment({
              purchaseId: order.paymentId,
              razorpayPaymentId: mockPaymentId,
              razorpaySignature: "mock_dev_signature",
            });
            if (!verifyResult.success) throw new Error("Payment verification failed.");
            navigate({ to: "/payment-success", search: { purchase_id: order.paymentId } });
          } catch (verifyError: any) {
            setPaymentError(verifyError?.message || "Payment verification failed.");
            setProcessing(false);
          }
        }, 1000);
        return;
      }

      // 3. If fake payment is NOT enabled, ensure valid Razorpay key is present
      if (!order.keyId || order.keyId === "rzp_test_mock_key" || order.keyId.includes("mock")) {
        throw new Error(
          "Payment gateway key is not configured. Please add your real Razorpay Key ID and Secret in backend/.env (or set VITE_FAKE_PAYMENT=true in .env to simulate test payments)."
        );
      }

      // 4. Real Razorpay production / test checkout
      const Razorpay = await loadRazorpayCheckout();
      const checkout = new Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "ArchitectureNext",
        description: course.title,
        order_id: order.orderId,
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
            className="hidden items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Courses
          </Link>
        }
      />

      <main className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-14">
        {/* Main Grid: Left (Billing & Order Details) | Right (Summary & Payment) */}
        <form onSubmit={handleCompletePayment} className="grid gap-10 lg:grid-cols-[1fr_420px]">
          {/* Left Column */}
          <div className="space-y-8">
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
                Checkout
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your billing info to complete enrollment and access your course dashboard
                immediately.
              </p>
            </div>

            {/* Section 1: Billing Details */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8 space-y-5">
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground border-b border-border/60 pb-4">
                Billing details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    First name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your name"
                    className="h-12 rounded-xl bg-background"
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
                    className="h-12 rounded-xl bg-background"
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
                    className="h-12 rounded-xl bg-background"
                    required
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Additional Information */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8 space-y-4">
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground border-b border-border/60 pb-4">
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
                  placeholder="Notes about your order, e.g. special requests or query for mentors."
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Section 3: Order Details Card */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8 space-y-5">
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground border-b border-border/60 pb-4">
                Order Details
              </h2>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-border/70 bg-surface/50 p-4">
                <div className="flex items-center gap-4">
                  <img
                    src={getMediaUrl(course.cover_url)}
                    alt={course.title}
                    className="h-16 w-24 rounded-xl object-cover border border-border/60 shrink-0"
                  />
                  <div>
                    <h4 className="font-display text-base font-bold text-foreground leading-snug line-clamp-2">
                      {course.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {course.level} · {course.total_duration}
                    </p>
                  </div>
                </div>
                <div className="font-display text-lg font-extrabold text-foreground shrink-0 sm:text-right">
                  {course.currency}
                  {course.price.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Payment Box */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-elevated md:p-8 space-y-6">
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground border-b border-border/60 pb-4">
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

              {/* Promo code toggle */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowCouponToggle(!showCouponToggle)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <Tag className="h-3 w-3" /> Have a coupon code?
                </button>
                {showCouponToggle && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value);
                        setCouponError("");
                      }}
                      placeholder="JULYOFF"
                      className="h-9 text-xs"
                    />
                    <Button
                      type="button"
                      onClick={handleApplyCoupon}
                      size="sm"
                      className="h-9 bg-primary text-primary-foreground"
                    >
                      Apply
                    </Button>
                  </div>
                )}
                {couponError && <p className="text-xs text-destructive">{couponError}</p>}
              </div>

              {/* Price Calculations */}
              <div className="space-y-2.5 text-sm border-b border-border/60 pb-5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold text-foreground">
                    {course.currency}
                    {originalSubtotal.toLocaleString()}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between items-center text-emerald-500 font-semibold">
                    <span className="flex items-center gap-1">
                      Coupon: {appliedCoupon.code}
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-[11px] text-muted-foreground underline ml-1 hover:text-foreground"
                      >
                        [Remove]
                      </button>
                    </span>
                    <span>
                      -{course.currency}
                      {appliedCoupon.discount.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Total Row */}
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="font-display text-lg font-bold text-foreground">Total</span>
                  <span className="block text-[11px] text-muted-foreground">
                    (includes {course.currency}
                    {estimatedTax.toLocaleString()} Tax)
                  </span>
                </div>
                <div className="font-display text-3xl font-extrabold text-primary">
                  {course.currency}
                  {finalTotal.toLocaleString()}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="rounded-2xl border border-border bg-surface/60 p-5 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span>Pay securely by Razorpay</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pay securely by Credit/Debit card, Net Banking, UPI, or QR Code.
                </p>
              </div>

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
                    Processing Payment...
                  </span>
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

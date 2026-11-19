import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Copy, ShieldCheck, Tag, X } from "lucide-react";
import type { Course } from "@/lib/database.types";
import type { CourseCouponProgress } from "@/lib/services/coupon.service";

/**
 * Coupon notification that only shows for courses that have an actual coupon.
 * Displays the real coupon code, accurate discount, expiry date, and a copy button.
 * Clicking Redeem navigates to checkout with the coupon pre-filled and auto-applied.
 * Dismissing hides it for the rest of the session (per course).
 */
export function CourseOfferNotification({
  course,
  coupon,
}: {
  course: Course;
  coupon: CourseCouponProgress;
}) {
  const c = coupon.coupon;
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | undefined>(undefined);
  const storageKey = `course-offer-dismissed:${course.slug || course.id}`;

  const expiresAt = c.expiresAt ? new Date(c.expiresAt) : null;
  const daysLeft = expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const dismiss = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(storageKey, "dismissed");
    } catch {
      /* storage blocked */
    }
  };

  useEffect(() => {
    // Respect admin toggle: if coupon notifications are disabled globally, do not show
    let notificationsEnabled = true;
    try {
      notificationsEnabled = localStorage.getItem("coupon-notifications-enabled") !== "false";
    } catch {
      notificationsEnabled = true;
    }
    if (!notificationsEnabled) return;

    if (!c.code || !c.isActive) return;
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(storageKey) === "dismissed";
    } catch {
      dismissed = false;
    }
    if (dismissed) return;

    const timer = window.setTimeout(() => setVisible(true), 1400);
    return () => window.clearTimeout(timer);
  }, [c.code, c.isActive, storageKey]);

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      dismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible]);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  if (!c.code || !visible) return null;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(c.code);
      setCopied(true);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const courseParam = course.slug || course.id;
  const discountLabel =
    c.discountType === "PERCENT"
      ? `${c.discountValue}% OFF`
      : c.discountType === "FLAT"
        ? `₹${c.discountValue.toLocaleString()} OFF`
        : "Special Offer";

  const description =
    c.discountType === "PERCENT"
      ? `You save ${c.discountValue}% off the regular fee — lock in today's price before it changes.`
      : c.discountType === "FLAT"
        ? `Get ₹${c.discountValue.toLocaleString()} off on this course — limited-time offer.`
        : `Special pricing on this course — limited-time offer.`;

  return (
    <div
      role="dialog"
      aria-label="Course offer"
      className="fixed inset-x-3 bottom-3 z-50 animate-fade-up sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[380px]"
    >
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-white shadow-xl">
        <div className="pointer-events-none absolute -right-4 -top-8 h-24 w-24 rounded-full bg-primary/15 blur-3xl" />

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss offer"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-5 pt-5">
          <div className="flex items-start gap-4">
            <div className="flex shrink-0 items-center justify-center h-12 w-12 rounded-full bg-primary/10 border border-primary/20">
              <Tag className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-end gap-2">
                <h3 className="text-lg font-extrabold tracking-tight text-foreground">
                  Coupon Available
                </h3>
                <span
                  className={`rounded-full text-xs font-bold px-3 py-1 ${
                    c.discountType === "PERCENT"
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {discountLabel}
                </span>
              </div>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">
                {course.title || "This Course"}
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 pt-3 pb-4">
          <p className="text-sm leading-relaxed text-foreground">
            {description}
          </p>
        </div>

        <div className="border-t border-border/50 mx-5" />

        <div className="px-5 pt-4 pb-3">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-destructive/60">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {daysLeft !== null ? `Ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}` : "No expiry"}
              </span>
            </div>
            <div className="h-3 w-px bg-border/50" />
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <span className="h-3 w-3 rounded-full border border-current" />
                <span>
                  {c.usageLimit && c.usageLimit > 0
                    ? `${c.usedCount} / ${c.usageLimit} used`
                    : "Unlimited uses"}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              <span className="font-semibold text-foreground">Verified Coupon</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyCode}
                className="h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-primary text-sm font-bold text-primary transition-all hover:bg-primary/5"
              >
                {copied ? (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy Code
                  </>
                )}
              </button>
              <Link
                to="/checkout"
                search={{ course: courseParam, coupon: c.code }}
                onClick={dismiss}
                className="h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-primary"
              >
                Redeem <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Copy, Sparkles, Tag, X } from "lucide-react";
import { brand } from "@/lib/brand";
import { setUnifiedWidgetActive } from "@/lib/floating-widget-state";
import type { Course } from "@/lib/database.types";
import type { CourseCouponProgress } from "@/lib/services/coupon.service";

/**
 * Course Offer & Support Widget:
 * - Mobile: Native bottom-to-top slide-up sheet with rounded top corners and pull handle.
 * - Desktop: Centered modal card styled to Reference Image 2.
 * - Corner FAB: A sleek, unified Speed-Dial Floating Action Button (1 single button by default).
 * - Clicking the single corner button expands into 2 options:
 *     1) 🎟️ Claim Course Offer (re-opens celebratory popup)
 *     2) 💬 WhatsApp Support (opens official chat with dynamic prefilled course context)
 */
export function CourseOfferNotification({
  course,
  coupon,
}: {
  course?: Course | null;
  coupon: CourseCouponProgress;
}) {
  const c = coupon?.coupon;
  const [isOpen, setIsOpen] = useState(() => {
    try {
      const code = coupon?.coupon?.code;
      if (code && sessionStorage.getItem(`coupon_dismissed_${code}`) === "true") {
        return false;
      }
    } catch {}
    return true;
  });
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | undefined>(undefined);

  // Notify standalone WhatsApp widget to suppress while unified speed-dial is active
  useEffect(() => {
    setUnifiedWidgetActive(true);
    return () => {
      setUnifiedWidgetActive(false);
    };
  }, []);

  // Minimize modal to floating pulsating button
  const handleCloseModal = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsOpen(false);
    try {
      if (c?.code) {
        sessionStorage.setItem(`coupon_dismissed_${c.code}`, "true");
      }
    } catch {}
  };

  // Re-open modal from floating button
  const handleOpenModal = () => {
    setIsSpeedDialOpen(false);
    setIsOpen(true);
  };

  // Keyboard navigation: Escape closes modal or speed dial
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isSpeedDialOpen) {
          setIsSpeedDialOpen(false);
        } else if (isOpen) {
          handleCloseModal();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isSpeedDialOpen]);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  // Do not render anything if coupon is invalid or inactive
  if (!c?.code || !c?.isActive) return null;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(c.code);
      setCopied(true);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const courseParam = course?.slug || course?.id || "";
  const discountLabel =
    c.discountType === "PERCENT"
      ? `${c.discountValue}% OFF`
      : c.discountType === "FLAT"
        ? `₹${c.discountValue.toLocaleString()} OFF`
        : "Special Offer";

  // Dynamic WhatsApp prefilled link with course context
  const courseTitle = course?.title || "";
  const prefilledMessage = courseTitle
    ? `Hi ArchitectureNext team! I have a question regarding the "${courseTitle}" course.`
    : "Hi ArchitectureNext team! I have a question about your courses.";
  const rawPhone = brand.contact.whatsapp || brand.contact.phone || "918891091894";
  const cleanPhone = rawPhone.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(prefilledMessage)}`;

  return (
    <>
      {/* 1. Celebratory Popup Modal (Centered on Mobile & Desktop, matching Reference Image 2) */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Course discount coupon offer"
          onClick={handleCloseModal}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-all duration-300 animate-in fade-in"
        >
          {/* Centered Modal Card */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-[340px] sm:max-w-[360px] overflow-hidden rounded-[28px] bg-white dark:bg-card border border-border/80 p-6 pt-5 pb-6 shadow-2xl text-center transition-all duration-300 animate-in zoom-in-95 duration-200"
          >
            {/* 'X' Close button in top right */}
            <button
              type="button"
              onClick={handleCloseModal}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCloseModal();
              }}
              aria-label="Close offer popup"
              title="Close offer"
              className="absolute top-3 right-3 z-30 grid h-9 w-9 sm:h-8 sm:w-8 place-items-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground active:scale-95 transition-all cursor-pointer shadow-xs border border-border/40"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {/* Celebratory Logo & Confetti Section */}
            <div className="relative mx-auto mt-1 mb-2 sm:mb-3 flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center w-28 h-24">
                {/* SVG Confetti Ribbons & Burst */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 120 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="20" cy="22" r="3" fill="#294398" opacity="0.8" />
                  <circle cx="98" cy="24" r="2.5" fill="#643A91" opacity="0.8" />
                  <circle cx="26" cy="70" r="2" fill="#F59E0B" />
                  <circle cx="95" cy="65" r="2.5" fill="#294398" opacity="0.7" />
                  <rect x="32" y="14" width="4" height="7" rx="1.5" transform="rotate(25 32 14)" fill="#F59E0B" />
                  <rect x="82" y="16" width="4" height="7" rx="1.5" transform="rotate(-30 82 16)" fill="#294398" />
                  <rect x="18" y="44" width="3.5" height="6" rx="1.5" transform="rotate(45 18 44)" fill="#643A91" />
                  <rect x="100" y="42" width="3.5" height="6" rx="1.5" transform="rotate(-40 100 42)" fill="#F59E0B" />
                  <path d="M50 10L52 15L57 16L53 19L54 24L50 21L46 24L47 19L43 16L48 15Z" fill="#F59E0B" opacity="0.9" />
                  <path d="M72 12L73.5 15.5L77 16L74.5 18.5L75 22L72 20L69 22L69.5 18.5L67 16L70.5 15.5Z" fill="#643A91" opacity="0.75" />
                </svg>

                {/* Brand Logo inside Celebratory Box */}
                <div className="relative z-10 flex h-18 w-18 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 via-surface to-accent/10 border-2 border-primary/25 shadow-md p-2">
                  <img
                    src={brand.logoUrl}
                    alt={brand.name}
                    className="h-full w-full object-contain drop-shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Congratulations Header */}
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Congratulations!
            </h3>

            {/* Discount subheadline */}
            <p className="mt-1 text-base sm:text-lg font-bold text-foreground">
              {discountLabel} on this course
            </p>

            {/* Dashed Coupon Code Box */}
            <div className="mt-4 sm:mt-5 flex items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-primary/45 bg-primary/5 py-3 px-4 transition-colors hover:bg-primary/10">
              <span className="font-mono text-base sm:text-lg font-extrabold tracking-wider text-primary select-all">
                {c.code}
              </span>
              <button
                type="button"
                onClick={copyCode}
                className="flex items-center gap-1 rounded-md text-primary hover:text-primary/70 transition-colors p-1 cursor-pointer"
                title="Copy code"
                aria-label="Copy coupon code"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600 stroke-[2.5]" />
                ) : (
                  <Copy className="h-4 w-4 stroke-[2]" />
                )}
              </button>
              {copied && (
                <span className="text-xs font-bold text-emerald-600 animate-in fade-in duration-150">
                  Copied!
                </span>
              )}
            </div>

            {/* Redeem Now Button */}
            <div className="mt-4 sm:mt-5">
              <Link
                to="/checkout"
                search={{ course: courseParam, coupon: c.code }}
                onClick={handleCloseModal}
                className="flex w-full items-center justify-center rounded-2xl bg-gradient-primary py-3.5 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:brightness-110 active:scale-[0.98]"
              >
                Redeem Now
              </Link>
            </div>

            {/* Mobile-Friendly Hide / Dismiss Option */}
            <button
              type="button"
              onClick={handleCloseModal}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCloseModal();
              }}
              className="mt-3.5 inline-block py-1.5 px-3 text-center text-xs font-semibold text-muted-foreground hover:text-foreground active:scale-95 transition-all cursor-pointer rounded-lg hover:bg-muted/40"
            >
              Maybe later, continue browsing
            </button>
          </div>
        </div>
      )}

      {/* 2. Unified Speed-Dial Floating Widget in Bottom-Right Corner (ONE icon by default) */}
      {!isOpen && (
        <>
          {/* Backdrop when Speed Dial is expanded (tap outside to close) */}
          {isSpeedDialOpen && (
            <div
              onClick={() => setIsSpeedDialOpen(false)}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
              aria-hidden="true"
            />
          )}

          <aside
            aria-label="Quick Actions: Course Offer and WhatsApp Chat"
            className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3"
          >
            {/* Speed Dial Menu Items (Slide Up when Clicked) */}
            {isSpeedDialOpen && (
              <div className="flex flex-col items-end gap-3 animate-in slide-in-from-bottom-3 fade-in duration-200">
                {/* Action 1: 🎟️ Course Discount Offer */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleOpenModal}
                    className="flex items-center gap-2 rounded-2xl border border-primary/25 bg-card/95 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-foreground shadow-elevated transition-all hover:scale-105 hover:border-primary cursor-pointer active:scale-95"
                  >
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-primary font-black">{discountLabel}</span>
                    <span className="text-muted-foreground font-semibold">• Claim Coupon</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenModal}
                    aria-label="Claim Course Discount Coupon"
                    title="Claim Course Discount Coupon"
                    className="group relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-gradient-to-tr from-[#294398] via-[#4E68B8] to-[#643A91] text-white shadow-md transition-all duration-300 hover:scale-110 hover:shadow-lg active:scale-95"
                  >
                    <Tag className="h-5 w-5 text-white transition-transform duration-300 group-hover:rotate-12" />
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black uppercase text-white shadow-xs border border-white">
                      OFF
                    </span>
                  </button>
                </div>

                {/* Action 2: 💬 WhatsApp Support */}
                <div className="flex items-center gap-3">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsSpeedDialOpen(false)}
                    className="flex items-center gap-2 rounded-2xl border border-emerald-500/25 bg-card/95 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-foreground shadow-elevated transition-all hover:scale-105 hover:border-emerald-500 cursor-pointer active:scale-95"
                  >
                    <span className="text-foreground font-bold">WhatsApp Support</span>
                    <span className="text-xs text-[#25D366] font-extrabold">● Online</span>
                  </a>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsSpeedDialOpen(false)}
                    aria-label="Chat with us on WhatsApp"
                    title="Chat with us on WhatsApp"
                    className="group relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#25D366] text-white shadow-md transition-all duration-300 hover:scale-110 hover:shadow-lg active:scale-95"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="26"
                      height="26"
                      fill="currentColor"
                      className="transition-transform duration-300 group-hover:scale-105"
                      aria-hidden="true"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    <span className="absolute top-0.5 right-0.5 flex h-3 w-3 items-center justify-center">
                      <span className="relative inline-flex h-2 w-2 rounded-full border border-white bg-emerald-400" />
                    </span>
                  </a>
                </div>
              </div>
            )}

            {/* Interactive Desktop Hover Tooltip (shown only when Speed Dial is closed) */}
            {!isSpeedDialOpen && (
              <div
                className={`pointer-events-none hidden sm:flex items-center gap-2 rounded-xl border border-primary/25 bg-card/95 px-3.5 py-2 text-xs font-bold text-foreground shadow-elevated backdrop-blur-md transition-all duration-200 absolute bottom-full mb-3 right-0 whitespace-nowrap ${
                  isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                }`}
              >
                <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-primary font-black">{discountLabel}</span>
                <span className="text-muted-foreground font-semibold">• Tap for Support & Offer</span>
              </div>
            )}

            {/* The ONE Single Primary Corner FAB */}
            <button
              type="button"
              onClick={() => setIsSpeedDialOpen(!isSpeedDialOpen)}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onFocus={() => setIsHovered(true)}
              onBlur={() => setIsHovered(false)}
              aria-label={isSpeedDialOpen ? "Close menu" : "Open Offers and Support menu"}
              title={isSpeedDialOpen ? "Close menu" : "Open Offers & Support"}
              className={`group relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full text-white shadow-[0_4px_22px_rgba(41,67,152,0.45)] transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 ${
                isSpeedDialOpen
                  ? "bg-slate-900 dark:bg-card text-foreground shadow-xl border border-border rotate-90"
                  : "bg-gradient-to-tr from-[#294398] via-[#4E68B8] to-[#643A91] animate-coupon-pulse"
              }`}
            >
              {isSpeedDialOpen ? (
                <X className="h-6 w-6 text-white dark:text-foreground transition-transform duration-300 -rotate-90" />
              ) : (
                <>
                  {/* Central Icon: Tag with Sparkles */}
                  <Tag className="h-6 w-6 text-white drop-shadow-xs transition-transform duration-300 group-hover:rotate-12" />

                  {/* Top-Right Badge: OFF Promo */}
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black uppercase text-white shadow-md border-2 border-white dark:border-card">
                    <Sparkles className="mr-0.5 h-2.5 w-2.5 fill-white" />
                    {c.discountType === "PERCENT" ? `${c.discountValue}%` : "OFF"}
                  </span>

                  {/* Bottom-Left Mini WhatsApp Support Indicator */}
                  <span
                    className="absolute -bottom-0.5 -left-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md border-2 border-white dark:border-card"
                    title="WhatsApp Support available"
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </span>
                </>
              )}
            </button>
          </aside>
        </>
      )}
    </>
  );
}

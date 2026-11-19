import type { Course } from "./database.types";

/**
 * Coupon codes created in Admin → Coupons, mapped to the course they belong to.
 * Key by course slug (preferred) or course id, lower-cased. A course that is not
 * listed here falls back to its plain limited-time price offer.
 */
const COURSE_COUPON_CODES: Record<string, string> = {
  // "autocadtoolsandtechnique": "AUTOCAD50",
};

export interface CourseOffer {
  /** Coupon code students can redeem at checkout, when one is configured. */
  code?: string;
  percentOff: number;
  currency: string;
  price: number;
  headline: string;
  detail: string;
}

type OfferCourse = Pick<Course, "slug" | "id" | "price" | "original_price" | "currency">;

export function getCourseOffer(course: OfferCourse | null | undefined): CourseOffer | null {
  if (!course) return null;

  const price = Number(course.price ?? 0);
  const originalPrice = Number(course.original_price ?? 0);
  if (!price || price <= 0) return null;

  const percentOff =
    originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  const code = (
    COURSE_COUPON_CODES[String(course.slug || course.id).toLowerCase()] || ""
  )
    .trim()
    .toUpperCase();

  if (!code && percentOff <= 0) return null;

  return {
    code: code || undefined,
    percentOff,
    currency: course.currency || "₹",
    price,
    headline: code ? "A coupon is available for this course" : "Limited-time price for this course",
    detail: code
      ? `Use ${code} at checkout to claim your discount on this course.`
      : `You save ${percentOff}% off the regular fee — lock in today's price before it changes.`,
  };
}

import { apiClient } from "../api-client";
import type { Coupon } from "../database.types";

export interface ValidateCouponResponse {
  valid: boolean;
  message: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  coupon?: Coupon;
}

export const couponService = {
  validateCoupon: async (payload: {
    code: string;
    courseId: string;
  }): Promise<ValidateCouponResponse> => {
    return apiClient<ValidateCouponResponse>("/coupons/validate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

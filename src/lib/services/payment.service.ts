import { apiClient } from "../api-client";

export interface CreateOrderResult {
  free?: boolean;
  paymentId: string;
  courseId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
}

export interface VerifyPaymentPayload {
  paymentId: string;
  purchaseId?: string;
  gatewayPaymentId?: string;
  razorpayPaymentId?: string;
  gatewaySignature?: string;
  razorpaySignature?: string;
}

export const paymentService = {
  createOrder: async (payload: { courseId: string; couponCode?: string } | string): Promise<CreateOrderResult> => {
    const body = typeof payload === "string" ? { courseId: payload } : payload;
    return apiClient<CreateOrderResult>("/payments/create-order", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },


  verifyPayment: async (payload: VerifyPaymentPayload): Promise<{ success: boolean; paymentId: string }> => {
    return apiClient<{ success: boolean; paymentId: string }>("/payments/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getPaymentStatus: async (paymentId: string): Promise<any> => {
    return apiClient(`/payments/${paymentId}`);
  },
};

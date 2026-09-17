import { apiClient } from "../api-client";

export interface CreateOrderResult {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
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
  createOrder: async (courseId: string): Promise<CreateOrderResult> => {
    return apiClient<CreateOrderResult>("/payments/create-order", {
      method: "POST",
      body: JSON.stringify({ courseId }),
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

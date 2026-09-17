import { paymentService } from "../services/payment.service";

export async function createOrder({ courseId }: { courseId: string }) {
  return paymentService.createOrder(courseId);
}

export async function verifyPayment(payload: {
  purchaseId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const res = await paymentService.verifyPayment({
    paymentId: payload.purchaseId,
    purchaseId: payload.purchaseId,
    razorpayPaymentId: payload.razorpayPaymentId,
    razorpaySignature: payload.razorpaySignature,
  });
  return { success: true, purchaseId: res.paymentId || payload.purchaseId };
}

type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color: string };
  modal?: { ondismiss: () => void };
  handler: (response: RazorpaySuccess) => void | Promise<void>;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

export async function loadRazorpayCheckout() {
  if (window.Razorpay) return window.Razorpay;
  const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout]');
  if (existing) {
    await new Promise<void>((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load Razorpay Checkout")), { once: true });
    });
  } else {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.dataset.razorpayCheckout = "true";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Could not load Razorpay Checkout"));
      document.head.appendChild(script);
    });
  }
  if (!window.Razorpay) throw new Error("Razorpay Checkout did not initialise");
  return window.Razorpay;
}

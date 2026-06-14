import crypto from "crypto";

const RAZORPAY_CONFIGURED = !!(
  process.env.RAZORPAY_KEY_ID &&
  process.env.RAZORPAY_KEY_SECRET &&
  !process.env.RAZORPAY_KEY_ID.startsWith("rzp_test_DEMO")
);

/** True when Razorpay keys are absent — lets dev flows skip real payments. */
export const DEV_PAYMENT_MODE = !RAZORPAY_CONFIGURED;

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

export async function createOrder(
  amount: number,
  currency: string = "INR",
  receipt: string
): Promise<RazorpayOrder> {
  if (DEV_PAYMENT_MODE) {
    return {
      id: `dev_order_${Date.now()}`,
      amount: Math.round(amount * 100),
      currency,
      receipt,
    };
  }

  const Razorpay = (await import("razorpay")).default;
  const client = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  return client.orders.create({
    amount: Math.round(amount * 100),
    currency,
    receipt,
  }) as unknown as RazorpayOrder;
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  // In dev mode, accept a special sentinel value without real verification
  if (DEV_PAYMENT_MODE && signature === "dev_signature") return true;

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  if (DEV_PAYMENT_MODE) return true;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");
  return expected === signature;
}

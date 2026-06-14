import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendOTPSMS(phone: string, otp: string): Promise<void> {
  await client.messages.create({
    body: `Your PlotBazaar OTP is: ${otp}. Valid for 10 minutes. Do not share this with anyone.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });
}

export async function sendFeedbackSMS(
  phone: string,
  buyerName: string,
  feedbackToken: string
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await client.messages.create({
    body: `PlotBazaar: Did ${buyerName} contact you genuinely? Respond here: ${baseUrl}/feedback/${feedbackToken}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });
}

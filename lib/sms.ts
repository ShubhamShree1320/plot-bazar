const SMS_CONFIGURED = !!(
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_PHONE_NUMBER &&
  !process.env.TWILIO_ACCOUNT_SID.startsWith("ACxxxxxxx")
);

async function getTwilioClient() {
  const twilio = (await import("twilio")).default;
  return twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
}

export async function sendOTPSMS(phone: string, otp: string): Promise<void> {
  if (!SMS_CONFIGURED) {
    console.log(`\n📱 [DEV] OTP for ${phone}: \x1b[1;33m${otp}\x1b[0m\n`);
    return;
  }
  const client = await getTwilioClient();
  await client.messages.create({
    body: `Your PlotBazaar OTP is: ${otp}. Valid for 10 minutes. Do not share this with anyone.`,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to: phone,
  });
}

export async function sendFeedbackSMS(
  phone: string,
  buyerName: string,
  feedbackToken: string
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = `${baseUrl}/feedback/${feedbackToken}`;

  if (!SMS_CONFIGURED) {
    console.log(`\n📱 [DEV] Feedback SMS for ${phone}: ${url}\n`);
    return;
  }
  const client = await getTwilioClient();
  await client.messages.create({
    body: `PlotBazaar: Did ${buyerName} contact you genuinely? Respond here: ${url}`,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to: phone,
  });
}

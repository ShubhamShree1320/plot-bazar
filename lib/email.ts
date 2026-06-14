import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.resend.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || "resend",
    pass: process.env.RESEND_API_KEY || process.env.SMTP_PASS,
  },
});

export async function sendOTPEmail(email: string, otp: string, name: string): Promise<void> {
  await transporter.sendMail({
    from: `"PlotBazaar" <${process.env.FROM_EMAIL || "noreply@plotbazaar.in"}>`,
    to: email,
    subject: "Your OTP for PlotBazaar",
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a5276, #2e86c1); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">PlotBazaar</h1>
            <p style="color: #aed6f1; margin: 5px 0 0;">Your Real Estate Marketplace</p>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #dee2e6;">
            <p style="color: #333; font-size: 16px;">Hi <strong>${name}</strong>,</p>
            <p style="color: #555;">Use the following OTP to verify your account. This code expires in 10 minutes.</p>
            <div style="background: white; border: 2px dashed #2e86c1; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a5276;">${otp}</span>
            </div>
            <p style="color: #888; font-size: 13px;">If you didn't request this OTP, please ignore this email.</p>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendFeedbackEmail(
  sellerEmail: string,
  sellerName: string,
  buyerName: string,
  plotTitle: string,
  feedbackToken: string
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const feedbackUrl = `${baseUrl}/feedback/${feedbackToken}`;

  await transporter.sendMail({
    from: `"PlotBazaar" <${process.env.FROM_EMAIL || "noreply@plotbazaar.in"}>`,
    to: sellerEmail,
    subject: `Feedback Request: Did ${buyerName} contact you genuinely?`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a5276, #2e86c1); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">PlotBazaar</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #dee2e6;">
            <p style="color: #333; font-size: 16px;">Hi <strong>${sellerName}</strong>,</p>
            <p style="color: #555;">
              <strong>${buyerName}</strong> recently paid to view your contact details for the plot
              "<strong>${plotTitle}</strong>".
            </p>
            <p style="color: #555;">We'd like to know if this buyer contacted you genuinely:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${feedbackUrl}?response=genuine"
                style="background: #27ae60; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 0 10px;">
                ✓ Yes, Genuine
              </a>
              <a href="${feedbackUrl}?response=not-genuine"
                style="background: #e74c3c; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 0 10px;">
                ✗ No, Not Genuine
              </a>
            </div>
            <p style="color: #888; font-size: 13px;">This link expires in 7 days.</p>
          </div>
        </body>
      </html>
    `,
  });
}

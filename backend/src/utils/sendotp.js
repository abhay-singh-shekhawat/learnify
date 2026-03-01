import { Resend } from 'resend';
import { generateOtp } from "./generateOtp.js";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOtp = async function (email) {
  try {
    const otp = generateOtp(6);

    const { data, error } = await resend.emails.send({
      from: 'LearnifyIT <onboarding@yourdomain.com>',
      to: [email],
      subject: 'Your Verification Code',
      html: `
        <div style="font-family: Arial; padding: 20px; text-align: center;">
          <h2>Welcome to Your App!</h2>
          <p>Your one-time password (OTP) is:</p>
          <h1 style="font-size: 40px; letter-spacing: 10px;">${otp}</h1>
          <p>This code expires in 10 minutes. Do not share it.</p>
          <p>If you didn't request this, ignore this email.</p>
        </div>
      `,
      text: `Your OTP is ${otp}. Expires in 10 minutes.`,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, otp: null };
    }

    console.log("OTP email sent via Resend:", data.id);

    return {
      success: true,
      otp: otp,
    };

  } catch (err) {
    console.error("Send OTP failed:", err.message);
    return { success: false, otp: null };
  }
};

export { sendOtp };
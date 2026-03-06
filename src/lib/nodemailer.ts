/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        type: "OAuth2",
        user: process.env.GOOGLE_USERNAME,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    },
});

interface SendMailProps {
  from?: string;
  subject: string;
  data?: Record<string, any>;
  email: string;
  html: string;
};
 
export async function sendEmail({
  from,
  email,
  subject,
  html
}: SendMailProps) {
 
  return transporter
    .sendMail({
      from: from || `<${process.env.EMAIL_FROM}>`,
      to: email,
      subject,
      html
    })
    .catch(() => {
      throw new Error("Failed to send email");
    });
}
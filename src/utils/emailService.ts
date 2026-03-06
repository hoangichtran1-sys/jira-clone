/* eslint-disable @typescript-eslint/no-explicit-any */

import { transporter } from "@/lib/nodemailer";

interface SendMailProps {
  from?: string;
  email: string;
  subject: string;
  data?: Record<string, any>;
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
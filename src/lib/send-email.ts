/* eslint-disable @typescript-eslint/no-explicit-any */

import { env } from "@/lib/env";
import { getTransporter } from "@/lib/nodemailer";
import { HTTPException } from "hono/http-exception";

interface SendMailProps {
    from?: string;
    email: string;
    subject: string;
    data?: Record<string, any>;
    html: string;
}

export async function sendEmail({ from, email, subject, html }: SendMailProps) {
    const transporter = getTransporter();

    return transporter
        .sendMail({
            from: from || `<${env.EMAIL_FROM}>`,
            to: email,
            subject,
            html,
        })
        .catch((error) => {
            console.log(error);
            throw new HTTPException(400, {
                message: "Failed to send email",
            });
        });
}

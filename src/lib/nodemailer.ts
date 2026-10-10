import nodemailer, { type Transporter } from "nodemailer";
import { env } from "./env";

let transporter: Transporter | null = null;

export function getTransporter() {
    if (transporter) return transporter;
    const host = env.MAIL_HOST;
    const port = env.MAIL_PORT;
    const user = env.MAIL_USERNAME;
    const pass = env.MAIL_PASSWORD;

    transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
    });
    return transporter;
}

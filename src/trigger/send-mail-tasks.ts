/* eslint-disable @typescript-eslint/no-unused-vars */
import { EmailJobData } from "@/types";
import { sendEmail } from "@/lib/send-email";
import { logger, task } from "@trigger.dev/sdk";

export const sendEmailInvitation = task({
    id: "send-email-invitation",
    maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
    run: async (payload: EmailJobData, { ctx }) => {
        const result = await sendEmail(payload);
        logger.info("Send email success");
        return {
            data: result,
        };
    },
});

export const sendEmailDeleteWorkspace = task({
    id: "send-email-delete-workspace",
    maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
    run: async (payload: EmailJobData, { ctx }) => {
        const result = await sendEmail(payload);
        logger.info("Send email success");
        return {
            data: result,
        };
    },
});

export const sendEmailDeleteMember = task({
    id: "send-email-delete-member",
    maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
    run: async (payload: EmailJobData, { ctx }) => {
        const result = await sendEmail(payload);
        logger.info("Send email success");
        return {
            data: result,
        };
    },
});

export const sendEmailVetification = task({
    id: "send-email-verification",
    maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
    run: async (payload: EmailJobData, { ctx }) => {
        const result = await sendEmail(payload);
        logger.info("Send email success");
        return {
            data: result,
        };
    },
});

export const sendEmailForgotPassword = task({
    id: "send-email-forgot-password",
    maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
    run: async (payload: EmailJobData, { ctx }) => {
        const result = await sendEmail(payload);
        logger.info("Send email success");
        return {
            data: result,
        };
    },
});

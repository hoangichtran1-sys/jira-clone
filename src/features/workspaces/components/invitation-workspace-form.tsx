"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { invitationSchema } from "../schemas";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { DottedSeparator } from "@/components/dotted-separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSendEmailInvitation } from "../api/use-send-email-invitation";

interface InvitationWorkspaceFormProps {
    onCancel?: () => void;
    link: string;
    workspaceId: string;
}

export const InvitationWorkspaceForm = ({
    onCancel,
    link,
    workspaceId,
}: InvitationWorkspaceFormProps) => {
    const title = "Invitation email join workspace ✔";

    const form = useForm<z.infer<typeof invitationSchema>>({
        resolver: zodResolver(invitationSchema),
        defaultValues: {
            emailTo: "",
        },
    });

    const sendEmail = useSendEmailInvitation();

    const handleSubmit = (values: z.infer<typeof invitationSchema>) => {
        sendEmail.mutate(
            {
                query: { workspaceId },
                json: {
                    title,
                    link,
                    emailTo: values.emailTo,
                },
            },
            {
                onSuccess: () => {
                    onCancel?.();
                },
            },
        );
    };

    return (
        <Card className="w-full h-full border-none shadow-none">
            <CardHeader className="flex p-7">
                <CardTitle className="text-xl font-bold">
                    <div className="flex items-center justify-center">
                        Invitation email to workspace
                    </div>
                </CardTitle>
            </CardHeader>
            <div className="px-7">
                <DottedSeparator />
            </div>
            <CardContent className="p-7">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)}>
                        <div className="flex flex-col gap-y-4">
                            <FormField
                                control={form.control}
                                name="emailTo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email member</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Enter email member"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DottedSeparator className="py-7" />
                        <div className="flex items-center justify-between">
                            <Button
                                type="button"
                                size="lg"
                                variant="secondary"
                                onClick={onCancel}
                                disabled={sendEmail.isPending}
                                className={cn(!onCancel && "invisible")}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="lg"
                                disabled={sendEmail.isPending}
                                variant="primary"
                            >
                                Send email with link
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

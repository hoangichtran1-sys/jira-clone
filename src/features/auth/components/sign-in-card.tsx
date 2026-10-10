"use client";

import { useAuth } from "@appwrite.io/react";
import { OAuthProvider } from "appwrite";
import { DottedSeparator } from "@/components/dotted-separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import {
    InputGroup,
    InputGroupInput,
    InputGroupAddon,
} from "@/components/ui/input-group";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { loginSchema } from "../schemas";
import { useRouter, useSearchParams } from "next/navigation";
import { safeRedirect } from "@/lib/utils";
import { toast } from "sonner";
import { LockIcon, MailIcon } from "lucide-react";

export const SignInCard = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const redirect = safeRedirect(searchParams.get("redirect"));

    const { signIn } = useAuth();

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const handleSubmit = (values: z.infer<typeof loginSchema>) => {
        signIn.emailPassword({
            email: values.email,
            password: values.password,
            onError(error) {
                console.log(error);
                toast.error(error.message);
            },
            onSuccess() {
                toast.success("Login successfully");
                router.push(redirect);
            },
        });
    };

    const handleSocial = (provider: keyof typeof OAuthProvider) => {
        signIn.oAuth({
            provider: provider.toLowerCase(),
            successUrl: `${process.env.NEXT_PUBLIC_APP_URL}${redirect}`,
            failureUrl: `${process.env.NEXT_PUBLIC_APP_URL}/sign-in`,
            onError(error) {
                console.log(error);
                toast.error(error.message);
            },
        });
    };

    return (
        <Card className="w-full h-full md:w-[487px] border-none shadow-none">
            <CardHeader className="flex items-center justify-center text-center p-7">
                <CardTitle className="text-2xl">Welcome back!</CardTitle>
            </CardHeader>
            <div className="px-7">
                <DottedSeparator />
            </div>
            <CardContent className="p-7">
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            name="email"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <InputGroup>
                                            <InputGroupInput
                                                {...field}
                                                type="email"
                                                placeholder="Enter email address"
                                            />
                                            <InputGroupAddon>
                                                <MailIcon />
                                            </InputGroupAddon>
                                        </InputGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            name="password"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <InputGroup>
                                            <InputGroupAddon>
                                                <InputGroupInput
                                                    {...field}
                                                    type="password"
                                                    placeholder="Enter password"
                                                />
                                                <LockIcon />
                                            </InputGroupAddon>
                                        </InputGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Link
                            tabIndex={-1}
                            href="/forgot-password"
                            className="ml-auto text-sm text-blue-500 dark:text-blue-400 underline-offset-4 hover:underline"
                        >
                            Forgot your password?
                        </Link>
                        <Button
                            disabled={signIn.isPending}
                            size="lg"
                            className="w-full"
                        >
                            Login
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <div className="px-7">
                <DottedSeparator />
            </div>
            <CardContent className="p-7 flex flex-col gap-y-4">
                <Button
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    disabled={signIn.isPending}
                    onClick={() => handleSocial("Google")}
                >
                    <FcGoogle className="mr-2 size-5" />
                    Login with Google
                </Button>
                <Button
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    disabled={signIn.isPending}
                    onClick={() => handleSocial("Github")}
                >
                    <FaGithub className="mr-2 size-5" />
                    Login with Github
                </Button>
            </CardContent>
            <div className="px-7">
                <DottedSeparator />
            </div>
            <CardContent className="p-7 flex items-center justify-center">
                <p>
                    Don&apos;t have an account?
                    <Link href="/sign-up">
                        <span className="text-blue-700">&nbsp;Sign Up</span>
                    </Link>
                </p>
            </CardContent>
        </Card>
    );
};

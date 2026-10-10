"use client";

import { DottedSeparator } from "@/components/dotted-separator";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
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
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "../schemas";
import { useRouter, useSearchParams } from "next/navigation";
import { safeRedirect } from "@/lib/utils";
import { OAuthProvider, useAuth } from "@appwrite.io/react";
import { toast } from "sonner";
import { LockIcon, MailIcon, UserIcon } from "lucide-react";

export const SignUpCard = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const redirect = safeRedirect(searchParams.get("redirect"));

    const { signUp, signIn } = useAuth();

    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    });

    const handleSubmit = (values: z.infer<typeof registerSchema>) => {
        signUp.emailPassword({
            email: values.email,
            password: values.password,
            name: values.name,
            onError(error) {
                console.log(error);
                toast.error(error.message);
            },
            onSuccess() {
                toast.success("Register successfully");
                router.push(redirect);
            },
        });
    };

    const handleSocial = (provider: keyof typeof OAuthProvider) => {
        signIn.oAuth({
            provider: provider.toLowerCase(),
            successUrl: `${process.env.NEXT_PUBLIC_APP_URL}${redirect}`,
            failureUrl: `${process.env.NEXT_PUBLIC_APP_URL}/sign-up`,
            onError(error) {
                console.log(error);
                toast.error(error.message);
            },
        });
    };

    return (
        <Card className="w-full h-full md:w-[487px] border-none shadow-none">
            <CardHeader className="flex items-center justify-center text-center p-7">
                <CardTitle className="text-2xl">Sign Up</CardTitle>
                <CardDescription>
                    By signing up, you agree to our{" "}
                    <Link href="/privacy">
                        <span className="text-blue-700">Privacy Policy</span>
                    </Link>{" "}
                    and{" "}
                    <Link href="/terms">
                        <span className="text-blue-700">Terms of Service</span>
                    </Link>
                </CardDescription>
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
                            name="name"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <InputGroup>
                                            <InputGroupInput
                                                {...field}
                                                type="text"
                                                placeholder="Enter your name"
                                            />
                                            <InputGroupAddon>
                                                <UserIcon />
                                            </InputGroupAddon>
                                        </InputGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
                        <Button
                            disabled={signUp.isPending}
                            size="lg"
                            className="w-full"
                        >
                            Register
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
                    disabled={signUp.isPending}
                    onClick={() => handleSocial("Google")}
                >
                    <FcGoogle className="mr-2 size-5" />
                    Login with Google
                </Button>
                <Button
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    disabled={signUp.isPending}
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
                    Already have an account?
                    <Link href="/sign-in">
                        <span className="text-blue-700">&nbsp;Sign In</span>
                    </Link>
                </p>
            </CardContent>
        </Card>
    );
};

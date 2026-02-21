"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRef } from "react";
import { createProjectFormSchema } from "../schemas";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useCreateProject } from "../api/use-create-project";
import { DottedSeparator } from "@/components/dotted-separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { MAX_FREE_PROJECT } from "@/constants";

interface CreateProjectFormProps {
    onCancel?: () => void;
    totalProject?: number;
    shouldBlock?: boolean;
}

export const CreateProjectForm = ({
    onCancel,
    totalProject,
    shouldBlock,
}: CreateProjectFormProps) => {
    const workspaceId = useWorkspaceId();
    const form = useForm<z.infer<typeof createProjectFormSchema>>({
        resolver: zodResolver(createProjectFormSchema),
        defaultValues: {
            name: "",
            image: "",
        },
    });

    const inputRef = useRef<HTMLInputElement>(null);

    const { mutate: create, isPending } = useCreateProject();

    const isNotCreate =
        !!totalProject && totalProject >= MAX_FREE_PROJECT && shouldBlock;

    const handleSubmit = (values: z.infer<typeof createProjectFormSchema>) => {
        const finalValues = {
            ...values,
            workspaceId,
            image: values.image instanceof File ? values.image : "",
        };
        create(
            { form: finalValues },
            {
                onSuccess: () => {
                    form.reset();
                    onCancel?.();
                },
            },
        );
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            form.setValue("image", file);
        }
    };

    return (
        <Card className="w-full h-full border-none shadow-none">
            <CardHeader className="flex p-7">
                <CardTitle className="text-xl font-bold">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <p>Create a new project</p>{" "}
                        {shouldBlock ? (
                            <p className="text-sm text-muted-foreground truncate">
                                Total project: {totalProject}/{MAX_FREE_PROJECT}
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground truncate">
                                Total project: {totalProject} (Unlimited)
                            </p>
                        )}
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
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Project name</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Enter project name"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="image"
                                render={({ field }) => (
                                    <div className="flex flex-col gap-y-2">
                                        <div className="flex items-center gap-x-5">
                                            {field.value ? (
                                                <div className="size-[72px] relative rounded-md overflow-hidden">
                                                    <Image
                                                        alt="Logo"
                                                        fill
                                                        className="object-cover"
                                                        src={
                                                            field.value instanceof
                                                            File
                                                                ? URL.createObjectURL(
                                                                      field.value,
                                                                  )
                                                                : field.value
                                                        }
                                                    />
                                                </div>
                                            ) : (
                                                <Avatar className="size-[72px]">
                                                    <AvatarFallback>
                                                        <ImageIcon className="size-[36px] text-neutral-400" />
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div className="flex flex-col">
                                                <p className="text-sm">
                                                    Project Icon
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    JPG, PNG, SVG or JPEG and
                                                    max 5MB
                                                </p>
                                                <input
                                                    className="hidden"
                                                    accept=".jpg, .png, .jpeg, .svg"
                                                    type="file"
                                                    ref={inputRef}
                                                    disabled={isPending}
                                                    onChange={handleImageChange}
                                                />
                                                {field.value ? (
                                                    <Button
                                                        type="button"
                                                        disabled={isPending}
                                                        variant="destructive"
                                                        size="xs"
                                                        className="w-fit mt-2"
                                                        onClick={() => {
                                                            field.onChange(
                                                                null,
                                                            );
                                                            if (
                                                                inputRef.current
                                                            ) {
                                                                inputRef.current.value =
                                                                    "";
                                                            }
                                                        }}
                                                    >
                                                        Remove Image
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        disabled={isPending}
                                                        variant="tertiary"
                                                        size="xs"
                                                        className="w-fit mt-2"
                                                        onClick={() =>
                                                            inputRef.current?.click()
                                                        }
                                                    >
                                                        Upload Image
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
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
                                disabled={isPending}
                                className={cn(!onCancel && "invisible")}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="lg"
                                disabled={isPending || isNotCreate}
                                variant="primary"
                            >
                                {isNotCreate ? "Upgrade Pro" : "Create Project"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

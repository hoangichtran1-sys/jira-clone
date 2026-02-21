"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { editTaskFormSchema } from "../schemas";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DottedSeparator } from "@/components/dotted-separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/date-picker";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { Task, TaskStatus } from "../types";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { useUpdateTask } from "../api/use-update-task";

interface EditTaskFormProps {
    onCancel?: () => void;
    projectOptions: { id: string; name: string; imageUrl: string }[];
    memberOptions: { id: string; name: string }[];
    initialValues: Task;
}

export const EditTaskForm = ({
    onCancel,
    projectOptions,
    memberOptions,
    initialValues,
}: EditTaskFormProps) => {
    const form = useForm<z.infer<typeof editTaskFormSchema>>({
        resolver: zodResolver(editTaskFormSchema),
        defaultValues: {
            ...initialValues,
            dueDate: initialValues.dueDate
                ? new Date(initialValues.dueDate)
                : undefined,
        },
    });

    const { mutate: update, isPending } = useUpdateTask();

    const handleSubmit = (values: z.infer<typeof editTaskFormSchema>) => {
        update(
            { json: values, param: { taskId: initialValues.$id } },
            {
                onSuccess: () => {
                    form.reset();
                    onCancel?.();
                },
            },
        );
    };

    return (
        <Card className="w-full h-full border-none shadow-none">
            <CardHeader className="flex p-7">
                <CardTitle className="text-xl font-bold">Edit a task</CardTitle>
            </CardHeader>
            <div className="px-7">
                <DottedSeparator />
            </div>
            <CardContent className="p-7">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Task name</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Enter task name"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="dueDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Due Date</FormLabel>
                                        <FormControl>
                                            <DatePicker {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="assigneeId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Assignee</FormLabel>
                                        <Select
                                            defaultValue={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select assignee" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <FormMessage />
                                            <SelectContent>
                                                {memberOptions.map((member) => (
                                                    <SelectItem
                                                        key={member.id}
                                                        value={member.id}
                                                    >
                                                        <div className="flex items-center gap-x-2">
                                                            <MemberAvatar
                                                                className="size-6"
                                                                name={
                                                                    member.name
                                                                }
                                                            />
                                                            {member.name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="projectId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Project</FormLabel>
                                        <Select
                                            defaultValue={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select project" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <FormMessage />
                                            <SelectContent>
                                                {projectOptions.map(
                                                    (project) => (
                                                        <SelectItem
                                                            key={project.id}
                                                            value={project.id}
                                                        >
                                                            <div className="flex items-center gap-x-2">
                                                                <ProjectAvatar
                                                                    className="size-6"
                                                                    name={
                                                                        project.name
                                                                    }
                                                                    image={
                                                                        project.imageUrl
                                                                    }
                                                                />
                                                                {project.name}
                                                            </div>
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select
                                            defaultValue={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <FormMessage />
                                            <SelectContent>
                                                <SelectItem
                                                    value={TaskStatus.BACKLOG}
                                                >
                                                    <span className="text-pink-500 hover:text-pink-600">
                                                        Backlog
                                                    </span>
                                                </SelectItem>
                                                <SelectItem
                                                    value={
                                                        TaskStatus.IN_PROGRESS
                                                    }
                                                >
                                                    <span className="text-yellow-500 hover:text-yellow-600">
                                                        In progress
                                                    </span>
                                                </SelectItem>
                                                <SelectItem
                                                    value={TaskStatus.IN_REVIEW}
                                                >
                                                    <span className="text-blue-500 hover:text-blue-600">
                                                        In review
                                                    </span>
                                                </SelectItem>
                                                <SelectItem
                                                    value={TaskStatus.TODO}
                                                >
                                                    <span className="text-red-500 hover:text-red-600">
                                                        Todo
                                                    </span>
                                                </SelectItem>
                                                <SelectItem
                                                    value={TaskStatus.DONE}
                                                >
                                                    <span className="text-green-500 hover:text-green-600">
                                                        Done
                                                    </span>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                            <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Task description(optional)
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    {...field}
                                                    rows={3}
                                                    value={field.value || ""}
                                                    placeholder="Enter task description"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
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
                                disabled={isPending || !form.formState.isDirty}
                                variant="primary"
                            >
                                Edit Task
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

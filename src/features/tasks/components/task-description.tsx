import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    InputGroup,
    InputGroupTextarea,
    InputGroupAddon,
    InputGroupText,
} from "@/components/ui/input-group";
import { DottedSeparator } from "@/components/dotted-separator";
import { PencilIcon, XIcon } from "lucide-react";
import { Task } from "../types";
import { useUpdateTask } from "../api/use-update-task";

interface TaskDescriptionProps {
    task: Task;
}

export const TaskDescription = ({ task }: TaskDescriptionProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(task.description);

    const updateTask = useUpdateTask();

    const handleSave = () => {
        updateTask.mutate(
            {
                json: { description: value },
                param: { taskId: task.$id },
            },
            {
                onSuccess: () => {
                    setIsEditing(false);
                },
            },
        );
    };

    return (
        <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">Task description</p>
                <Button
                    onClick={() => setIsEditing((prev) => !prev)}
                    size="sm"
                    variant="secondary"
                >
                    {isEditing ? (
                        <XIcon className="size-4" />
                    ) : (
                        <PencilIcon className="size-4" />
                    )}
                    {isEditing ? "Cancel" : "Edit"}
                </Button>
            </div>
            <DottedSeparator className="my-4" />
            {isEditing ? (
                <div className="flex flex-col gap-y-4">
                    <InputGroup>
                        <InputGroupTextarea
                            placeholder="Add description task..."
                            value={value}
                            rows={5}
                            onChange={(e) => setValue(e.target.value)}
                            disabled={updateTask.isPending}
                        />
                        <InputGroupAddon align="block-end">
                            <InputGroupText className="text-xs text-muted-foreground">
                                {500 - (value || "").trim().length} characters
                                left
                            </InputGroupText>
                        </InputGroupAddon>
                    </InputGroup>
                    <Button
                        size="sm"
                        className="w-fit ml-auto"
                        onClick={handleSave}
                        disabled={updateTask.isPending}
                    >
                        {updateTask.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            ) : (
                <div>
                    {task.description || (
                        <span className="text-muted-foreground">
                            No description set
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

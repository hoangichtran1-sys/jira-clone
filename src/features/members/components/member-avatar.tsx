import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getUserPhoto } from "@/lib/utils";

interface MemberAvatarProps {
    name: string;
    className?: string;
    fallbackClassName?: string;
    avatarUserId?: string;
}

export const MemberAvatar = ({
    name,
    className,
    fallbackClassName,
    avatarUserId,
}: MemberAvatarProps) => {
    return (
        <Avatar
            className={cn(
                "size-5 transition border border-neutral-300 rounded-full",
                className,
            )}
        >
            <AvatarImage
                src={getUserPhoto(avatarUserId) || undefined}
                alt={name}
            />
            <AvatarFallback
                className={cn(
                    "bg-neutral-200 font-medium text-neutral-500 flex items-center justify-center",
                    fallbackClassName,
                )}
            >
                {name.charAt(0).toUpperCase()}
            </AvatarFallback>
        </Avatar>
    );
};

"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { type DateRange } from "react-day-picker";

interface DatePickerRangeProps {
    value: DateRange | undefined;
    onDateChange: (dateRange: DateRange) => void;
    className?: string;
    placeholder?: string;
}

export const DatePickerRange = ({
    value,
    onDateChange,
    className,
    placeholder = "Pick a date",
}: DatePickerRangeProps) => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    size="lg"
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal px-3",
                        !value && "text-muted-foreground",
                        className,
                    )}
                >
                    <CalendarIcon className="h-4 w-4" />
                    {value?.from ? (
                        value.to ? (
                            <>
                                {format(value.from, "LLL dd, y")} -{" "}
                                {format(value.to, "LLL dd, y")}
                            </>
                        ) : (
                            format(value.from, "LLL dd, y")
                        )
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="range"
                    defaultMonth={value?.from}
                    selected={value}
                    onSelect={onDateChange}
                    numberOfMonths={2}
                    required
                />
            </PopoverContent>
        </Popover>
    );
};

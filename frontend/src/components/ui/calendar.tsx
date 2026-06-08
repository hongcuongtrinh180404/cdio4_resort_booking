"use client";

import * as React from "react";
import {
  DayPicker,
  UI,
  DayFlag,
  SelectionState,
} from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        [UI.Root]: "p-3",
        [UI.Chevron]: "fill-primary",
        [UI.Day]: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md",
          "relative text-center text-sm focus-within:relative focus-within:z-20",
          "[&:has([aria-selected])]:bg-primary/10"
        ),
        [UI.DayButton]: "h-9 w-9 p-0 font-normal",
        [UI.CaptionLabel]: "text-sm font-medium",
        [UI.MonthCaption]: "flex justify-center pt-1 relative items-center",
        [UI.Nav]: "space-x-1 flex items-center",
        [UI.PreviousMonthButton]: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1"
        ),
        [UI.NextMonthButton]: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1"
        ),
        [UI.Month]: "space-y-4",
        [UI.Months]: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        [UI.MonthGrid]: "w-full border-collapse space-y-1",
        [UI.Weekdays]: "flex",
        [UI.Weekday]: "text-on-surface-variant rounded-md w-9 font-normal text-[0.8rem]",
        [UI.Week]: "flex w-full mt-2",
        [SelectionState.selected]: "bg-primary text-on-primary hover:bg-primary hover:text-on-primary focus:bg-primary focus:text-on-primary rounded-md",
        [DayFlag.today]: "bg-accent text-accent-foreground",
        [DayFlag.outside]: "text-on-surface-variant opacity-50",
        [DayFlag.disabled]: "text-on-surface-variant opacity-30 line-through",
        [SelectionState.range_middle]: "bg-primary/10 text-on-surface",
        [DayFlag.hidden]: "invisible",
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };

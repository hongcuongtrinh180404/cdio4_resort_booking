"use client";

import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const MAX_ADULTS = 10;
const MAX_CHILDREN = 5;

interface GuestCounterProps {
  adults: number;
  children: number;
  onAdultsChange: (value: number) => void;
  onChildrenChange: (value: number) => void;
}

export function GuestCounter({ adults, children, onAdultsChange, onChildrenChange }: GuestCounterProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-outline bg-surface px-4 py-2.5 h-11">
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <Icon icon="material-symbols:group" className="text-on-surface-variant text-lg" />
        <span className="text-sm text-on-surface truncate">
          {adults} Người lớn{children > 0 && `, ${children} Trẻ em`}
        </span>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high">
            <Icon icon="lucide:plus" className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-on-surface">Người lớn</p>
                <p className="text-xs text-on-surface-variant">Từ 13 tuổi</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onAdultsChange(Math.max(1, adults - 1))}
                  disabled={adults <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-outline text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Icon icon="lucide:minus" className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-semibold tabular-nums">
                  {adults}
                </span>
                <button
                  type="button"
                  onClick={() => onAdultsChange(Math.min(MAX_ADULTS, adults + 1))}
                  disabled={adults >= MAX_ADULTS}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-outline text-primary hover:bg-primary/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Icon icon="lucide:plus" className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="h-px bg-outline" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-on-surface">Trẻ em</p>
                <p className="text-xs text-on-surface-variant">2–12 tuổi</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onChildrenChange(Math.max(0, children - 1))}
                  disabled={children <= 0}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-outline text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Icon icon="lucide:minus" className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-semibold tabular-nums">
                  {children}
                </span>
                <button
                  type="button"
                  onClick={() => onChildrenChange(Math.min(MAX_CHILDREN, children + 1))}
                  disabled={children >= MAX_CHILDREN}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-outline text-primary hover:bg-primary/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Icon icon="lucide:plus" className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

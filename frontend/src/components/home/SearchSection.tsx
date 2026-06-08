"use client";

import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, Minus, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const MAX_ADULTS = 10;
const MAX_CHILDREN = 5;

export function SearchSection() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [checkIn, setCheckIn] = useState<Date | undefined>(today);
  const [checkOut, setCheckOut] = useState<Date | undefined>(tomorrow);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  return (
    <section className="relative z-20 max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop -mt-20 md:-mt-28">
      <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-white/20 p-6 md:p-8 shadow-2xl">
        <form
          className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-5 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = "/rooms";
          }}
        >
          {/* Check-in */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Nhận phòng
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-11 border-outline hover:bg-surface-container-low",
                    !checkIn && "text-on-surface-variant"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  {checkIn ? (
                    format(checkIn, "dd/MM/yyyy", { locale: vi })
                  ) : (
                    <span>Chọn ngày</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkIn}
                  onSelect={(date) => {
                    setCheckIn(date);
                    if (date && checkOut && date >= checkOut) {
                      const next = new Date(date);
                      next.setDate(next.getDate() + 1);
                      setCheckOut(next);
                    }
                  }}
                  disabled={(date) =>
                    date < today
                  }
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Check-out */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Trả phòng
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-11 border-outline hover:bg-surface-container-low",
                    !checkOut && "text-on-surface-variant"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  {checkOut ? (
                    format(checkOut, "dd/MM/yyyy", { locale: vi })
                  ) : (
                    <span>Chọn ngày</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkOut}
                  onSelect={setCheckOut}
                  disabled={(date) =>
                    !checkIn || date <= checkIn || date < today
                  }
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Guests */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Số khách
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-outline bg-surface px-4 py-2.5 h-11">
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <span className="material-symbols-outlined text-on-surface-variant text-lg">group</span>
                <span className="text-sm text-on-surface truncate">
                  {adults} Người lớn{children > 0 && `, ${children} Trẻ em`}
                </span>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high">
                    <Plus className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4" align="end">
                  <div className="space-y-4">
                    {/* Adults */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-on-surface">Người lớn</p>
                        <p className="text-xs text-on-surface-variant">Từ 13 tuổi</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setAdults(Math.max(1, adults - 1))}
                          disabled={adults <= 1}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-outline text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold tabular-nums">
                          {adults}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAdults(Math.min(MAX_ADULTS, adults + 1))}
                          disabled={adults >= MAX_ADULTS}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-outline text-primary hover:bg-primary/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="h-px bg-outline" />
                    {/* Children */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-on-surface">Trẻ em</p>
                        <p className="text-xs text-on-surface-variant">2–12 tuổi</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setChildren(Math.max(0, children - 1))}
                          disabled={children <= 0}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-outline text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold tabular-nums">
                          {children}
                        </span>
                        <button
                          type="button"
                          onClick={() => setChildren(Math.min(MAX_CHILDREN, children + 1))}
                          disabled={children >= MAX_CHILDREN}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-outline text-primary hover:bg-primary/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            className="w-full h-11 gap-2 text-sm font-semibold shadow hover:shadow-md active:scale-[0.98] transition-all"
          >
            <Search className="h-4 w-4" />
            Tìm phòng
          </Button>
        </form>
      </div>
    </section>
  );
}

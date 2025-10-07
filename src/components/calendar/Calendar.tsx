"use client";

import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { DailyTotal } from "@/lib/types";
import { formatLocalYMD } from "@/lib/date";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CalendarProps {
  dailyTotals: DailyTotal[];
  onDateClick: (date: Date) => void;
  month: Date;
  formatCurrency: (amountInUsd: number) => string;
}

export default function Calendar({
  dailyTotals,
  onDateClick,
  month,
  formatCurrency,
}: CalendarProps) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const today = new Date();

  const getDailyTotal = (date: Date): DailyTotal | undefined => {
    const ymd = formatLocalYMD(date);
    return dailyTotals.find((total) => total.date === ymd);
  };

  const getPillClasses = (amount: number) => {
    if (amount > 0) {
      return "bg-[#17A2B8]/15 text-[#00c700]";
    }
    if (amount < 0) {
      return "bg-[#FF6B6B]/15 text-[#FF6B6B]";
    }
    return "bg-[#E2E8F0] text-[#1B2A38]/60";
  };

  const getLabel = (amount: number) => {
    if (amount > 0) return "Net gain";
    if (amount < 0) return "Net loss";
    return "No change";
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.35em] text-[#0B1B2B]/40 sm:gap-3">
        {WEEK_DAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 sm:gap-3 lg:gap-4">
        {calendarDays.map((day) => {
          const dailyTotal = getDailyTotal(day);
          const isCurrentMonth = isSameMonth(day, month);
          const isToday = isSameDay(day, today);
          const netAmount = dailyTotal?.net_total ?? 0;
          const transactions = dailyTotal?.transaction_count ?? 0;

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onDateClick(day)}
              className={`relative flex h-28 flex-col rounded-2xl border transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#17A2B8] focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:h-32 ${
                isCurrentMonth
                  ? "border-transparent bg-white/95 text-[#0B1B2B] shadow-sm hover:-translate-y-1.5 hover:shadow-xl"
                  : "border-dashed border-[#E2E8F0] bg-white/70 text-[#94A3B8]"
              } ${
                isToday
                  ? "ring-2 ring-[#17A2B8] ring-offset-2 ring-offset-white"
                  : ""
              }`}
              aria-label={`View transactions for ${format(
                day,
                "MMMM d, yyyy"
              )}`}
            >
              <span className="px-4 pt-4 text-sm font-semibold">
                {format(day, "d")}
              </span>

              <span
                className={`absolute right-3 top-3 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${getPillClasses(
                  netAmount
                )}`}
              >
                {formatCurrency(netAmount)}
              </span>

              <div className="mt-auto w-full px-4 pb-4 text-left">
                <p
                  className={`text-sm font-semibold ${
                    netAmount > 0
                      ? "text-[#00c700]"
                      : netAmount < 0
                      ? "text-[#FF6B6B]"
                      : "text-[#1B2A38]/60"
                  }`}
                >
                  {getLabel(netAmount)}
                </p>
                <p className="text-xs text-[#1B2A38]/50">
                  {transactions > 0
                    ? `${transactions} entr${transactions === 1 ? "y" : "ies"}`
                    : "No entries yet"}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

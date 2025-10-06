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
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DailyTotal } from "@/lib/types";
import { formatLocalYMD } from "@/lib/date";

interface CalendarProps {
  dailyTotals: DailyTotal[];
  onDateClick: (date: Date) => void;
  month: Date; // controlled month from parent
  onMonthChange: (date: Date) => void; // notify parent on prev/next
}

export default function Calendar({
  dailyTotals,
  onDateClick,
  month,
  onMonthChange,
}: CalendarProps) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getDailyTotal = (date: Date): DailyTotal | undefined => {
    const ymd = formatLocalYMD(date);
    return dailyTotals.find((total) => total.date === ymd);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getAmountColor = (amount: number) => {
    if (amount > 0) return "text-green-600";
    if (amount < 0) return "text-red-600";
    return "text-gray-500";
  };

  const nextMonth = () => onMonthChange(addMonths(month, 1));
  const prevMonth = () => onMonthChange(subMonths(month, 1));

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex items-center justify-between p-4 border-b">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded-md"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-semibold text-gray-900">
          {format(month, "MMMM yyyy")}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-md"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="bg-gray-50 py-2 px-3 text-center text-sm font-medium text-gray-700"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day) => {
          const dailyTotal = getDailyTotal(day);
          const isCurrentMonth = isSameMonth(day, month);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toString()}
              className={`bg-white min-h-[100px] p-2 cursor-pointer hover:bg-gray-50 ${
                !isCurrentMonth ? "text-gray-400" : ""
              } ${isToday ? "ring-2 ring-indigo-500" : ""}`}
              onClick={() => onDateClick(day)}
            >
              <div className="flex flex-col h-full">
                <div className="text-sm font-medium mb-1">
                  {format(day, "d")}
                </div>
                {dailyTotal && (
                  <div className="flex-1 flex flex-col justify-center">
                    <div
                      className={`text-xs font-medium ${getAmountColor(
                        dailyTotal.net_total
                      )}`}
                    >
                      {formatAmount(dailyTotal.net_total)}
                    </div>
                    {dailyTotal.transaction_count > 0 && (
                      <div className="text-xs text-gray-500">
                        {dailyTotal.transaction_count} transaction
                        {dailyTotal.transaction_count !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { MonthlySummary as MonthlySummaryType } from "@/lib/types";

interface MonthlySummaryProps {
  summary: MonthlySummaryType;
  formatCurrency: (amountInUsd: number) => string;
  currency: "USD" | "PHP";
}

export default function MonthlySummary({
  summary,
  formatCurrency,
  currency,
}: MonthlySummaryProps) {
  const [animatedProfit, setAnimatedProfit] = useState(summary.profit);
  const previousProfit = useRef(summary.profit);

  useEffect(() => {
    const startValue = previousProfit.current;
    const endValue = summary.profit;
    const duration = 600;
    let animationFrame: number;
    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = startValue + (endValue - startValue) * eased;
      setAnimatedProfit(nextValue);
      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      }
    };

    animationFrame = requestAnimationFrame(step);
    previousProfit.current = summary.profit;

    return () => cancelAnimationFrame(animationFrame);
  }, [summary.profit]);

  const summaryCards = [
    {
      label: "Total Income",
      icon: TrendingUp,
      value: summary.total_income,
      accentBorder: "border-[#17A2B8]/40",
      accentIcon: "text-[#17A2B8]",
      accentText: "text-[#0B1B2B]",
      badgeText: "+",
    },
    {
      label: "Total Expense",
      icon: TrendingDown,
      value: summary.total_expense,
      accentBorder: "border-[#FF6B6B]/40",
      accentIcon: "text-[#FF6B6B]",
      accentText: "text-[#0B1B2B]",
      badgeText: "-",
    },
  ];

  const profitPositive = summary.profit >= 0;
  const animatedDisplay = Number(animatedProfit.toFixed(2));

  return (
    <section className="rounded-3xl border border-[#E2E8F0] bg-white/90 p-6 shadow-[0_30px_60px_-45px_rgba(11,27,43,0.5)] backdrop-blur-xl lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#0B1B2B] sm:text-2xl">
            Monthly Summary
          </h2>
          <p className="mt-1 text-sm text-[#1B2A38]/60">
            Review aggregate performance for the selected month.
          </p>
        </div>
        <span className="rounded-full bg-[#0B1B2B]/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#0B1B2B]/60">
          {currency}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {summaryCards.map(
          ({
            label,
            icon: Icon,
            value,
            accentBorder,
            accentIcon,
            accentText,
            badgeText,
          }) => (
            <article
              key={label}
              className={`relative overflow-hidden rounded-3xl border ${accentBorder} bg-white/95 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#1B2A38]/45">
                    {label}
                  </p>
                  <p className={`mt-3 text-2xl font-semibold ${accentText}`}>
                    {formatCurrency(value)}
                  </p>
                </div>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B1B2B]/5 text-[#0B1B2B]">
                  <Icon className={`h-6 w-6 ${accentIcon}`} strokeWidth={2.5} />
                </span>
              </div>
              <div className="mt-4 inline-flex items-center rounded-full bg-[#F5F7FA] px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#1B2A38]/40">
                {badgeText} Snapshot
              </div>
            </article>
          )
        )}

        <article className="relative overflow-hidden rounded-3xl border border-[#0B1B2B]/5 bg-gradient-to-br from-[#0B1B2B] via-[#11263b] to-[#16344f] p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
                {profitPositive ? "Profit" : "Loss"}
              </p>
              <p className="mt-4 text-3xl font-semibold sm:text-4xl">
                {formatCurrency(animatedDisplay)}
              </p>
            </div>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <DollarSign className="h-6 w-6" strokeWidth={2.5} />
            </span>
          </div>
          <p className="mt-4 text-sm text-white/70">
            {profitPositive
              ? "Your earnings outpaced spending this month."
              : "Spending surpassed earnings — review expenses closely."}
          </p>
        </article>
      </div>

      <div className="mt-8 grid gap-4 rounded-3xl border border-[#E2E8F0] bg-white/80 p-5 text-sm text-[#1B2A38]/70 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#1B2A38]/40">
            Total Transactions
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#0B1B2B]">
            {summary.transaction_count}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#1B2A38]/40">
            Average Per Entry
          </p>
          <p className="mt-2 text-xl font-semibold text-[#0B1B2B]">
            {summary.transaction_count > 0
              ? formatCurrency(
                  (summary.total_income - summary.total_expense) /
                    summary.transaction_count
                )
              : formatCurrency(0)}
          </p>
        </div>
      </div>
    </section>
  );
}

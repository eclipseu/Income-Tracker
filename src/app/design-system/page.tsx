"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import MonthlySummary from "@/components/summary/MonthlySummary";
import Calendar from "@/components/calendar/Calendar";
import TransactionModal from "@/components/transactions/TransactionModal";
import { formatLocalYMD } from "@/lib/date";
import {
  DailyTotal,
  MonthlySummary as MonthlySummaryType,
  Transaction,
} from "@/lib/types";

const previewMonth = new Date(2025, 9, 1); // October 2025

const initialTransactions: Transaction[] = [
  {
    id: "t-1",
    user_id: "preview",
    date: "2025-10-02",
    type: "income",
    amount: 1800,
    note: "Consulting retainer",
    created_at: new Date("2025-10-02T09:15:00").toISOString(),
    updated_at: new Date("2025-10-02T09:15:00").toISOString(),
  },
  {
    id: "t-2",
    user_id: "preview",
    date: "2025-10-02",
    type: "expense",
    amount: 450,
    note: "Software licenses",
    created_at: new Date("2025-10-02T11:10:00").toISOString(),
    updated_at: new Date("2025-10-02T11:10:00").toISOString(),
  },
  {
    id: "t-3",
    user_id: "preview",
    date: "2025-10-06",
    type: "income",
    amount: 3200,
    note: "Paid invoice #1183",
    created_at: new Date("2025-10-06T08:45:00").toISOString(),
    updated_at: new Date("2025-10-06T08:45:00").toISOString(),
  },
  {
    id: "t-4",
    user_id: "preview",
    date: "2025-10-06",
    type: "expense",
    amount: 900,
    note: "Equipment upgrade",
    created_at: new Date("2025-10-06T14:05:00").toISOString(),
    updated_at: new Date("2025-10-06T14:05:00").toISOString(),
  },
  {
    id: "t-5",
    user_id: "preview",
    date: "2025-10-09",
    type: "income",
    amount: 2450,
    note: "Workshop fees",
    created_at: new Date("2025-10-09T12:00:00").toISOString(),
    updated_at: new Date("2025-10-09T12:00:00").toISOString(),
  },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(amount);

const convertToBaseCurrency = (amount: number) => amount;

const previewSizes = [
  { label: "Desktop", widthClass: "w-full max-w-5xl" },
  { label: "Tablet", widthClass: "w-[768px] max-w-full" },
  { label: "Mobile", widthClass: "w-[360px] max-w-full" },
];

const componentVariants = [
  {
    title: "Primary Button",
    className:
      "rounded-full bg-[#17A2B8] px-5 py-2 text-sm font-semibold text-white shadow-md",
  },
  {
    title: "Secondary Button",
    className:
      "rounded-full border border-[#E2E8F0] px-5 py-2 text-sm font-semibold text-[#0B1B2B]",
  },
  {
    title: "Danger Button",
    className:
      "rounded-full bg-[#FF6B6B] px-5 py-2 text-sm font-semibold text-white shadow-md",
  },
  {
    title: "Input Field",
    className:
      "w-full rounded-2xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm text-[#0B1B2B]",
  },
  {
    title: "Positive Badge",
    className:
      "inline-flex rounded-full bg-[#17A2B8]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#17A2B8]",
  },
  {
    title: "Negative Badge",
    className:
      "inline-flex rounded-full bg-[#FF6B6B]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#FF6B6B]",
  },
];

function deriveMonthlySummary(transactions: Transaction[]): MonthlySummaryType {
  const totals = transactions.reduce(
    (acc, transaction) => {
      if (transaction.type === "income") {
        acc.total_income += transaction.amount;
      } else {
        acc.total_expense += transaction.amount;
      }
      acc.transaction_count += 1;
      return acc;
    },
    {
      total_income: 0,
      total_expense: 0,
      profit: 0,
      transaction_count: 0,
    }
  );

  return {
    ...totals,
    profit: totals.total_income - totals.total_expense,
  };
}

function deriveDailyTotals(transactions: Transaction[]): DailyTotal[] {
  const lookup = new Map<string, DailyTotal>();

  for (const transaction of transactions) {
    const key = transaction.date;
    if (!lookup.has(key)) {
      lookup.set(key, {
        date: key,
        net_total: 0,
        income_total: 0,
        expense_total: 0,
        transaction_count: 0,
      });
    }

    const current = lookup.get(key)!;
    if (transaction.type === "income") {
      current.net_total += transaction.amount;
      current.income_total += transaction.amount;
    } else {
      current.net_total -= transaction.amount;
      current.expense_total += transaction.amount;
    }
    current.transaction_count += 1;
  }

  return Array.from(lookup.values());
}

export default function DesignSystemPage() {
  const [prototypeTransactions, setPrototypeTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [prototypeDate, setPrototypeDate] = useState<Date>(
    new Date("2025-10-06")
  );
  const [isPrototypeOpen, setIsPrototypeOpen] = useState(false);

  const monthKey = `${previewMonth.getFullYear()}-${previewMonth.getMonth()}`;

  const transactionsForMonth = useMemo(() => {
    return prototypeTransactions.filter((transaction) => {
      const date = new Date(transaction.date);
      return `${date.getFullYear()}-${date.getMonth()}` === monthKey;
    });
  }, [prototypeTransactions, monthKey]);

  const monthlySummary = useMemo(
    () => deriveMonthlySummary(transactionsForMonth),
    [transactionsForMonth]
  );

  const dailyTotals = useMemo(
    () => deriveDailyTotals(transactionsForMonth),
    [transactionsForMonth]
  );

  const transactionsForSelectedDate = useMemo(() => {
    const key = formatLocalYMD(prototypeDate);
    return prototypeTransactions.filter(
      (transaction) => transaction.date === key
    );
  }, [prototypeDate, prototypeTransactions]);

  const handlePrototypeAdd = async (
    transaction: Omit<
      Transaction,
      "id" | "user_id" | "created_at" | "updated_at"
    >
  ) => {
    const newEntry: Transaction = {
      id: crypto.randomUUID(),
      user_id: "preview",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...transaction,
    };

    setPrototypeTransactions((previous) => [...previous, newEntry]);
  };

  const handlePrototypeDelete = async (id: string) => {
    setPrototypeTransactions((previous) =>
      previous.filter((transaction) => transaction.id !== id)
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] px-6 py-12 text-[#1B2A38] sm:px-10 lg:px-16">
      <header className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#17A2B8]">
          Design Delivery
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[#0B1B2B] sm:text-4xl">
          IncomeTracker Product UI Kit
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-[#1B2A38]/70">
          A visual system outlining the refreshed dashboard experience. Explore
          responsive frames, base components, and an interactive preview of the
          add/delete entry flow. These mocks reflect the live implementation
          without introducing new business logic.
        </p>
      </header>

      <section className="mx-auto mt-12 max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#0B1B2B]">
            Responsive Frames
          </h2>
          <span className="text-xs uppercase tracking-[0.35em] text-[#1B2A38]/45">
            Desktop · Tablet · Mobile
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {previewSizes.map(({ label, widthClass }) => (
            <div key={label} className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#0B1B2B]">{label}</p>
                <span className="text-xs uppercase tracking-[0.3em] text-[#1B2A38]/45">
                  Preview
                </span>
              </div>
              <div
                className={`${widthClass} overflow-hidden rounded-[32px] border border-[#E2E8F0] bg-white shadow-[0_30px_60px_-45px_rgba(11,27,43,0.5)]`}
              >
                <div className="bg-[#0B1B2B] px-6 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold tracking-tight">
                      IncomeTracker
                    </p>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em]">
                      Live
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-white/70">
                    {format(previewMonth, "MMMM yyyy")} overview mockup.
                  </p>
                </div>
                <div className="flex flex-col gap-6 bg-[#F5F7FA] px-4 py-6">
                  <MonthlySummary
                    summary={monthlySummary}
                    formatCurrency={formatCurrency}
                    currency="PHP"
                  />
                  <div className="rounded-3xl border border-[#E2E8F0] bg-white/90 p-4">
                    <Calendar
                      dailyTotals={dailyTotals}
                      onDateClick={(date) => {
                        setPrototypeDate(date);
                        setIsPrototypeOpen(true);
                      }}
                      month={previewMonth}
                      formatCurrency={formatCurrency}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#0B1B2B]">
            Component Sheet
          </h2>
          <span className="text-xs uppercase tracking-[0.3em] text-[#1B2A38]/45">
            Buttons · Inputs · Badges
          </span>
        </div>
        <div className="mt-6 grid gap-6 rounded-3xl border border-[#E2E8F0] bg-white/95 p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
          {componentVariants.map(({ title, className }) => (
            <div key={title} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#1B2A38]/45">
                {title}
              </p>
              <div className="rounded-2xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-5">
                <span className={className}>Sample</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#0B1B2B]">
              Interaction Prototype · Add & Delete Entry
            </h2>
            <p className="mt-2 text-sm text-[#1B2A38]/70">
              Launches the live slide-over modal using mock data. No real
              Supabase mutations occur — this is a UI walkthrough only.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPrototypeOpen(true)}
            className="rounded-full bg-[#0B1B2B] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#11263b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#17A2B8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5F7FA]"
          >
            Play prototype
          </button>
        </div>

        <div className="mt-6 rounded-3xl border border-[#E2E8F0] bg-white/95 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#1B2A38]/45">
            Prototype Notes
          </p>
          <ul className="mt-3 space-y-2 text-sm text-[#1B2A38]/70">
            <li>• Add a mock entry to experience the success affordance.</li>
            <li>
              • Delete an item to preview the inline confirmation styling.
            </li>
            <li>
              • Interactions reset on page refresh — data stays in-memory for
              this preview only.
            </li>
          </ul>
        </div>
      </section>

      {isPrototypeOpen && (
        <TransactionModal
          isOpen={isPrototypeOpen}
          onClose={() => setIsPrototypeOpen(false)}
          selectedDate={prototypeDate}
          transactions={transactionsForSelectedDate}
          currency="PHP"
          formatCurrency={formatCurrency}
          convertToBaseCurrency={convertToBaseCurrency}
          onAddTransaction={handlePrototypeAdd}
          onDeleteTransaction={handlePrototypeDelete}
        />
      )}
    </div>
  );
}

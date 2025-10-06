"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { formatLocalYMD } from "@/lib/date";
import {
  Download,
  Menu,
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  FileDown,
  Settings,
  User2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Calendar from "@/components/calendar/Calendar";
import TransactionModal from "@/components/transactions/TransactionModal";
import MonthlySummary from "@/components/summary/MonthlySummary";
import AuthButton from "@/components/auth/AuthButton";
import {
  Transaction,
  DailyTotal,
  MonthlySummary as MonthlySummaryType,
} from "@/lib/types";

export default function Dashboard() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dailyTotals, setDailyTotals] = useState<DailyTotal[]>([]);
  const [monthlySummary, setMonthlySummary] =
    useState<MonthlySummaryType | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [currency, setCurrency] = useState<"USD" | "PHP">("USD");
  const [usdToPhpRate, setUsdToPhpRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const navigationItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "#", isActive: true },
    { label: "Calendar", icon: CalendarDays, href: "#calendar" },
    { label: "Reports", icon: BarChart3, href: "#reports" },
    { label: "Export", icon: FileDown, href: "#export" },
    { label: "Settings", icon: Settings, href: "#settings" },
  ];

  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => addMonths(prev, 1));
  };

  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const monthLabel = format(currentDate, "MMMM yyyy");

  // Check authentication
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/landing");
      } else {
        setUser(user);
      }
    };
    checkUser();
  }, [router, supabase.auth]);

  // Fetch exchange rate for USD to PHP once
  useEffect(() => {
    const fetchRate = async () => {
      setRateLoading(true);
      setRateError(null);
      try {
        const response = await fetch(
          "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json"
        );
        if (!response.ok) {
          throw new Error(`Rate request failed: ${response.status}`);
        }
        const data = await response.json();
        const usdRates = data?.usd;
        const phpRate = usdRates?.php;
        if (typeof phpRate !== "number") {
          throw new Error("USD to PHP rate unavailable");
        }
        setUsdToPhpRate(phpRate);
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
        setRateError(
          "Unable to load exchange rate. Amounts will remain in USD."
        );
        setCurrency("USD");
      } finally {
        setRateLoading(false);
      }
    };

    fetchRate();
  }, []);

  const formatCurrency = useMemo(() => {
    return (amountInUsd: number) => {
      const formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
      });
      if (currency === "PHP") {
        if (usdToPhpRate) {
          return formatter.format(amountInUsd * usdToPhpRate);
        }
        return formatter.format(amountInUsd);
      }
      return formatter.format(amountInUsd);
    };
  }, [currency, usdToPhpRate]);

  const convertToBaseCurrency = useMemo(() => {
    return (amount: number) => {
      if (currency === "PHP" && usdToPhpRate) {
        return amount / usdToPhpRate;
      }
      return amount;
    };
  }, [currency, usdToPhpRate]);

  // Fetch data for the current month
  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch transactions
      const transactionsResponse = await fetch(
        `/api/transactions?month=${currentMonth}&year=${currentYear}`
      );
      const { transactions: fetchedTransactions } =
        await transactionsResponse.json();
      setTransactions(fetchedTransactions || []);

      // Fetch daily totals
      const dailyTotalsResponse = await fetch(
        `/api/daily-totals?month=${currentMonth}&year=${currentYear}`
      );
      const { dailyTotals: fetchedDailyTotals } =
        await dailyTotalsResponse.json();
      setDailyTotals(fetchedDailyTotals || []);

      // Fetch monthly summary
      const summaryResponse = await fetch(
        `/api/summary?month=${currentMonth}&year=${currentYear}`
      );
      const { summary } = await summaryResponse.json();
      setMonthlySummary(summary);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [currentDate, user]);

  const handleDateClick = (date: Date) => {
    // If user clicks a day from an adjacent month, also set currentDate to that day to switch month
    if (
      date.getMonth() !== currentDate.getMonth() ||
      date.getFullYear() !== currentDate.getFullYear()
    ) {
      setCurrentDate(date);
    }
    setSelectedDate(date);
  };

  const handleAddTransaction = async (
    transactionData: Omit<
      Transaction,
      "id" | "user_id" | "created_at" | "updated_at"
    >
  ) => {
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionData),
      });

      if (response.ok) {
        // Refresh data
        await fetchData();
      } else {
        throw new Error("Failed to add transaction");
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      throw error;
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh data
        await fetchData();
      } else {
        throw new Error("Failed to delete transaction");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw error;
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(
        `/api/export?month=${currentMonth}&year=${currentYear}&currency=${currency}`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `income-tracker-${format(
          currentDate,
          "MMMM-yyyy"
        )}-${currency.toLowerCase()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error("Failed to export CSV");
      }
    } catch (error) {
      console.error("Error exporting CSV:", error);
    }
  };

  const getTransactionsForDate = (date: Date) => {
    const dateString = formatLocalYMD(date);
    return transactions.filter((t) => t.date === dateString);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1B2A38]">
      <header className="sticky top-0 z-50 bg-[#0B1B2B] text-white shadow-lg">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1B2B] focus-visible:ring-white lg:hidden"
              aria-label="Toggle navigation"
              aria-expanded={isSidebarOpen}
              onClick={() => setIsSidebarOpen((prev) => !prev)}
            >
              <Menu className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-semibold tracking-tight">
                  IncomeTracker
                </span>
                <span className="hidden rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.25em] text-white/80 sm:inline-flex">
                  Secure
                </span>
              </div>
              <p className="mt-1 text-sm text-white/70">
                Track your daily income and expenses with confidence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
                className="flex items-center gap-3 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1B2B]"
              >
                <span className="hidden text-right text-xs font-medium leading-tight text-white/70 sm:block">
                  {user?.email || "Authenticated"}
                </span>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#17A2B8]/20 text-white">
                  <User2 className="h-5 w-5" />
                </span>
              </button>
              {isUserMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border border-white/20 bg-white/95 text-[#0B1B2B] shadow-xl backdrop-blur-xl"
                >
                  <div className="px-4 py-3 text-sm">
                    <p className="font-semibold">Signed in</p>
                    <p className="truncate text-xs text-gray-500">
                      {user?.email || "Secure session"}
                    </p>
                  </div>
                  <div className="border-t border-[#E2E8F0]/60 bg-[#F8FAFC] px-4 py-3">
                    <AuthButton className="w-full rounded-full bg-[#FF6B6B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#ff5c5c] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B6B]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="relative flex min-h-[calc(100vh-72px)]">
        <div
          className={`fixed inset-0 z-40 bg-[#0B1B2B]/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
            isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          aria-hidden="true"
          onClick={() => setIsSidebarOpen(false)}
        />

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-white/10 bg-white/80 pb-8 pt-6 shadow-xl backdrop-blur-xl transition-transform duration-300 ease-out lg:static lg:z-auto lg:flex lg:w-72 lg:translate-x-0 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-label="Primary navigation"
        >
          <nav className="flex h-full w-full flex-col">
            <div className="px-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0B1B2B]/60">
                Overview
              </p>
              <ul className="mt-4 space-y-1">
                {navigationItems.map(
                  ({ label, icon: Icon, href, isActive }) => (
                    <li key={label}>
                      <a
                        href={href}
                        className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                          isActive
                            ? "bg-[#0B1B2B] text-white shadow-[0_10px_30px_-15px_rgba(11,27,43,0.6)]"
                            : "text-[#1B2A38]/70 hover:bg-white hover:text-[#0B1B2B]"
                        }`}
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20 text-[#17A2B8] transition group-hover:bg-[#17A2B8]/10 group-hover:text-[#17A2B8]">
                          <Icon className="h-4 w-4" strokeWidth={2.5} />
                        </span>
                        {label}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div className="mt-auto px-6 pt-8 text-xs text-[#1B2A38]/60">
              <p className="font-medium">Need help?</p>
              <p className="mt-1 leading-relaxed">
                Visit the reports section to understand your monthly cash flow
                patterns.
              </p>
            </div>
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 py-10 sm:px-6 lg:px-12">
            <section className="rounded-3xl border border-[#E2E8F0] bg-white/80 p-6 shadow-[0_30px_60px_-40px_rgba(11,27,43,0.55)] backdrop-blur-xl lg:p-8">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#17A2B8]">
                    Current Month
                  </p>
                  <div className="mt-3 flex flex-wrap items-baseline gap-3">
                    <h1 className="text-3xl font-semibold text-[#0B1B2B] sm:text-4xl">
                      {monthLabel}
                    </h1>
                    <span className="rounded-full bg-[#0B1B2B]/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-[#0B1B2B]/70">
                      Live
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#1B2A38]/60">
                    All records sync instantly to Supabase — adjust the month to
                    review historical performance.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 lg:gap-4">
                  <div className="flex items-center rounded-full border border-[#E2E8F0] bg-white/70 shadow-sm">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#0B1B2B] transition hover:text-[#17A2B8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#17A2B8] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
                    </button>
                    <span className="px-4 text-sm font-semibold text-[#0B1B2B]">
                      {monthLabel}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#0B1B2B] transition hover:text-[#17A2B8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#17A2B8] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      aria-label="Next month"
                    >
                      <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white/70 px-3 py-1.5 text-sm font-medium shadow-sm">
                    <span className="text-xs uppercase tracking-[0.25em] text-[#1B2A38]/60">
                      Currency
                    </span>
                    <select
                      id="currency-select"
                      value={currency}
                      onChange={(event) => {
                        const value = event.target.value as "USD" | "PHP";
                        if (value === "PHP" && !usdToPhpRate) {
                          setRateError(
                            "Exchange rate not loaded. Staying in USD."
                          );
                          setCurrency("USD");
                          return;
                        }
                        setCurrency(value);
                      }}
                      className="appearance-none rounded-full bg-transparent px-2 py-1 text-sm font-semibold text-[#0B1B2B] focus:outline-none"
                      disabled={rateLoading}
                      aria-label="Select currency"
                    >
                      <option value="USD">USD</option>
                      <option value="PHP">PHP</option>
                    </select>
                    {rateLoading && (
                      <span className="text-xs text-[#1B2A38]/40">
                        Loading…
                      </span>
                    )}
                  </div>
                  <div className="relative group">
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="inline-flex items-center gap-2 rounded-full bg-[#0B1B2B] px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-[#11263b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#17A2B8] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      aria-describedby="export-tooltip"
                    >
                      <Download className="h-4 w-4" strokeWidth={2.5} />
                      Export {currency} CSV
                    </button>
                    <span
                      id="export-tooltip"
                      role="tooltip"
                      className="pointer-events-none absolute -bottom-12 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0B1B2B] px-3 py-2 text-xs font-medium text-white shadow-lg transition group-hover:block"
                    >
                      Download CSV of current month
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {rateError && (
              <div className="mt-6 rounded-2xl border border-[#FF6B6B]/40 bg-[#FF6B6B]/10 px-6 py-4 text-sm text-[#aa3030] shadow-sm">
                {rateError}
              </div>
            )}

            <div className="mt-10 space-y-10">
              {monthlySummary && (
                <MonthlySummary
                  summary={monthlySummary}
                  formatCurrency={formatCurrency}
                  currency={currency}
                />
              )}

              <section
                id="calendar"
                className="rounded-3xl border border-[#E2E8F0] bg-white/90 p-4 shadow-[0_30px_60px_-45px_rgba(11,27,43,0.5)] sm:p-6"
              >
                <Calendar
                  dailyTotals={dailyTotals}
                  onDateClick={handleDateClick}
                  month={currentDate}
                  formatCurrency={formatCurrency}
                />
              </section>
            </div>
          </div>
        </main>
      </div>

      {selectedDate && (
        <TransactionModal
          isOpen={!!selectedDate}
          onClose={() => setSelectedDate(null)}
          selectedDate={selectedDate}
          transactions={getTransactionsForDate(selectedDate)}
          currency={currency}
          formatCurrency={formatCurrency}
          convertToBaseCurrency={convertToBaseCurrency}
          onAddTransaction={handleAddTransaction}
          onDeleteTransaction={handleDeleteTransaction}
        />
      )}
    </div>
  );
}

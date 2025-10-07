"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { format, addMonths, subMonths } from "date-fns";
import { formatLocalYMD } from "@/lib/date";
import {
  Download,
  Menu,
  LayoutDashboard,
  CalendarDays,
  UserSquare2,
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
import type { User } from "@supabase/supabase-js";

export default function Dashboard() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dailyTotals, setDailyTotals] = useState<DailyTotal[]>([]);
  const [monthlySummary, setMonthlySummary] =
    useState<MonthlySummaryType | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [currency, setCurrency] = useState<"USD" | "PHP">("USD");
  const [usdToPhpRate, setUsdToPhpRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const navigationItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      isActive: true,
    },
    {
      label: "Calendar",
      icon: CalendarDays,
      href: "#calendar",
      isActive: false,
    },
    {
      label: "Inventory",
      icon: UserSquare2,
      href: "/dashboard/inventory",
      isActive: false,
    },
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
      setBootstrapping(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setBootstrapping(false);
        router.replace("/login");
        return;
      }
      setUser(user);
      setBootstrapping(false);
    };
    checkUser();
  }, [router, supabase]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        setBootstrapping(false);
        return;
      }

      if (event === "SIGNED_OUT" || !session?.user) {
        setUser(null);
        setTransactions([]);
        setDailyTotals([]);
        setMonthlySummary(null);
        setSelectedDate(null);
        setIsSidebarOpen(false);
        setIsUserMenuOpen(false);
        setLoading(false);
        setBootstrapping(false);
        router.replace("/login");
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

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
  const fetchData = useCallback(async () => {
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
  }, [currentMonth, currentYear, user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [fetchData, user]);

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

  if (bootstrapping) {
    return <LoadingScreen message="Getting your secure session ready…" />;
  }

  if (!user) {
    return null;
  }

  if (loading) {
    return <LoadingScreen message="Balancing your latest money moves…" />;
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
                  BrokeNoMo
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
                  ({ label, icon: Icon, href, isActive }) => {
                    const sharedClasses = `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-[#0B1B2B] text-white shadow-[0_10px_30px_-15px_rgba(11,27,43,0.6)]"
                        : "text-[#1B2A38]/70 hover:bg-white hover:text-[#0B1B2B]"
                    }`;

                    const content = (
                      <>
                        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20 text-[#17A2B8] transition group-hover:bg-[#17A2B8]/10 group-hover:text-[#17A2B8]">
                          <Icon className="h-4 w-4" strokeWidth={2.5} />
                        </span>
                        {label}
                      </>
                    );

                    return (
                      <li key={label}>
                        {href.startsWith("#") ? (
                          <a href={href} className={sharedClasses}>
                            {content}
                          </a>
                        ) : (
                          <Link href={href} className={sharedClasses}>
                            {content}
                          </Link>
                        )}
                      </li>
                    );
                  }
                )}
              </ul>
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

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-white via-[#F5FFF7] to-[#E8FDF4] px-6 py-16 text-[#163D2C]">
      <div className="pointer-events-none absolute inset-0">
        <span className="bnm-floating-coin coin-one" />
        <span className="bnm-floating-coin coin-two" />
        <span className="bnm-floating-coin coin-three" />
        <span className="bnm-floating-bill bill-one" />
        <span className="bnm-floating-bill bill-two" />
      </div>

      <div className="relative flex w-full max-w-md flex-col items-center gap-8 rounded-[36px] border border-white/60 bg-white/80 p-10 text-center shadow-[0_35px_120px_-40px_rgba(22,61,44,0.45)] backdrop-blur-2xl">
        <div className="relative flex h-48 w-48 items-center justify-center">
          <div className="absolute -inset-6 rounded-full bg-gradient-to-br from-[#DFF9E7] via-transparent to-transparent blur-3xl" />
          <PiggyAnimation />
          <span className="bnm-pig-sparkle" />
          <span className="bnm-pig-sparkle delay" />
        </div>
        <div className="space-y-2">
          <p className="text-3xl font-black tracking-tight text-[#163D2C] sm:text-4xl">
            BrokeNoMo
          </p>
          <p className="text-sm text-[#1B2A38]/70 sm:text-base">{message}</p>
        </div>
        <div className="relative h-3 w-full max-w-xs overflow-hidden rounded-full bg-[#E9F7EE]">
          <span className="bnm-progress" />
        </div>
      </div>

      <style jsx>{`
        @keyframes bnmCoinDrop {
          0% {
            transform: translate(-50%, -160%) scale(0.8) rotate(-12deg);
            opacity: 0;
          }
          25% {
            opacity: 1;
          }
          55% {
            transform: translate(-50%, -10%) scale(1) rotate(4deg);
          }
          70% {
            transform: translate(-50%, 10%) scale(1) rotate(-2deg);
          }
          100% {
            transform: translate(-50%, -160%) scale(0.8) rotate(-12deg);
            opacity: 0;
          }
        }

        @keyframes bnmFloat {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-16px) rotate(6deg);
          }
        }

        @keyframes bnmDrift {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(-4deg);
          }
          50% {
            transform: translate3d(12px, -14px, 0) rotate(4deg);
          }
        }

        @keyframes bnmSparkle {
          0% {
            opacity: 0;
            transform: scale(0.4) translate(-50%, -50%);
          }
          50% {
            opacity: 0.9;
            transform: scale(1) translate(-50%, -50%);
          }
          100% {
            opacity: 0;
            transform: scale(0.2) translate(-50%, -50%);
          }
        }

        @keyframes bnmProgress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .bnm-floating-coin {
          position: absolute;
          display: block;
          width: 74px;
          height: 74px;
          border-radius: 999px;
          background: radial-gradient(
            circle at 30% 30%,
            #ffeeb3 0%,
            #f3c744 45%,
            #b98909 100%
          );
          opacity: 0.65;
          filter: drop-shadow(0 12px 24px rgba(185, 137, 9, 0.25));
          animation: bnmFloat 6s ease-in-out infinite;
        }

        .coin-one {
          top: 12%;
          left: 16%;
          animation-delay: -1.2s;
        }

        .coin-two {
          bottom: 18%;
          right: 8%;
          animation-delay: -2.4s;
        }

        .coin-three {
          top: 35%;
          right: 20%;
          animation-delay: -3.4s;
        }

        .bnm-floating-bill {
          position: absolute;
          display: block;
          width: 120px;
          height: 52px;
          border-radius: 18px;
          background: linear-gradient(
            120deg,
            #d1f7d8 0%,
            #8fd9a8 60%,
            #3cae6f 100%
          );
          opacity: 0.35;
          filter: blur(0.6px);
          animation: bnmDrift 7.5s ease-in-out infinite;
        }

        .bill-one {
          top: 22%;
          right: 54%;
          animation-delay: -0.8s;
        }

        .bill-two {
          bottom: 12%;
          left: 8%;
          animation-delay: -2.1s;
        }

        .bnm-pig-sparkle,
        .bnm-pig-sparkle.delay {
          position: absolute;
          top: 55%;
          left: 52%;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.7) 0%,
            rgba(255, 255, 255, 0) 70%
          );
          animation: bnmSparkle 2.8s ease-in-out infinite;
        }

        .bnm-pig-sparkle.delay {
          animation-delay: -1.4s;
        }

        .bnm-progress {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            rgba(24, 161, 110, 0),
            #18a16e,
            rgba(88, 209, 151, 0)
          );
          animation: bnmProgress 1.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function PiggyAnimation() {
  return (
    <svg
      viewBox="0 0 240 220"
      className="h-48 w-48"
      role="img"
      aria-label="Animated piggy bank loading"
    >
      <defs>
        <linearGradient
          id="pigBodyGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#FF9BC2" />
          <stop offset="100%" stopColor="#FF6D9E" />
        </linearGradient>
        <linearGradient id="pigHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFE6F0" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFB9D3" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="coinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF4C5" />
          <stop offset="45%" stopColor="#FFD76B" />
          <stop offset="100%" stopColor="#C9980F" />
        </linearGradient>
        <clipPath id="pigClip">
          <ellipse cx="128" cy="122" rx="86" ry="64" />
        </clipPath>
      </defs>

      <ellipse cx="128" cy="122" rx="86" ry="64" fill="url(#pigBodyGradient)" />
      <ellipse
        cx="128"
        cy="122"
        rx="86"
        ry="64"
        fill="url(#pigHighlight)"
        opacity="0.35"
      />

      <g clipPath="url(#pigClip)">
        <rect
          x="42"
          y="150"
          width="172"
          height="78"
          fill="#18A16E"
          opacity="0.15"
        >
          <animate
            attributeName="y"
            values="160;110;130;160"
            dur="3.2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="height"
            values="60;100;80;60"
            dur="3.2s"
            repeatCount="indefinite"
          />
        </rect>
      </g>

      <path
        d="M58 108C50 80 68 58 94 50C100 30 126 20 152 28C186 20 214 48 210 86C228 96 230 132 208 144C206 170 164 190 122 188C94 196 70 182 64 158C40 158 28 134 44 116C42 104 48 96 58 108Z"
        fill="none"
        stroke="#D85688"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.25"
      />

      <path d="M74 66L94 42C104 38 112 46 108 54L90 74" fill="#FF7EAB" />
      <circle cx="192" cy="118" r="22" fill="#FF7EAB" />
      <ellipse cx="198" cy="120" rx="10" ry="6" fill="#FFAAC6" opacity="0.75" />

      <ellipse cx="160" cy="122" rx="6" ry="8" fill="#2D0E1B" opacity="0.85" />
      <ellipse cx="136" cy="114" rx="4" ry="5" fill="#2D0E1B" opacity="0.7" />

      <path
        d="M86 150C86 140 96 134 122 134C148 134 158 140 158 150"
        stroke="#2D0E1B"
        strokeWidth="5"
        strokeLinecap="round"
      />

      <path
        d="M46 144C36 136 34 116 44 110"
        stroke="#FF9BC2"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="50" cy="106" r="6" fill="#FF7EAB" />

      <g>
        <rect
          x="112"
          y="58"
          width="32"
          height="14"
          rx="6"
          fill="#0B3F24"
          opacity="0.9"
        />
      </g>

      <g>
        <circle
          cx="128"
          cy="44"
          r="18"
          fill="url(#coinGradient)"
          opacity="0.95"
        >
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 -80; 0 10; 0 -80"
            keyTimes="0;0.6;1"
            dur="2.6s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="128" cy="44" r="10" fill="#FEE08B" opacity="0.8">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 -80; 0 10; 0 -80"
            keyTimes="0;0.6;1"
            dur="2.6s"
            repeatCount="indefinite"
          />
        </circle>
      </g>

      <g>
        <circle cx="170" cy="62" r="12" fill="url(#coinGradient)" opacity="0.8">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 -50; 0 40; 0 -50"
            keyTimes="0;0.7;1"
            dur="3s"
            repeatCount="indefinite"
          />
        </circle>
      </g>

      <g>
        <circle cx="88" cy="62" r="10" fill="url(#coinGradient)" opacity="0.7">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 -60; 0 30; 0 -60"
            keyTimes="0;0.65;1"
            dur="2.8s"
            repeatCount="indefinite"
          />
        </circle>
      </g>

      <g>
        <path
          d="M198 160C206 154 214 160 214 168C214 178 202 182 196 176"
          stroke="#FF7EAB"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

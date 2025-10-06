"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { formatLocalYMD } from "@/lib/date";
import { Download } from "lucide-react";
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
  const router = useRouter();
  const supabase = createClient();

  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Income Tracker
              </h1>
              <p className="text-gray-600">
                Track your daily income and expenses
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label
                  htmlFor="currency-select"
                  className="text-sm text-gray-600"
                >
                  Currency
                </label>
                <select
                  id="currency-select"
                  value={currency}
                  onChange={(event) => {
                    const value = event.target.value as "USD" | "PHP";
                    if (value === "PHP" && !usdToPhpRate) {
                      // If rate unavailable, stay with USD
                      setRateError("Exchange rate not loaded. Staying in USD.");
                      setCurrency("USD");
                      return;
                    }
                    setCurrency(value);
                  }}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={rateLoading}
                >
                  <option value="USD">USD</option>
                  <option value="PHP">PHP</option>
                </select>
                {rateLoading && (
                  <span className="text-xs text-gray-500">Loading...</span>
                )}
              </div>
              <button
                onClick={handleExportCSV}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Export {currency} CSV
              </button>
              <AuthButton />
            </div>
          </div>
        </div>
        {rateError && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
            <p className="text-sm text-red-600">{rateError}</p>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Monthly Summary */}
          {monthlySummary && (
            <MonthlySummary
              summary={monthlySummary}
              formatCurrency={formatCurrency}
              currency={currency}
            />
          )}

          {/* Calendar */}
          <Calendar
            dailyTotals={dailyTotals}
            onDateClick={handleDateClick}
            month={currentDate}
            onMonthChange={(d) => setCurrentDate(d)}
            formatCurrency={formatCurrency}
            currency={currency}
          />

          {/* Transaction Modal */}
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
      </main>
    </div>
  );
}

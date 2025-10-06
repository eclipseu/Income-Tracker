"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
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
        `/api/export?month=${currentMonth}&year=${currentYear}`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `income-tracker-${format(currentDate, "MMMM-yyyy")}.csv`;
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
    const dateString = date.toISOString().split("T")[0];
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
              <button
                onClick={handleExportCSV}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Monthly Summary */}
          {monthlySummary && <MonthlySummary summary={monthlySummary} />}

          {/* Calendar */}
          <Calendar dailyTotals={dailyTotals} onDateClick={handleDateClick} />

          {/* Transaction Modal */}
          {selectedDate && (
            <TransactionModal
              isOpen={!!selectedDate}
              onClose={() => setSelectedDate(null)}
              selectedDate={selectedDate}
              transactions={getTransactionsForDate(selectedDate)}
              onAddTransaction={handleAddTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}
        </div>
      </main>
    </div>
  );
}

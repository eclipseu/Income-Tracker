"use client";

import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { MonthlySummary as MonthlySummaryType } from "@/lib/types";

interface MonthlySummaryProps {
  summary: MonthlySummaryType;
}

export default function MonthlySummary({ summary }: MonthlySummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return "text-green-600";
    if (profit < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getProfitBgColor = (profit: number) => {
    if (profit > 0) return "bg-green-50";
    if (profit < 0) return "bg-red-50";
    return "bg-gray-50";
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Monthly Summary
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Income */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">Total Income</p>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(summary.total_income)}
              </p>
            </div>
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center">
            <TrendingDown className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-600">Total Expense</p>
              <p className="text-2xl font-bold text-red-700">
                {formatCurrency(summary.total_expense)}
              </p>
            </div>
          </div>
        </div>

        {/* Profit/Loss */}
        <div className={`${getProfitBgColor(summary.profit)} rounded-lg p-4`}>
          <div className="flex items-center">
            <DollarSign
              className={`h-8 w-8 ${getProfitColor(summary.profit)}`}
            />
            <div className="ml-3">
              <p
                className={`text-sm font-medium ${getProfitColor(
                  summary.profit
                )}`}
              >
                {summary.profit >= 0 ? "Profit" : "Loss"}
              </p>
              <p
                className={`text-2xl font-bold ${getProfitColor(
                  summary.profit
                )}`}
              >
                {formatCurrency(Math.abs(summary.profit))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Total Transactions</span>
          <span className="font-medium">{summary.transaction_count}</span>
        </div>
      </div>
    </div>
  );
}

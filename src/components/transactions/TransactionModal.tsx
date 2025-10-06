"use client";

import { useState, useEffect } from "react";
import { X, Plus, Minus } from "lucide-react";
import { Transaction } from "@/lib/types";
import { formatLocalYMD } from "@/lib/date";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  transactions: Transaction[];
  currency: "USD" | "PHP";
  formatCurrency: (amountInUsd: number) => string;
  convertToBaseCurrency: (amount: number) => number;
  onAddTransaction: (
    transaction: Omit<
      Transaction,
      "id" | "user_id" | "created_at" | "updated_at"
    >
  ) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
}

export default function TransactionModal({
  isOpen,
  onClose,
  selectedDate,
  transactions,
  currency,
  formatCurrency,
  convertToBaseCurrency,
  onAddTransaction,
  onDeleteTransaction,
}: TransactionModalProps) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [type, setType] = useState<"income" | "expense">("income");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setNote("");
      setType("income");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setLoading(true);
    try {
      const parsedAmount = parseFloat(amount);
      const baseAmount = convertToBaseCurrency(parsedAmount);
      const normalizedAmount = Math.round(baseAmount * 100) / 100;
      if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
        throw new Error("Invalid amount after currency conversion");
      }

      await onAddTransaction({
        date: formatLocalYMD(selectedDate),
        type,
        amount: normalizedAmount,
        note: note.trim() || undefined,
      });
      setAmount("");
      setNote("");
    } catch (error) {
      console.error("Error adding transaction:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      try {
        await onDeleteTransaction(id);
      } catch (error) {
        console.error("Error deleting transaction:", error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Add new transaction form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setType("income")}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md border ${
                  type === "income"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Plus className="h-4 w-4 mr-2" />
                Income
              </button>
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md border ${
                  type === "expense"
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Minus className="h-4 w-4 mr-2" />
                Expense
              </button>
            </div>

            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Amount ({currency})
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label
                htmlFor="note"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Note (optional)
              </label>
              <input
                id="note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Add a note..."
              />
            </div>

            <button
              type="submit"
              disabled={loading || !amount}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Transaction"}
            </button>
          </form>

          {/* Existing transactions */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Transactions ({transactions.length})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {transactions.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  No transactions for this day
                </p>
              ) : (
                transactions.map((transaction) => {
                  const displayAmount =
                    transaction.type === "income"
                      ? `+${formatCurrency(transaction.amount)}`
                      : formatCurrency(-transaction.amount);

                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-sm font-medium ${
                              transaction.type === "income"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {displayAmount}
                          </span>
                          {transaction.note && (
                            <span className="text-sm text-gray-600 truncate">
                              {transaction.note}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(
                            transaction.created_at
                          ).toLocaleTimeString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

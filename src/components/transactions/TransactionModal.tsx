"use client";

import { useState, useEffect } from "react";
import { X, Plus, Minus, Trash2, Clock } from "lucide-react";
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
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#0B1B2B]/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-modal-heading"
    >
      <div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden rounded-l-3xl border border-white/10 bg-white/95 shadow-[0_40px_80px_-40px_rgba(11,27,43,0.65)] backdrop-blur-xl transition-transform sm:max-w-lg">
        <div className="flex items-start justify-between border-b border-[#E2E8F0] px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#1B2A38]/50">
              Selected Day
            </p>
            <h3
              id="transaction-modal-heading"
              className="mt-2 text-xl font-semibold text-[#0B1B2B]"
            >
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h3>
            <p className="mt-1 text-xs text-[#1B2A38]/50">
              Amounts saved in {currency}. Apply changes to update your daily
              log instantly.
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#0B1B2B] transition hover:bg-[#F5F7FA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#17A2B8] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            aria-label="Close day details"
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-3xl border border-[#E2E8F0] bg-white/95 p-5 shadow-sm"
          >
            <div className="grid grid-cols-2 gap-3" role="radiogroup">
              <button
                type="button"
                onClick={() => setType("income")}
                className={`flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  type === "income"
                    ? "border-[#17A2B8] bg-[#17A2B8]/10 text-[#0B1B2B] shadow"
                    : "border-transparent bg-[#F5F7FA] text-[#1B2A38]/70 hover:border-[#17A2B8]/40"
                }`}
                aria-pressed={type === "income"}
              >
                <Plus className="h-4 w-4" />
                Income
              </button>
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  type === "expense"
                    ? "border-[#FF6B6B] bg-[#FF6B6B]/10 text-[#FF6B6B] shadow"
                    : "border-transparent bg-[#F5F7FA] text-[#1B2A38]/70 hover:border-[#FF6B6B]/40"
                }`}
                aria-pressed={type === "expense"}
              >
                <Minus className="h-4 w-4" />
                Expense
              </button>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="amount"
                className="text-xs font-semibold uppercase tracking-[0.25em] text-[#1B2A38]/50"
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
                className="w-full rounded-2xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#0B1B2B] shadow-sm focus:border-[#17A2B8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#17A2B8]/60"
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="note"
                className="text-xs font-semibold uppercase tracking-[0.25em] text-[#1B2A38]/50"
              >
                Note (optional)
              </label>
              <input
                id="note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-2xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#0B1B2B] shadow-sm focus:border-[#17A2B8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#17A2B8]/60"
                placeholder="Add a note…"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !amount}
              className="w-full rounded-full bg-[#17A2B8] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#1492a5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#17A2B8] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50"
            >
              {loading
                ? "Saving…"
                : `Save ${type === "income" ? "Income" : "Expense"}`}
            </button>
          </form>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-[#0B1B2B]">
                Entries ({transactions.length})
              </h4>
              <span className="text-xs uppercase tracking-[0.3em] text-[#1B2A38]/40">
                History
              </span>
            </div>
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <p className="rounded-3xl border border-dashed border-[#E2E8F0] bg-white/70 px-5 py-10 text-center text-sm text-[#1B2A38]/50">
                  No entries recorded yet. Add your first income or expense for
                  the day.
                </p>
              ) : (
                transactions.map((transaction) => {
                  const displayAmount =
                    transaction.type === "income"
                      ? `+${formatCurrency(transaction.amount)}`
                      : formatCurrency(-transaction.amount);

                  return (
                    <article
                      key={transaction.id}
                      className="flex items-center justify-between rounded-3xl border border-[#E2E8F0] bg-white/95 px-4 py-4 shadow-sm"
                    >
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] ${
                              transaction.type === "income"
                                ? "bg-[#17A2B8]/10 text-[#0B1B2B]"
                                : "bg-[#FF6B6B]/10 text-[#FF6B6B]"
                            }`}
                          >
                            {transaction.type}
                          </span>
                          <span
                            className={`text-sm font-semibold ${
                              transaction.type === "income"
                                ? "text-[#17A2B8]"
                                : "text-[#FF6B6B]"
                            }`}
                          >
                            {displayAmount}
                          </span>
                          {transaction.note && (
                            <span className="truncate text-sm text-[#1B2A38]/60">
                              {transaction.note}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-[#1B2A38]/45">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(transaction.created_at).toLocaleTimeString(
                            [],
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="ml-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-[#FF6B6B] transition hover:bg-[#FF6B6B]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B6B] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        aria-label="Delete entry"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2.5} />
                      </button>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

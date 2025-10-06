export interface Transaction {
  id: string;
  user_id: string;
  date: string;
  type: "income" | "expense";
  amount: number;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface MonthlySummary {
  total_income: number;
  total_expense: number;
  profit: number;
  transaction_count: number;
}

export interface DailyTotal {
  date: string;
  net_total: number;
  income_total: number;
  expense_total: number;
  transaction_count: number;
}

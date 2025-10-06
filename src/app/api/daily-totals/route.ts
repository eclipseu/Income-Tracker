import { createClient } from "@/lib/supabase/server";
import { formatLocalYMD } from "@/lib/date";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = createClient();

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  if (!month || !year) {
    return NextResponse.json(
      { error: "Month and year are required" },
      { status: 400 }
    );
  }

  try {
    // Get transactions for the specified month
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);

    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("date, type, amount")
      .eq("user_id", user.id)
      .gte("date", formatLocalYMD(startDate))
      .lte("date", formatLocalYMD(endDate));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group transactions by date
    const dailyTotals = new Map<
      string,
      {
        date: string;
        income_total: number;
        expense_total: number;
        net_total: number;
        transaction_count: number;
      }
    >();

    transactions?.forEach((transaction) => {
      const date = transaction.date;
      if (!dailyTotals.has(date)) {
        dailyTotals.set(date, {
          date,
          income_total: 0,
          expense_total: 0,
          net_total: 0,
          transaction_count: 0,
        });
      }

      const daily = dailyTotals.get(date)!;
      daily.transaction_count++;

      if (transaction.type === "income") {
        daily.income_total += transaction.amount;
      } else {
        daily.expense_total += transaction.amount;
      }

      daily.net_total = daily.income_total - daily.expense_total;
    });

    return NextResponse.json({ dailyTotals: Array.from(dailyTotals.values()) });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

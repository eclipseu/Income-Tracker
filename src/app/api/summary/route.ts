import { createClient } from "@/lib/supabase/server";
import { formatLocalYMD } from "@/lib/date";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

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
      .select("type, amount")
      .eq("user_id", user.id)
      .gte("date", formatLocalYMD(startDate))
      .lte("date", formatLocalYMD(endDate));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate summary
    const totalIncome =
      transactions
        ?.filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0) || 0;

    const totalExpense =
      transactions
        ?.filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0) || 0;

    const profit = totalIncome - totalExpense;

    const summary = {
      total_income: totalIncome,
      total_expense: totalExpense,
      profit,
      transaction_count: transactions?.length || 0,
    };

    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

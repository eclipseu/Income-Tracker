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
      .select("*")
      .eq("user_id", user.id)
      .gte("date", formatLocalYMD(startDate))
      .lte("date", formatLocalYMD(endDate))
      .order("date", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("/api/transactions GET failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { date, type, amount, note } = body;

    if (!date || !type || !amount) {
      return NextResponse.json(
        { error: "Date, type, and amount are required" },
        { status: 400 }
      );
    }

    if (type !== "income" && type !== "expense") {
      return NextResponse.json(
        { error: "Type must be income or expense" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    const { data: transaction, error } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        date,
        type,
        amount,
        note: note || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("/api/transactions POST failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    // Create CSV content
    const csvHeader = "Date,Type,Amount,Note,Timestamp\n";
    const csvRows =
      transactions
        ?.map((transaction) => {
          // transaction.date is stored as DATE (no time); use as-is to avoid UTC shifts
          const date = transaction.date as string;
          const timestamp = new Date(transaction.created_at).toLocaleString();
          const note = transaction.note
            ? `"${transaction.note.replace(/"/g, '""')}"`
            : "";
          return `${date},${transaction.type},${transaction.amount},${note},${timestamp}`;
        })
        .join("\n") || "";

    const csvContent = csvHeader + csvRows;

    // Return CSV file
    const monthName = new Date(
      parseInt(year),
      parseInt(month) - 1
    ).toLocaleDateString("en-US", { month: "long" });
    const filename = `income-tracker-${monthName}-${year}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

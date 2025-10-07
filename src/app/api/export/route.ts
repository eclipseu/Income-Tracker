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
  const currencyParam = searchParams.get("currency");
  const requestedCurrency =
    currencyParam?.toUpperCase() === "PHP" ? "PHP" : "USD";

  if (!month || !year) {
    return NextResponse.json(
      { error: "Month and year are required" },
      { status: 400 }
    );
  }

  try {
    let currencyUsed = requestedCurrency;
    let conversionRate = 1;

    if (requestedCurrency === "PHP") {
      try {
        const rateResponse = await fetch(
          "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json",
          { next: { revalidate: 3600 } }
        );

        if (!rateResponse.ok) {
          throw new Error(`Rate request failed: ${rateResponse.status}`);
        }

        const rateData = await rateResponse.json();
        const phpRate = rateData?.usd?.php;
        if (typeof phpRate !== "number") {
          throw new Error("USD to PHP rate unavailable");
        }
        conversionRate = phpRate;
      } catch (error) {
        console.error("Export currency conversion failed, defaulting to USD:", {
          error,
        });
        currencyUsed = "USD";
        conversionRate = 1;
      }
    }

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
    const csvHeader = `Date,Type,Amount (${currencyUsed}),Note,Timestamp\n`;
    const csvRows =
      transactions
        ?.map((transaction) => {
          // transaction.date is stored as DATE (no time); use as-is to avoid UTC shifts
          const date = transaction.date as string;
          const timestamp = new Date(transaction.created_at).toLocaleString();
          const amount = Number(transaction.amount) || 0;
          const convertedAmount =
            Math.round(amount * conversionRate * 100) / 100;
          const note = transaction.note
            ? `"${transaction.note.replace(/"/g, '""')}"`
            : "";
          return `${date},${transaction.type},${convertedAmount.toFixed(
            2
          )},${note},${timestamp}`;
        })
        .join("\n") || "";

    const csvContent = csvHeader + csvRows;

    // Return CSV file
    const monthName = new Date(
      parseInt(year),
      parseInt(month) - 1
    ).toLocaleDateString("en-US", { month: "long" });
    const filename = `income-tracker-${monthName}-${year}-${currencyUsed.toLowerCase()}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Export-Currency": currencyUsed,
      },
    });
  } catch (error) {
    console.error("/api/export failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

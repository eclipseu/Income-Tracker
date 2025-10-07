import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Income Tracker",
  description: "Track your daily income and expenses",
} satisfies Metadata;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

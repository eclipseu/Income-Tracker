import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "BrokeNoMo",
  description: "Track your daily income and expenses",
  icons: {
    icon: "/logo.jpg",
  },
} satisfies Metadata;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.jpg" type="image/jpeg" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}

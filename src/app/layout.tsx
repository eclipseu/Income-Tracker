import type { Metadata } from "next";
import "./globals.css";

export const metadata = {
  title: "BrokeNoMo",
  description: "Track your money, stay broke no more!",
  icons: {
    icon: "/logo.jpg", // put your logo in /public
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect fill="#0B1B2B" rx="14" width="64" height="64"/><path fill="#17A2B8" d="M20 44h24a4 4 0 0 0 4-4V26a4 4 0 0 0-4-4h-8v-4h-8v4h-4a4 4 0 0 0-4 4v14a4 4 0 0 0 4 4zm12-8a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg>`;
const FAVICON_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(
  faviconSvg
)}`;

export const metadata = {
  title: "BrokeNoMo",
  description: "Track your daily income and expenses",
  icons: {
    icon: FAVICON_DATA_URI,
  },
} satisfies Metadata;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href={FAVICON_DATA_URI} type="image/svg+xml" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}

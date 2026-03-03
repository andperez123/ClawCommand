import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClawCommand",
  description: "OpenClaw Control Dashboard — Configuration Intelligence & Compliance",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}

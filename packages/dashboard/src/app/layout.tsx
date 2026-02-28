import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClawCommand",
  description: "OpenClaw Control Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark:bg-gray-950">
      <body className="antialiased min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}

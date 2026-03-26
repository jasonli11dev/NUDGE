import type { Metadata } from "next";
import { handwritten, mono } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nudge — Talk to your calendar",
  description:
    "Nudge calls you Sunday. You talk. It turns your goals into time blocks and writes them to your Google Calendar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${handwritten.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

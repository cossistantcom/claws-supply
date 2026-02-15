import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistPixelSquare } from "geist/font/pixel";
import "./globals.css";
import { MainProviders } from "./providers";

export const metadata: Metadata = {
  title: "hourglass.bot — Your Leads, Delivered Daily",
  description:
    "We configure a dedicated OpenClaw bot for you. It runs 24/7, finds qualified leads, verifies them, and delivers them straight to you. No setup. No maintenance.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${GeistPixelSquare.variable} ${GeistMono.variable}`}
    >
      <body className="font-mono antialiased bg-background text-foreground">
        <MainProviders>{children}</MainProviders>
      </body>
    </html>
  );
}

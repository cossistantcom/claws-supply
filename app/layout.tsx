import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistPixelSquare } from "geist/font/pixel";
import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { MainProviders } from "./providers";

export const metadata: Metadata = {
  title: "Claws supply - explore, generate and sell OpenClaw templates",
  description:
    "Quickstart your OpenClaw setup with pre-configured templates and join a community of OpenClaw enthusiasts.",
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
      <body className="font-mono antialiased bg-background text-foreground min-h-screen">
        <MainProviders>
          <Navbar />
          {children}
          <Toaster />
        </MainProviders>
      </body>
    </html>
  );
}

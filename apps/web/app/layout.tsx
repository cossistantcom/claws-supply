import type { Metadata } from "next";
import { RootProvider } from "fumadocs-ui/provider/next";
import { GeistMono } from "geist/font/mono";
import { GeistPixelSquare } from "geist/font/pixel";
import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";
import { getSessionFromNextHeaders } from "@/lib/auth/session";
import { absoluteUrl, getDefaultOgImagePath, getSiteUrl } from "@/lib/seo";
import "./globals.css";
import { MainProviders } from "./providers";
import Script from "next/script";

const SITE_URL = getSiteUrl();
const DEFAULT_OG_IMAGE_URL = absoluteUrl(getDefaultOgImagePath());

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Claws.supply — OpenClaw AI Agent Templates Marketplace",
    template: "%s",
  },
  description:
    "Discover popular and latest OpenClaw agent templates, and launch faster with production-ready setups.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Claws.supply — OpenClaw AI Agent Templates Marketplace",
    description:
      "Discover popular and latest OpenClaw agent templates, and launch faster with production-ready setups.",
    url: "/",
    siteName: "Claws.supply",
    type: "website",
    images: [
      {
        url: DEFAULT_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "Claws.supply OpenClaw template marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Claws.supply — OpenClaw AI Agent Templates Marketplace",
    description:
      "Discover popular and latest OpenClaw agent templates, and launch faster with production-ready setups.",
    images: [DEFAULT_OG_IMAGE_URL],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSessionFromNextHeaders();
  const navbarUser = session
    ? {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
      }
    : null;

  return (
    <html
      lang="en"
      className={`dark ${GeistPixelSquare.variable} ${GeistMono.variable}`}
    >
      <body className="font-mono antialiased bg-background text-foreground min-h-screen">
        <Script
          data-website-id="dfid_wmEet4rNZJvfDIEP784LA"
          data-domain="claws.supply"
          src="https://datafa.st/js/script.js"
          strategy="afterInteractive"
        />
        <RootProvider theme={{ enabled: false }}>
          <MainProviders>
            <Navbar user={navbarUser} />
            {children}
            <SiteFooter />
            <Toaster />
          </MainProviders>
        </RootProvider>
      </body>
    </html>
  );
}

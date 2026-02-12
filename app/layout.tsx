import { headers } from "next/headers";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import Navbar from "@/components/nav/Navbar";
import PlausibleProvider from "next-plausible";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://oppai-daisuki.net";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Oppai Daisuki - Japanese Gravure Idol Videos & Photo Galleries",
    template: "%s | Oppai Daisuki",
  },
  description:
    "Discover the best Japanese gravure idol content. Stream high-quality videos, browse photo galleries, and stay updated with the latest news about your favorite idols.",
  keywords: [
    "gravure",
    "Japanese gravure",
    "gravure idol",
    "Japanese idol",
    "idol videos",
    "photo galleries",
    "gravure photos",
    "Japanese models",
    "idol news",
  ],
  authors: [{ name: "Oppai Daisuki" }],
  creator: "Oppai Daisuki",
  publisher: "Oppai Daisuki",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Oppai Daisuki",
    title: "Oppai Daisuki - Japanese Gravure Idol Videos & Photo Galleries",
    description:
      "Discover the best Japanese gravure idol content. Stream high-quality videos, browse photo galleries, and stay updated with the latest news.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Oppai Daisuki - Japanese Gravure Content",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Oppai Daisuki - Japanese Gravure Idol Content",
    description:
      "Stream gravure videos, browse photo galleries, and discover Japanese idol content.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "entertainment",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonceHeader = await headers();
  const nonceValue = nonceHeader.get("x-nonce");
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {nonceValue && <meta name="csp-nonce" content={nonceValue} />}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200`}
      >
        <PlausibleProvider 
        domain="oppai-daisuki.net"
        customDomain="stats.oppai-daisuki.net"
        trackOutboundLinks={true}
        trackFileDownloads={true}
        selfHosted={true}
        >
        <ThemeProvider>
          <Providers>
            <Navbar />
            {children}
          </Providers>
        </ThemeProvider>

        </PlausibleProvider>
      </body>
    </html>
  );
}

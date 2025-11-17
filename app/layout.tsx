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

export const metadata: Metadata = {
  title: "Oppai Daisuki",
  description: "Gravure Video Stream Collection",
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

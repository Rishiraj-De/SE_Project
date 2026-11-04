import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { CustomCursor } from "@/components/common/CustomCursor";

export const metadata: Metadata = {
  title: "Digital Archaeologist — Legacy Code Analysis Platform",
  description: "Understand existing software before changing it. Intelligent legacy codebase analysis, architecture reconstruction, and blast radius risk assessment.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Google Identity Services SDK */}
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}


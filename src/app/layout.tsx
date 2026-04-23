import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import { Manrope } from "next/font/google";
import { AIImportProvider } from "@/context/AIImportContext";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: {
    default: "BoxiStock",
    template: "%s | BoxiStock",
  },
  description:
    "Automated FIFO inventory and profit tracking for high-volume resellers.",
  robots: {
    index: false,
    follow: false,
  },
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", "font-sans", manrope.variable)}>
      <body
        className={`${manrope.variable} antialiased min-h-screen flex flex-col`}
      >
        <ClerkProvider>
          <AIImportProvider>
            {children}
            <Toaster position="bottom-right" theme="dark" richColors />
          </AIImportProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

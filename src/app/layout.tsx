import type { Metadata } from "next";
// Vendor CSS must be imported BEFORE globals.css so our overrides win
// by natural source order, without needing !important.
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Manrope } from "next/font/google";
import { AIImportProvider } from "@/context/AIImportContext";
import { cn } from "@/lib/utils";

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

import type { Metadata } from "next";
// Vendor CSS must be imported BEFORE globals.css so our overrides win
// by natural source order, without needing !important.
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";
import "./globals.css";
import { Manrope } from "next/font/google";
import { AIImportProvider } from "@/context/AIImportContext";
import { cn } from "@/lib/utils";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
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

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", manrope.variable)}>
      <body className="antialiased min-h-screen flex flex-col">
        <AIImportProvider>
          {children}
          <Toaster position="bottom-right" theme="dark" richColors />
          <SpeedInsights />
        </AIImportProvider>
      </body>
    </html>
  );
}

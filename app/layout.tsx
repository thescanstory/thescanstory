import type { Metadata } from "next";
import { Caveat, Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

import { CsrfProvider } from "@/components/brand/csrf-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-handwriting" });

export const metadata: Metadata = {
  title: "The Scan Story",
  description:
    "The Scan Story — physical products that come to life. Point your camera at a printed photo and watch a personalized video overlay appear.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${caveat.variable}`}>
      <body className="gradient-surface min-h-screen font-sans antialiased">
        <CsrfProvider>
          {children}
          <Toaster />
        </CsrfProvider>
      </body>
    </html>
  );
}


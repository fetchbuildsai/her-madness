import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "HER MADNESS — Women's March Madness",
  description: "Brackets. Live scores. Community. The Women's March Madness experience built for real fans.",
  openGraph: {
    title: "HER MADNESS",
    description: "Women's March Madness brackets, live scores, and community.",
    siteName: "HER MADNESS",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <body className={`${inter.variable} font-sans antialiased bg-[#09090b] text-[#fafafa] overflow-x-hidden`}>
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Buddy Dashboards",
  description:
    "Business intelligence em tempo real para TVs corporativas conectadas ao Kommo.",
};

type RootLayoutProps = Readonly<{ children: React.ReactNode }>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" className="h-full bg-[#0c0c10] text-slate-100">
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-[color:var(--background)]`}>{children}</body>
    </html>
  );
}

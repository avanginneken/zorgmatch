import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/context/ToastContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ZorgMatch - Verbindt zorgvragers met zorgverleners",
  description: "Het Nederlandse platform dat mensen die thuis zorg nodig hebben snel verbindt met gecertificeerde zzp-zorgverleners in de buurt.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

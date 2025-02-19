import { headers } from "next/headers";
import { WagmiProvider } from '@/context/WagmiProvider'
import { Header } from '@/components/Header';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Prophet - 予言プラットフォーム",
  description: "予言を作成・検証するプラットフォーム",
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const headersList = await headers();
  const cookies = headersList.get('cookie');

  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <WagmiProvider cookies={cookies}>
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
        </WagmiProvider>
      </body>
    </html>
  );
}

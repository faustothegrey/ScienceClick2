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
  title: "ScienceClick",
  description: "Interactive educational tool for visual learning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="rotate-prompt" aria-hidden="true">
          <div className="rotate-prompt__icon">📱</div>
          <div className="rotate-prompt__title">Rotate your device</div>
          <div className="rotate-prompt__body">
            ScienceClick works best in landscape mode on phones.
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}

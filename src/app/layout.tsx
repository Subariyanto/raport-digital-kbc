import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Raport Digital Madrasah KBC",
  description: "Aplikasi Raport Digital Madrasah berbasis Kurikulum Berbasis Cinta",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${geistSans.variable} font-sans antialiased bg-gray-50`}>
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}

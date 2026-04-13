import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";

// Menggunakan font standar Inter yang stabil di Next.js 14
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TarbiyahTech - Sistem Ujian",
  description: "Platform ujian CBT dan Scanner LJK Terintegrasi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
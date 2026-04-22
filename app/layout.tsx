import type { Metadata } from "next";
// Kita gunakan pemanggilan relatif standar yang paling aman
import "./globals.css";

export const metadata: Metadata = {
  title: "TarbiyahTech",
  description: "Sistem Manajemen Pendidikan",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode; 
}) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
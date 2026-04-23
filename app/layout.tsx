import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "FastTest - TarbiyahTech",
  description: "Sistem Manajemen Pendidikan Terpadu",
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
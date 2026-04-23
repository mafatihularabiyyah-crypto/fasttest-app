"use client";

import SyncManager from "../../components/SyncManager";
import { User, SignOut, BookOpenText } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function GuruLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();

  // FUNGSI UNTUK LOGOUT
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* HEADER SATU BARIS */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-50 shadow-sm">
          {/* Sisi Kiri: Logo */}
          <Link href="/guru" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-lg">F</div>
            <span className="font-black text-xl text-slate-800 tracking-tight">Fast<span className="text-indigo-600">Test</span></span>
          </Link>

          {/* Sisi Kanan: Widget Sync & Profil */}
          <div className="flex items-center gap-4 sm:gap-6">
            
            {/* WIDGET SINKRONISASI */}
            <SyncManager />

            {/* Tombol Tutorial (Pengganti Lonceng) */}
            <Link href="/guru/tutorial" title="Pusat Panduan & Tutorial" className="text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 hover:bg-indigo-50 p-2 rounded-full">
              <BookOpenText size={22} weight="fill" />
            </Link>

            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

            {/* Info Profil */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-800 leading-tight">Ustadz Ihza Cahya Utama, S.Si.</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Yayasan Mafatihul Arabiyyah</p>
              </div>
              <div className="w-9 h-9 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-slate-400">
                <User size={18} weight="fill" />
              </div>
              
              {/* TOMBOL LOGOUT AKTIF */}
              <button 
                onClick={handleLogout} 
                title="Keluar dari Akun"
                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors ml-1"
              >
                <SignOut size={22} weight="bold" />
              </button>
            </div>
            
          </div>
        </header>

        {/* AREA KONTEN */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>

      </div>
    </div>
  );
}
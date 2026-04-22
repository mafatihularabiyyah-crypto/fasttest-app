"use client";
import SyncManager from "../../components/SyncManager";
import { Bell, User, SignOut } from "@phosphor-icons/react";

export default function GuruLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <div className="flex-1 flex flex-col">
        
        {/* HEADER SATU BARIS SESUAI SCREENSHOT */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">

          {/* Kiri: Logo FastTest */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-lg">F</div>
            <span className="font-black text-xl text-slate-800 tracking-tight">Fast<span className="text-indigo-600">Test</span></span>
          </div>

          {/* Kanan: Sync, Notif, Profil, Logout */}
          <div className="flex items-center gap-4 sm:gap-6">
            
            {/* WIDGET SINKRONISASI (Minimalis & Ramping) */}
            <SyncManager />

            {/* Ikon Notifikasi */}
            <button className="text-slate-400 hover:text-indigo-600 transition-colors relative">
              <Bell size={24} weight="fill" />
            </button>

            {/* Garis Pemisah */}
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

            {/* Profil Pengguna & Logout */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-800 leading-tight">Ustadz Ihza Cahya Utama, S.Si.</p>
                <p className="text-[10px] font-bold text-slate-500">Yayasan Mafatihul Arabiyyah</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-slate-400">
                <User size={20} weight="fill" />
              </div>
              <button className="text-red-400 hover:text-red-600 transition-colors ml-1">
                <SignOut size={24} weight="bold" />
              </button>
            </div>
            
          </div>
        </header>

        {/* Konten Utama Halaman (CBT, Arsip, dll) */}
        <main className="flex-1">
          {children}
        </main>

      </div>
    </div>
  );
}
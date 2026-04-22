"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
// Memanggil Supabase Client untuk fungsi Sign Out
import { createClient } from "@/utils/supabase/client"; 

import { 
  UsersThree, Student, ListChecks, 
  Scan, SquaresFour, SignOut,
  UserCircleGear, X, Buildings as BuildingsIcon, PencilSimpleLine, EnvelopeSimple,
  WhatsappLogo
} from "@phosphor-icons/react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter(); // <-- Tambahkan router untuk pindah halaman

  const [profil, setProfil] = useState({
    nama: "Administrator",
    email: "admin@sekolah.com",
    institusi: "SMA Terpadu FastTest"
  });
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(profil);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const isActive = (path: string) => {
    if (path === "/admin" && pathname === "/admin") return true;
    if (path !== "/admin" && pathname.startsWith(path)) return true;
    return false;
  };

  const handleSimpanProfil = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    
    setTimeout(() => {
      setProfil(editForm);
      setIsSavingProfile(false);
      setIsEditModalOpen(false);
      alert("Profil institusi berhasil diperbarui!");
    }, 800);
  };

  // --- FUNGSI KELUAR SISTEM (LOGOUT) ---
  const handleLogout = async () => {
    if (!confirm("Yakin ingin keluar dari sistem?")) return;
    
    try {
      const supabase = createClient();
      await supabase.auth.signOut(); // Menghapus sesi Supabase
      
      // Mengarahkan kembali ke halaman login (Sesuaikan rute jika berbeda, misal: "/")
      router.push("/login"); 
      router.refresh(); // Memaksa refresh agar cache sesi bersih
    } catch (error) {
      alert("Terjadi kesalahan saat mencoba keluar.");
      console.error(error);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* SIDEBAR KIRI */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-slate-200 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
        <div className="h-20 flex items-center px-6 lg:px-8 border-b border-slate-100">
          <div className="flex items-center gap-3 text-indigo-600 font-black text-xl tracking-tight">
            <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center">
              <Scan size={20} weight="bold" />
            </div>
            <span className="hidden sm:block">FastTest <span className="text-slate-300 font-normal">|</span> <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Admin</span></span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Menu Utama</p>
          
          <Link href="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all relative ${isActive("/admin") ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50"}`}>
            {isActive("/admin") && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full"></div>}
            <SquaresFour size={20} weight={isActive("/admin") ? "fill" : "bold"} /> Dashboard
          </Link>
          
          <Link href="/admin/guru" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all relative ${isActive("/admin/guru") ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50"}`}>
            {isActive("/admin/guru") && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full"></div>}
            <UsersThree size={20} weight={isActive("/admin/guru") ? "fill" : "bold"} /> Manajemen Guru
          </Link>
          
          <Link href="/admin/santri" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all relative ${isActive("/admin/santri") ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50"}`}>
            {isActive("/admin/santri") && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full"></div>}
            <Student size={20} weight={isActive("/admin/santri") ? "fill" : "bold"} /> Database Santri
          </Link>
          
          <Link href="/admin/template" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all relative ${isActive("/admin/template") ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50"}`}>
            {isActive("/admin/template") && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full"></div>}
            <ListChecks size={20} weight={isActive("/admin/template") ? "fill" : "bold"} /> Master Template
          </Link>
        </div>

        {/* FOOTER SIDEBAR - TOMBOL KELUAR SISTEM */}
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-500 hover:bg-red-50 rounded-xl font-bold transition-all"
          >
            <SignOut size={20} weight="bold" /> Keluar Sistem
          </button>
        </div>
      </aside>

      {/* AREA KONTEN KANAN */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
            <span className="text-indigo-600">Portal Admin</span> <span className="hidden sm:inline">/ Sistem Manajemen</span>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="https://wa.me/6288227617030" target="_blank" rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all relative group" title="Hubungi Bantuan via WhatsApp"
            >
              <WhatsappLogo size={22} weight="fill" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white group-hover:border-emerald-500 animate-pulse"></span>
            </a>

            <div className="h-8 w-px bg-slate-200"></div>
            
            <div onClick={() => { setEditForm(profil); setIsEditModalOpen(true); }} className="flex items-center gap-3 cursor-pointer group p-2 rounded-xl hover:bg-slate-100 transition-all" title="Pengaturan Profil">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{profil.nama}</p>
                <p className="text-[10px] font-bold text-slate-400">{profil.institusi}</p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black border border-indigo-200 group-hover:scale-105 transition-transform">
                {profil.nama.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-hide">
          {children}
        </main>

        {/* MODAL EDIT PROFIL */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity">
            <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden transform transition-all">
              <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black flex items-center gap-2"><UserCircleGear size={24} weight="fill" /> Pengaturan Profil</h3>
                  <p className="text-indigo-200 text-xs font-medium mt-1">Perbarui data admin dan identitas instansi.</p>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"><X size={20} weight="bold" /></button>
              </div>

              <form onSubmit={handleSimpanProfil} className="p-6 sm:p-8 space-y-5 bg-slate-50">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2"><BuildingsIcon size={14} weight="bold" /> Nama Institusi / Sekolah</label>
                  <input required type="text" value={editForm.institusi} onChange={(e) => setEditForm({...editForm, institusi: e.target.value})} className="w-full p-3.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 shadow-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2"><PencilSimpleLine size={14} weight="bold" /> Nama Admin</label>
                  <input required type="text" value={editForm.nama} onChange={(e) => setEditForm({...editForm, nama: e.target.value})} className="w-full p-3.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 shadow-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2"><EnvelopeSimple size={14} weight="bold" /> Email Kontak</label>
                  <input required type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="w-full p-3.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 shadow-sm" />
                </div>
                <div className="pt-6 mt-6 border-t border-slate-200 flex gap-3">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-sm transition-colors shadow-sm">Batal</button>
                  <button type="submit" disabled={isSavingProfile} className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-sm transition-colors shadow-lg flex justify-center items-center">
                    {isSavingProfile ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CaretLeft, FolderOpen, MagnifyingGlass, FileText, CalendarBlank, Users } from "@phosphor-icons/react";

export default function DetailArsipGuruPage() {
  const params = useParams();
  const id = params.id as string; // ID Guru dari URL
  
  const [profilGuru, setProfilGuru] = useState<{nama: string, email: string} | null>(null);
  const [daftarArsip, setDaftarArsip] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchDetailGuru = async () => {
      try {
        const res = await fetch(`/api/admin/guru/arsip?guru_id=${id}`);
        const data = await res.json();
        
        if (data.profil) setProfilGuru(data.profil);
        if (data.arsip) setDaftarArsip(data.arsip);
      } catch (error) {
        console.error("Gagal memuat detail guru:", error);
      }
      setIsLoading(false);
    };

    if (id) fetchDetailGuru();
  }, [id]);

  const filteredArsip = daftarArsip.filter(a => 
    a.judul_ujian?.toLowerCase().includes(search.toLowerCase()) || 
    a.kelas?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* TOMBOL KEMBALI */}
        <div className="mb-8 border-b border-slate-200 pb-4">
          <Link href="/admin/guru" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition-all text-sm shadow-sm">
            <CaretLeft size={16} weight="bold" /> Kembali ke Manajemen Guru
          </Link>
        </div>

        {/* HEADER PROFIL GURU */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 mb-8 flex items-center gap-6">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-4xl shadow-inner">
            {profilGuru?.nama ? profilGuru.nama.charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded">Status: Read-Only</span>
              <span className="text-xs font-bold text-slate-400">Pengawas: Administrator</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              {profilGuru ? profilGuru.nama : "Memuat Profil..."}
            </h1>
            <p className="text-sm font-bold text-slate-500">{profilGuru?.email}</p>
          </div>
        </div>

        {/* DAFTAR ARSIP UJIAN */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <FolderOpen size={24} className="text-blue-600" weight="fill" /> Arsip Ujian Dibuat
            </h2>
            <div className="relative w-full sm:w-80">
              <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Cari judul ujian atau kelas..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="py-12 text-center text-slate-500 font-bold flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                Memuat riwayat ujian...
              </div>
            ) : filteredArsip.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                  <FileText size={40} weight="light" />
                </div>
                <h3 className="text-xl font-black text-slate-700 mb-2">Arsip Masih Kosong</h3>
                <p className="text-sm font-medium text-slate-500 max-w-sm">Guru ini belum membuat ujian atau menyimpan LJK apapun di sistem.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArsip.map((arsip) => (
                  <div key={arsip.id} className="border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 transition-all group">
                    <h3 className="font-black text-slate-800 text-lg mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {arsip.judul_ujian || "Ujian Tanpa Judul"}
                    </h3>
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <Users size={16} /> Kelas: <span className="text-slate-700">{arsip.kelas || "-"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <CalendarBlank size={16} /> Dibuat: {new Date(arsip.created_at).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                    <button className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors border border-blue-200/50">
                      Lihat Detail Ujian
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
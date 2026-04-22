"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  ListChecks, 
  MagnifyingGlass, 
  PencilSimple, 
  Trash, 
  Plus 
} from "@phosphor-icons/react";

export default function MasterTemplateLJKPage() {
  const [daftarTemplate, setDaftarTemplate] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State Filter
  const [search, setSearch] = useState("");
  const [filterOpsi, setFilterOpsi] = useState("Semua");

  // --- AMBIL DATA DARI API ---
  const fetchTemplate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/template');
      const data = await res.json();
      if (Array.isArray(data)) setDaftarTemplate(data);
    } catch (error) { 
      console.error("Gagal mengambil data template:", error); 
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchTemplate(); }, []);

  // --- LOGIKA HAPUS ---
  const handleHapus = async (id: string, nama: string) => {
    if (!confirm(`Tindakan ini permanen. Yakin ingin menghapus template "${nama}"?`)) return;
    try {
      const res = await fetch(`/api/admin/template?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDaftarTemplate(daftarTemplate.filter(t => t.id !== id));
      } else {
        alert("Gagal menghapus template.");
      }
    } catch (error) { 
      alert("Terjadi kesalahan jaringan."); 
    }
  };

  // --- LOGIKA FILTER PENCARIAN ---
  const filteredData = useMemo(() => {
    return daftarTemplate.filter(t => {
      const matchSearch = t.nama_template?.toLowerCase().includes(search.toLowerCase());
      const matchOpsi = filterOpsi === "Semua" ? true : t.opsi === filterOpsi;
      return matchSearch && matchOpsi;
    });
  }, [daftarTemplate, search, filterOpsi]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* HEADER & TOMBOL TAMBAH */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pt-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <ListChecks size={36} className="text-indigo-600" weight="fill" /> Manajemen Master LJK
            </h1>
            <p className="text-sm font-bold text-slate-500 mt-1">
              Standarisasi format lembar jawaban untuk seluruh pengajar sekolah.
            </p>
          </div>
          
          {/* TOMBOL INI MENGARAH KE FOLDER /editor */}
          <Link 
            href="/admin/template/editor" 
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all text-sm w-full sm:w-auto"
          >
            <Plus size={20} weight="bold" /> Buat Template Baru
          </Link>
        </div>

        {/* AREA TABEL DATA */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* BARIS PENCARIAN & FILTER */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-2 text-slate-700 font-black text-sm">
              Total: <span className="text-indigo-600 text-lg">{filteredData.length}</span> Template
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <select 
                value={filterOpsi} 
                onChange={(e) => setFilterOpsi(e.target.value)}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none min-w-[150px]"
              >
                <option value="Semua">Semua Opsi</option>
                <option value="A-D">4 Pilihan (A-D)</option>
                <option value="A-E">5 Pilihan (A-E)</option>
                <option value="B/S">Benar / Salah</option>
              </select>

              <div className="relative flex-1 sm:w-64">
                <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" weight="bold" />
                <input 
                  type="text" 
                  placeholder="Cari nama template..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
                />
              </div>
            </div>
          </div>

          {/* TABEL */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/30">
                  <th className="p-4 pl-8">Nama Identitas Master</th>
                  <th className="p-4 text-center">Jml Soal</th>
                  <th className="p-4 text-center">Opsi</th>
                  <th className="p-4 text-center">Kolom</th>
                  <th className="p-4 pr-8 text-right">Aksi Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 font-bold">Memuat data master...</td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 font-bold">Template tidak ditemukan.</td>
                  </tr>
                ) : filteredData.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group text-sm">
                    <td className="p-4 pl-8">
                      <div className="font-black text-slate-800 uppercase">{t.nama_template}</div>
                      <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                        Dibuat: {new Date(t.created_at).toLocaleDateString('id-ID')}
                      </div>
                    </td>
                    <td className="p-4 text-center font-black text-slate-700">{t.jumlah_soal}</td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black">{t.opsi}</span>
                    </td>
                    <td className="p-4 text-center font-bold text-slate-500">{t.kolom} Kolom</td>
                    <td className="p-4 pr-8 text-right space-x-2">
                      
                      {/* TOMBOL EDIT - Mengirim ID via URL ke halaman Editor */}
                      <Link 
                        href={`/admin/template/editor?editId=${t.id}`} 
                        className="inline-flex p-2 text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors items-center" 
                        title="Edit Template"
                      >
                        <PencilSimple size={18} weight="bold"/>
                      </Link>

                      <button 
                        onClick={() => handleHapus(t.id, t.nama_template)} 
                        className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors inline-flex items-center" 
                        title="Hapus"
                      >
                        <Trash size={18} weight="bold"/>
                      </button>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FOOTER TABEL */}
          <div className="bg-slate-50 p-4 px-8 flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-widest border-t border-slate-100">
            <span>Total: {filteredData.length} Template Tersimpan</span>
            <span>FastTest Institutional</span>
          </div>

        </div>
      </div>
    </div>
  );
}
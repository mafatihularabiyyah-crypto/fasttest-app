"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  UserPlus, 
  Trash, 
  MagnifyingGlass, 
  UsersThree, 
  CaretLeft, 
  FolderOpen,
  EnvelopeSimple,
  LockKey
} from "@phosphor-icons/react";

export default function ManajemenGuruPage() {
  const [daftarGuru, setDaftarGuru] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nama: "", email: "", password: "" });

  const fetchGuru = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/guru');
      const data = await res.json();
      if (Array.isArray(data)) setDaftarGuru(data);
    } catch (error) {
      console.error("Gagal memuat data:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchGuru(); }, []);

  const handleDaftarGuru = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/guru', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert("Berhasil! Akun login Guru telah dibuat.");
        setIsModalOpen(false);
        setFormData({ nama: "", email: "", password: "" });
        fetchGuru();
      } else {
        const err = await res.json();
        alert(`Gagal: ${err.error}`);
      }
    } catch (error) { alert("Terjadi kesalahan sistem."); }
    setIsSaving(false);
  };

  const handleHapusGuru = async (id: string, nama: string) => {
    if (!confirm(`Tindakan ini permanen. Yakin ingin mencabut akses dan menghapus akun Ustadz/Ustadzah ${nama}?`)) return;
    try {
      const res = await fetch(`/api/admin/guru?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDaftarGuru(daftarGuru.filter(g => g.id !== id));
      } else { alert("Gagal menghapus akun."); }
    } catch (error) { alert("Terjadi kesalahan."); }
  };

  const filteredGuru = daftarGuru.filter(g => 
    g.nama?.toLowerCase().includes(search.toLowerCase()) || 
    g.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* TOMBOL KEMBALI & TAB NAVIGASI */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 mb-8 pb-4">
          <Link href="/admin" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition-all text-sm shadow-sm">
            <CaretLeft size={16} weight="bold" /> Dashboard Utama
          </Link>
          
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/guru" className="px-5 py-2.5 rounded-xl font-black text-blue-700 bg-blue-100/50 shadow-sm transition-colors">Manajemen Guru</Link>
            <Link href="/admin/santri" className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">Data Santri Aktif</Link>
            <Link href="/admin/template" className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">Master Template LJK</Link>
          </div>
        </div>

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <UsersThree size={36} className="text-blue-600" weight="fill" /> Manajemen Akun Guru
            </h1>
            <p className="text-sm font-bold text-slate-500 mt-1">Kelola akses login dan pantau arsip ujian ustadz/ustadzah.</p>
          </div>
          <div>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 w-full sm:w-auto">
              <UserPlus size={20} weight="bold" /> Daftarkan Guru Baru
            </button>
          </div>
        </div>

        {/* TABEL DATA */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-2 text-slate-700 font-black text-sm">
              Total: <span className="text-blue-600 text-lg">{daftarGuru.length}</span> Pengajar
            </div>
            <div className="relative w-full sm:w-80">
              <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Cari nama atau email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-xs font-black text-slate-400 uppercase tracking-wider">
                  <th className="p-4 pl-6">Profil Pengajar</th>
                  <th className="p-4">Email Login</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Aksi Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={4} className="p-12 text-center text-slate-500 font-bold">Memuat data pengajar...</td></tr>
                ) : filteredGuru.length === 0 ? (
                  <tr><td colSpan={4} className="p-12 text-center text-slate-500 font-bold">Belum ada akun guru yang didaftarkan.</td></tr>
                ) : filteredGuru.map((guru) => (
                  <tr key={guru.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 pl-6 font-black text-slate-800 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-lg">
                        {guru.nama.charAt(0).toUpperCase()}
                      </div>
                      {guru.nama}
                    </td>
                    <td className="p-4 font-bold text-slate-500">{guru.email}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded border border-emerald-200">Aktif</span>
                    </td>
                    <td className="p-4 pr-6 text-right space-x-2">
                      {/* TOMBOL LIHAT ARSIP GURU */}
<Link 
  href={`/admin/guru/${guru.id}`}
  className="p-2 text-blue-500 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-bold"
  title="Intip Arsip Ujian Guru Ini"
>
  <FolderOpen size={18} weight="bold" /> Arsip
</Link>
                      
                      <button 
                        onClick={() => handleHapusGuru(guru.id, guru.nama)} 
                        className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors inline-flex items-center"
                        title="Cabut Akses Login"
                      >
                        <Trash size={18} weight="bold" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL PENDAFTARAN GURU */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
              <h3 className="text-xl font-black text-slate-800 mb-2">Buat Akun Guru</h3>
              <p className="text-xs font-bold text-slate-500 mb-6">Guru akan menggunakan Email dan Password ini untuk masuk ke aplikasi ujian.</p>
              
              <form onSubmit={handleDaftarGuru} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nama Lengkap & Gelar</label>
                  <input required type="text" value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" placeholder="Ustadz Fulan, S.Pd"/>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><EnvelopeSimple size={14}/> Email Login</label>
                  <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" placeholder="guru@sekolah.com"/>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><LockKey size={14}/> Password Baru</label>
                  <input required type="text" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" placeholder="Minimal 6 karakter" minLength={6}/>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm transition-colors">Batal</button>
                  <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors flex justify-center items-center">
                    {isSaving ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : "Simpan Akun"}
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
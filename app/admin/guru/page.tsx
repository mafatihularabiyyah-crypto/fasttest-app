"use client";

import { useState, useEffect } from "react";
import { UserCirclePlus, UsersThree, Trash, MagnifyingGlass, EnvelopeSimple, LockKey } from "@phosphor-icons/react";

export default function ManajemenGuruPage() {
  const [daftarGuru, setDaftarGuru] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  
  // State Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nama: "", email: "", password: "" });

  const fetchGuru = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/guru');
      const data = await res.json();
      if (Array.isArray(data)) setDaftarGuru(data);
    } catch (error) {
      console.error("Gagal memuat data guru:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchGuru();
  }, []);

  const handleBuatAkun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) return alert("Password minimal 6 karakter!");
    
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/guru', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: formData.nama,
          email: formData.email,
          password: formData.password,
          sekolah_id: "TARBIYAHTECH_SCHOOL_01" // ID Sekolah Dummy
        })
      });
      
      const result = await res.json();
      if (res.ok) {
        alert("Berhasil! Akun guru siap digunakan.");
        setIsModalOpen(false);
        setFormData({ nama: "", email: "", password: "" });
        fetchGuru(); // Refresh tabel
      } else {
        alert(`Gagal: ${result.error}`);
      }
    } catch (error) {
      alert("Terjadi kesalahan jaringan.");
    }
    setIsSaving(false);
  };

  const handleHapusGuru = async (id: string, nama: string) => {
    if (!confirm(`Yakin ingin mencabut akses dan menghapus akun Ustadz/ah ${nama}?`)) return;
    
    try {
      const res = await fetch(`/api/admin/guru?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDaftarGuru(daftarGuru.filter(g => g.id !== id));
      } else {
        alert("Gagal menghapus akun.");
      }
    } catch (error) {
      alert("Terjadi kesalahan jaringan.");
    }
  };

  const filteredGuru = daftarGuru.filter(g => g.nama?.toLowerCase().includes(search.toLowerCase()) || g.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded">Panel Admin Sekolah</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Manajemen Akun Guru</h1>
            <p className="text-sm font-bold text-slate-500 mt-1">Kelola akses *login* dan data pengajar di sekolah Anda.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/30">
            <UserCirclePlus size={20} weight="bold" /> Daftarkan Guru Baru
          </button>
        </div>

        {/* TABEL DATA */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-2 text-slate-700 font-black">
              <UsersThree size={24} weight="fill" className="text-indigo-500"/> Daftar Pengajar Aktif
            </div>
            <div className="relative w-full sm:w-72">
              <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Cari nama atau email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-xs font-black text-slate-400 uppercase tracking-wider">
                  <th className="p-4 pl-6">Nama Lengkap</th>
                  <th className="p-4">Email Login</th>
                  <th className="p-4">Status Akses</th>
                  <th className="p-4 pr-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={4} className="p-12 text-center text-slate-500 font-bold">Memuat data pengajar...</td></tr>
                ) : filteredGuru.length === 0 ? (
                  <tr><td colSpan={4} className="p-12 text-center text-slate-500 font-bold">Belum ada akun guru yang didaftarkan.</td></tr>
                ) : filteredGuru.map((guru) => (
                  <tr key={guru.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6 font-black text-slate-800">{guru.nama}</td>
                    <td className="p-4 font-bold text-slate-500">{guru.email}</td>
                    <td className="p-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded border border-emerald-200">Aktif</span></td>
                    <td className="p-4 pr-6 text-right">
                      <button onClick={() => handleHapusGuru(guru.id, guru.nama)} className="p-2 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-bold"><Trash size={16} weight="bold" /> Cabut Akses</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL BUAT AKUN */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
              <h3 className="text-xl font-black text-slate-800 mb-2">Buat Akun Guru</h3>
              <p className="text-xs font-bold text-slate-500 mb-6">Guru akan menggunakan Email dan Password ini untuk masuk ke aplikasi ujian.</p>
              
              <form onSubmit={handleBuatAkun} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nama Lengkap & Gelar</label>
                  <input required type="text" value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700" placeholder="Contoh: Ustadz Ahmad, S.Pd"/>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><EnvelopeSimple size={14}/> Email Login</label>
                  <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700" placeholder="ahmad@sekolah.com"/>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><LockKey size={14}/> Password Baru</label>
                  <input required type="text" minLength={6} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700" placeholder="Minimal 6 karakter"/>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm transition-colors">Batal</button>
                  <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors flex justify-center items-center">
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
"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  UserPlus, Student, Trash, MagnifyingGlass, 
  PencilSimple, MicrosoftExcelLogo, FileArrowDown
} from "@phosphor-icons/react";

export default function ManajemenSantriLengkap() {
  const [daftarSantri, setDaftarSantri] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Fitur Filter & Pencarian
  const [search, setSearch] = useState("");
  const [filterKelas, setFilterKelas] = useState("Semua");
  const [filterGender, setFilterGender] = useState("Semua");
  
  // Fitur Modal (Tambah & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ 
    nama: "", 
    nis: "", 
    nisn: "", 
    kelas: "", 
    jenis_kelamin: "L" 
  });

  const fetchSantri = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/santri');
      const data = await res.json();
      if (Array.isArray(data)) setDaftarSantri(data);
    } catch (error) {
      console.error("Gagal memuat data santri:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchSantri(); }, []);

  const daftarKelasUnik = useMemo(() => {
    const kelas = daftarSantri.map(s => s.kelas).filter(Boolean);
    return Array.from(new Set(kelas)).sort();
  }, [daftarSantri]);

  const handleSimpanSantri = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const method = editId ? 'PUT' : 'POST';
    const payload = editId ? { id: editId, ...formData } : formData;

    try {
      const res = await fetch('/api/admin/santri', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert(`Berhasil! Data santri telah ${editId ? 'diperbarui' : 'ditambahkan'}.`);
        setIsModalOpen(false);
        fetchSantri();
      } else { alert("Gagal menyimpan data."); }
    } catch (error) { alert("Terjadi kesalahan jaringan."); }
    setIsSaving(false);
  };

  const openEditModal = (santri: any) => {
    setEditId(santri.id);
    setFormData({ 
      nama: santri.nama, 
      nis: santri.nis, 
      nisn: santri.nisn || "",
      kelas: santri.kelas,
      jenis_kelamin: santri.jenis_kelamin || "L" 
    });
    setIsModalOpen(true);
  };

  const openTambahModal = () => {
    setEditId(null);
    setFormData({ nama: "", nis: "", nisn: "", kelas: "", jenis_kelamin: "L" });
    setIsModalOpen(true);
  };

  const handleExportCSV = () => {
    if (filteredSantri.length === 0) return alert("Tidak ada data untuk diekspor");
    
    const header = ["Nama", "NIS", "NISN", "Kelas", "L/P"];
    const rows = filteredSantri.map(s => [
      `"${s.nama}"`, 
      s.nis, 
      s.nisn || "-", 
      `"${s.kelas}"`, 
      s.jenis_kelamin
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + header.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Santri_${filterKelas}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleHapusSantri = async (id: string, nama: string) => {
    if (!confirm(`Yakin ingin menghapus siswa ${nama}?`)) return;
    try {
      const res = await fetch(`/api/admin/santri?id=${id}`, { method: 'DELETE' });
      if (res.ok) setDaftarSantri(daftarSantri.filter(s => s.id !== id));
    } catch (error) { alert("Gagal menghapus santri."); }
  };

  const filteredSantri = daftarSantri.filter(s => {
    const matchSearch = s.nama?.toLowerCase().includes(search.toLowerCase()) || 
                        s.nis?.toLowerCase().includes(search.toLowerCase()) ||
                        s.nisn?.toLowerCase().includes(search.toLowerCase());
    const matchKelas = filterKelas === "Semua" ? true : s.kelas === filterKelas;
    const matchGender = filterGender === "Semua" ? true : s.jenis_kelamin === filterGender;
    return matchSearch && matchKelas && matchGender;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* HEADER SECTION (TANPA TAB NAVIGASI) */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8 pt-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <Student size={36} className="text-indigo-600" weight="fill" /> Kelola Data Santri
            </h1>
            <p className="text-sm font-bold text-slate-500 mt-1">Pusat database siswa peserta ujian untuk instansi Anda.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleExportCSV} className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-3 rounded-xl font-bold text-sm transition-all shadow-sm">
              <FileArrowDown size={20} weight="bold" /> Export CSV
            </button>
            <button onClick={() => alert("Fitur Upload Excel akan segera hadir!")} className="flex items-center justify-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-4 py-3 rounded-xl font-bold transition-all shadow-sm text-sm">
              <MicrosoftExcelLogo size={20} weight="fill" /> Import
            </button>
            <button onClick={openTambahModal} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/30 text-sm">
              <UserPlus size={20} weight="bold" /> Input Baru
            </button>
          </div>
        </div>

        {/* TABEL DATA */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* BARIS PENCARIAN & FILTER */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-2 text-slate-700 font-black text-sm">
              Total: <span className="text-indigo-600 text-lg">{filteredSantri.length}</span> Siswa
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <select 
                value={filterGender} 
                onChange={(e) => setFilterGender(e.target.value)}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none min-w-[100px]"
              >
                <option value="Semua">Semua L/P</option>
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>

              <select 
                value={filterKelas} 
                onChange={(e) => setFilterKelas(e.target.value)}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none min-w-[120px]"
              >
                <option value="Semua">Semua Kelas</option>
                {daftarKelasUnik.map(kls => (
                  <option key={kls} value={kls}>Kelas {kls}</option>
                ))}
              </select>

              <div className="relative flex-1 sm:w-56">
                <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari nama / NIS..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" 
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/30">
                  <th className="p-4 pl-6">Nama Lengkap</th>
                  <th className="p-4">NIS / NISN</th>
                  <th className="p-4">L/P</th>
                  <th className="p-4">Kelas</th>
                  <th className="p-4 pr-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-12 text-center text-slate-500 font-bold">Memuat data siswa...</td></tr>
                ) : filteredSantri.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-slate-500 font-bold">Data siswa tidak ditemukan.</td></tr>
                ) : filteredSantri.map((santri) => (
                  <tr key={santri.id} className="hover:bg-slate-50/80 transition-colors group text-sm">
                    <td className="p-4 pl-6 font-black text-slate-800 uppercase">{santri.nama}</td>
                    <td className="p-4 font-bold">
                      <div className="text-slate-600">{santri.nis}</div>
                      <div className="text-[10px] text-indigo-400 mt-0.5">{santri.nisn ? `NISN: ${santri.nisn}` : "-"}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-black ${santri.jenis_kelamin === 'L' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                        {santri.jenis_kelamin === 'L' ? 'LAKI-LAKI' : 'PEREMPUAN'}
                      </span>
                    </td>
                    <td className="p-4"><span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200">{santri.kelas}</span></td>
                    <td className="p-4 pr-6 text-right space-x-2">
                      <button onClick={() => openEditModal(santri)} className="p-2 text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors inline-flex items-center" title="Edit Data">
                        <PencilSimple size={18} weight="bold" />
                      </button>
                      <button onClick={() => handleHapusSantri(santri.id, santri.nama)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors inline-flex items-center" title="Hapus">
                        <Trash size={18} weight="bold" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL INPUT/EDIT SANTRI */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
              <h3 className="text-xl font-black text-slate-800 mb-2">
                {editId ? "Edit Data Santri" : "Input Data Santri"}
              </h3>
              <p className="text-xs font-bold text-slate-500 mb-6">Pastikan data NIS akurat untuk mempermudah identifikasi scanner LJK.</p>
              
              <form onSubmit={handleSimpanSantri} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nama Lengkap</label>
                  <input required type="text" value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700" placeholder="Fulan bin Fulan"/>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">NIS (Wajib)</label>
                    <input required type="text" value={formData.nis} onChange={(e) => setFormData({...formData, nis: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700" placeholder="102938"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">NISN (Opsional)</label>
                    <input type="text" value={formData.nisn} onChange={(e) => setFormData({...formData, nisn: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700" placeholder="004123..."/>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">Jenis Kelamin</label>
                    <select value={formData.jenis_kelamin} onChange={(e) => setFormData({...formData, jenis_kelamin: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 appearance-none">
                      <option value="L">Laki-laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">Kelas</label>
                    <input required type="text" value={formData.kelas} onChange={(e) => setFormData({...formData, kelas: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700" placeholder="7A"/>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm transition-colors">Batal</button>
                  <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors flex justify-center items-center">
                    {isSaving ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : "Simpan Data"}
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
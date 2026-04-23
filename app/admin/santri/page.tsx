"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { 
  UserPlus, Student, Trash, MagnifyingGlass, 
  PencilSimple, MicrosoftExcelLogo, FileArrowDown,
  CheckSquareOffset, GraduationCap, Archive, ArrowBendUpRight, X
} from "@phosphor-icons/react";
import * as XLSX from 'xlsx';

export default function ManajemenSantriLengkap() {
  const [daftarSantri, setDaftarSantri] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // Fitur Filter & Pencarian
  const [search, setSearch] = useState("");
  const [filterKelas, setFilterKelas] = useState("Semua");
  const [filterGender, setFilterGender] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Aktif"); // Baru: Filter Status
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fitur Modal (Tambah & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nama: "", nis: "", nisn: "", kelas: "", jenis_kelamin: "L", status: "Aktif" });

  // FITUR MASSAL (BULK ACTION)
  const [selectedSantri, setSelectedSantri] = useState<string[]>([]);
  const [isModalNaikKelas, setIsModalNaikKelas] = useState(false);
  const [kelasBaruMasal, setKelasBaruMasal] = useState("");
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const fetchSantri = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/santri');
      const data = await res.json();
      if (Array.isArray(data)) {
        // Memastikan data lama yang belum punya status, otomatis dianggap 'Aktif'
        const sanitizedData = data.map(s => ({ ...s, status: s.status || "Aktif" }));
        setDaftarSantri(sanitizedData);
      }
    } catch (error) {
      console.error("Gagal memuat data santri:", error);
    }
    setIsLoading(false);
    setSelectedSantri([]); // Reset pilihan
  };

  useEffect(() => { fetchSantri(); }, []);

  const daftarKelasUnik = useMemo(() => {
    const kelas = daftarSantri.map(s => s.kelas).filter(Boolean);
    return Array.from(new Set(kelas)).sort();
  }, [daftarSantri]);

  // --- LOGIKA FILTERING ---
  const filteredSantri = daftarSantri.filter(s => {
    const matchSearch = s.nama?.toLowerCase().includes(search.toLowerCase()) || 
                        s.nis?.toLowerCase().includes(search.toLowerCase()) ||
                        s.nisn?.toLowerCase().includes(search.toLowerCase());
    const matchKelas = filterKelas === "Semua" ? true : s.kelas === filterKelas;
    const matchGender = filterGender === "Semua" ? true : s.jenis_kelamin === filterGender;
    const matchStatus = filterStatus === "Semua" ? true : s.status === filterStatus;
    
    return matchSearch && matchKelas && matchGender && matchStatus;
  });

  // --- LOGIKA CHECKBOX MASSAL ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedSantri(filteredSantri.map(s => s.id));
    else setSelectedSantri([]);
  };

  const handleSelectRow = (id: string) => {
    if (selectedSantri.includes(id)) setSelectedSantri(selectedSantri.filter(selectedId => selectedId !== id));
    else setSelectedSantri([...selectedSantri, id]);
  };

  // --- FUNGSI AKSI MASSAL ---
  const handleBulkHapus = async () => {
    if (!confirm(`Tindakan ini tidak bisa dibatalkan!\nYakin ingin MENGHAPUS PERMANEN ${selectedSantri.length} siswa yang dipilih?`)) return;
    setIsBulkProcessing(true);
    try {
      // Loop hapus satu persatu (Bisa dioptimalkan dengan API bulk delete jika ada)
      await Promise.all(selectedSantri.map(id => fetch(`/api/admin/santri?id=${id}`, { method: 'DELETE' })));
      alert(`Berhasil menghapus ${selectedSantri.length} data santri.`);
      fetchSantri();
    } catch (error) { alert("Gagal menghapus beberapa santri."); }
    setIsBulkProcessing(false);
  };

  const handleBulkLuluskan = async () => {
    if (!confirm(`Pindahkan ${selectedSantri.length} siswa ini ke Arsip Alumni?\nMereka akan disembunyikan dari daftar aktif.`)) return;
    setIsBulkProcessing(true);
    try {
      const targetSantri = daftarSantri.filter(s => selectedSantri.includes(s.id));
      await Promise.all(targetSantri.map(s => fetch('/api/admin/santri', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...s, status: "Alumni" })
      })));
      alert(`Berhasil mengarsipkan ${selectedSantri.length} siswa sebagai Alumni.`);
      fetchSantri();
    } catch (error) { alert("Gagal memproses arsip."); }
    setIsBulkProcessing(false);
  };

  const handleBulkNaikKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kelasBaruMasal.trim()) return alert("Masukkan nama kelas yang baru!");
    setIsBulkProcessing(true);
    try {
      const targetSantri = daftarSantri.filter(s => selectedSantri.includes(s.id));
      await Promise.all(targetSantri.map(s => fetch('/api/admin/santri', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...s, kelas: kelasBaruMasal.trim().toUpperCase(), status: "Aktif" })
      })));
      alert(`Berhasil memindahkan ${selectedSantri.length} siswa ke kelas ${kelasBaruMasal.toUpperCase()}.`);
      setIsModalNaikKelas(false);
      setKelasBaruMasal("");
      fetchSantri();
    } catch (error) { alert("Gagal menaikkan kelas."); }
    setIsBulkProcessing(false);
  };

  // --- CRUD DASAR ---
  const handleSimpanSantri = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const method = editId ? 'PUT' : 'POST';
    const payload = editId ? { id: editId, ...formData } : formData;

    try {
      const res = await fetch('/api/admin/santri', {
        method: method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert(`Berhasil! Data santri telah ${editId ? 'diperbarui' : 'ditambahkan'}.`);
        setIsModalOpen(false); fetchSantri();
      } else { alert("Gagal menyimpan data."); }
    } catch (error) { alert("Terjadi kesalahan jaringan."); }
    setIsSaving(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(worksheet) as any[];
        
        if (!rawData || rawData.length === 0) return alert("File kosong.");
        let totalSukses = 0, totalGagal = 0;
        alert("Memproses data, mohon jangan tutup halaman...");

        for (const row of rawData) {
          const namaSiswa = row['Nama'] || row['nama'] || row['NAMA'];
          const nisSiswa = row['NIS'] || row['nis'] || row['Nis'];
          if (!namaSiswa || !nisSiswa) continue; 

          const payload = {
            nama: String(namaSiswa).trim(), nis: String(nisSiswa).trim(),
            nisn: String(row['NISN'] || "").trim(), kelas: String(row['Kelas'] || "").trim(),
            jenis_kelamin: String(row['L/P'] || "L").toUpperCase().startsWith("P") ? "P" : "L",
            status: "Aktif" // Otomatis aktif saat import
          };

          try {
            const res = await fetch('/api/admin/santri', {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            if (res.ok) totalSukses++; else totalGagal++;
          } catch (err) { totalGagal++; }
        }
        alert(`Import Selesai!\n✅ Berhasil: ${totalSukses}\n❌ Gagal/Kembar: ${totalGagal}`);
        fetchSantri();
      } catch (error) { alert("Format Excel tidak valid."); } finally {
        setIsImporting(false); if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExportCSV = () => {
    if (filteredSantri.length === 0) return alert("Tidak ada data untuk diekspor");
    const header = ["Nama", "NIS", "NISN", "Kelas", "L/P", "Status"];
    const rows = filteredSantri.map(s => [`"${s.nama}"`, s.nis, s.nisn || "-", `"${s.kelas}"`, s.jenis_kelamin, s.status]);
    const csvContent = "data:text/csv;charset=utf-8," + header.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Data_Santri_${filterKelas}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const openEditModal = (santri: any) => {
    setEditId(santri.id);
    setFormData({ nama: santri.nama, nis: santri.nis, nisn: santri.nisn || "", kelas: santri.kelas, jenis_kelamin: santri.jenis_kelamin || "L", status: santri.status || "Aktif" });
    setIsModalOpen(true);
  };

  const openTambahModal = () => {
    setEditId(null);
    setFormData({ nama: "", nis: "", nisn: "", kelas: "", jenis_kelamin: "L", status: "Aktif" });
    setIsModalOpen(true);
  };

  const handleHapusSantri = async (id: string, nama: string) => {
    if (!confirm(`Yakin ingin menghapus permanen siswa ${nama}?`)) return;
    try {
      const res = await fetch(`/api/admin/santri?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDaftarSantri(daftarSantri.filter(s => s.id !== id));
        alert("Siswa berhasil dihapus.");
      } else {
        alert("Gagal menghapus santri.");
      }
    } catch (error) { 
      alert("Terjadi kesalahan jaringan."); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* HEADER SECTION */}
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
            <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="flex items-center justify-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-4 py-3 rounded-xl font-bold transition-all shadow-sm text-sm disabled:opacity-50">
              {isImporting ? <span className="w-5 h-5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin"></span> : <MicrosoftExcelLogo size={20} weight="fill" />} 
              {isImporting ? "Mengimpor..." : "Import Excel"}
            </button>
            <button onClick={openTambahModal} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/30 text-sm">
              <UserPlus size={20} weight="bold" /> Input Baru
            </button>
          </div>
        </div>

        {/* TABEL DATA & FILTER */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* BARIS PENCARIAN & FILTER CANGGIH */}
          <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-2 text-slate-700 font-black text-sm">
              <span className="text-indigo-600 text-lg">{filteredSantri.length}</span> Siswa Ditampilkan
            </div>
            
            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
              {/* FILTER STATUS (BARU) */}
              <div className="flex bg-slate-200/50 p-1 rounded-xl">
                <button onClick={() => setFilterStatus("Aktif")} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${filterStatus === 'Aktif' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Aktif</button>
                <button onClick={() => setFilterStatus("Alumni")} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${filterStatus === 'Alumni' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Alumni / Lulus</button>
                <button onClick={() => setFilterStatus("Semua")} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${filterStatus === 'Semua' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Semua</button>
              </div>

              <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none min-w-[120px]">
                <option value="Semua">Semua Kelas</option>
                {daftarKelasUnik.map(kls => <option key={kls} value={kls}>Kelas {kls}</option>)}
              </select>

              <div className="relative flex-1 min-w-[200px]">
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" placeholder="Cari nama / NIS..." value={search} onChange={(e) => setSearch(e.target.value)} 
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" 
                />
              </div>
            </div>
          </div>

          {/* FLOATING ACTION BAR (Muncul jika ada siswa yang dicentang) */}
          {selectedSantri.length > 0 && (
            <div className="bg-indigo-50 border-b border-indigo-100 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <CheckSquareOffset size={20} weight="fill" className="text-indigo-600" />
                <span className="text-sm font-black text-indigo-900">{selectedSantri.length} Siswa Terpilih</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsModalNaikKelas(true)} disabled={isBulkProcessing} className="px-4 py-2 bg-white border border-indigo-200 text-indigo-700 font-bold text-xs rounded-lg shadow-sm hover:bg-indigo-100 flex items-center gap-1 transition-colors">
                  <ArrowBendUpRight size={14} weight="bold"/> Naik Kelas
                </button>
                <button onClick={handleBulkLuluskan} disabled={isBulkProcessing} className="px-4 py-2 bg-amber-100 border border-amber-200 text-amber-700 font-bold text-xs rounded-lg shadow-sm hover:bg-amber-200 flex items-center gap-1 transition-colors">
                  <GraduationCap size={14} weight="bold"/> Arsipkan (Lulus)
                </button>
                <button onClick={handleBulkHapus} disabled={isBulkProcessing} className="px-4 py-2 bg-red-100 border border-red-200 text-red-700 font-bold text-xs rounded-lg shadow-sm hover:bg-red-200 flex items-center gap-1 transition-colors">
                  <Trash size={14} weight="bold"/> Hapus
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-4 pl-6 w-12">
                    <input 
                      type="checkbox" 
                      checked={selectedSantri.length === filteredSantri.length && filteredSantri.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-4">Nama Lengkap</th>
                  <th className="p-4">NIS / NISN</th>
                  <th className="p-4">Kelas</th>
                  <th className="p-4 pr-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-12 text-center text-slate-500 font-bold">Memuat data siswa...</td></tr>
                ) : filteredSantri.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-slate-500 font-bold">Data tidak ditemukan.</td></tr>
                ) : filteredSantri.map((santri) => {
                  const isAlumni = santri.status === "Alumni" || santri.status === "Nonaktif";
                  const isChecked = selectedSantri.includes(santri.id);
                  
                  return (
                  // Warna baris memudar (opacity-50) jika siswa adalah Alumni
                  <tr key={santri.id} className={`${isChecked ? 'bg-indigo-50/30' : 'hover:bg-slate-50'} ${isAlumni ? 'opacity-50 bg-slate-50/50' : ''} transition-colors group text-sm`}>
                    <td className="p-4 pl-6">
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => handleSelectRow(santri.id)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-black text-slate-800 uppercase flex items-center gap-2">
                        {santri.nama} 
                        {isAlumni && <span className="px-2 py-0.5 bg-slate-200 text-slate-500 text-[8px] rounded-full">ALUMNI</span>}
                      </div>
                      <div className="text-[10px] font-bold mt-1">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black mr-2 ${santri.jenis_kelamin === 'L' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                          {santri.jenis_kelamin === 'L' ? 'L' : 'P'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-bold">
                      <div className="text-slate-600">{santri.nis}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{santri.nisn ? `NISN: ${santri.nisn}` : "-"}</div>
                    </td>
                    <td className="p-4"><span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200">{santri.kelas}</span></td>
                    <td className="p-4 pr-6 text-right space-x-2">
                      <button onClick={() => openEditModal(santri)} className="p-2 text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors inline-flex items-center" title="Edit Data">
                        <PencilSimple size={18} weight="bold" />
                      </button>
                      <button onClick={() => handleHapusSantri(santri.id, santri.nama)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors inline-flex items-center" title="Hapus Permanen">
                        <Trash size={18} weight="bold" />
                      </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL NAIK KELAS MASSAL */}
        {isModalNaikKelas && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center"><ArrowBendUpRight size={24} weight="bold"/></div>
                <h3 className="text-xl font-black text-slate-800">Naik Kelas Massal</h3>
              </div>
              <p className="text-xs font-bold text-slate-500 mb-6">Pindahkan <strong className="text-indigo-600">{selectedSantri.length} siswa</strong> yang dipilih ke kelas baru secara serentak.</p>
              
              <form onSubmit={handleBulkNaikKelas}>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nama Kelas Baru</label>
                <input required autoFocus type="text" value={kelasBaruMasal} onChange={(e) => setKelasBaruMasal(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-black text-slate-800 uppercase text-center text-lg mb-6" placeholder="Contoh: 8A"/>
                
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalNaikKelas(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm transition-colors">Batal</button>
                  <button type="submit" disabled={isBulkProcessing} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors flex justify-center items-center">
                    {isBulkProcessing ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : "Pindahkan Sekarang"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL INPUT/EDIT SANTRI */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">NIS (Wajib)</label>
                    <input required type="text" value={formData.nis} onChange={(e) => setFormData({...formData, nis: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700" placeholder="102938"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">NISN (Opsional)</label>
                    <input type="text" value={formData.nisn} onChange={(e) => setFormData({...formData, nisn: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700" placeholder="004123..."/>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">L/P</label>
                    <select value={formData.jenis_kelamin} onChange={(e) => setFormData({...formData, jenis_kelamin: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 appearance-none">
                      <option value="L">L</option><option value="P">P</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 appearance-none">
                      <option value="Aktif">Aktif</option>
                      <option value="Alumni">Alumni</option>
                      <option value="Nonaktif">Nonaktif</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Kelas</label>
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
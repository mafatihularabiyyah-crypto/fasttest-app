"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { 
  ArrowLeft, MagnifyingGlass, Funnel, Plus, DownloadSimple, UploadSimple, 
  PencilSimple, Trash, Eye, Student, Users, CaretDoubleUp, Prohibit, X, CheckCircle
} from "@phosphor-icons/react";
import * as XLSX from "xlsx";

// --- TIPE DATA & DUMMY AWAL ---
type StatusSantri = 'Aktif' | 'Lulus' | 'Pindah' | 'Drop Out';

interface Santri {
  id: string;
  nis: string;
  nama: string;
  kelas: string;
  status: StatusSantri;
  gender: 'L' | 'P';
}

const dummyData: Santri[] = [
  { id: "1", nis: "20261001", nama: "Ahmad Budi Santoso", kelas: "X IPA 1", status: "Aktif", gender: "L" },
  { id: "2", nis: "20261002", nama: "Siti Aminah Putri", kelas: "XI IPS 2", status: "Aktif", gender: "P" },
  { id: "3", nis: "20261003", nama: "Rizky Fauzi", kelas: "XII IPA 1", status: "Aktif", gender: "L" },
  { id: "4", nis: "20261004", nama: "Dina Mariana", kelas: "X IPS 1", status: "Aktif", gender: "P" },
  { id: "5", nis: "20261005", nama: "Eko Prasetyo", kelas: "XI IPA 1", status: "Pindah", gender: "L" },
  { id: "6", nis: "20261006", nama: "Fatimah Azzahra", kelas: "XII IPS 1", status: "Aktif", gender: "P" },
];

export default function KelolaSantri() {
  const [santriList, setSantriList] = useState<Santri[]>(dummyData);
  const [search, setSearch] = useState("");
  const [filterKelas, setFilterKelas] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // State Modal
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view' | null>(null);
  const [currentSantri, setCurrentSantri] = useState<Partial<Santri>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // LOGIKA PENCARIAN & FILTERING
  // ==========================================
  const filteredSantri = santriList.filter(s => {
    const matchSearch = s.nama.toLowerCase().includes(search.toLowerCase()) || s.nis.includes(search);
    const matchKelas = filterKelas === "Semua" || s.kelas.includes(filterKelas);
    const matchStatus = filterStatus === "Semua" || s.status === filterStatus;
    return matchSearch && matchKelas && matchStatus;
  });

  // ==========================================
  // LOGIKA CHECKBOX (TINDAKAN MASSAL)
  // ==========================================
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(filteredSantri.map(s => s.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  // ==========================================
  // FITUR SUPER: NAIK KELAS OTOMATIS
  // ==========================================
  const prosesNaikKelas = (kelasSekarang: string) => {
    if (kelasSekarang.includes("XII")) return "LULUS";
    if (kelasSekarang.includes("XI")) return kelasSekarang.replace("XI", "XII");
    if (kelasSekarang.includes("X")) return kelasSekarang.replace("X", "XI");
    return kelasSekarang;
  };

  const handleBulkNaikKelas = () => {
    if (!confirm(`Yakin ingin menaikkan kelas ${selectedIds.length} santri terpilih?`)) return;
    setSantriList(prev => prev.map(s => {
      if (selectedIds.includes(s.id)) {
        const kelasBaru = prosesNaikKelas(s.kelas);
        return { ...s, kelas: kelasBaru === "LULUS" ? s.kelas : kelasBaru, status: kelasBaru === "LULUS" ? "Lulus" : s.status };
      }
      return s;
    }));
    setSelectedIds([]);
  };

  const handleBulkKecualikan = (statusBaru: StatusSantri) => {
    if (!confirm(`Ubah status ${selectedIds.length} santri menjadi ${statusBaru}?`)) return;
    setSantriList(prev => prev.map(s => selectedIds.includes(s.id) ? { ...s, status: statusBaru } : s));
    setSelectedIds([]);
  };

  // ==========================================
  // FITUR EXCEL (IMPORT & EXPORT)
  // ==========================================
  const handleExportExcel = () => {
    const dataForExcel = filteredSantri.map((s, i) => ({
      "No": i + 1, "NIS": s.nis, "Nama Lengkap": s.nama, "L/P": s.gender, "Kelas": s.kelas, "Status": s.status
    }));
    const ws = XLSX.utils.json_to_sheet(dataForExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data_Santri");
    XLSX.writeFile(wb, `Data_Santri_TarbiyahTech_${new Date().getTime()}.xlsx`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];
      
      // Mapping format excel ke format state kita
      const newData = data.map((row: any) => ({
        id: Date.now().toString() + Math.random().toString(),
        nis: String(row.NIS || ""),
        nama: row["Nama Lengkap"] || row.Nama || "Tanpa Nama",
        gender: row["L/P"] || "L",
        kelas: row.Kelas || "X",
        status: "Aktif" as StatusSantri
      }));
      setSantriList([...santriList, ...newData]);
      alert(`${newData.length} data santri berhasil diimpor!`);
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
  };

  // ==========================================
  // FITUR CRUD MANUAL
  // ==========================================
  const handleSave = () => {
    if (modalMode === 'add') {
      setSantriList([{ ...currentSantri, id: Date.now().toString() } as Santri, ...santriList]);
    } else if (modalMode === 'edit') {
      setSantriList(santriList.map(s => s.id === currentSantri.id ? currentSantri as Santri : s));
    }
    setModalMode(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Hapus data santri ini permanen?")) {
      setSantriList(santriList.filter(s => s.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      
      {/* 1. HEADER UTAMA */}
      <div className="bg-blue-700 text-white p-6 shadow-md z-20 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Link href="/guru" className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all">
              <ArrowLeft size={24} weight="bold" />
            </Link>
            <div>
              <h1 className="text-xl font-black uppercase tracking-widest flex items-center gap-2"><Student size={24}/> Master Data Santri</h1>
              <p className="text-xs text-blue-200 font-medium">Kelola siswa, kenaikan kelas, dan arsip induk</p>
            </div>
          </div>

          <div className="flex w-full md:w-auto gap-2">
            <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleImportExcel} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-lg">
              <UploadSimple size={18} weight="bold" /> Import
            </button>
            <button onClick={handleExportExcel} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-green-500/30 transition-all">
              <DownloadSimple size={18} weight="bold" /> Export
            </button>
            <button onClick={() => { setCurrentSantri({ status: 'Aktif', gender: 'L' }); setModalMode('add'); }} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded-xl font-bold text-sm shadow-lg border border-blue-400 transition-all">
              <Plus size={18} weight="bold" /> Tambah Santri
            </button>
          </div>
        </div>
      </div>

      {/* 2. AREA KONTROL (Pencarian & Filter) */}
      <div className="max-w-7xl mx-auto w-full p-6 pb-2 shrink-0">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4 justify-between items-center relative z-10">
          
          <div className="relative w-full lg:w-96">
            <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" weight="bold" />
            <input 
              type="text" placeholder="Cari Nama atau NIS..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
            />
          </div>

          <div className="flex w-full lg:w-auto gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl w-full lg:w-auto">
              <Funnel size={18} className="text-slate-400" />
              <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} className="bg-transparent py-1.5 outline-none font-bold text-sm text-slate-600 w-full cursor-pointer">
                <option value="Semua">Semua Kelas</option>
                <option value="X">Kelas X</option>
                <option value="XI">Kelas XI</option>
                <option value="XII">Kelas XII</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl w-full lg:w-auto">
              <Student size={18} className="text-slate-400" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-transparent py-1.5 outline-none font-bold text-sm text-slate-600 w-full cursor-pointer">
                <option value="Semua">Semua Status</option>
                <option value="Aktif">Aktif Saja</option>
                <option value="Lulus">Telah Lulus</option>
                <option value="Pindah">Pindah/Mutasi</option>
                <option value="Drop Out">Drop Out</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. TINDAKAN MASSAL (Muncul jika ada checkbox yang dicentang) */}
        {selectedIds.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-2 text-blue-800 font-black text-sm">
              <CheckCircle size={20} weight="fill" className="text-blue-600" /> {selectedIds.length} Santri Dipilih
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={handleBulkNaikKelas} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-xs transition-colors shadow-sm">
                <CaretDoubleUp size={16} weight="bold" /> Naik Kelas Massal
              </button>
              <button onClick={() => handleBulkKecualikan("Lulus")} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-xs transition-colors shadow-sm">
                <Student size={16} weight="bold" /> Luluskan
              </button>
              <button onClick={() => handleBulkKecualikan("Pindah")} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-xs transition-colors shadow-sm">
                <Prohibit size={16} weight="bold" /> Pindahkan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. TABEL DATA UTAMA */}
      <div className="max-w-7xl mx-auto w-full px-6 pb-6 flex-1 flex flex-col">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-slate-100 border-b border-slate-200 sticky top-0 z-10">
                <tr className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  <th className="p-4 w-12 text-center">
                    <input type="checkbox" className="w-4 h-4 accent-blue-600 cursor-pointer rounded" onChange={handleSelectAll} checked={selectedIds.length === filteredSantri.length && filteredSantri.length > 0} />
                  </th>
                  <th className="p-4">NIS</th>
                  <th className="p-4">Nama Lengkap</th>
                  <th className="p-4">Kelas</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Aksi Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSantri.length > 0 ? filteredSantri.map((s) => (
                  <tr key={s.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(s.id) ? 'bg-blue-50/50' : ''}`}>
                    <td className="p-4 text-center">
                      <input type="checkbox" className="w-4 h-4 accent-blue-600 cursor-pointer rounded" checked={selectedIds.includes(s.id)} onChange={() => handleSelectOne(s.id)} />
                    </td>
                    <td className="p-4 font-bold text-slate-600 text-sm">{s.nis}</td>
                    <td className="p-4">
                      <p className="font-black text-slate-800 uppercase">{s.nama}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">Gender: {s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                    </td>
                    <td className="p-4 font-black text-blue-600 text-sm">{s.kelas}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-widest ${
                        s.status === 'Aktif' ? 'bg-green-100 text-green-700' :
                        s.status === 'Lulus' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setCurrentSantri(s); setModalMode('view'); }} className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"><Eye size={18} weight="bold" /></button>
                        <button onClick={() => { setCurrentSantri(s); setModalMode('edit'); }} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><PencilSimple size={18} weight="bold" /></button>
                        <button onClick={() => handleDelete(s.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"><Trash size={18} weight="bold" /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <Users size={48} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500 font-bold text-lg">Data Santri Tidak Ditemukan</p>
                      <p className="text-slate-400 text-sm">Coba sesuaikan kata kunci pencarian atau filter kelas Anda.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. FOOTER TOTAL SANTRI */}
      <div className="bg-white border-t border-slate-200 p-4 shrink-0 z-10 sticky bottom-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-xs font-black text-slate-500 uppercase tracking-widest">
          <p>Sistem Informasi TarbiyahTech</p>
          <p className="bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
            Menampilkan <span className="text-blue-600">{filteredSantri.length}</span> dari Total <span className="text-slate-800">{santriList.length}</span> Santri
          </p>
        </div>
      </div>

      {/* ========================================== */}
      {/* 6. MODAL FORM (TAMBAH / EDIT / LIHAT)        */}
      {/* ========================================== */}
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h2 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2">
                {modalMode === 'view' ? <><Eye size={20} className="text-blue-600"/> Detail Santri</> : 
                 modalMode === 'edit' ? <><PencilSimple size={20} className="text-blue-600"/> Edit Data Santri</> : 
                 <><Plus size={20} className="text-blue-600"/> Input Santri Baru</>}
              </h2>
              <button onClick={() => setModalMode(null)} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X size={20} weight="bold" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nomor Induk Siswa (NIS)</label>
                <input type="text" value={currentSantri.nis || ''} onChange={e => setCurrentSantri({...currentSantri, nis: e.target.value})} disabled={modalMode === 'view'} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 disabled:opacity-70" />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nama Lengkap</label>
                <input type="text" value={currentSantri.nama || ''} onChange={e => setCurrentSantri({...currentSantri, nama: e.target.value})} disabled={modalMode === 'view'} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-black text-slate-800 uppercase disabled:opacity-70" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gender</label>
                  <select value={currentSantri.gender || 'L'} onChange={e => setCurrentSantri({...currentSantri, gender: e.target.value as 'L'|'P'})} disabled={modalMode === 'view'} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 disabled:opacity-70">
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kelas Aktif</label>
                  <input type="text" placeholder="Misal: X IPA 1" value={currentSantri.kelas || ''} onChange={e => setCurrentSantri({...currentSantri, kelas: e.target.value})} disabled={modalMode === 'view'} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-600 disabled:opacity-70" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Keaktifan</label>
                <select value={currentSantri.status || 'Aktif'} onChange={e => setCurrentSantri({...currentSantri, status: e.target.value as StatusSantri})} disabled={modalMode === 'view'} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-black text-slate-700 disabled:opacity-70">
                  <option value="Aktif">Aktif Belajar</option>
                  <option value="Lulus">Telah Lulus</option>
                  <option value="Pindah">Pindah / Mutasi</option>
                  <option value="Drop Out">Dikeluarkan (Drop Out)</option>
                </select>
              </div>
            </div>

            {modalMode !== 'view' && (
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3">
                <button onClick={() => setModalMode(null)} className="flex-1 py-3 bg-white border border-slate-300 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors">Batal</button>
                <button onClick={handleSave} className="flex-1 py-3 bg-blue-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors">Simpan Data</button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
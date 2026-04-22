"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, MagnifyingGlass, Funnel, 
  Eye, Student, Users, X, GenderMale, GenderFemale
} from "@phosphor-icons/react";

type StatusSantri = 'Aktif' | 'Lulus' | 'Pindah' | 'Drop Out' | 'Diarsipkan';

interface Santri {
  id: string;
  nis: string;
  nama: string;
  kelas: string;
  status: StatusSantri;
  gender: 'L' | 'P';
}

const formatNama = (nama: string) => {
  if (!nama) return "";
  return nama.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function DatabaseSantriGuru() {
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fitur Filter & Pencarian
  const [search, setSearch] = useState("");
  const [filterKelas, setFilterKelas] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Aktif");
  
  // Fitur Modal (Hanya Lihat)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentSantri, setCurrentSantri] = useState<Partial<Santri>>({});

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/santri');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSantriList(data);
      } else {
        setSantriList([]); 
      }
    } catch (error) {
      setSantriList([]); 
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSantri = [...santriList]
    .filter(s => {
      const matchSearch = s.nama.toLowerCase().includes(search.toLowerCase()) || s.nis.includes(search);
      const matchKelas = filterKelas === "Semua" || s.kelas.includes(filterKelas);
      const matchStatus = filterStatus === "Semua" || s.status === filterStatus;
      return matchSearch && matchKelas && matchStatus;
    })
    .sort((a, b) => a.nama.localeCompare(b.nama)); 

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      
      {/* HEADER KHUSUS GURU (TANPA TOMBOL TAMBAH/IMPORT/EXPORT) */}
      <div className="bg-blue-700 text-white p-6 shadow-md z-20 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link href="/guru" className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all">
            <ArrowLeft size={24} weight="bold" />
          </Link>
          <div>
            <h1 className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
              <Student size={24}/> Database Santri
            </h1>
            <p className="text-xs text-blue-200 font-medium">Lihat dan cari data induk siswa peserta ujian.</p>
          </div>
        </div>
      </div>

      {/* FILTER & PENCARIAN */}
      <div className="max-w-7xl mx-auto w-full p-6 pb-2 shrink-0">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4 justify-between items-center">
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
                {Array.from(new Set(santriList.map(s => s.kelas))).sort().map(kelas => (
                   <option key={kelas} value={kelas}>{kelas}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl w-full lg:w-auto">
              <Student size={18} className="text-slate-400" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-transparent py-1.5 outline-none font-bold text-sm text-slate-600 w-full cursor-pointer">
                <option value="Semua">Semua Status</option>
                <option value="Aktif">Aktif Saja</option>
                <option value="Lulus">Telah Lulus</option>
                <option value="Diarsipkan">Diarsipkan / Riwayat Lama</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* TABEL DATA UTAMA (HANYA BACA) */}
      <div className="max-w-7xl mx-auto w-full px-6 pb-6 flex-1 flex flex-col">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-slate-100 border-b border-slate-200 sticky top-0 z-10">
                <tr className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  <th className="p-4 w-12 text-center">No</th>
                  <th className="p-4">NIS</th>
                  <th className="p-4">Nama Lengkap</th>
                  <th className="p-4 text-center">Gender</th>
                  <th className="p-4 text-center">Kelas</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right pr-6">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-slate-500 font-bold">Sinkronisasi Database...</p>
                    </td>
                  </tr>
                ) : filteredSantri.length > 0 ? filteredSantri.map((s, index) => (
                  <tr key={s.id} className={`hover:bg-slate-50 transition-colors ${s.status === 'Diarsipkan' ? 'opacity-60' : ''}`}>
                    <td className="p-4 text-center font-black text-slate-400">{index + 1}</td>
                    <td className="p-4 font-bold text-slate-600 text-sm">{s.nis}</td>
                    <td className="p-4">
                      <p className="font-black text-slate-800 text-[15px]">{formatNama(s.nama)}</p>
                    </td>
                    <td className="p-4 text-center">
                      {s.gender === 'L' ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-100">
                          <GenderMale size={16} weight="bold" /> Laki-laki
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-pink-50 text-pink-600 rounded-lg text-xs font-bold border border-pink-100">
                          <GenderFemale size={16} weight="bold" /> Perempuan
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center font-black text-blue-600 text-sm">{s.kelas}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-widest ${
                        s.status === 'Aktif' ? 'bg-green-100 text-green-700' :
                        s.status === 'Lulus' ? 'bg-blue-100 text-blue-700' : 
                        s.status === 'Diarsipkan' ? 'bg-slate-200 text-slate-600 border border-slate-300' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <button 
                        onClick={() => { setCurrentSantri(s); setIsViewModalOpen(true); }} 
                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors inline-flex"
                        title="Lihat Detail"
                      >
                        <Eye size={18} weight="bold" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <Users size={48} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500 font-bold text-lg">Data Santri Tidak Ditemukan</p>
                      <p className="text-slate-400 text-sm">Jika kosong, hubungi Administrator untuk sinkronisasi data.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FOOTER JUMLAH */}
      <div className="bg-white border-t border-slate-200 p-4 shrink-0 z-10 sticky bottom-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-xs font-black text-slate-500 uppercase tracking-widest">
          <p>TarbiyahTech Institutional</p>
          <p className="bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
            Menampilkan <span className="text-blue-600">{filteredSantri.length}</span> Santri
          </p>
        </div>
      </div>

      {/* MODAL VIEW SAJA (READ ONLY) */}
      {isViewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 bg-blue-600 text-white flex justify-between items-center">
              <h2 className="font-black uppercase tracking-widest text-sm flex items-center gap-2">
                <Student size={20} /> Kartu Identitas Santri
              </h2>
              <button onClick={() => setIsViewModalOpen(false)} className="p-1.5 hover:bg-white/20 rounded-full transition-colors"><X size={20} weight="bold" /></button>
            </div>

            <div className="p-6 space-y-4 bg-slate-50">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-3xl mx-auto mb-3 shadow-inner border-4 border-white">
                  {currentSantri.nama?.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-black text-xl text-slate-800">{formatNama(currentSantri.nama || "")}</h3>
                <p className="text-sm font-bold text-slate-500 mt-1">NIS: {currentSantri.nis}</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Gender</span>
                  <span className="text-xs font-black text-slate-700">{currentSantri.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Kelas Saat Ini</span>
                  <span className="text-xs font-black text-blue-600">{currentSantri.kelas}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Status Siswa</span>
                  <span className="text-xs font-black text-emerald-600">{currentSantri.status}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
              <button onClick={() => setIsViewModalOpen(false)} className="px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors">
                Tutup Kartu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
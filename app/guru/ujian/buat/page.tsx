// app/guru/ujian/buat/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FloppyDisk, Gear, FileText, CheckCircle, ListChecks, CircleNotch } from "@phosphor-icons/react";
// Pastikan path ini mengarah ke file supabase.ts yang Anda buat
import { supabase } from "@/lib/supabase"; 

export default function BuatUjianPro() {
  // State untuk form input
  const [mapel, setMapel] = useState("");
  const [kodeUjian, setKodeUjian] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [kelas, setKelas] = useState("");
  
  // State untuk skor
  const [skorBenar, setSkorBenar] = useState(5);
  const [skorSalah, setSkorSalah] = useState(0);
  const [skorKosong, setSkorKosong] = useState(0);

  // State untuk kunci jawaban
  const [jumlahSoal, setJumlahSoal] = useState(20);
  const [kunciJawaban, setKunciJawaban] = useState<string[]>(Array(20).fill(""));
  
  // State loading saat menyimpan
  const [isSaving, setIsSaving] = useState(false);

  // Fungsi untuk mengubah jawaban saat bulatan diklik
  const handlePilihJawaban = (indexSoal: number, opsi: string) => {
    const kunciBaru = [...kunciJawaban];
    kunciBaru[indexSoal] = opsi;
    setKunciJawaban(kunciBaru);
  };

  // Fungsi untuk mengubah jumlah soal secara dinamis
  const handleUbahJumlahSoal = (jumlahBaru: number) => {
    setJumlahSoal(jumlahBaru);
    setKunciJawaban(Array(jumlahBaru).fill(""));
  };

  // Fungsi untuk mengirim data ke Supabase
  const handleSimpanUjian = async () => {
    if (!mapel || !kodeUjian || !kelas || !tanggal) {
      alert("Mohon lengkapi semua Informasi Dasar terlebih dahulu!");
      return;
    }

    setIsSaving(true);

    const { data, error } = await supabase
      .from('ujian')
      .insert([
        { 
          kode_ujian: kodeUjian.toUpperCase(),
          mata_pelajaran: mapel,
          kelas: kelas,
          tanggal: tanggal,
          kunci_jawaban: kunciJawaban,
          skor_benar: skorBenar,
          skor_salah: skorSalah,
          skor_kosong: skorKosong
        }
      ]);

    setIsSaving(false);

    if (error) {
      alert("Gagal menyimpan data: " + error.message);
    } else {
      alert("Alhamdulillah! Ujian berhasil disimpan ke Database.");
      // Opsional: Kosongkan form setelah simpan jika mau
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/guru" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={24} weight="bold" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900">Buat Ujian Baru</h1>
            <p className="text-sm text-slate-500 font-medium">Konfigurasi metadata dan kunci jawaban LJK</p>
          </div>
        </div>
        <button 
          onClick={handleSimpanUjian}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200 disabled:opacity-70"
        >
          {isSaving ? <CircleNotch size={20} weight="bold" className="animate-spin" /> : <FloppyDisk size={20} weight="bold" />}
          {isSaving ? "Menyimpan..." : "Simpan Ujian"}
        </button>
      </nav>

      <main className="max-w-6xl mx-auto px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Kolom Kiri: Pengaturan Ujian */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Card Metadata */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText size={20} weight="bold" /></div>
              <h2 className="font-bold text-slate-800 text-lg">Informasi Dasar</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Mata Pelajaran</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Nahwu Shorof" 
                  value={mapel}
                  onChange={(e) => setMapel(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Kode Ujian (Unik)</label>
                <input 
                  type="text" 
                  placeholder="Contoh: NHW-VII-01" 
                  value={kodeUjian}
                  onChange={(e) => setKodeUjian(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono font-bold uppercase" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Tanggal</label>
                  <input 
                    type="date" 
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Kelas</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: VII-A" 
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card Sistem Penilaian */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Gear size={20} weight="bold" /></div>
              <h2 className="font-bold text-slate-800 text-lg">Sistem Penilaian</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-sm font-bold text-slate-700">Skor Benar</span>
                <input 
                  type="number" 
                  value={skorBenar}
                  onChange={(e) => setSkorBenar(Number(e.target.value))}
                  className="w-16 p-2 text-center bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-black text-emerald-600" 
                />
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-sm font-bold text-slate-700">Skor Salah</span>
                <input 
                  type="number" 
                  value={skorSalah}
                  onChange={(e) => setSkorSalah(Number(e.target.value))}
                  className="w-16 p-2 text-center bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-black text-red-600" 
                />
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-sm font-bold text-slate-700">Skor Kosong</span>
                <input 
                  type="number" 
                  value={skorKosong}
                  onChange={(e) => setSkorKosong(Number(e.target.value))}
                  className="w-16 p-2 text-center bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-black text-slate-600" 
                />
              </div>
            </div>
          </div>

        </div>

        {/* Kolom Kanan: Editor Kunci Jawaban */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-140px)]">
          
          {/* Header Editor */}
          <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 text-white rounded-lg"><ListChecks size={20} weight="bold" /></div>
              <h2 className="font-black text-slate-800 text-xl">Editor Kunci Jawaban</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-500">Jumlah Soal:</span>
              <select 
                value={jumlahSoal}
                onChange={(e) => handleUbahJumlahSoal(Number(e.target.value))}
                className="p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-slate-700 cursor-pointer"
              >
                <option value={10}>10 Soal</option>
                <option value={20}>20 Soal</option>
                <option value={40}>40 Soal</option>
                <option value={50}>50 Soal</option>
              </select>
            </div>
          </div>

          {/* Grid Kunci Jawaban (Scrollable) */}
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              {[...Array(jumlahSoal)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors group">
                  
                  {/* Nomor Soal & Indikator */}
                  <div className="flex items-center gap-3 w-16">
                    <span className="text-lg font-black text-slate-400 group-hover:text-slate-600">{i + 1}.</span>
                    {kunciJawaban[i] && <CheckCircle size={20} weight="fill" className="text-emerald-500" />}
                  </div>

                  {/* Opsi A-E */}
                  <div className="flex gap-2">
                    {['A', 'B', 'C', 'D', 'E'].map((opsi) => {
                      const isSelected = kunciJawaban[i] === opsi;
                      return (
                        <button 
                          key={opsi}
                          onClick={() => handlePilihJawaban(i, opsi)}
                          className={`
                            w-11 h-11 rounded-full text-sm font-black border-2 transition-all flex items-center justify-center
                            ${isSelected 
                              ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-110' 
                              : 'bg-white border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-500'}
                          `}
                        >
                          {opsi}
                        </button>
                      );
                    })}
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* Footer Editor Status */}
          <div className="p-5 border-t border-slate-200 bg-slate-50 rounded-b-3xl flex justify-between items-center text-sm">
            <span className="font-bold text-slate-500">
              Terisi: <span className="text-blue-600 font-black">{kunciJawaban.filter(k => k !== "").length}</span> / {jumlahSoal}
            </span>
            <span className="text-slate-400 font-medium hidden sm:block">Klik bulatan untuk memilih kunci jawaban yang benar.</span>
          </div>

        </div>

      </main>
    </div>
  );
}
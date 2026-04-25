"use client";
   
import Link from "next/link";
import { 
  ArrowLeft, Scan, ChartBar, Key, FilePdf, Archive, 
  Users, CalendarBlank, Hash
} from "@phosphor-icons/react";

export default function DetailUjianDashboard() {
  // Dalam aplikasi nyata, data ini diambil dari Database (Supabase) berdasarkan [id] di URL
  const detailUjian = {
    id: "UJN-2026-001",
    nama: "Ujian Akhir Semester: Bahasa Arab",
    kelas: "XII IPA & IPS",
    tanggal: "15 Juni 2026",
    jumlahSoal: 40,
    totalSiswa: 120,
    sudahDiScan: 45
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* HEADER DINAMIS (Menyesuaikan Ujian yang Dibuka) */}
      <div className="bg-blue-700 text-white p-6 shadow-md rounded-b-[2.5rem] relative overflow-hidden">
        {/* Dekorasi Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/guru" className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-sm font-bold backdrop-blur-md transition-all mb-6">
            <ArrowLeft size={16} weight="bold" /> Kembali ke Daftar Ujian
          </Link>
          
          <h1 className="text-3xl font-black tracking-tight mb-2">{detailUjian.nama}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-blue-100">
            <div className="flex items-center gap-1.5"><Users size={18} /> {detailUjian.kelas}</div>
            <div className="flex items-center gap-1.5"><CalendarBlank size={18} /> {detailUjian.tanggal}</div>
            <div className="flex items-center gap-1.5"><Hash size={18} /> {detailUjian.jumlahSoal} Soal</div>
          </div>
        </div>
      </div>

      {/* STATISTIK PROGRES SCAN */}
      <div className="max-w-4xl mx-auto px-6 -mt-6 relative z-20">
        <div className="bg-white p-5 rounded-2xl shadow-lg border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Progres Scan LJK</p>
            <p className="text-sm font-bold text-slate-700">
              <span className="text-2xl font-black text-blue-600">{detailUjian.sudahDiScan}</span> / {detailUjian.totalSiswa} Siswa
            </p>
          </div>
          <div className="w-1/2 h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full" 
              style={{ width: `${(detailUjian.sudahDiScan / detailUjian.totalSiswa) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* MENU UTAMA UJIAN */}
      <div className="max-w-4xl mx-auto p-6 mt-4">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Menu Kelola Ujian</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* MENU 1: MULAI SCAN (Paling Mencolok) */}
          <Link href={`/guru/scan?namaUjian=${encodeURIComponent(detailUjian.nama)}`} 
                className="col-span-1 md:col-span-2 lg:col-span-1 group relative bg-blue-600 p-6 rounded-3xl shadow-lg shadow-blue-600/30 hover:-translate-y-1 transition-all overflow-hidden flex flex-col justify-between min-h-[160px]">
            <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-110 group-hover:rotate-12 transition-transform">
              <Scan size={80} weight="fill" className="text-white" />
            </div>
            <div className="relative z-10 text-white">
              <h3 className="text-xl font-black mb-1 drop-shadow-md">Scan LJK</h3>
              <p className="text-xs font-medium text-blue-100 drop-shadow-md">Kamera otomatis mendeteksi kertas</p>
            </div>
            <div className="relative z-10 mt-4 bg-white/20 backdrop-blur inline-flex px-4 py-2 rounded-full text-white text-xs font-bold w-max border border-white/30">
              Buka Kamera &rarr;
            </div>
          </Link>

          {/* MENU 2: HASIL & ANALISIS */}
          <Link href={`/guru/arsip?id=${detailUjian.id}`} 
                className="group bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:border-green-500 hover:shadow-md transition-all flex flex-col justify-between min-h-[160px]">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 mb-4 group-hover:scale-110 transition-transform">
              <ChartBar size={28} weight="fill" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 mb-1">Analisis Hasil</h3>
              <p className="text-xs font-bold text-slate-500">Lihat nilai & statistik kelas</p>
            </div>
          </Link>

          {/* MENU 3: KUNCI JAWABAN */}
          <button className="group bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:border-orange-500 hover:shadow-md transition-all flex flex-col justify-between min-h-[160px] text-left">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mb-4 group-hover:scale-110 transition-transform">
              <Key size={28} weight="fill" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 mb-1">Kunci Jawaban</h3>
              <p className="text-xs font-bold text-slate-500">Edit kunci & bobot nilai</p>
            </div>
          </button>

          {/* MENU 4: DOWNLOAD KERTAS LJK */}
          <button className="group bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all flex flex-col justify-between min-h-[160px] text-left">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
              <FilePdf size={28} weight="fill" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 mb-1">Format LJK</h3>
              <p className="text-xs font-bold text-slate-500">Unduh master LJK (PDF)</p>
            </div>
          </button>

          {/* MENU 5: DOKUMEN ARSIP */}
          <Link href="/guru/arsip" className="group bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:border-slate-800 hover:shadow-md transition-all flex flex-col justify-between min-h-[160px]">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 mb-4 group-hover:scale-110 transition-transform">
              <Archive size={28} weight="fill" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 mb-1">Dokumen Arsip</h3>
              <p className="text-xs font-bold text-slate-500">Akses foto bukti koreksi</p>
            </div>
          </Link>

        </div>
      </div>

    </div>
  );
}
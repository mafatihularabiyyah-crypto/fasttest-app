"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  UsersThree, Student, ListChecks, ArrowRight, 
  ShieldCheck, ClockClockwise, Scan, TrendUp, Buildings,
  CaretRight
} from "@phosphor-icons/react";

export default function AdminDashboardMain() {
  const [stats, setStats] = useState({ guru: 0, santri: 0, template: 0, isLoading: true });

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Mengambil data dari 3 API sekaligus secara paralel
        const [resGuru, resSantri, resTemplate] = await Promise.all([
          fetch('/api/admin/guru'),
          fetch('/api/admin/santri'),
          fetch('/api/admin/template')
        ]);
        
        const [dataGuru, dataSantri, dataTemplate] = await Promise.all([
          resGuru.json(), resSantri.json(), resTemplate.json()
        ]);

        setStats({
          guru: Array.isArray(dataGuru) ? dataGuru.length : 0,
          santri: Array.isArray(dataSantri) ? dataSantri.length : 0,
          template: Array.isArray(dataTemplate) ? dataTemplate.length : 0,
          isLoading: false
        });
      } catch (error) {
        console.error("Gagal memuat statistik", error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-8 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 pt-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-lg mb-3">
              <ShieldCheck size={14} weight="bold" /> Administrator Portal
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">
              Dashboard Institusi
            </h1>
            <p className="text-sm font-bold text-slate-500 mt-2 max-w-xl leading-relaxed">
              Pantau aktivitas pengajar, kelola data santri, dan standarisasi lembar jawaban sekolah Anda dalam satu panel terpusat.
            </p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Status Sistem</p>
            <div className="flex items-center justify-end gap-2 text-emerald-600 font-bold text-sm">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span> Semua Layanan Aktif
            </div>
          </div>
        </div>

        {/* BENTO GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* HERO CARD (SPAN 8) */}
          <div className="md:col-span-8 bg-[#1d4ed8] rounded-[2rem] p-8 sm:p-10 relative overflow-hidden shadow-xl shadow-blue-900/20 flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Buildings size={200} weight="fill" />
            </div>
            
            <div className="relative z-10 mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Manajemen Terpusat</h2>
              <p className="text-blue-200 font-medium max-w-md text-sm sm:text-base leading-relaxed">
                Tingkatkan efisiensi evaluasi belajar. Kelola akses guru dan buat standar Master LJK yang akan otomatis tersinkronisasi ke seluruh perangkat pengajar.
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-blue-600/50 pt-6">
              <div>
                <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1">Total Santri</p>
                <div className="text-3xl font-black text-white">
                  {stats.isLoading ? <span className="animate-pulse opacity-50">...</span> : stats.santri}
                </div>
              </div>
              <div>
                <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1">Total Pengajar</p>
                <div className="text-3xl font-black text-white">
                  {stats.isLoading ? <span className="animate-pulse opacity-50">...</span> : stats.guru}
                </div>
              </div>
              <div>
                <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1">Master LJK</p>
                <div className="text-3xl font-black text-white">
                  {stats.isLoading ? <span className="animate-pulse opacity-50">...</span> : stats.template}
                </div>
              </div>
            </div>
          </div>

          {/* QUICK SCAN CARD (SPAN 4) */}
          <div className="md:col-span-4 bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center relative group hover:border-indigo-300 transition-all">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Scan size={40} weight="duotone" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Koreksi Cepat</h3>
            <p className="text-xs font-bold text-slate-500 mb-6">Pindai LJK secara masal menggunakan kamera web atau scanner dokumen.</p>
            <button onClick={() => alert("Fitur Scanner Masal akan segera hadir!")} className="w-full py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              Buka Scanner <CaretRight size={16} weight="bold" />
            </button>
          </div>

          {/* MENU 1: GURU */}
          <Link href="/admin/guru" className="md:col-span-4 bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-blue-300 transition-all group flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <UsersThree size={32} weight="fill" />
              </div>
              <ArrowRight size={24} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Manajemen Guru</h3>
            <p className="text-xs font-bold text-slate-500 leading-relaxed">
              Kelola akses masuk akun Ustadz/Ustadzah dan pantau riwayat pembuatan LJK mereka.
            </p>
          </Link>

          {/* MENU 2: SANTRI */}
          <Link href="/admin/santri" className="md:col-span-4 bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-300 transition-all group flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Student size={32} weight="fill" />
              </div>
              <ArrowRight size={24} className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Database Santri</h3>
            <p className="text-xs font-bold text-slate-500 leading-relaxed">
              Pusat data siswa aktif. Kelola NIS/NISN untuk sinkronisasi otomatis saat LJK dipindai.
            </p>
          </Link>

          {/* MENU 3: TEMPLATE LJK */}
          <Link href="/admin/template" className="md:col-span-4 bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-purple-300 transition-all group flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <ListChecks size={32} weight="fill" />
              </div>
              <ArrowRight size={24} className="text-slate-300 group-hover:text-purple-600 transition-colors" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Master Template</h3>
            <p className="text-xs font-bold text-slate-500 leading-relaxed">
              Desain standar format LJK resmi sekolah (Kop, Logo, Layout) untuk digunakan pengajar.
            </p>
          </Link>

        </div>

        {/* RECENT ACTIVITY (Mockup) */}
        <div className="mt-8 pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
            <ClockClockwise size={18} />
            Pembaruan terakhir sistem: <span className="text-slate-700">Hari ini, 08:30 WIB</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
            <TrendUp size={18} />
            Total Pemindaian Minggu Ini: <span className="text-indigo-600 font-black">1,240 LJK</span>
          </div>
        </div>

      </div>
    </div>
  );
}
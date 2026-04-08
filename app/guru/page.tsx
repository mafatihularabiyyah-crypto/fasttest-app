"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Scan, FileText, ChartBar, Student, Bell, UserCircle, 
  RocketLaunch, Clock, CalendarCheck, TrendUp, Plus, CaretRight
} from "@phosphor-icons/react";

export default function MainDashboard() {
  const [greeting, setGreeting] = useState("Selamat Datang");
  const [currentTime, setCurrentTime] = useState("");

  // Efek Sapaan & Waktu Dinamis
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours();
      
      if (hour >= 5 && hour < 11) setGreeting("Selamat Pagi");
      else if (hour >= 11 && hour < 15) setGreeting("Selamat Siang");
      else if (hour >= 15 && hour < 18) setGreeting("Selamat Sore");
      else setGreeting("Selamat Malam");

      setCurrentTime(now.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-blue-500 selection:text-white">
      
      {/* ========================================= */}
      {/* 1. TOP NAVIGATION BAR (GLASSMORPHISM)       */}
      {/* ========================================= */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30 text-white font-black">
              T
            </div>
            <span className="font-black text-xl tracking-tight text-slate-800">
              Tarbiyah<span className="text-blue-600">Tech</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-blue-600 transition-colors">
              <Bell size={24} weight="fill" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <button className="flex items-center gap-2 group">
              <div className="text-right hidden md:block">
                <p className="text-xs font-black text-slate-800 group-hover:text-blue-600 transition-colors">Ustadz Ahmad</p>
                <p className="text-[10px] font-bold text-slate-400">Guru Mapel</p>
              </div>
              <UserCircle size={36} weight="fill" className="text-slate-300 group-hover:text-blue-600 transition-colors" />
            </button>
          </div>
        </div>
      </nav>

      {/* ========================================= */}
      {/* 2. HERO SECTION (SAPAAN & STATISTIK CEPAT)  */}
      {/* ========================================= */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 rounded-[2rem] p-8 md:p-12 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden mb-10">
          {/* Dekorasi Abstrak Latar Belakang */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold border border-white/20 mb-6">
                <Clock size={16} /> {currentTime} WIB &bull; {new Date().toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight">
                {greeting}, Ahmad!
              </h1>
              <p className="text-blue-100 font-medium text-lg max-w-lg">
                Siap untuk mengevaluasi hasil belajar hari ini? Sistem OMR canggih TarbiyahTech siap membantu Anda.
              </p>
            </div>

            {/* Quick Stats Banner */}
            <div className="flex gap-4 bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20">
              <div className="px-4 border-r border-white/20 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">Total Santri</p>
                <p className="text-3xl font-black">120</p>
              </div>
              <div className="px-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">Kertas Di-Scan</p>
                <p className="text-3xl font-black text-green-300">845</p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================= */}
        {/* 3. MENU MODUL UTAMA (INTERAKTIF & AKTIF)    */}
        {/* ========================================= */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <RocketLaunch size={24} className="text-blue-600" /> Modul Utama
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          
          {/* MENU 1: GENERATOR LJK */}
          <Link href="/guru/ujian/buat" className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-500 hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
              <FileText size={28} weight="fill" className="text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">Buat Ujian & LJK</h3>
            <p className="text-sm font-medium text-slate-500 mb-6">Desain dan cetak kertas Lembar Jawaban Komputer (LJK) otomatis.</p>
            <div className="flex items-center text-xs font-bold text-blue-600 group-hover:gap-2 transition-all">
              Buka Generator <CaretRight size={14} weight="bold" />
            </div>
          </Link>

          {/* MENU 2: SCANNER PINTAR */}
          {/* Default mengarah ke scan ujian bahasa arab sebagai contoh */}
          <Link href="/guru/scan?namaUjian=Pemindaian+Cepat" className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-green-500 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            {/* Pinggir hijau efek canggih */}
            <div className="absolute top-0 left-0 w-full h-1 bg-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-600 transition-colors">
              <Scan size={28} weight="fill" className="text-green-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">Scanner Pintar</h3>
            <p className="text-sm font-medium text-slate-500 mb-6">Koreksi LJK dengan kamera HP. Super cepat dan akurat ala QRIS.</p>
            <div className="flex items-center text-xs font-bold text-green-600 group-hover:gap-2 transition-all">
              Buka Kamera <CaretRight size={14} weight="bold" />
            </div>
          </Link>

          {/* MENU 3: ARSIP & DASHBOARD NILAI */}
          <Link href="/guru/arsip" className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-purple-500 hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors">
              <ChartBar size={28} weight="fill" className="text-purple-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">Arsip & Analisis</h3>
            <p className="text-sm font-medium text-slate-500 mb-6">Kelola nilai siswa, cetak laporan Excel & PDF, dan lihat bukti foto.</p>
            <div className="flex items-center text-xs font-bold text-purple-600 group-hover:gap-2 transition-all">
              Lihat Laporan <CaretRight size={14} weight="bold" />
            </div>
          </Link>

          {/* MENU 4: KELOLA SANTRI */}
          <Link href="/guru/santri" className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-orange-500 hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-500 transition-colors">
              <Student size={28} weight="fill" className="text-orange-500 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">Kelola Santri</h3>
            <p className="text-sm font-medium text-slate-500 mb-6">Manajemen data induk siswa, kenaikan kelas, dan import data.</p>
            <div className="flex items-center text-xs font-bold text-orange-500 group-hover:gap-2 transition-all">
              Kelola Data <CaretRight size={14} weight="bold" />
            </div>
          </Link>

        </div>

        {/* ========================================= */}
        {/* 4. SEKSI AKTIVITAS TERBARU & JADWAL         */}
        {/* ========================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Ujian Aktif / Mendatang */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <CalendarCheck size={20} className="text-blue-600" /> Ujian Aktif
              </h2>
              <Link href="/guru/ujian/buat" className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <Plus size={12} weight="bold" /> Ujian Baru
              </Link>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-4 hover:bg-slate-50 border-b border-slate-100 flex items-center justify-between transition-colors group cursor-pointer">
                <div>
                  <h4 className="font-black text-slate-800 group-hover:text-blue-600 transition-colors">Ujian Akhir Semester: Bahasa Arab</h4>
                  <p className="text-xs font-bold text-slate-400 mt-1">Kelas XII IPA & IPS &bull; 40 Soal</p>
                </div>
                <Link href="/guru/scan?namaUjian=Bahasa+Arab" className="px-4 py-2 bg-blue-50 text-blue-600 font-bold text-xs rounded-xl hover:bg-blue-600 hover:text-white transition-colors">
                  Mulai Scan
                </Link>
              </div>
              <div className="p-4 hover:bg-slate-50 flex items-center justify-between transition-colors group cursor-pointer">
                <div>
                  <h4 className="font-black text-slate-800 group-hover:text-blue-600 transition-colors">Ulangan Harian: Fiqih</h4>
                  <p className="text-xs font-bold text-slate-400 mt-1">Kelas X IPA 1 &bull; 25 Soal</p>
                </div>
                <Link href="/guru/scan?namaUjian=Ulangan+Fiqih" className="px-4 py-2 bg-blue-50 text-blue-600 font-bold text-xs rounded-xl hover:bg-blue-600 hover:text-white transition-colors">
                  Mulai Scan
                </Link>
              </div>
            </div>
          </div>

          {/* Ringkasan Analisis Singkat */}
          <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
              <TrendUp size={20} className="text-blue-600" /> Insight Cepat
            </h2>
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><ChartBar size={100} weight="fill" /></div>
              
              <div className="relative z-10">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Performa Rata-Rata</p>
                <div className="flex items-end gap-2 mb-6">
                  <span className="text-5xl font-black text-green-400">78</span>
                  <span className="text-sm font-bold text-slate-400 mb-1.5">/ 100</span>
                </div>

                <div className="space-y-3">
                  <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10">
                    <p className="text-[10px] font-bold text-slate-300 uppercase">Nilai Tertinggi Bulan Ini</p>
                    <p className="font-black text-sm">Siti Aminah (92) - Bahasa Arab</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10">
                    <p className="text-[10px] font-bold text-slate-300 uppercase">Soal Paling Sulit (Fiqih)</p>
                    <p className="font-black text-sm text-orange-300">Nomor 12 (65% Siswa Salah)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white mt-12 py-8 text-center">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Sistem Informasi OMR &copy; {new Date().getFullYear()} TarbiyahTech.
        </p>
      </footer>

    </div>
  );
}
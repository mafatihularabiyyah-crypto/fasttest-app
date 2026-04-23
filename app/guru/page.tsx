"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { 
  Scan, FileText, ChartBar, Student, RocketLaunch, 
  Clock, TrendUp, CaretRight, CheckCircle, Desktop, 
  CalendarBlank, ListChecks, ArrowUpRight, Exam, ClockCounterClockwise,
} from "@phosphor-icons/react";

export default function MainDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [greeting, setGreeting] = useState("Selamat Datang");
  const [currentTime, setCurrentTime] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [guruProfile, setGuruProfile] = useState({
    nama: "Memuat Data...",
    sekolahNama: "Memuat Sekolah...",
    jumlahSantri: 0
  });

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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/guru/profile");
        if (res.ok) {
          const data = await res.json();
          setGuruProfile({
            nama: data.nama,
            sekolahNama: data.sekolahNama,
            jumlahSantri: data.jumlahSantri
          });
        } else if (res.status === 401) {
          router.push("/login"); 
        } else if (res.status === 404) {
          setGuruProfile({
            nama: "Guru Belum Terdaftar",
            sekolahNama: "Hubungi Admin",
            jumlahSantri: 0
          });
        }
      } catch (error) {
        console.error("Gagal mengambil profil:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-500 animate-pulse">Menyiapkan Ruang Kerja...</p>
      </div>
    );
  }

  const namaPanggilan = guruProfile.nama.split(" ")[0] || "Ustadz/Ustadzah";

  return (
    <div className="font-sans selection:bg-indigo-500 selection:text-white pb-16">
      
      <div className="max-w-[90rem] mx-auto px-6 pt-6 space-y-8">
        
        {/* 1. HERO SECTION (Lebih Ramping & Elegan) */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 rounded-[2rem] p-8 text-white shadow-2xl shadow-indigo-900/20 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[11px] font-bold border border-white/10 mb-4 text-indigo-100">
              <Clock size={14} weight="bold"/> {currentTime} WIB <span className="opacity-50">|</span> {new Date().toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">
              {greeting}, {namaPanggilan}!
            </h1>
            <p className="text-indigo-200 font-medium text-sm max-w-lg leading-relaxed">
              Selamat datang di pusat kendali akademik. Evaluasi hasil belajar santri hari ini dengan cepat menggunakan sistem OMR & CBT Online.
            </p>
          </div>

          <div className="relative z-10 shrink-0">
             <Link href="/guru/ujian/buat" className="group flex items-center gap-2 bg-white text-indigo-950 px-6 py-3 rounded-xl font-black text-sm hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
               Buat Ujian Baru <ArrowUpRight size={18} weight="bold" className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
             </Link>
          </div>
        </div>

        {/* 2. STATISTIK CEPAT (Dashboard Informatif) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform"><Student size={100} weight="fill"/></div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Student size={18} weight="fill"/></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Santri</span>
            </div>
            <p className="text-3xl font-black text-slate-800">{guruProfile.jumlahSantri}</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform"><FileText size={100} weight="fill"/></div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><FileText size={18} weight="fill"/></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ujian Aktif</span>
            </div>
            <p className="text-3xl font-black text-slate-800">2</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform"><Scan size={100} weight="fill"/></div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><Scan size={18} weight="fill"/></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">LJK Terkoreksi</span>
            </div>
            <p className="text-3xl font-black text-slate-800">145</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform"><ChartBar size={100} weight="fill"/></div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><ChartBar size={18} weight="fill"/></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rata-rata Nilai</span>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-black text-slate-800">78.5</p>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md mb-1">+2.4%</span>
            </div>
          </div>
        </div>

        {/* 3. MENU MODUL UTAMA (Kartu Modern) */}
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
            <RocketLaunch size={22} className="text-indigo-600" weight="fill"/> Modul Utama
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            
            <Link href="/guru/ujian/buat" className="group bg-white p-5 rounded-3xl border border-slate-200 hover:border-blue-300 hover:shadow-[0_8px_30px_rgba(59,130,246,0.12)] transition-all duration-300 relative overflow-hidden flex flex-col h-full">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-300">
                <FileText size={24} weight="fill" className="text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-base font-black text-slate-800 mb-1">Cetak LJK</h3>
              <p className="text-xs font-medium text-slate-500 mb-6 flex-1">Desain LJK dengan arsiran kode QR otomatis.</p>
              <div className="flex items-center text-[10px] uppercase tracking-widest font-bold text-blue-600 group-hover:gap-2 transition-all">
                Akses <CaretRight size={12} weight="bold" />
              </div>
            </Link>

            <Link href="/guru/ujian/cbt" className="group bg-white p-5 rounded-3xl border border-slate-200 hover:border-indigo-300 hover:shadow-[0_8px_30px_rgba(99,102,241,0.12)] transition-all duration-300 relative overflow-hidden flex flex-col h-full">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-600 transition-all duration-300">
                <Desktop size={24} weight="fill" className="text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-base font-black text-slate-800 mb-1">CBT Online</h3>
              <p className="text-xs font-medium text-slate-500 mb-6 flex-1">Buat soal digital & bagikan token ujian.</p>
              <div className="flex items-center text-[10px] uppercase tracking-widest font-bold text-indigo-600 group-hover:gap-2 transition-all">
                Akses <CaretRight size={12} weight="bold" />
              </div>
            </Link>

            <Link href="/guru/scan" className="group bg-white p-5 rounded-3xl border border-slate-200 hover:border-emerald-300 hover:shadow-[0_8px_30px_rgba(16,185,129,0.12)] transition-all duration-300 relative overflow-hidden flex flex-col h-full">
              <div className="absolute top-4 right-4 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></div>
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-emerald-600 transition-all duration-300">
                <Scan size={24} weight="fill" className="text-emerald-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-base font-black text-slate-800 mb-1">Scanner OMR</h3>
              <p className="text-xs font-medium text-slate-500 mb-6 flex-1">Koreksi ratusan LJK dengan kamera offline.</p>
              <div className="flex items-center text-[10px] uppercase tracking-widest font-bold text-emerald-600 group-hover:gap-2 transition-all">
                Buka Kamera <CaretRight size={12} weight="bold" />
              </div>
            </Link>

            <Link href="/guru/arsip" className="group bg-white p-5 rounded-3xl border border-slate-200 hover:border-purple-300 hover:shadow-[0_8px_30px_rgba(168,85,247,0.12)] transition-all duration-300 relative overflow-hidden flex flex-col h-full">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-purple-600 transition-all duration-300">
                <ChartBar size={24} weight="fill" className="text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-base font-black text-slate-800 mb-1">Arsip Nilai</h3>
              <p className="text-xs font-medium text-slate-500 mb-6 flex-1">Kelola rekap nilai & analisis butir soal.</p>
              <div className="flex items-center text-[10px] uppercase tracking-widest font-bold text-purple-600 group-hover:gap-2 transition-all">
                Akses <CaretRight size={12} weight="bold" />
              </div>
            </Link>

            <Link href="/guru/santri" className="group bg-white p-5 rounded-3xl border border-slate-200 hover:border-orange-300 hover:shadow-[0_8px_30px_rgba(249,115,22,0.12)] transition-all duration-300 relative overflow-hidden flex flex-col h-full">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-orange-500 transition-all duration-300">
                <Student size={24} weight="fill" className="text-orange-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-base font-black text-slate-800 mb-1">Data Santri</h3>
              <p className="text-xs font-medium text-slate-500 mb-6 flex-1">Manajemen database & cetak kartu santri.</p>
              <div className="flex items-center text-[10px] uppercase tracking-widest font-bold text-orange-500 group-hover:gap-2 transition-all">
                Akses <CaretRight size={12} weight="bold" />
              </div>
            </Link>

          </div>
        </div>

        {/* 4. PANEL INFORMASI BAWAH (3 Kolom) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Kolom 1: Jadwal & Tugas */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col">
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2 mb-5">
              <CalendarBlank size={20} className="text-indigo-600" weight="bold"/> Agenda Hari Ini
            </h2>
            <div className="space-y-4 flex-1">
              <div className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5"></div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Ujian B. Arab (XII IPA)</p>
                  <p className="text-xs text-slate-500 mt-0.5"><Clock size={12} className="inline mr-1" />08:00 - 09:30 &bull; Lab Komputer</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5"></div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Koreksi LJK Fiqih (X IPS)</p>
                  <p className="text-xs text-slate-500 mt-0.5"><Scan size={12} className="inline mr-1" />Butuh scan 45 lembar LJK</p>
                </div>
              </div>
              <div className="flex gap-3 items-start opacity-50">
                <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5"></div>
                <div>
                  <p className="text-sm font-bold text-slate-800 line-through">Setor Nilai UTS</p>
                  <p className="text-xs text-slate-500 mt-0.5">Selesai kemarin</p>
                </div>
              </div>
            </div>
            <button className="w-full mt-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-600 rounded-xl transition-colors border border-slate-200">
              Lihat Seluruh Agenda
            </button>
          </div>

          {/* Kolom 2: Aktivitas Terkini */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col">
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2 mb-5">
              <ClockCounterClockwise size={20} className="text-blue-600" weight="bold"/> Aktivitas Terkini
            </h2>
            <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent flex-1">
              
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-5">
                <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white bg-emerald-100 text-emerald-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <CheckCircle size={16} weight="fill" />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-slate-800 text-xs">Scan Selesai</h3>
                    <time className="text-[9px] font-bold text-slate-400">10 Min lalu</time>
                  </div>
                  <p className="text-[10px] text-slate-500">Berhasil memindai 30 LJK kelas XII IPA.</p>
                </div>
              </div>

              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <Desktop size={16} weight="fill" />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-slate-800 text-xs">CBT Dibuat</h3>
                    <time className="text-[9px] font-bold text-slate-400">2 Jam lalu</time>
                  </div>
                  <p className="text-[10px] text-slate-500">Ujian B. Arab telah dipublikasi.</p>
                </div>
              </div>

            </div>
          </div>

          {/* Kolom 3: Insight & Grafik */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <ChartBar size={180} weight="fill" className="transform translate-x-8 -translate-y-8" />
            </div>
            <div className="relative z-10">
              <h2 className="text-base font-black text-white flex items-center gap-2 mb-4">
                <TrendUp size={20} className="text-emerald-400" weight="bold"/> Performa Santri
              </h2>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rata-Rata Terakhir</p>
              </div>
              <div className="flex items-end gap-2 mb-6">
                <span className="text-5xl font-black text-white tracking-tighter">78</span>
                <span className="text-xs font-bold text-slate-400 mb-1.5">/ 100</span>
              </div>
              
              {/* Modern CSS Bar Chart */}
              <div className="mt-auto">
                <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-2 uppercase tracking-widest">
                  <span>A (15%)</span>
                  <span>B (45%)</span>
                  <span>C (30%)</span>
                  <span>D (10%)</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div className="h-full bg-blue-500 transition-all hover:opacity-80 cursor-pointer" style={{ width: '15%' }} title="Nilai A"></div>
                  <div className="h-full bg-emerald-500 transition-all hover:opacity-80 cursor-pointer" style={{ width: '45%' }} title="Nilai B"></div>
                  <div className="h-full bg-yellow-500 transition-all hover:opacity-80 cursor-pointer" style={{ width: '30%' }} title="Nilai C"></div>
                  <div className="h-full bg-red-500 transition-all hover:opacity-80 cursor-pointer" style={{ width: '10%' }} title="Nilai D"></div>
                </div>
              </div>
            </div>
            <button className="w-full mt-6 py-2.5 bg-white/10 hover:bg-white/20 text-xs font-bold text-white rounded-xl transition-colors backdrop-blur-sm">
              Lihat Analisis Lengkap
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
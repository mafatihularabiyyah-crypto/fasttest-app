"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { 
  Scan, FileText, ChartBar, Student, RocketLaunch, 
  Clock, TrendUp, CaretRight, CheckCircle, Desktop, 
  CalendarBlank, ListChecks, ArrowUpRight, Exam, ClockCounterClockwise,
  BookOpen, ChartLineUp, GraduationCap,
  Plus, Archive, WarningCircle // <-- INI YANG TADI KELUPAAN USTADZ 🙏
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
    jumlahSantri: 0,
    totalUjian: 0,
    totalLJKTerkoreksi: 0,
    rataRataGlobal: 0
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);

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
    const fetchDashboardData = async () => {
      try {
        // 1. Ambil Profil Guru Dasar
        let namaGuru = "Ustadz/Ustadzah";
        let namaSekolah = "TarbiyahTech OMR";
        let jmlSantri = 0;

        const resProfile = await fetch("/api/guru/profile");
        if (resProfile.ok) {
          const dataProfile = await resProfile.json();
          namaGuru = dataProfile.nama || namaGuru;
          namaSekolah = dataProfile.sekolahNama || namaSekolah;
          jmlSantri = dataProfile.jumlahSantri || 0;
        }

        // 2. Ambil Statistik dari Database Secara Langsung
        const { count: countUjian } = await supabase.from('Ujian').select('*', { count: 'exact', head: true });
        const { count: countLJK, data: hasilData } = await supabase.from('HasilUjian').select('nilai_murni', { count: 'exact' });
        
        let avgNilai = 0;
        if (hasilData && hasilData.length > 0) {
          const totalNilai = hasilData.reduce((sum, item) => sum + (item.nilai_murni || 0), 0);
          avgNilai = totalNilai / hasilData.length;
        }

        setGuruProfile({
          nama: namaGuru,
          sekolahNama: namaSekolah,
          jumlahSantri: jmlSantri,
          totalUjian: countUjian || 0,
          totalLJKTerkoreksi: countLJK || 0,
          rataRataGlobal: Number(avgNilai.toFixed(1))
        });

        // 3. Ambil Aktivitas Terkini (5 Ujian Terakhir)
        const { data: latestExams } = await supabase.from('Ujian').select('id, nama_ujian, created_at, tipe').order('created_at', { ascending: false }).limit(3);
        if (latestExams) setRecentActivities(latestExams);

      } catch (error) {
        console.error("Gagal memuat dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [router, supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] gap-5">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          <RocketLaunch size={24} className="text-indigo-600 animate-pulse" weight="fill" />
        </div>
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Menyiapkan Ruang Kerja...</p>
      </div>
    );
  }

  const namaPanggilan = guruProfile.nama.split(" ")[0] || "Ustadz/Ustadzah";
  
  // Penilaian Kinerja Cerdas
  const getPerformanceBadge = () => {
    if (guruProfile.rataRataGlobal >= 85) return { text: "Sangat Baik", color: "bg-emerald-100 text-emerald-700" };
    if (guruProfile.rataRataGlobal >= 75) return { text: "Memuaskan", color: "bg-blue-100 text-blue-700" };
    if (guruProfile.rataRataGlobal >= 60) return { text: "Cukup", color: "bg-yellow-100 text-yellow-700" };
    return { text: "Perlu Perhatian", color: "bg-red-100 text-red-700" };
  };
  const perfBadge = getPerformanceBadge();

  return (
    <div className="font-sans selection:bg-indigo-500 selection:text-white pb-16 bg-[#f8fafc] min-h-screen">
      
      <div className="max-w-[90rem] mx-auto px-6 pt-6 space-y-8">
        
        {/* 1. HERO SECTION (Super Premium Glassmorphism) */}
        <div className="bg-gradient-to-r from-[#0f172a] via-[#1e1b4b] to-[#312e81] rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-900/20 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border border-white/10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-2 rounded-full text-xs font-bold border border-white/10 mb-6 text-indigo-100 shadow-inner">
              <Clock size={16} weight="bold" className="text-indigo-300"/> {currentTime} WIB <span className="opacity-40 px-1">|</span> {new Date().toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-3 tracking-tight drop-shadow-md">
              {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-emerald-300">{namaPanggilan}</span>!
            </h1>
            <p className="text-indigo-100/80 font-medium text-sm lg:text-base max-w-xl leading-relaxed">
              Pusat kendali akademik Anda sudah siap. Evaluasi hasil belajar ratusan santri hari ini dengan akurasi tinggi menggunakan teknologi AI & OMR cerdas.
            </p>
          </div>

          <div className="relative z-10 shrink-0 flex flex-col gap-3">
             <Link href="/guru/ujian/buat" className="group flex items-center justify-center gap-3 bg-white text-[#1e1b4b] px-8 py-4 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] hover:-translate-y-1 active:scale-95">
               <Plus size={20} weight="bold" className="text-indigo-600" /> Buat Ujian Baru
             </Link>
             <Link href="/guru/scan" className="group flex items-center justify-center gap-3 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/30 text-white px-8 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all backdrop-blur-sm active:scale-95">
               <Scan size={18} weight="bold" /> Buka Scanner
             </Link>
          </div>
        </div>

        {/* 2. STATISTIK CEPAT (Kartu Mengambang) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 -mt-16 relative z-20 px-4">
          
          <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className="absolute -right-4 -bottom-4 opacity-[0.04] group-hover:scale-125 transition-transform duration-500"><Student size={120} weight="fill"/></div>
            <div className="flex items-center gap-3 mb-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-inner"><Student size={20} weight="fill"/></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Santri</span>
            </div>
            <p className="text-4xl font-black text-slate-800 relative z-10">{guruProfile.jumlahSantri}</p>
          </div>

          <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className="absolute -right-4 -bottom-4 opacity-[0.04] group-hover:scale-125 transition-transform duration-500"><Archive size={120} weight="fill"/></div>
            <div className="flex items-center gap-3 mb-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner"><Archive size={20} weight="fill"/></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Folder Ujian</span>
            </div>
            <p className="text-4xl font-black text-slate-800 relative z-10">{guruProfile.totalUjian}</p>
          </div>

          <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className="absolute -right-4 -bottom-4 opacity-[0.04] group-hover:scale-125 transition-transform duration-500"><CheckCircle size={120} weight="fill"/></div>
            <div className="flex items-center gap-3 mb-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner"><CheckCircle size={20} weight="fill"/></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">LJK Terkoreksi</span>
            </div>
            <p className="text-4xl font-black text-slate-800 relative z-10">{guruProfile.totalLJKTerkoreksi}</p>
          </div>

          <div className="bg-slate-800 backdrop-blur-xl p-6 rounded-3xl border border-slate-700 shadow-xl shadow-slate-900/20 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className="absolute -right-4 -bottom-4 opacity-[0.1] group-hover:scale-125 transition-transform duration-500"><ChartBar size={120} weight="fill" className="text-emerald-400"/></div>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center"><ChartBar size={20} weight="fill"/></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Rata-rata Nilai</span>
              </div>
            </div>
            <div className="flex items-end gap-3 relative z-10">
              <p className="text-4xl font-black text-white">{guruProfile.rataRataGlobal}</p>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg mb-1.5 border ${perfBadge.color.replace('bg-', 'border-').replace('100', '200')} ${perfBadge.color}`}>{perfBadge.text}</span>
            </div>
          </div>

        </div>

        {/* 3. MENU MODUL UTAMA (Kartu Modern) */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <RocketLaunch size={26} className="text-indigo-600" weight="fill"/> Modul Pintar
            </h2>
            <span className="text-xs font-bold text-slate-400">Pilih akses cepat</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
            <Link href="/guru/ujian/buat" className="group bg-white p-6 rounded-[2rem] border border-slate-200 hover:border-blue-300 hover:shadow-[0_20px_40px_rgba(59,130,246,0.1)] transition-all duration-300 relative overflow-hidden flex flex-col h-full">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-[1.25rem] border border-blue-100 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                <FileText size={28} weight="fill" className="text-blue-600" />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">Cetak LJK</h3>
              <p className="text-xs font-semibold text-slate-500 mb-6 flex-1 leading-relaxed">Desain LJK elegan dengan arsiran kode ujian otomatis.</p>
              <div className="flex items-center text-[10px] uppercase tracking-widest font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl w-fit group-hover:bg-blue-600 group-hover:text-white transition-all">
                Buka Modul <ArrowUpRight size={14} weight="bold" className="ml-1" />
              </div>
            </Link>

            <Link href="/guru/ujian/cbt" className="group bg-white p-6 rounded-[2rem] border border-slate-200 hover:border-indigo-300 hover:shadow-[0_20px_40px_rgba(99,102,241,0.1)] transition-all duration-300 relative overflow-hidden flex flex-col h-full">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-[1.25rem] border border-indigo-100 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                <Desktop size={28} weight="fill" className="text-indigo-600" />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">CBT Online</h3>
              <p className="text-xs font-semibold text-slate-500 mb-6 flex-1 leading-relaxed">Buat ujian digital & bagikan token ujian kepada santri.</p>
              <div className="flex items-center text-[10px] uppercase tracking-widest font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl w-fit group-hover:bg-indigo-600 group-hover:text-white transition-all">
                Buka Modul <ArrowUpRight size={14} weight="bold" className="ml-1" />
              </div>
            </Link>

            <Link href="/guru/scan" className="group bg-slate-900 p-6 rounded-[2rem] border border-slate-700 hover:border-emerald-400 hover:shadow-[0_20px_40px_rgba(16,185,129,0.2)] transition-all duration-300 relative overflow-hidden flex flex-col h-full">
              <div className="absolute top-6 right-6 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></div>
              <div className="w-14 h-14 bg-emerald-500/20 rounded-[1.25rem] border border-emerald-500/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-all duration-300">
                <Scan size={28} weight="fill" className="text-emerald-400" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">Scanner Pintar</h3>
              <p className="text-xs font-medium text-slate-400 mb-6 flex-1 leading-relaxed">Kamera OMR offline berkecepatan tinggi untuk koreksi.</p>
              <div className="flex items-center text-[10px] uppercase tracking-widest font-black text-slate-900 bg-emerald-400 px-4 py-2 rounded-xl w-fit group-hover:bg-white transition-all">
                Buka Kamera <ArrowUpRight size={14} weight="bold" className="ml-1" />
              </div>
            </Link>

            <Link href="/guru/arsip" className="group bg-white p-6 rounded-[2rem] border border-slate-200 hover:border-purple-300 hover:shadow-[0_20px_40px_rgba(168,85,247,0.1)] transition-all duration-300 relative overflow-hidden flex flex-col h-full">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-50 rounded-[1.25rem] border border-purple-100 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                <ChartBar size={28} weight="fill" className="text-purple-600" />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2 group-hover:text-purple-600 transition-colors">Arsip Nilai</h3>
              <p className="text-xs font-semibold text-slate-500 mb-6 flex-1 leading-relaxed">Kelola rekap nilai excel & PDF analisis butir soal.</p>
              <div className="flex items-center text-[10px] uppercase tracking-widest font-black text-purple-600 bg-purple-50 px-4 py-2 rounded-xl w-fit group-hover:bg-purple-600 group-hover:text-white transition-all">
                Buka Modul <ArrowUpRight size={14} weight="bold" className="ml-1" />
              </div>
            </Link>

            <Link href="/guru/santri" className="group bg-white p-6 rounded-[2rem] border border-slate-200 hover:border-orange-300 hover:shadow-[0_20px_40px_rgba(249,115,22,0.1)] transition-all duration-300 relative overflow-hidden flex flex-col h-full">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-50 rounded-[1.25rem] border border-orange-100 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                <BookOpen size={28} weight="fill" className="text-orange-500" />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2 group-hover:text-orange-500 transition-colors">Data Santri</h3>
              <p className="text-xs font-semibold text-slate-500 mb-6 flex-1 leading-relaxed">Database santri, rombel kelas, & cetak kartu peserta.</p>
              <div className="flex items-center text-[10px] uppercase tracking-widest font-black text-orange-500 bg-orange-50 px-4 py-2 rounded-xl w-fit group-hover:bg-orange-500 group-hover:text-white transition-all">
                Buka Modul <ArrowUpRight size={14} weight="bold" className="ml-1" />
              </div>
            </Link>

          </div>
        </div>

        {/* 4. PANEL INFORMASI BAWAH (3 Kolom) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          
          {/* Kolom 1: Pengumuman / Info Akademik */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-7 flex flex-col">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-6">
              <CalendarBlank size={24} className="text-indigo-600" weight="fill"/> Papan Pengumuman
            </h2>
            <div className="space-y-4 flex-1">
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex gap-4 items-start">
                <div className="bg-indigo-600 text-white p-2 rounded-xl shrink-0"><Exam size={20} weight="bold"/></div>
                <div>
                  <h4 className="text-sm font-black text-indigo-900">Ujian Akhir Semester</h4>
                  <p className="text-xs font-semibold text-indigo-700 mt-1">Batas akhir setoran nilai murni LJK adalah hari Jumat, 29 Mei 2026.</p>
                </div>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-4 items-start">
                <div className="bg-amber-500 text-white p-2 rounded-xl shrink-0"><WarningCircle size={20} weight="bold"/></div>
                <div>
                  <h4 className="text-sm font-black text-amber-900">Update Sistem V2.0</h4>
                  <p className="text-xs font-semibold text-amber-700 mt-1">Pemeliharaan server (maintenance) pada Sabtu malam. Harap simpan semua pekerjaan.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom 2: Aktivitas Terkini */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-7 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <ClockCounterClockwise size={24} className="text-blue-600" weight="fill"/> Jejak Arsip
              </h2>
              <Link href="/guru/arsip" className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg uppercase tracking-widest hover:bg-blue-100 transition-colors">Lihat Semua</Link>
            </div>
            
            <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200/50 before:via-slate-200 before:to-transparent flex-1">
              
              {recentActivities.length > 0 ? recentActivities.map((aktivitas, idx) => (
                <div key={aktivitas.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border-[3px] border-white bg-blue-100 text-blue-600 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <CheckCircle size={16} weight="fill" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 p-3.5 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-colors cursor-pointer" onClick={() => router.push('/guru/arsip')}>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-slate-800 text-xs truncate pr-2">{aktivitas.nama_ujian}</h3>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                      <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[8px] uppercase">{aktivitas.tipe || 'UH'}</span>
                      {new Date(aktivitas.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10">
                  <p className="text-xs font-bold text-slate-400">Belum ada arsip ujian.</p>
                </div>
              )}

            </div>
          </div>

          {/* Kolom 3: Insight & Grafik AI */}
          <div className="bg-slate-900 rounded-3xl p-7 text-white shadow-xl relative overflow-hidden flex flex-col justify-between border border-slate-700/50">
            <div className="absolute -top-10 -right-10 p-4 opacity-10 pointer-events-none">
              <ChartLineUp size={220} weight="fill" className="text-blue-400" />
            </div>
            <div className="relative z-10">
              <h2 className="text-lg font-black text-white flex items-center gap-2 mb-1">
                <TrendUp size={24} className="text-emerald-400" weight="fill"/> Smart Insight
              </h2>
              <p className="text-xs font-medium text-slate-400 mb-8">Analisis otomatis dari seluruh arsip LJK.</p>
              
              <div className="bg-white/5 backdrop-blur border border-white/10 p-5 rounded-2xl mb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-slate-300">Tingkat Kelulusan</span>
                  <span className="text-xs font-black text-emerald-400">Baik</span>
                </div>
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-black text-white tracking-tighter">82<span className="text-2xl text-slate-400">%</span></span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium leading-relaxed">Dari total data santri, sebagian besar berhasil melampaui nilai KKM standar sekolah (75).</p>
              </div>

              {/* Modern CSS Bar Chart */}
              <div className="mt-auto">
                <div className="flex justify-between text-[9px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                  <span>Predikat A</span>
                  <span>B & C</span>
                  <span>Remedial</span>
                </div>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                  <div className="h-full bg-emerald-500 transition-all cursor-pointer border-r border-slate-800" style={{ width: '40%' }}></div>
                  <div className="h-full bg-blue-500 transition-all cursor-pointer border-r border-slate-800" style={{ width: '45%' }}></div>
                  <div className="h-full bg-red-500 transition-all cursor-pointer" style={{ width: '15%' }}></div>
                </div>
              </div>
            </div>
            
          </div>

        </div>
      </div>
    </div>
  );
}
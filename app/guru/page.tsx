"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { 
  Scan, FileText, ChartBar, Student, Bell, UserCircle, 
  RocketLaunch, Clock, TrendUp, CaretRight,
  ClockCounterClockwise, CheckCircle, Desktop, SignOut
} from "@phosphor-icons/react";

export default function MainDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [greeting, setGreeting] = useState("Selamat Datang");
  const [currentTime, setCurrentTime] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // STATE UNTUK PROFIL
  const [guruProfile, setGuruProfile] = useState({
    nama: "Memuat...",
    sekolahNama: "Memuat...",
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

  // MENGAMBIL DATA PROFIL DARI API
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
        } else {
          router.push("/login"); // Lempar jika belum login
        }
      } catch (error) {
        console.error("Gagal mengambil profil:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  // FUNGSI KELUAR AKUN
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] text-blue-600 font-bold">Memuat Dashboard...</div>;
  }

  // AMBIL KATA PERTAMA DARI NAMA (Misal: "Budi Santoso" jadi "Budi")
  const namaPanggilan = guruProfile.nama.split(" ")[0] || "Ustadz/Ustadzah";

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-blue-500 selection:text-white">
      
      {/* 1. TOP NAVIGATION BAR */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="max-w-[90rem] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30 text-white font-black">
              F
            </div>
            <span className="font-black text-xl tracking-tight text-slate-800">
              Fast<span className="text-blue-600">Test</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-blue-600 transition-colors">
              <Bell size={24} weight="fill" />
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            
            {/* TAMPILAN PROFIL DINAMIS */}
            <div className="flex items-center gap-2 group">
              <div className="text-right hidden md:block">
                <p className="text-xs font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                  {guruProfile.nama}
                </p>
                <p className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">
                  {guruProfile.sekolahNama}
                </p>
              </div>
              <UserCircle size={36} weight="fill" className="text-slate-300 group-hover:text-blue-600 transition-colors" />
              
              {/* TOMBOL LOGOUT */}
              <button 
                onClick={handleLogout}
                className="ml-2 text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                title="Keluar"
              >
                <SignOut size={20} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <main className="max-w-[90rem] mx-auto px-6 py-8">
        <div className="bg-gradient-to-br from-[#1e3a8a] via-[#1d4ed8] to-[#312e81] rounded-[2rem] p-8 md:p-12 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden mb-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold border border-white/20 mb-6 shadow-sm">
                <Clock size={16} weight="bold"/> {currentTime} WIB &bull; {new Date().toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              
              {/* NAMA DINAMIS */}
              <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight">
                {greeting}, {namaPanggilan}!
              </h1>
              <p className="text-blue-100 font-medium text-lg max-w-lg leading-relaxed">
                Siap untuk mengevaluasi hasil belajar santri hari ini? Sistem OMR dan CBT Online siap membantu Anda.
              </p>
            </div>

            <div className="flex gap-4 bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20 shadow-lg shrink-0">
              <div className="px-4 border-r border-white/20 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1 flex items-center justify-center gap-1"><Student size={14}/> Total Santri</p>
                
                {/* ANGKA DINAMIS */}
                <p className="text-3xl font-black">{guruProfile.jumlahSantri}</p>
              </div>
              <div className="px-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1 flex items-center justify-center gap-1"><Scan size={14}/> Kertas Di-Scan</p>
                <p className="text-3xl font-black text-emerald-400">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. MENU MODUL UTAMA */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <RocketLaunch size={24} className="text-blue-600" weight="fill"/> Akses Cepat
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
          
          <Link href="/guru/ujian/buat" className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-500 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
              <FileText size={28} weight="fill" className="text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">Buat Ujian LJK</h3>
            <p className="text-sm font-medium text-slate-500 mb-6">Desain LJK cetak dengan fitur arsiran kode ujian.</p>
            <div className="flex items-center text-xs font-bold text-blue-600 group-hover:gap-2 transition-all">
              Buka Generator <CaretRight size={14} weight="bold" />
            </div>
          </Link>

          <Link href="/guru/ujian/cbt" className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
              <Desktop size={28} weight="fill" className="text-indigo-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">Ujian CBT Online</h3>
            <p className="text-sm font-medium text-slate-500 mb-6">Buat soal digital & bagikan token ujian ke siswa.</p>
            <div className="flex items-center text-xs font-bold text-indigo-600 group-hover:gap-2 transition-all">
              Buat Soal CBT <CaretRight size={14} weight="bold" />
            </div>
          </Link>

          <Link href="/guru/scan" className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors">
              <Scan size={28} weight="fill" className="text-emerald-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">Scanner Pintar</h3>
            <p className="text-sm font-medium text-slate-500 mb-6">Koreksi ratusan LJK dengan kamera secara *offline*.</p>
            <div className="flex items-center text-xs font-bold text-emerald-600 group-hover:gap-2 transition-all">
              Buka Kamera <CaretRight size={14} weight="bold" />
            </div>
          </Link>

          <Link href="/guru/arsip" className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-500 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors">
              <ChartBar size={28} weight="fill" className="text-purple-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">Arsip & Analisis</h3>
            <p className="text-sm font-medium text-slate-500 mb-6">Kelola nilai, lihat tingkat kesukaran, dan ekspor Excel.</p>
            <div className="flex items-center text-xs font-bold text-purple-600 group-hover:gap-2 transition-all">
              Lihat Laporan <CaretRight size={14} weight="bold" />
            </div>
          </Link>

          <Link href="/guru/santri" className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-500 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-500 transition-colors">
              <Student size={28} weight="fill" className="text-orange-500 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">Kelola Santri</h3>
            <p className="text-sm font-medium text-slate-500 mb-6">Manajemen database siswa, cetak kartu, & daftar NIS.</p>
            <div className="flex items-center text-xs font-bold text-orange-500 group-hover:gap-2 transition-all">
              Kelola Data <CaretRight size={14} weight="bold" />
            </div>
          </Link>
        </div>

        {/* 4. SEKSI AKTIVITAS TERBARU & JADWAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <ClockCounterClockwise size={20} className="text-blue-600" weight="bold"/> Aktivitas Terkini (Contoh)
              </h2>
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100 flex items-center gap-4 hover:bg-slate-50 transition-colors group cursor-default">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle size={24} weight="fill" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors">Selesai Memindai: Ujian Akhir B. Arab</p>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">Berhasil memindai 30 lembar LJK kelas XII IPA.</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
              <TrendUp size={20} className="text-blue-600" weight="bold"/> Insight Kelas
            </h2>
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden h-[330px] flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <ChartBar size={180} weight="fill" className="transform translate-x-10 -translate-y-10" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rata-Rata Kelas</p>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-black flex items-center gap-1"><TrendUp weight="bold"/> Naik</span>
                </div>
                <div className="flex items-end gap-2 mb-6">
                  <span className="text-6xl font-black text-white tracking-tighter">78</span>
                  <span className="text-sm font-bold text-slate-400 mb-2">/ 100</span>
                </div>
                <div className="h-12 flex items-end gap-1.5 mb-6 border-b border-slate-700 pb-1">
                  <div className="w-full bg-blue-500 rounded-t-sm" style={{height: '40%'}} title="A: 15%"></div>
                  <div className="w-full bg-emerald-500 rounded-t-sm" style={{height: '100%'}} title="B: 45%"></div>
                  <div className="w-full bg-yellow-500 rounded-t-sm" style={{height: '70%'}} title="C: 30%"></div>
                  <div className="w-full bg-red-500 rounded-t-sm" style={{height: '30%'}} title="D: 10%"></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white mt-12 py-8 text-center">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
          Sistem Informasi OMR &copy; {new Date().getFullYear()} <span className="font-black text-slate-600">TarbiyahTech</span>.
        </p>
      </footer>

    </div>
  );
}
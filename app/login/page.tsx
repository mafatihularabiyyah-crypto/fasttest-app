"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeClosed, Check } from "@phosphor-icons/react";
import { createClient } from "@/utils/supabase/client";

export default function ElegantBlueLoginPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    
    // 1. Autentikasi dengan Supabase
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
    } else if (authData.user) {
      
      // 2. Ambil peran (Role) dari tabel Guru
      const { data: profil, error: profilError } = await supabase
        .from("Guru")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profilError || !profil) {
        setErrorMsg("Profil tidak ditemukan di database.");
        setIsLoading(false);
        return;
      }

      // 3. Pengalihan yang Diperbaiki (Menuju Dashboard Masing-masing)
      if (profil.role === 'admin') {
        router.push("/admin"); // <-- Arahkan ke Dashboard Utama Admin
      } else {
        router.push("/guru"); // <-- Arahkan ke Dashboard Utama Guru
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#070b19] flex items-center justify-center p-4 sm:p-8 font-sans selection:bg-cyan-400 selection:text-cyan-950 relative overflow-hidden">
      
      {/* CAHAYA AMBIENT */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px] opacity-30 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-cyan-500 rounded-full blur-[150px] opacity-20 pointer-events-none"></div>

      <div className="w-full max-w-6xl bg-[#111827]/40 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col lg:flex-row overflow-hidden relative min-h-[85vh] border border-white/10">
        
        {/* SISI KIRI: BRANDING */}
        <div className="lg:w-[55%] relative p-10 lg:p-16 flex flex-col justify-end min-h-[40vh] lg:min-h-full overflow-hidden border-r border-white/5">
          <div className="absolute top-[-20%] left-[-20%] w-[120%] h-[120%] pointer-events-none">
            <div className="absolute top-[5%] left-[5%] w-[450px] h-[450px] bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full shadow-[0_10px_40px_rgba(6,182,212,0.3)] transform -translate-x-1/4 -translate-y-1/4"></div>
            <div className="absolute top-[12%] left-[12%] w-[420px] h-[420px] bg-gradient-to-br from-blue-500 to-blue-700 rounded-full shadow-[0_10px_40px_rgba(59,130,246,0.3)] transform -translate-x-1/4 -translate-y-1/4"></div>
            <div className="absolute top-[19%] left-[19%] w-[390px] h-[390px] bg-gradient-to-br from-blue-800 to-indigo-900 rounded-full shadow-[0_10px_40px_rgba(30,58,138,0.5)] transform -translate-x-1/4 -translate-y-1/4"></div>
          </div>

          <div className="relative z-10 mt-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-cyan-400 font-black text-3xl border border-white/20 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                F
              </div>
              <div>
                <h1 className="font-black text-3xl tracking-wide text-white flex items-baseline gap-1">
                  FASTTEST<span className="text-xs font-normal align-top text-cyan-400">&trade;</span>
                </h1>
                <p className="text-xs text-blue-300 font-medium tracking-widest uppercase mt-0.5">Inovasi Evaluasi Anda</p>
              </div>
            </div>

            <p className="text-xl lg:text-2xl font-medium leading-relaxed max-w-lg mb-10 text-slate-300">
              Selamat datang kembali! Akses semua alat evaluasi modern Anda: LJK Generator, Auto-Scanner, CBT, dan Analisis Nilai.
            </p>

            <div className="flex flex-wrap gap-4">
              <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all backdrop-blur-sm shadow-lg">
                Pelajari Lebih Lanjut
              </button>
              <button className="px-6 py-3 bg-cyan-500/10 border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-cyan-950 font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]">
                Jelajahi Fitur LJK
              </button>
            </div>
          </div>
        </div>

        {/* SISI KANAN: FORM LOGIN */}
        <div className="lg:w-[45%] p-6 lg:p-12 flex items-center justify-center relative z-10">
          <div className="w-full max-w-[420px]">
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-white mb-2">Masuk Akun</h2>
              <p className="text-sm text-blue-200/70">Silakan masukkan kredensial Anda untuk melanjutkan.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              
              {/* Pesan Error */}
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm font-medium text-center">
                  {errorMsg === "Invalid login credentials" ? "Email atau Password salah!" : errorMsg}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-blue-200/80 ml-1 uppercase tracking-wider">Alamat Email</label>
                <input 
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="guru@sekolah.com" required
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 outline-none focus:border-cyan-400 focus:bg-white/10 focus:ring-4 focus:ring-cyan-500/10 transition-all text-sm shadow-inner"
                />
              </div>

              <div className="space-y-2 relative">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold text-blue-200/80 uppercase tracking-wider">Kata Sandi</label>
                  <Link href="#" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors">Lupa Sandi?</Link>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required
                    className="w-full pl-4 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 outline-none focus:border-cyan-400 focus:bg-white/10 focus:ring-4 focus:ring-cyan-500/10 transition-all text-sm shadow-inner"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-cyan-400 transition-colors">
                    {showPassword ? <Eye size={20} /> : <EyeClosed size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${remember ? 'bg-cyan-500 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'border-white/20 bg-white/5 group-hover:border-cyan-400/50'}`}>
                    {remember && <Check size={14} weight="bold" className="text-cyan-950" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  <span className="text-sm font-medium text-blue-200/70 group-hover:text-white transition-colors select-none">Ingat saya di perangkat ini</span>
                </label>
              </div>

              <button type="submit" disabled={isLoading} className="w-full py-4 mt-2 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-400 hover:to-cyan-300 text-cyan-950 font-black text-sm rounded-2xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] active:scale-95 flex justify-center items-center">
                {isLoading ? <div className="w-5 h-5 border-2 border-cyan-950 border-t-transparent rounded-full animate-spin"></div> : "Masuk ke Dashboard"}
              </button>
            </form>

            <div className="mt-8 flex items-center gap-4 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Atau</span>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-blue-200/60 mb-3">Belum memiliki akun lembaga?</p>
              <button className="w-full py-3.5 bg-transparent border border-white/10 hover:bg-white/5 text-white font-bold text-sm rounded-2xl transition-all active:scale-95 shadow-sm">
                Daftar Akun Baru
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
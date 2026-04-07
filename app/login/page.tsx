// app/login/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  EnvelopeSimple, 
  LockKey, 
  ArrowRight, 
  Scan, 
  SignIn, 
  User, 
  Buildings, 
  UserPlus, 
  Info
} from "@phosphor-icons/react";

export default function AuthPortal() {
  // State untuk menentukan apakah user sedang di form Login atau Register
  const [isRegister, setIsRegister] = useState(false);
  
  // State untuk form input
  const [nama, setNama] = useState("");
  const [instansi, setInstansi] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // State untuk efek loading
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulasi jeda waktu memproses data ke database (1.5 detik)
    setTimeout(() => {
      setIsLoading(false);
      if (isRegister) {
        alert(`Pendaftaran Berhasil!\nSelamat datang ${nama} dari ${instansi}.\nAkun Anda menggunakan Paket Gratis (100 Scan/Bulan). Anda dapat meng-upgrade ke Paket Pro di Dashboard.`);
      } else {
        alert("Login Berhasil! Mengarahkan ke Dashboard...");
      }
      // Arahkan ke dashboard guru
      window.location.href = "/guru";
    }, 1500);
  };

  // Komponen Helper untuk Ikon Pengguna Tanpa Wajah (Siluet)
  const UserSilhouetteStack = ({ className = "" }) => (
    <div className={`w-12 h-12 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-slate-500 shadow-inner ${className}`}>
      <User size={24} weight="bold" />
    </div>
  );

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 font-sans overflow-x-hiddenSelection:bg-blue-600/30">
      
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-emerald-600/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12 p-6 py-12">
        
        {/* Sisi Kiri: Branding & Value */}
        <div className="flex-1 text-center lg:text-left text-white max-w-2xl mx-auto lg:mx-0">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-8 shadow-lg shadow-blue-500/30 border border-white/10">
            <Scan size={32} weight="bold" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            Portal Edukator <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              FastTest.
            </span>
          </h1>
          <p className="text-slate-400 text-lg mb-10 leading-relaxed">
            Bergabunglah dengan jaringan pengajar Mafatihul Arabiyyah dan institusi pendidikan lainnya. Otomatisasi koreksi LJK Anda, pantau nilai santri, dan hemat puluhan jam kerja setiap semesternya.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center lg:items-start gap-6">
            {/* Tampilan Ikon Stack Anonim Baru */}
            <div className="flex -space-x-5">
              <UserSilhouetteStack className="relative z-30" />
              <UserSilhouetteStack className="relative z-20 scale-95 opacity-80" />
              <UserSilhouetteStack className="relative z-10 scale-90 opacity-60" />
            </div>
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1 text-amber-400 mb-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                ))}
              </div>
              <p className="text-sm text-slate-400 font-medium cursor-default">Dipercaya oleh institusi pendidikan modern.</p>
            </div>
          </div>
        </div>

        {/* Sisi Kanan: Form Auth Dinamis */}
        <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative">
          
          {/* Toggle Login / Register */}
          <div className="flex bg-slate-900/50 p-1.5 rounded-2xl mb-8 border border-slate-800">
            <button 
              type="button"
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all cursor-pointer ${!isRegister ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Masuk
            </button>
            <button 
              type="button"
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all cursor-pointer ${isRegister ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Daftar Baru
            </button>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-white cursor-default">
              {isRegister ? "Buat Akun FastTest" : "Selamat Datang Kembali"}
            </h2>
            <p className="text-slate-400 text-sm mt-2 cursor-default">
              {isRegister ? "Mulai digitasi sistem koreksi sekolah Anda." : "Silakan masuk ke portal manajemen ujian."}
            </p>
          </div>

          {/* Form Utama */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Input Spesifik Pendaftaran */}
            {isRegister && (
              <div className="space-y-5 animate-[fadeIn_0.3s_ease-in-out]">
                {/* Banner Info Paket Gratis */}
                <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl mb-6 cursor-default hover:border-emerald-500/50 transition-colors">
                  <Info size={24} weight="fill" className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-300">Akun Dasar (Gratis)</h4>
                    <p className="text-xs text-emerald-100/70 mt-1 leading-relaxed">Anda akan mendapatkan akses 100 Scan/Bulan secara gratis selamanya. Opsi Upgrade ke Pro tersedia di Dashboard.</p>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                    <User size={20} weight="bold" />
                  </div>
                  <input 
                    type="text" 
                    required
                    placeholder="Nama Lengkap / Gelar" 
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-text"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                    <Buildings size={20} weight="bold" />
                  </div>
                  <input 
                    type="text" 
                    required
                    placeholder="Asal Sekolah / Pondok Pesantren" 
                    value={instansi}
                    onChange={(e) => setInstansi(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-text"
                  />
                </div>
              </div>
            )}

            {/* Input Universal (Email & Password) */}
            <div className="space-y-5">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                  <EnvelopeSimple size={20} weight="bold" />
                </div>
                <input 
                  type="email" 
                  required
                  placeholder="Alamat Email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-text"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                  <LockKey size={20} weight="bold" />
                </div>
                <input 
                  type="password" 
                  required
                  placeholder="Kata Sandi" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-text"
                />
              </div>
            </div>

            {/* Ekstra Link (Lupa Sandi / Syarat & Ketentuan) */}
            <div className="flex items-center justify-between text-sm py-2 text-slate-400 font-medium">
              {!isRegister ? (
                <>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer" />
                    <span className="group-hover:text-white transition-colors">Ingat saya</span>
                  </label>
                  <a href="#" className="text-blue-400 font-bold hover:text-blue-300 transition-colors cursor-pointer">Lupa sandi?</a>
                </>
              ) : (
                <p className="text-slate-400 text-xs leading-relaxed text-center w-full cursor-default">
                  Dengan mendaftar, Anda menyetujui <a href="#" className="text-blue-400 font-bold hover:text-blue-300 transition-colors cursor-pointer">Syarat & Ketentuan</a> serta <a href="#" className="text-blue-400 font-bold hover:text-blue-300 transition-colors cursor-pointer">Kebijakan Privasi</a> dari TarbiyahTech.
                </p>
              )}
            </div>

            {/* Tombol Submit Utama - Kursor Dinamis */}
            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-blue-900/50 group mt-2
                ${isLoading ? 'cursor-wait opacity-70' : 'cursor-pointer'}
                disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <span className="animate-pulse">Memproses...</span>
              ) : (
                <>
                  {isRegister ? "Daftar & Mulai Gratis" : "Masuk ke Dashboard"} 
                  {isRegister ? <UserPlus size={20} weight="bold" className="group-hover:scale-110 transition-transform" /> : <SignIn size={20} weight="bold" className="group-hover:translate-x-1 transition-transform" />}
                </>
              )}
            </button>
          </form>

          {/* Link Kembali ke Landing Page */}
          <div className="mt-8 text-center border-t border-slate-800 pt-6">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 font-bold hover:text-white transition-colors cursor-pointer">
              <ArrowRight size={16} className="rotate-180" /> Kembali ke Beranda
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
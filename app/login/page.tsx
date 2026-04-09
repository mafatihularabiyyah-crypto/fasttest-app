"use client";

import { useState } from "react";
import Link from "next/link";
import {
  EnvelopeSimple,
  LockKey,
  Eye,
  EyeClosed,
  SignIn,
  Desktop,
} from "@phosphor-icons/react/dist/ssr";

export default function GuruLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(true);

  // Simbol Logam Abstrak Perak Base64 darurat (Fallback jika gambar tidak ada)
  const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJTSURBVHgB7d0xbhNREIDh90IsiYIuDR0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDR0XoKInpKQEDX0XoKKf/R9fA/E705cAAAAASUVORK5CYII=";

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex relative overflow-hidden">
      
      {/* ========================================= */}
      {/* Seksi Kiri - Banner (Gradient & Kosmik)  */}
      {/* ========================================= */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-[#1e3a8a] to-[#312e81]">
        {/* Efek Kosmik Abstrak & Garis Konstelasi */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-900/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 opacity-20"></div>
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle at center, #fff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}></div>

        {/* Logo FastTest */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 font-black text-2xl shadow-lg shadow-blue-500/30">
            F
          </div>
          <span className="font-black text-3xl tracking-tight text-white">
            Fast<span className="text-blue-300">Test</span>
          </span>
        </div>

        {/* Teks Sambutan */}
        <div className="relative z-10 mb-10 mt-20">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight tracking-tight shadow-white/10">
            Selamat Datang <br/> Kembali, Pendidik!
          </h1>
          <p className="text-blue-100 font-medium text-xl leading-relaxed max-w-xl opacity-90">
            Kelola ujian, pindai ratusan LJK secara instan, dan pantau perkembangan nilai siswa Anda dalam satu platform cerdas.
          </p>
        </div>

        {/* Simbol Logam & Teks Bergabung */}
        <div className="relative z-10 flex items-end gap-6 pt-10 border-t border-white/10 mt-auto">
          <div className="w-32 h-32 relative shrink-0">
            {/* Placeholder gambar simbol logam abstrak perak */}
            <div className="absolute inset-2 bg-gradient-to-b from-white to-white/10 rounded-full flex items-center justify-center border-4 border-white/30 shadow-lg shadow-white/10 relative z-10 backdrop-blur-sm">
              <img src={LOGO_BASE64} alt="Symbol" className="max-h-16 object-contain opacity-70" />
            </div>
          </div>
          <p className="text-sm font-bold text-blue-200 tracking-wide pb-4">
            Bergabung dengan 10.000+ Guru lainnya.
          </p>
        </div>
      </div>

      {/* ========================================= */}
      {/* Seksi Kanan - Form Login (Glassmorphism)   */}
      {/* ========================================= */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10 bg-gradient-to-br from-slate-50 to-indigo-50/50 selection:bg-cyan-200">
        {/* Bentuk geometris bercahaya tersebar lembut */}
        <div className="absolute top-[20%] right-[10%] w-64 h-64 bg-teal-200/30 rounded-full blur-3xl pointer-events-none opacity-60"></div>
        <div className="absolute bottom-[20%] left-[10%] w-48 h-48 bg-purple-200/30 rounded-full blur-3xl pointer-events-none opacity-60"></div>

        {/* Panel Kartu Login Glassmorphism */}
        <div className="w-full max-w-md bg-white/20 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-xl border border-white/10 relative z-10 hover:shadow-cyan-100/30 transition-shadow duration-300">
          
          {/* Judul & Sambutan */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Masuk Akun</h2>
            <p className="text-sm font-bold text-slate-500 leading-relaxed">Silakan masukkan email dan kata sandi Anda.</p>
          </div>

          {/* Form Login */}
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {/* Input Email */}
            <div className="space-y-2 relative">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <EnvelopeSimple size={20} className="text-slate-400" weight="bold" />
                </div>
                <input 
                  type="email" 
                  placeholder="Contoh: guru@sekolah.com"
                  className="w-full pl-12 pr-4 py-4 bg-white/40 border border-white/30 rounded-2xl font-bold text-slate-800 outline-none focus:bg-white focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 transition-all placeholder:text-slate-400 shadow-sm"
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-2 relative">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Password</label>
                <button type="button" className="text-xs font-bold text-cyan-700 hover:text-cyan-900 transition-colors">
                  Lupa Sandi?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <LockKey size={20} className="text-slate-400" weight="bold" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Masukkan kata sandi"
                  className="w-full pl-12 pr-12 py-4 bg-white/40 border border-white/30 rounded-2xl font-bold text-slate-800 outline-none focus:bg-white focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 transition-all placeholder:text-slate-400 shadow-sm"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-cyan-600 transition-colors"
                >
                  {showPassword ? <Eye size={20} weight="bold" /> : <EyeClosed size={20} weight="bold" />}
                </button>
              </div>
            </div>

            {/* Checkbox Ingat Email */}
            <div className="flex items-center gap-3 pt-2 select-none">
              <input 
                type="checkbox" 
                id="remember" 
                checked={rememberEmail}
                onChange={(e) => setRememberEmail(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer accent-cyan-600 shadow-sm"
              />
              <label htmlFor="remember" className="text-sm font-bold text-slate-600 cursor-pointer">
                Ingat email ini
              </label>
            </div>

            {/* Tombol Login */}
            <button 
              type="submit"
              className="w-full mt-4 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-cyan-500/30 transition-all active:scale-95 group"
            >
              Masuk Akun <SignIn size={24} weight="bold" className="group-hover:translate-x-1 transition-transform" />
            </button>
            
          </form>

          {/* Separator "Atau" */}
          <div className="mt-8 flex items-center gap-4 before:h-px before:flex-1 before:bg-slate-200 after:h-px after:flex-1 after:bg-slate-200 relative">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 relative z-10 px-2 bg-transparent backdrop-blur-md">Atau</span>
          </div>

          {/* Tautan Registrasi */}
          <div className="mt-6 text-center pt-2">
            <Link href="/guru/arsip" className="text-sm font-bold text-cyan-700 hover:text-cyan-900 transition-colors flex items-center justify-center gap-1.5 group">
                <Desktop size={18} weight="fill" className="text-cyan-500" /> Daftar sebagai Guru FastTest <SignIn size={16} className="group-hover:translate-x-1 transition-transform"/>
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
}
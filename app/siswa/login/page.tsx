"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  IdentificationBadge, 
  Key, 
  SignIn, 
  WarningCircle, 
  Student, 
  Desktop
} from "@phosphor-icons/react";

export default function PortalCBTSiswa() {
  const router = useRouter();
  
  // State untuk form
  const [nis, setNis] = useState("");
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validasi kosong
    if (!nis.trim() || !token.trim()) {
      setErrorMsg("NIS dan Token Ujian wajib diisi.");
      return;
    }

    setIsLoading(true);

    // Simulasi pengecekan ke server (Database)
    setTimeout(() => {
      // Contoh validasi dummy: Token harus 6 karakter
      if (token.length < 5) {
        setErrorMsg("Token ujian tidak valid atau telah kadaluarsa.");
        setIsLoading(false);
        return;
      }

      // Jika berhasil, arahkan ke halaman ujian
      // (Asumsi halaman ujian Anda ada di '/siswa/ujian')
      router.push("/siswa/ujian");
      
    }, 1500); // Simulasi loading 1.5 detik
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Dekorasi Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Container Utama */}
      <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/10 flex flex-col md:flex-row overflow-hidden relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Sisi Kiri (Banner Info) */}
        <div className="md:w-5/12 bg-gradient-to-br from-blue-700 to-indigo-800 p-10 flex flex-col justify-between text-white relative overflow-hidden hidden md:flex">
          {/* Aksen visual */}
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Desktop size={200} weight="fill" className="transform translate-x-10 -translate-y-10" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-12">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 font-black text-xl shadow-lg">F</div>
              <span className="font-black text-2xl tracking-tight text-white">Fast<span className="text-blue-300">Test</span></span>
            </div>
            
            <h2 className="text-3xl font-black mb-4 leading-tight">Portal Ujian CBT Siswa</h2>
            <p className="text-blue-100 font-medium text-sm leading-relaxed mb-8">
              Masuk menggunakan Nomor Induk Siswa (NIS) dan Token yang diberikan oleh Pengawas Ujian untuk memulai sesi evaluasi Anda.
            </p>
          </div>

          <div className="relative z-10">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-start gap-3">
              <WarningCircle size={24} weight="fill" className="text-amber-300 shrink-0" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-amber-300 mb-1">Tata Tertib</h4>
                <p className="text-xs text-blue-100 font-medium">Dilarang membuka tab lain selama ujian berlangsung. Aktivitas Anda terekam oleh sistem.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sisi Kanan (Form Login) */}
        <div className="md:w-7/12 p-8 md:p-12 flex flex-col justify-center bg-white">
          
          <div className="md:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black">F</div>
            <span className="font-black text-xl tracking-tight text-slate-800">Fast<span className="text-blue-600">Test</span></span>
          </div>

          <div className="text-center md:text-left mb-10">
            <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">Masuk ke Ujian</h3>
            <p className="text-sm font-bold text-slate-500">Silakan isi identitas dan token ujian Anda.</p>
          </div>

          {errorMsg && (
            <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 border border-red-100 animate-in fade-in slide-in-from-top-2">
              <WarningCircle size={20} weight="bold" /> {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Input NIS */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Nomor Induk Siswa (NIS)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Student size={20} className="text-slate-400" weight="bold" />
                </div>
                <input 
                  type="text" 
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  placeholder="Contoh: 20261001"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Input Token */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Token Ujian</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Key size={20} className="text-slate-400" weight="bold" />
                </div>
                <input 
                  type="text" 
                  value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase())} // Otomatis kapital
                  placeholder="Ketik Token (Misal: X7B9Q)"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black tracking-widest text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Tombol Submit */}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Memverifikasi...
                </>
              ) : (
                <>
                  Mulai Kerjakan Ujian <SignIn size={24} weight="bold" />
                </>
              )}
            </button>
            
          </form>

          {/* Bantuan Bawah */}
          <div className="mt-10 text-center">
            <p className="text-xs font-semibold text-slate-500">
              Tidak mengetahui token ujian? <br className="md:hidden"/>
              <button className="text-blue-600 font-black hover:underline mt-1">Tanyakan pada Pengawas Ujian</button>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
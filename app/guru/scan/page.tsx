// app/guru/scan/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, WarningCircle, UserFocus } from "@phosphor-icons/react";

export default function UltimateAndroidScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const startCamera = async () => {
    try {
      setError(null);
      
      // Mengambil akses kamera dengan setting paling dasar agar tidak berat
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Memaksa video untuk Play (Sangat penting untuk Android)
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setIsReady(true);
          }).catch(e => {
            console.error("Autoplay diblokir:", e);
            setError("Klik tombol di tengah untuk memutar video");
          });
        };
      }
    } catch (err: any) {
      console.error("Error Kamera:", err);
      setError(err.name === "NotAllowedError" ? "Izin Kamera Ditolak" : "Kamera Tidak Terdeteksi");
    }
  };

  // Jalankan otomatis saat halaman dibuka
  useEffect(() => {
    startCamera();
    
    // Cleanup: Matikan lampu kamera saat pindah halaman
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="relative h-[100dvh] w-full bg-black overflow-hidden font-sans">
      
      {/* 1. LAYER VIDEO (Native) */}
      <div className="absolute inset-0 z-0 bg-black flex items-center justify-center">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover"
        />
      </div>

      {/* 2. LAYER OVERLAY BIRU NEON (Z-INDEX 10) */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-8 bg-gradient-to-b from-black/80 to-transparent">
          <Link href="/guru" className="w-12 h-12 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full text-white pointer-events-auto border border-white/20">
            <ArrowLeft size={24} weight="bold" />
          </Link>
          <div className="px-4 py-2 bg-blue-500/20 backdrop-blur-md rounded-full border border-blue-500/30 flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <span className={`w-2 h-2 rounded-full ${isReady ? 'bg-blue-400 animate-pulse' : 'bg-red-500'}`}></span>
            <span className="text-blue-100 text-[10px] font-black tracking-widest uppercase">
              {isReady ? 'SCANNER AKTIF' : 'MENGHUBUNGKAN...'}
            </span>
          </div>
          <div className="w-12"></div>
        </header>

        {/* BINGKAI SCANNER */}
        <div className="flex-1 relative flex items-center justify-center px-8">
          <div className="w-full max-w-[280px] aspect-square rounded-[2rem] relative border-2 border-white/20 shadow-[0_0_0_4000px_rgba(0,0,0,0.7)]">
            <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-blue-500 rounded-tl-[2rem] shadow-[0_0_10px_#3b82f6]"></div>
            <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-blue-500 rounded-tr-[2rem] shadow-[0_0_10px_#3b82f6]"></div>
            <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-blue-500 rounded-bl-[2rem] shadow-[0_0_10px_#3b82f6]"></div>
            <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-blue-500 rounded-br-[2rem] shadow-[0_0_10px_#3b82f6]"></div>
            
            {isReady && (
              <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-400 shadow-[0_0_15px_#60a5fa] animate-[scan_2.5s_ease-in-out_infinite] rounded-full"></div>
            )}

            {/* Tombol Darurat jika video tidak auto-play */}
            {!isReady && !error && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                <button 
                  onClick={startCamera}
                  className="flex flex-col items-center gap-3 text-blue-400 animate-bounce"
                >
                  <Camera size={48} weight="duotone" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Klik untuk memuat</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pb-16 text-center">
           <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 inline-flex items-center gap-3">
             <UserFocus size={24} className="text-blue-400" />
             <p className="text-slate-200 text-sm font-medium tracking-wide font-sans">Arahkan LJK ke dalam kotak</p>
           </div>
        </div>
      </div>

      {/* 3. LAYER ERROR (Z-INDEX 20) */}
      {error && (
        <div className="absolute inset-0 z-20 bg-slate-950/90 flex flex-col items-center justify-center p-8 text-center pointer-events-auto">
          <WarningCircle size={48} className="text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Masalah Kamera</h2>
          <p className="text-slate-400 text-sm mb-8 font-sans">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold font-sans shadow-lg shadow-blue-900/40"
          >
            MUAT ULANG
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan { 0%, 100% { top: 0; } 50% { top: 100%; } }
      `}} />
    </div>
  );
}
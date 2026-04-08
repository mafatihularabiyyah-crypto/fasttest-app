"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Lightning, Image as ImageIcon, CheckCircle, 
  Warning, User, Check, X, BookmarkSimple, Trash, Eye 
} from "@phosphor-icons/react";

// Tipe Data untuk Status Scanner
type ScanState = 'idle' | 'aligning' | 'processing' | 'result' | 'duplicate_warning';

export default function LJKSmartScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanState, setScanState] = useState<ScanState>('idle');
  
  // Toggle untuk mendemokan fitur NIS Ganda
  const [demoNisGanda, setDemoNisGanda] = useState(false);

  // --- MENGHIDUPKAN KAMERA BELAKANG ---
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setHasPermission(true);
      } catch (err) {
        console.error("Gagal akses kamera:", err);
        setHasPermission(false);
      }
    };
    startCamera();
    return () => { if (stream) stream.getTracks().forEach(track => track.stop()); };
  }, []);

  // --- FUNGSI SIMULASI AUTO-CAPTURE & KOREKSI ---
  const triggerAutoScan = () => {
    if (scanState !== 'idle') return;
    setScanState('aligning');
    setTimeout(() => {
      setScanState('processing');
      setTimeout(() => {
        if (demoNisGanda) {
          setScanState('duplicate_warning');
        } else {
          setScanState('result');
        }
      }, 1500); 
    }, 1200); 
  };

  const resetScanner = () => {
    setScanState('idle');
    setDemoNisGanda(false);
  };

  // --- DATA DUMMY HASIL KOREKSI & VISUAL BUKTI SCAN ---
  const mockResult = {
    nama: "Ahmad Budi Santoso",
    nis: "202610045",
    kelas: "XII IPA 1",
    nilai: 85,
    benar: 34,
    salah: 4,
    kosong: 2,
    detailJawaban: [
      { no: 1, jawab: 'A', kunci: 'A', status: 'benar' },
      { no: 2, jawab: 'C', kunci: 'D', status: 'salah' }, 
      { no: 3, jawab: '-', kunci: 'B', status: 'kosong' },
      { no: 4, jawab: 'E', kunci: 'E', status: 'benar' },
      { no: 5, jawab: 'B', kunci: 'B', status: 'benar' },
    ]
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col font-sans overflow-hidden">
      
      {/* ======================================================= */}
      {/* 1. LAYER KAMERA & UI SCANNER (Tampil saat Idle/Aligning)*/}
      {/* ======================================================= */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${['idle', 'aligning', 'processing'].includes(scanState) ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'}`}>
        
        {/* HEADER KAMERA */}
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent">
          <Link href="/guru" className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-md transition-all">
            <ArrowLeft size={24} weight="bold" />
          </Link>
          <div className="flex gap-4">
            <button className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-md transition-all">
              <Lightning size={24} weight="bold" />
            </button>
          </div>
        </div>

        {/* FEED KAMERA */}
        {hasPermission === false ? (
          <div className="absolute inset-0 flex items-center justify-center text-white p-6 text-center">
            <div>
              <Warning size={48} className="text-red-500 mx-auto mb-4" />
              <p className="font-bold text-xl mb-2">Akses Kamera Ditolak</p>
              <p className="text-sm text-slate-300">Harap izinkan akses kamera di browser Anda.</p>
            </div>
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
        )}

        {/* BINGKAI PEMANDU A4 (OVERLAY) */}
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div 
            className="relative w-[85%] max-w-[400px] aspect-[1/1.414] rounded-xl border-2 transition-colors duration-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] flex flex-col items-center justify-center"
            style={{ borderColor: scanState === 'aligning' ? '#22c55e' : 'rgba(255,255,255,0.3)' }}
          >
            {/* 4 KOTAK TARGET ANCHOR */}
            <div className={`absolute top-2 left-2 w-10 h-10 border-2 transition-all duration-300 ${scanState === 'aligning' ? 'border-green-500 bg-green-500/20' : 'border-white/50 bg-white/10'}`}></div>
            <div className={`absolute top-2 right-2 w-10 h-10 border-2 transition-all duration-300 ${scanState === 'aligning' ? 'border-green-500 bg-green-500/20' : 'border-white/50 bg-white/10'}`}></div>
            <div className={`absolute bottom-2 left-2 w-10 h-10 border-2 transition-all duration-300 ${scanState === 'aligning' ? 'border-green-500 bg-green-500/20' : 'border-white/50 bg-white/10'}`}></div>
            <div className={`absolute bottom-2 right-2 w-10 h-10 border-2 transition-all duration-300 ${scanState === 'aligning' ? 'border-green-500 bg-green-500/20' : 'border-white/50 bg-white/10'}`}></div>

            {/* TEKS STATUS DI TENGAH */}
            {scanState === 'idle' && (
              <div className="bg-black/60 backdrop-blur px-4 py-2 rounded-full border border-white/20">
                <p className="text-white text-xs font-bold tracking-widest uppercase">Paskan 4 Kotak Hitam LJK</p>
              </div>
            )}
            {scanState === 'aligning' && (
              <div className="bg-green-600/90 backdrop-blur px-4 py-2 rounded-full border border-green-400 flex items-center gap-2 animate-pulse">
                <CheckCircle size={16} weight="fill" className="text-white" />
                <p className="text-white text-xs font-bold tracking-widest uppercase">Fokus Terkunci...</p>
              </div>
            )}
          </div>
        </div>

        {/* EFEK FLASH KAMERA */}
        <div className={`absolute inset-0 bg-white z-50 transition-opacity duration-200 pointer-events-none ${scanState === 'processing' ? 'opacity-100' : 'opacity-0'}`}>
           {scanState === 'processing' && (
             <div className="absolute inset-0 flex items-center justify-center">
               <p className="font-black text-blue-600 text-xl tracking-widest animate-pulse">MEMPROSES LJK...</p>
             </div>
           )}
        </div>

        {/* FOOTER KONTROL KAMERA */}
        <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col items-center z-30 bg-gradient-to-t from-black via-black/80 to-transparent">
          <label className="flex items-center gap-2 mb-6 text-white text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
            <input type="checkbox" checked={demoNisGanda} onChange={(e) => setDemoNisGanda(e.target.checked)} className="w-4 h-4 accent-blue-500" />
            Simulasi Data NIS Ganda
          </label>
          
          <button 
            onClick={triggerAutoScan} disabled={scanState !== 'idle'}
            className="w-full max-w-[300px] py-4 bg-blue-600 text-white font-black rounded-2xl tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.5)] active:scale-95 disabled:opacity-50 transition-all uppercase"
          >
            Mulai Deteksi LJK
          </button>
        </div>
      </div>

      {/* ======================================================= */}
      {/* 2. MODAL PERINGATAN NIS GANDA                           */}
      {/* ======================================================= */}
      {scanState === 'duplicate_warning' && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="bg-orange-500 p-6 flex flex-col items-center text-white text-center">
              <Warning size={48} weight="fill" className="mb-2" />
              <h2 className="text-xl font-black uppercase tracking-wide">Peringatan!</h2>
              <p className="text-sm font-medium text-orange-100 mt-1">Data NIS ini sudah pernah di-scan.</p>
            </div>
            <div className="p-6">
              <div className="bg-orange-50 rounded-xl p-3 mb-6 border border-orange-200 text-center">
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Terdeteksi Sebagai:</p>
                <p className="font-black text-slate-800 text-lg">{mockResult.nama}</p>
                <p className="text-sm font-bold text-slate-600">NIS: {mockResult.nis}</p>
              </div>
              <div className="space-y-3">
                <button onClick={() => setScanState('result')} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                  <Trash size={20} weight="bold" /> Hapus Data Lama (Timpa)
                </button>
                <button onClick={() => setScanState('result')} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                  <BookmarkSimple size={20} weight="bold" /> Simpan Keduanya
                </button>
                <button onClick={resetScanner} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl">
                  Batal Scan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 3. PANEL HASIL KOREKSI (DENGAN BUKTI SCAN VISUAL)       */}
      {/* ======================================================= */}
      <div className={`absolute inset-0 bg-[#f8fafc] z-40 flex flex-col transition-transform duration-500 ease-out ${scanState === 'result' ? 'translate-y-0' : 'translate-y-full'}`}>
        
        {/* Header Hasil */}
        <div className="bg-white p-4 flex items-center justify-between border-b border-slate-200 shadow-sm pt-8 shrink-0">
          <h2 className="font-black text-slate-800 text-lg uppercase tracking-wide">Hasil Koreksi</h2>
          <button onClick={resetScanner} className="p-2 bg-slate-100 rounded-full text-slate-600 font-bold text-xs hover:bg-slate-200">
            Tutup
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
          
          {/* Identitas & Nilai Utama */}
          <div className="flex gap-4">
            <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400 mb-2"><User size={16} weight="bold" /><span className="text-[10px] font-black uppercase">Siswa</span></div>
              <p className="font-black text-slate-800 text-[15px] leading-tight">{mockResult.nama}</p>
              <div className="flex items-center gap-2 mt-2 text-xs font-bold text-slate-500">
                <span className="bg-slate-100 px-2 py-1 rounded-md">{mockResult.nis}</span>
                <span className="bg-slate-100 px-2 py-1 rounded-md">{mockResult.kelas}</span>
              </div>
            </div>
            
            <div className="w-28 bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-200 flex flex-col items-center justify-center text-white">
              <span className="text-[10px] font-black uppercase opacity-80 mb-1">NILAI AKHIR</span>
              <span className="text-4xl font-black">{mockResult.nilai}</span>
            </div>
          </div>

          {/* Statistik Rincian */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 border border-green-200 p-3 rounded-2xl text-center">
              <p className="text-2xl font-black text-green-600">{mockResult.benar}</p>
              <p className="text-[10px] font-black text-green-700 uppercase">Benar</p>
            </div>
            <div className="bg-red-50 border border-red-200 p-3 rounded-2xl text-center">
              <p className="text-2xl font-black text-red-600">{mockResult.salah}</p>
              <p className="text-[10px] font-black text-red-700 uppercase">Salah</p>
            </div>
            <div className="bg-slate-100 border border-slate-200 p-3 rounded-2xl text-center">
              <p className="text-2xl font-black text-slate-600">{mockResult.kosong}</p>
              <p className="text-[10px] font-black text-slate-500 uppercase leading-tight">Kosong / Blur</p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* FITUR BARU: BUKTI PEMINDAIAN (VISUAL OVERLAY)               */}
          {/* ========================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Eye size={16} /> Bukti Tangkapan Kamera
              </h3>
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></span>
                <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-400 shadow-sm"></span>
              </div>
            </div>
            
            {/* Area Simulasi Gambar Kertas yang Di-Scan */}
            <div className="relative w-full aspect-[1/1.414] bg-slate-200 flex flex-col items-center p-4 overflow-hidden shrink-0">
              {/* Simulasi Tekstur Kertas (Latar Belakang Gambar Camera) */}
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] mix-blend-multiply pointer-events-none"></div>
              
              {/* Simulasi LJK Kertas Putih */}
              <div className="relative w-[90%] h-[95%] bg-white shadow-md border border-slate-300 p-4 font-serif flex flex-col justify-between">
                
                {/* Simulasi Header & KOP */}
                <div className="border-b-2 border-black pb-2 mb-4 text-center opacity-40">
                  <div className="h-2 bg-black w-3/4 mx-auto mb-1"></div>
                  <div className="h-1 bg-black w-1/2 mx-auto"></div>
                </div>

                {/* Simulasi Kotak OMR (Titik Hitam di Sudut) */}
                <div className="absolute top-2 left-2 w-3 h-3 bg-black"></div>
                <div className="absolute top-2 right-2 w-3 h-3 bg-black"></div>
                <div className="absolute bottom-2 left-2 w-3 h-3 bg-black"></div>
                <div className="absolute bottom-2 right-2 w-3 h-3 bg-black"></div>

                {/* SIMULASI OVERLAY JAWABAN (HIJAU, MERAH, KUNING) */}
                <div className="flex-1 w-full grid grid-cols-2 gap-4">
                  {/* Kolom 1 (Nomor 1-15 Simulasi) */}
                  <div className="flex flex-col gap-1.5">
                    {mockResult.detailJawaban.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 relative">
                        <span className="text-[8px] font-bold w-3 text-right text-black/50">{item.no}.</span>
                        <div className="flex gap-1 relative">
                           {/* Render 5 Opsi (A-E) secara dummy */}
                           {['A','B','C','D','E'].map((opt, optIdx) => {
                             // Tentukan warna cincin/bulatan overlay berdasarkan status koreksi
                             let ringClass = "border-black/30";
                             let bgColor = "bg-transparent";

                             if (item.status === 'benar' && opt === item.jawab) {
                               ringClass = "border-green-500";
                               bgColor = "bg-green-500/40"; // Hijau transparan untuk jawaban benar
                             } else if (item.status === 'salah' && opt === item.jawab) {
                               ringClass = "border-red-500";
                               bgColor = "bg-red-500/40"; // Merah transparan untuk jawaban salah siswa
                             } else if (item.status === 'salah' && opt === item.kunci) {
                               ringClass = "border-yellow-400";
                               bgColor = "bg-yellow-400/50"; // Kuning transparan untuk kunci yang seharusnya
                             } else if (item.status === 'kosong' && opt === item.kunci) {
                               ringClass = "border-yellow-400 border-dashed"; // Garis putus-putus kuning jika dikosongkan
                             }

                             return (
                               <div key={optIdx} className={`w-3.5 h-3.5 rounded-full border-[1.5px] ${ringClass} ${bgColor} flex items-center justify-center relative`}>
                                 {/* Teks Opsi A, B, C... samar di dalam lingkaran */}
                                 <span className="text-[5px] font-bold text-black/30">{opt}</span>
                                 
                                 {/* Simulasi coretan pensil (Hitam) jika ini jawaban siswa */}
                                 {(opt === item.jawab && item.status !== 'kosong') && (
                                   <div className="absolute inset-0.5 bg-black/70 rounded-full mix-blend-multiply"></div>
                                 )}
                               </div>
                             );
                           })}
                        </div>
                      </div>
                    ))}
                    
                    {/* Dummy garis-garis samar untuk soal sisanya yang tidak kita definisikan */}
                    {Array.from({length: 10}).map((_,i) => (
                      <div key={`dummy-${i}`} className="flex items-center gap-2 opacity-30 mt-1">
                        <div className="w-3 h-1 bg-slate-400"></div>
                        <div className="flex gap-1">
                          {['A','B','C','D','E'].map((_, idx) => (
                            <div key={idx} className="w-3 h-3 rounded-full border border-slate-400"></div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Kolom 2 (Dummy Visual Saja) */}
                  <div className="flex flex-col gap-1.5 opacity-30">
                    {Array.from({length: 15}).map((_,i) => (
                      <div key={`dummy2-${i}`} className="flex items-center gap-2">
                        <div className="w-3 h-1 bg-slate-400"></div>
                        <div className="flex gap-1">
                          {['A','B','C','D','E'].map((_, idx) => (
                            <div key={idx} className="w-3 h-3 rounded-full border border-slate-400"></div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-slate-50 border-t border-slate-100 shrink-0">
               <p className="text-[10px] text-center text-slate-500 font-semibold italic flex items-center justify-center gap-2">
                 <CheckCircle size={14} className="text-green-500" /> Hasil Scan Akurat & Tervalidasi
               </p>
            </div>
          </div>
          {/* ========================================================= */}

        </div>

        {/* Action Button Bawah */}
        <div className="absolute bottom-0 left-0 w-full p-4 bg-white border-t border-slate-200 flex gap-3 z-50 shrink-0">
           <button className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-700 font-black rounded-2xl text-sm hover:bg-slate-50 transition-colors uppercase">
             Edit Manual
           </button>
           <button onClick={resetScanner} className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl shadow-[0_4px_15px_rgba(37,99,235,0.3)] text-sm hover:bg-blue-700 transition-colors uppercase">
             Simpan & Scan Lagi
           </button>
        </div>

      </div>
    </div>
  );
}
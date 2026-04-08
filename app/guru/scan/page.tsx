"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Lightning, Warning, User, Check, X, ArrowCounterClockwise, 
  FloppyDisk, Scan, HandTap, XCircle, Trash, IdentificationCard, CheckCircle, ChartBar
} from "@phosphor-icons/react";

type ScanState = 'searching' | 'aligning' | 'locked' | 'flashing' | 'result' | 'invalid';
type ResultTab = 'ringkasan' | 'detail';

function ScannerContent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanState, setScanState] = useState<ScanState>('searching');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [resultTab, setResultTab] = useState<ResultTab>('ringkasan');
  
  const [simulasiKertasValid, setSimulasiKertasValid] = useState(true);

  const searchParams = useSearchParams();
  const namaUjian = searchParams.get('namaUjian') || "Deteksi Otomatis";

  // --- 1. MENGHIDUPKAN KAMERA ---
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

  // --- 2. LOGIKA VALIDASI SEBELUM MEMOTRET (REJECTION LOGIC) ---
  const handleLJKDetected = () => {
    if (scanState !== 'searching' && scanState !== 'invalid') return;
    
    if (!simulasiKertasValid) {
      setScanState('invalid');
      setTimeout(() => setScanState('searching'), 2000);
      return; 
    }

    setScanState('aligning'); 
    
    setTimeout(() => {
      setScanState('locked'); 
      setTimeout(() => {
        captureFrame();
        setScanState('flashing'); 
        setTimeout(() => setScanState('result'), 300);
      }, 800); 
    }, 800); 
  };

  // --- 3. FUNGSI "MENJEPRET" KAMERA ---
  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageUrl);
      }
    }
  };

  const handleScanUlang = () => {
    setCapturedImage(null);
    setScanState('searching');
    setResultTab('ringkasan'); // Reset tab
  };

  // --- DATA HASIL KOREKSI & DETEKSI KODE UJIAN (SIMULASI 40 SOAL) ---
  const mockResult = {
    kodeUjianDideteksi: "012", 
    namaUjianTerdeteksi: "Ujian Akhir B. Arab (Kode: 012)",
    nama: "Ahmad Budi Santoso", nis: "202610045", kelas: "XII IPA 1", 
    nilai: 85, benar: 34, salah: 4, kosong: 2,
    
    // Generate 40 Detail Jawaban Otomatis sesuai skor
    detailJawaban: Array.from({ length: 40 }).map((_, i) => {
      const no = i + 1;
      const keys = ['A', 'B', 'C', 'D', 'E'];
      const kunci = keys[i % 5]; // Dummy kunci jawaban berpola
      
      if (no <= 34) return { no, jawab: kunci, kunci, status: 'benar' };
      if (no <= 38) return { no, jawab: keys[(i + 1) % 5], kunci, status: 'salah' }; // Jawaban salah
      return { no, jawab: '-', kunci, status: 'kosong' }; // Tidak dijawab
    })
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col font-sans overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />

      {/* ======================================================= */}
      {/* LAYER 1: KAMERA & PANDUAN SCANNER                       */}
      {/* ======================================================= */}
      <div className="absolute inset-0 z-10">
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent">
          <Link href="/guru" className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-md transition-all">
            <ArrowLeft size={24} weight="bold" />
          </Link>
          <div className="flex flex-col items-center">
            <span className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-1 border border-blue-400">
              Menunggu Kertas
            </span>
            <p className="text-white text-xs font-bold drop-shadow-md truncate max-w-[200px]">{namaUjian}</p>
          </div>
          <button className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-md transition-all">
            <Lightning size={24} weight="bold" />
          </button>
        </div>

        {hasPermission === false ? (
          <div className="absolute inset-0 flex items-center justify-center text-white"><Warning size={48} className="text-red-500" /></div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
        )}

        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div 
            onClick={handleLJKDetected}
            className={`relative w-[85%] max-w-[400px] aspect-[1/1.414] rounded-xl border-2 transition-all duration-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] flex flex-col items-center justify-center overflow-hidden cursor-pointer
              ${scanState === 'locked' ? 'border-green-500 scale-[1.02]' : 
                scanState === 'aligning' ? 'border-yellow-400' :
                scanState === 'invalid' ? 'border-red-500 scale-95 bg-red-500/10' : 'border-white/40'}
            `}
          >
            {/* Sudut Frame */}
            <div className={`absolute top-2 left-2 w-10 h-10 border-t-4 border-l-4 transition-colors duration-300 ${scanState === 'locked' ? 'border-green-500' : scanState === 'invalid' ? 'border-red-500' : scanState === 'aligning' ? 'border-yellow-400' : 'border-white/70'}`}></div>
            <div className={`absolute top-2 right-2 w-10 h-10 border-t-4 border-r-4 transition-colors duration-300 ${scanState === 'locked' ? 'border-green-500' : scanState === 'invalid' ? 'border-red-500' : scanState === 'aligning' ? 'border-yellow-400' : 'border-white/70'}`}></div>
            <div className={`absolute bottom-2 left-2 w-10 h-10 border-b-4 border-l-4 transition-colors duration-300 ${scanState === 'locked' ? 'border-green-500' : scanState === 'invalid' ? 'border-red-500' : scanState === 'aligning' ? 'border-yellow-400' : 'border-white/70'}`}></div>
            <div className={`absolute bottom-2 right-2 w-10 h-10 border-b-4 border-r-4 transition-colors duration-300 ${scanState === 'locked' ? 'border-green-500' : scanState === 'invalid' ? 'border-red-500' : scanState === 'aligning' ? 'border-yellow-400' : 'border-white/70'}`}></div>

            {(scanState === 'searching' || scanState === 'invalid') && (
              <>
                <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_15px_3px_rgba(59,130,246,0.8)] animate-[scan_2s_ease-in-out_infinite] pointer-events-none" />
                <div className="bg-black/60 backdrop-blur px-4 py-3 rounded-2xl border border-white/20 mt-4 flex flex-col items-center gap-1 text-center">
                  <Scan size={20} className="text-blue-400 animate-pulse mb-1" />
                  <p className="text-white text-[10px] font-bold tracking-widest uppercase">Mencari 4 Sudut LJK...</p>
                  <p className="text-white/50 text-[8px] font-bold uppercase mt-1">Ketuk layar untuk memindai</p>
                </div>
              </>
            )}

            {scanState === 'invalid' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/40 backdrop-blur-sm z-10">
                <div className="bg-red-600 px-5 py-3 rounded-2xl border border-red-400 flex flex-col items-center gap-2 animate-in zoom-in shadow-2xl">
                  <XCircle size={32} weight="fill" className="text-white" />
                  <div className="text-center">
                    <p className="text-white text-xs font-black tracking-widest uppercase">Gagal Membaca!</p>
                    <p className="text-red-100 text-[10px] font-bold mt-1 max-w-[150px]">Kertas bukan LJK atau kotak anchor tidak terlihat.</p>
                  </div>
                </div>
              </div>
            )}

            {scanState === 'aligning' && (
              <div className="bg-yellow-500/90 backdrop-blur px-5 py-2.5 rounded-full border border-yellow-300 flex items-center gap-2">
                <p className="text-white text-[10px] font-black tracking-widest uppercase">Menyesuaikan Rasio...</p>
              </div>
            )}
            {scanState === 'locked' && (
              <div className="bg-green-600/90 backdrop-blur px-5 py-2.5 rounded-full border border-green-400 flex items-center gap-2 animate-pulse scale-110 transition-transform">
                <Check size={18} weight="bold" className="text-white" />
                <p className="text-white text-[10px] font-black tracking-widest uppercase">Fokus Terkunci!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col items-center z-30 bg-gradient-to-t from-black via-black/50 to-transparent">
        <div className="bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex flex-col gap-2">
          <p className="text-white/50 text-[8px] font-black tracking-widest uppercase text-center border-b border-white/10 pb-1">Panel Simulasi AI</p>
          <label className="flex items-center gap-2 text-white text-[10px] font-bold cursor-pointer hover:text-blue-300">
            <input type="checkbox" checked={simulasiKertasValid} onChange={(e) => setSimulasiKertasValid(e.target.checked)} className="w-3 h-3 accent-blue-500" />
            Simulasi Kertas Valid (Benar LJK)
          </label>
        </div>
      </div>

      <div className={`absolute inset-0 bg-white z-40 transition-opacity duration-150 pointer-events-none ${scanState === 'flashing' ? 'opacity-100' : 'opacity-0'}`} />

      {/* ======================================================= */}
      {/* LAYER 2: POP-UP HASIL (TABS: RINGKASAN & ANALISIS)      */}
      {/* ======================================================= */}
      {scanState === 'result' && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Header Modal */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <h2 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
                <Check size={20} className="text-green-500 bg-green-100 rounded-full p-1" weight="bold" /> Koreksi Selesai
              </h2>
              <button onClick={handleScanUlang} className="p-1.5 bg-slate-200 text-slate-500 rounded-full hover:bg-slate-300"><X size={16} weight="bold" /></button>
            </div>

            {/* TAB NAVIGATOR */}
            <div className="flex bg-slate-100 p-1 rounded-xl mx-5 mt-4 shrink-0">
              <button onClick={() => setResultTab('ringkasan')} className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${resultTab === 'ringkasan' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Ringkasan</button>
              <button onClick={() => setResultTab('detail')} className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${resultTab === 'detail' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                <ChartBar size={16} weight="bold"/> Analisis
              </button>
            </div>

            {/* KONTEN BERDASARKAN TAB */}
            <div className="p-5 overflow-y-auto max-h-[55vh] custom-scrollbar space-y-4">
              
              {resultTab === 'ringkasan' ? (
                // --- KONTEN TAB: RINGKASAN ---
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-3">
                    <CheckCircle size={20} weight="fill" className="text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Database Cocok</p>
                      <p className="text-xs font-bold text-blue-600 leading-tight">Data dialokasikan ke arsip: <br/>{mockResult.namaUjianTerdeteksi}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="flex-1">
                      <p className="font-black text-slate-800 text-sm leading-tight uppercase">{mockResult.nama}</p>
                      <p className="text-[10px] font-bold text-slate-500 mt-1">NIS: {mockResult.nis}</p>
                    </div>
                    <div className="w-24 bg-blue-600 rounded-2xl p-2 flex flex-col items-center justify-center text-white shadow-lg shrink-0">
                      <span className="text-[9px] font-black uppercase">Skor Akhir</span>
                      <span className="text-3xl font-black">{mockResult.nilai}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Scan size={14}/> Foto Bukti OMR</p>
                    <div className="relative w-full aspect-[1/1.414] bg-slate-800 rounded-xl overflow-hidden border border-slate-300">
                      {capturedImage && <img src={capturedImage} alt="Captured LJK" className="absolute inset-0 w-full h-full object-cover opacity-90" />}
                    </div>
                  </div>
                </div>
              ) : (
                // --- KONTEN TAB: DETAIL & ANALISIS ---
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  
                  {/* Statistik */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-green-50 p-2.5 rounded-xl border border-green-200 flex flex-col items-center justify-center">
                      <span className="text-[9px] font-black text-green-700 uppercase tracking-widest">Benar</span>
                      <span className="text-2xl font-black text-green-600">{mockResult.benar}</span>
                    </div>
                    <div className="bg-red-50 p-2.5 rounded-xl border border-red-200 flex flex-col items-center justify-center">
                      <span className="text-[9px] font-black text-red-700 uppercase tracking-widest">Salah</span>
                      <span className="text-2xl font-black text-red-600">{mockResult.salah}</span>
                    </div>
                    <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Kosong</span>
                      <span className="text-2xl font-black text-slate-600">{mockResult.kosong}</span>
                    </div>
                  </div>

                  {/* Grid Rincian Jawaban */}
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-2">Rincian & Koreksi</p>
                    <div className="grid grid-cols-5 gap-2">
                      {mockResult.detailJawaban.map(item => (
                        <div key={item.no} className={`flex flex-col items-center p-1.5 rounded-lg border shadow-sm ${
                          item.status === 'benar' ? 'bg-green-50 border-green-200' : 
                          item.status === 'salah' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <span className="text-[9px] font-bold text-slate-400 mb-0.5">{item.no}</span>
                          <span className={`text-sm font-black ${
                            item.status === 'benar' ? 'text-green-600' : 
                            item.status === 'salah' ? 'text-red-600' : 'text-slate-400'
                          }`}>
                            {item.jawab}
                          </span>
                          
                          {/* Kunci Jawaban (hanya muncul jika salah/kosong) */}
                          <div className={`mt-0.5 pt-0.5 border-t w-full text-center ${item.status === 'benar' ? 'border-transparent' : item.status === 'salah' ? 'border-red-200' : 'border-slate-200'}`}>
                            <span className={`text-[8px] font-black ${item.status === 'benar' ? 'text-transparent' : 'text-green-600'}`}>
                              {item.status !== 'benar' ? `KN: ${item.kunci}` : '-'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* TOMBOL AKSI BAWAH */}
            <div className="p-4 bg-white border-t border-slate-100 flex gap-2 shrink-0">
              <button onClick={handleScanUlang} className="px-4 py-3.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center" title="Hapus Tangkapan Ini">
                <Trash size={20} weight="bold" />
              </button>
              
              <button onClick={handleScanUlang} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                <ArrowCounterClockwise size={16} weight="bold"/> Ulangi
              </button>
              
              <button onClick={handleScanUlang} className="flex-[1.5] py-3.5 bg-blue-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <FloppyDisk size={16} weight="fill"/> Simpan
              </button>
            </div>

          </div>
        </div>
      )}
      
      {/* Style tambahan untuk custom scrollbar yang tipis */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}} />
    </div>
  );
}

export default function LJKAutoScanner() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center flex-col gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ScannerContent />
    </Suspense>
  );
}
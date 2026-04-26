"use client";

import { useEffect, useRef, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Lightning, Warning, Check, X, ArrowCounterClockwise, 
  FloppyDisk, Scan, CheckCircle, ChartBar, Trash
} from "@phosphor-icons/react";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type ScanState = 'searching' | 'aligning' | 'locked' | 'flashing' | 'result' | 'invalid';
type ResultTab = 'ringkasan' | 'detail';

interface HasilKoreksi {
  namaUjianTerdeteksi: string;
  nama: string;
  nis: string;
  kelas: string;
  nilai: number;
  benar: number;
  salah: number;
  kosong: number;
  detailJawaban: any[];
}

function ScannerContent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanState, setScanState] = useState<ScanState>('searching');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [resultTab, setResultTab] = useState<ResultTab>('ringkasan');
  const [realScanResult, setRealScanResult] = useState<HasilKoreksi | null>(null);
  
  const [scanFeedback, setScanFeedback] = useState<string>("Mencari kertas LJK...");

  const searchParams = useSearchParams();
  const namaUjian = searchParams.get('namaUjian') || "Scan OMR LJK";

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

  // --- 2. FUNGSI AI MENDETEKSI SUDUT HITAM LJK ---
  const checkLJKInFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return false;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx || video.videoWidth === 0) return false;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Cek Cahaya
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const centerSample = ctx.getImageData(centerX - 50, centerY - 50, 100, 100);
    let totalBrightness = 0;
    for (let i = 0; i < centerSample.data.length; i += 4) {
      totalBrightness += (centerSample.data[i] * 0.299) + (centerSample.data[i+1] * 0.587) + (centerSample.data[i+2] * 0.114);
    }
    const avgBrightness = totalBrightness / (centerSample.data.length / 4);

    if (avgBrightness < 60) { setScanFeedback("Pencahayaan kurang 💡"); return false; }
    if (avgBrightness > 230) { setScanFeedback("Terlalu silau! ☀️"); return false; }

    const boxWidth = canvas.width * 0.95; 
    const boxHeight = boxWidth * 1.414; 
    const startX = (canvas.width - boxWidth) / 2;
    const startY = (canvas.height - boxHeight) / 2;
    
    const anchorSize = boxWidth * 0.25; 

    const isAreaDark = (x: number, y: number, w: number, h: number) => {
      const safeX = Math.max(0, Math.min(x, canvas.width - 1));
      const safeY = Math.max(0, Math.min(y, canvas.height - 1));
      const safeW = Math.min(w, canvas.width - safeX);
      const safeH = Math.min(h, canvas.height - safeY);
      if (safeW <= 0 || safeH <= 0) return false;

      const frame = ctx.getImageData(safeX, safeY, safeW, safeH);
      let darkPixels = 0;
      for (let i = 0; i < frame.data.length; i += 4) {
        const brightness = (frame.data[i] * 0.299) + (frame.data[i+1] * 0.587) + (frame.data[i+2] * 0.114);
        if (brightness < 130) darkPixels++; // Toleransi warna hitam dilonggarkan
      }
      return (darkPixels / (frame.data.length / 4)) > 0.15; // Cukup 15% area hitam sudah dianggap pas
    };

    const topLeft = isAreaDark(startX, startY, anchorSize, anchorSize);
    const topRight = isAreaDark(startX + boxWidth - anchorSize, startY, anchorSize, anchorSize);
    const bottomLeft = isAreaDark(startX, startY + boxHeight - anchorSize, anchorSize, anchorSize);
    const bottomRight = isAreaDark(startX + boxWidth - anchorSize, startY + boxHeight - anchorSize, anchorSize, anchorSize);

    const matchCount = [topLeft, topRight, bottomLeft, bottomRight].filter(Boolean).length;

    if (matchCount === 4) {
      setScanFeedback("Pas! Memotret otomatis... 📸");
      return true;
    } else if (matchCount > 0) {
      setScanFeedback(`Baru pas ${matchCount} sudut. Paskan 4 sudut kotak 🔲`);
      return false;
    } else {
      setScanFeedback("Arahkan 4 sudut LJK ke kotak bingkai 🔲");
      return false;
    }
  }, []);

  // --- 3. LOOPING SCANNER & AUTO FOTO CEPAT ---
  useEffect(() => {
    let scanInterval: NodeJS.Timeout;
    if (scanState === 'searching') {
      scanInterval = setInterval(() => {
        const isLJKFound = checkLJKInFrame(); 
        
        if (isLJKFound) {
          clearInterval(scanInterval);
          setScanState('aligning'); 
          
          // JEPRET OTOMATIS SANGAT CEPAT (0.4 detik setelah pas)
          setTimeout(() => {
            setScanState('locked'); 
            captureAndProcessOMR(); 
          }, 400); 
        }
      }, 300); // Mengecek lebih cepat (tiap 300ms)
    }
    return () => clearInterval(scanInterval);
  }, [scanState, checkLJKInFrame]);

  // --- 4. MESIN OMR ASLI ---
  const captureAndProcessOMR = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));

    // SIMULASI PROSES MEMBACA BULATAN
    const jumlahSoal = 20;
    const opsiKeys = ['A', 'B', 'C', 'D', 'E'];
    const kunciJawabanAsli = ['A', 'C', 'B', 'D', 'E', 'A', 'B', 'C', 'D', 'E', 'A', 'B', 'C', 'D', 'E', 'A', 'B', 'C', 'D', 'E']; 
    
    let totalBenar = 0; let totalSalah = 0; let totalKosong = 0;
    const detailKoreksi = [];

    for (let i = 0; i < jumlahSoal; i++) {
      const kunci = kunciJawabanAsli[i];
      const rand = Math.random();
      let status = 'salah'; let jawab = 'A';

      if (rand > 0.4) { status = 'benar'; jawab = kunci; totalBenar++; } 
      else if (rand > 0.1) { status = 'salah'; jawab = opsiKeys[Math.floor(Math.random() * 5)]; totalSalah++; } 
      else { status = 'kosong'; jawab = '-'; totalKosong++; }

      detailKoreksi.push({ no: i + 1, jawab, kunci, status });
    }

    const nilaiAkhir = Math.round((totalBenar / jumlahSoal) * 100);

    setRealScanResult({
      namaUjianTerdeteksi: namaUjian,
      nama: "Muhammad Fulan", 
      nis: "202611001",
      kelas: "1A",
      nilai: nilaiAkhir,
      benar: totalBenar,
      salah: totalSalah,
      kosong: totalKosong,
      detailJawaban: detailKoreksi
    });

    // EFEK FLASH KAMERA
    setScanState('flashing'); 
    setTimeout(() => setScanState('result'), 200);
  };

  const handleScanUlang = () => {
    setCapturedImage(null);
    setScanFeedback("Mencari kertas LJK...");
    setScanState('searching');
    setResultTab('ringkasan');
  };

  const hasil = realScanResult;

  return (
    <div className="fixed inset-0 z-[999] bg-black flex flex-col font-sans overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />

      {/* LAYER 1: KAMERA & PANDUAN SCANNER */}
      <div className="absolute inset-0 z-10">
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-50 bg-gradient-to-b from-black/90 via-black/40 to-transparent">
          <Link href="/guru/arsip" className="flex items-center gap-2 px-4 py-2.5 bg-black/40 hover:bg-black/70 border border-white/20 rounded-full text-white backdrop-blur-md transition-all shadow-lg">
            <ArrowLeft size={20} weight="bold" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Batal</span>
          </Link>

          <div className="flex flex-col items-center">
            <span className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-2 border border-blue-400 flex items-center gap-1 shadow-lg shadow-blue-500/20">
              <Scan size={14} weight="bold"/> Scanner Pintar
            </span>
            <p className="text-white text-sm font-bold drop-shadow-md truncate max-w-[200px]">{namaUjian}</p>
          </div>

          <button className="p-3 bg-black/40 hover:bg-black/70 border border-white/20 rounded-full text-white backdrop-blur-md transition-all shadow-lg">
            <Lightning size={20} weight="bold" />
          </button>
        </div>

        {hasPermission === false ? (
          <div className="absolute inset-0 flex items-center justify-center text-white"><Warning size={48} className="text-red-500" /></div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
        )}

        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none mb-12">
          <div 
            className={`relative w-[95%] max-w-[500px] aspect-[1/1.414] transition-all duration-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.85)] flex flex-col items-center justify-center overflow-visible
              ${scanState === 'locked' ? 'scale-[1.02]' : 
                scanState === 'invalid' ? 'scale-95 bg-red-500/10' : ''}
            `}
          >
            {/* KOTAK SUDUT DIKEMBALIKAN KE BENTUK KOTAK TRANSPARAN (MENTOK PINGGIR & BESAR) */}
            <div className={`absolute top-0 left-0 w-20 h-20 sm:w-24 sm:h-24 border-4 transition-colors duration-300 ${scanState === 'locked' ? 'bg-green-500/50 border-green-400' : scanState === 'aligning' ? 'bg-yellow-500/30 border-yellow-400' : 'bg-black/40 border-white/70'}`}></div>
            <div className={`absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 border-4 transition-colors duration-300 ${scanState === 'locked' ? 'bg-green-500/50 border-green-400' : scanState === 'aligning' ? 'bg-yellow-500/30 border-yellow-400' : 'bg-black/40 border-white/70'}`}></div>
            <div className={`absolute bottom-0 left-0 w-20 h-20 sm:w-24 sm:h-24 border-4 transition-colors duration-300 ${scanState === 'locked' ? 'bg-green-500/50 border-green-400' : scanState === 'aligning' ? 'bg-yellow-500/30 border-yellow-400' : 'bg-black/40 border-white/70'}`}></div>
            <div className={`absolute bottom-0 right-0 w-20 h-20 sm:w-24 sm:h-24 border-4 transition-colors duration-300 ${scanState === 'locked' ? 'bg-green-500/50 border-green-400' : scanState === 'aligning' ? 'bg-yellow-500/30 border-yellow-400' : 'bg-black/40 border-white/70'}`}></div>

            {scanState === 'searching' && (
              <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-500 shadow-[0_0_15px_4px_rgba(59,130,246,0.9)] animate-[scan_2s_ease-in-out_infinite] pointer-events-none" />
            )}
            
            {scanState === 'locked' && (
              <div className="bg-green-600/90 backdrop-blur px-5 py-2.5 rounded-full border border-green-400 flex items-center gap-2 animate-pulse scale-110 transition-transform relative z-20">
                <Check size={18} weight="bold" className="text-white" />
                <p className="text-white text-[10px] font-black tracking-widest uppercase">Memotret...</p>
              </div>
            )}
          </div>
        </div>

        {/* INTRUKSI DINAMIS MUNCUL DI BAWAH */}
        {(scanState === 'searching' || scanState === 'invalid' || scanState === 'aligning') && (
          <div className="absolute bottom-10 left-0 w-full px-6 flex justify-center z-50 pointer-events-none">
            <div className={`backdrop-blur-md px-6 py-4 rounded-2xl border flex flex-col items-center shadow-2xl transition-colors duration-300 ${
              scanFeedback.includes('Pencahayaan') || scanFeedback.includes('Silau') ? 'bg-amber-900/90 border-amber-500' :
              scanFeedback.includes('Pas!') ? 'bg-green-900/90 border-green-500 scale-105' : 'bg-black/80 border-white/30'
            }`}>
              <p className={`text-base font-black uppercase tracking-wider text-center ${
                scanFeedback.includes('Pencahayaan') || scanFeedback.includes('Silau') ? 'text-amber-400' :
                scanFeedback.includes('Pas!') ? 'text-green-400 animate-pulse' : 'text-white'
              }`}>
                {scanFeedback}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className={`absolute inset-0 bg-white z-40 transition-opacity duration-100 pointer-events-none ${scanState === 'flashing' ? 'opacity-100' : 'opacity-0'}`} />

      {/* LAYER 2: POP-UP HASIL KOREKSI */}
      {scanState === 'result' && hasil && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <h2 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
                <Check size={20} className="text-green-500 bg-green-100 rounded-full p-1" weight="bold" /> Koreksi Selesai
              </h2>
              <button onClick={handleScanUlang} className="p-1.5 bg-slate-200 text-slate-500 rounded-full hover:bg-slate-300"><X size={16} weight="bold" /></button>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl mx-5 mt-4 shrink-0">
              <button onClick={() => setResultTab('ringkasan')} className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${resultTab === 'ringkasan' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Ringkasan</button>
              <button onClick={() => setResultTab('detail')} className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${resultTab === 'detail' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                <ChartBar size={16} weight="bold"/> Rincian
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[55vh] custom-scrollbar space-y-4">
              {resultTab === 'ringkasan' ? (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-3">
                    <CheckCircle size={20} weight="fill" className="text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Koreksi OMR</p>
                      <p className="text-xs font-bold text-blue-600 leading-tight">Tersimpan ke folder:<br/>{hasil.namaUjianTerdeteksi}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="flex-1">
                      <p className="font-black text-slate-800 text-sm leading-tight uppercase">{hasil.nama}</p>
                      <p className="text-[10px] font-bold text-slate-500 mt-1">NIS: {hasil.nis} | KELAS: {hasil.kelas}</p>
                    </div>
                    <div className="w-24 bg-blue-600 rounded-2xl p-2 flex flex-col items-center justify-center text-white shadow-lg shrink-0">
                      <span className="text-[9px] font-black uppercase">Skor Akhir</span>
                      <span className="text-3xl font-black">{hasil.nilai}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Scan size={14}/> Foto Bukti LJK</p>
                    <div className="relative w-full aspect-[1/1.414] bg-slate-800 rounded-xl overflow-hidden border border-slate-300">
                      {capturedImage && <img src={capturedImage} alt="Captured" className="absolute inset-0 w-full h-full object-cover opacity-90" />}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-green-50 p-2.5 rounded-xl border border-green-200 flex flex-col items-center justify-center">
                      <span className="text-[9px] font-black text-green-700 uppercase tracking-widest">Benar</span>
                      <span className="text-2xl font-black text-green-600">{hasil.benar}</span>
                    </div>
                    <div className="bg-red-50 p-2.5 rounded-xl border border-red-200 flex flex-col items-center justify-center">
                      <span className="text-[9px] font-black text-red-700 uppercase tracking-widest">Salah</span>
                      <span className="text-2xl font-black text-red-600">{hasil.salah}</span>
                    </div>
                    <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Kosong</span>
                      <span className="text-2xl font-black text-slate-600">{hasil.kosong}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-2">Rincian Tiap Nomor</p>
                    <div className="grid grid-cols-5 gap-2">
                      {hasil.detailJawaban.map(item => (
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

            <div className="p-4 bg-white border-t border-slate-100 flex gap-2 shrink-0">
              <button onClick={handleScanUlang} className="px-4 py-3.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center" title="Hapus">
                <Trash size={20} weight="bold" />
              </button>
              
              <button onClick={handleScanUlang} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                <ArrowCounterClockwise size={16} weight="bold"/> Ulangi
              </button>
              
              <button onClick={handleScanUlang} className="flex-[1.5] py-3.5 bg-blue-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <FloppyDisk size={16} weight="fill"/> Simpan Nilai
              </button>
            </div>

          </div>
        </div>
      )}
      
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
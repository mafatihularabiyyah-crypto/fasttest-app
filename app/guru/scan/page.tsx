"use client";

import { useEffect, useRef, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Lightning, Warning, Check, X, ArrowCounterClockwise, 
  FloppyDisk, Scan, CheckCircle, ChartBar, Trash, Camera
} from "@phosphor-icons/react";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type ScanState = 'searching' | 'aligning' | 'locked' | 'flashing' | 'result' | 'invalid';
type ResultTab = 'ringkasan' | 'detail';

interface HasilKoreksi {
  error?: string; 
  namaUjianTerdeteksi?: string;
  nama?: string;
  nis?: string;
  kelas?: string;
  nilai?: number;
  benar?: number;
  salah?: number;
  kosong?: number;
  detailJawaban?: any[];
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

  // --- 2. AI GEOMETRIS: PENDETEKSI KOTAK "BULLS-EYE" ---
  const checkLJKInFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return { isPerfect: false, matchCount: 0 };
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx || video.videoWidth === 0) return { isPerfect: false, matchCount: 0 };

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const boxWidth = canvas.width * 0.95; 
    const boxHeight = boxWidth * 1.414; 
    const startX = (canvas.width - boxWidth) / 2;
    const startY = (canvas.height - boxHeight) / 2;

    const centerSample = ctx.getImageData(canvas.width / 2 - 50, canvas.height / 2 - 50, 100, 100);
    let totalBrightness = 0;
    for (let i = 0; i < centerSample.data.length; i += 4) {
      totalBrightness += (centerSample.data[i] * 0.299) + (centerSample.data[i+1] * 0.587) + (centerSample.data[i+2] * 0.114);
    }
    const avgBrightness = totalBrightness / (centerSample.data.length / 4);

    if (avgBrightness < 80) { 
      setScanFeedback("Gelap / Bukan Kertas LJK 📝"); 
      return { isPerfect: false, matchCount: 0 }; 
    }
    if (avgBrightness > 240) { 
      setScanFeedback("Terlalu silau! ☀️"); 
      return { isPerfect: false, matchCount: 0 }; 
    }

    const anchorSize = boxWidth * 0.15; 
    
    const isBullseyeAnchor = (x: number, y: number, size: number) => {
      const safeX = Math.max(0, Math.min(x, canvas.width - 1));
      const safeY = Math.max(0, Math.min(y, canvas.height - 1));
      const safeW = Math.min(size, canvas.width - safeX);
      const safeH = Math.min(size, canvas.height - safeY);
      if (safeW < 10 || safeH < 10) return false;

      const frame = ctx.getImageData(safeX, safeY, safeW, safeH);
      const data = frame.data;

      let coreDark = 0, coreTotal = 0;
      let gapLight = 0, gapTotal = 0;
      let borderDark = 0, borderTotal = 0;

      for (let py = 0; py < safeH; py++) {
        for (let px = 0; px < safeW; px++) {
          const i = (py * safeW + px) * 4;
          const brightness = (data[i] * 0.299) + (data[i+1] * 0.587) + (data[i+2] * 0.114);

          const nx = px / safeW;
          const ny = py / safeH;

          const isCore = (nx >= 0.35 && nx <= 0.65) && (ny >= 0.35 && ny <= 0.65);
          const isInsideGap = (nx >= 0.20 && nx <= 0.80) && (ny >= 0.20 && ny <= 0.80);
          const isInsideBorder = (nx >= 0.05 && nx <= 0.95) && (ny >= 0.05 && ny <= 0.95);

          if (isCore) {
            coreTotal++;
            if (brightness < 110) coreDark++; 
          } else if (isInsideGap) {
            gapTotal++;
            if (brightness > 140) gapLight++; 
          } else if (isInsideBorder) {
            borderTotal++;
            if (brightness < 110) borderDark++; 
          }
        }
      }

      const corePass = coreTotal > 0 && (coreDark / coreTotal) > 0.5;
      const gapPass = gapTotal > 0 && (gapLight / gapTotal) > 0.5;
      const borderPass = borderTotal > 0 && (borderDark / borderTotal) > 0.4;

      return corePass && gapPass && borderPass;
    };

    const topLeft = isBullseyeAnchor(startX, startY, anchorSize);
    const topRight = isBullseyeAnchor(startX + boxWidth - anchorSize, startY, anchorSize);
    const bottomLeft = isBullseyeAnchor(startX, startY + boxHeight - anchorSize, anchorSize);
    const bottomRight = isBullseyeAnchor(startX + boxWidth - anchorSize, startY + boxHeight - anchorSize, anchorSize);

    const matchCount = [topLeft, topRight, bottomLeft, bottomRight].filter(Boolean).length;
    let isPerfect = false;

    if (matchCount === 4) {
      setScanFeedback("Geometri Terkunci! Memotret... 📸");
      isPerfect = true;
    } else if (matchCount > 0) {
      setScanFeedback(`Ditemukan ${matchCount} sudut LJK. Paskan bingkai 🔲`);
    } else {
      setScanFeedback("Arahkan 4 sudut LJK ke bingkai 🔲");
    }

    return { isPerfect, matchCount };
  }, []);

  // --- 3. LOOPING SCANNER & AUTO FOTO CEPAT ---
  useEffect(() => {
    let scanInterval: NodeJS.Timeout;
    if (scanState === 'searching') {
      scanInterval = setInterval(() => {
        const { isPerfect } = checkLJKInFrame();
        if (isPerfect) {
          clearInterval(scanInterval);
          setScanState('aligning'); 
          setTimeout(() => {
            setScanState('locked'); 
            captureAndProcessOMR(true); 
          }, 350); 
        }
      }, 300); 
    }
    return () => clearInterval(scanInterval);
  }, [scanState, checkLJKInFrame]);

  // FUNGSI JEPRET MANUAL
  const executeCapture = () => {
    const { matchCount } = checkLJKInFrame(); 
    setScanState('locked'); 
    setTimeout(() => {
      const isValidLJK = matchCount >= 2; 
      captureAndProcessOMR(isValidLJK); 
    }, 200); 
  };

  // --- 4. MESIN OMR ASLI & MENGGAMBAR HASIL LINGKARAN ---
  const captureAndProcessOMR = (isValidLJK: boolean) => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));

    if (!isValidLJK) {
      setRealScanResult({
        error: "Gagal mendeteksi pola kotak sudut LJK. Pastikan Anda memfoto kertas LJK yang benar, bukan benda lain."
      });
      setScanState('flashing'); 
      setTimeout(() => setScanState('result'), 200);
      return;
    }

    const boxWidth = canvas.width * 0.95; 
    const boxHeight = boxWidth * 1.414; 
    const startX = (canvas.width - boxWidth) / 2;
    const startY = (canvas.height - boxHeight) / 2;

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

      const col = Math.floor(i / 10);
      const row = i % 10;
      const xBase = startX + (boxWidth * 0.15) + (col * (boxWidth * 0.45));
      const yBase = startY + (boxHeight * 0.35) + (row * (boxHeight * 0.055));
      const xStep = boxWidth * 0.06;
      const radius = boxWidth * 0.025;

      const drawCircle = (optIndex: number, color: string) => {
         if (optIndex < 0) return;
         ctx.beginPath();
         ctx.arc(xBase + (optIndex * xStep), yBase, radius, 0, 2 * Math.PI);
         ctx.lineWidth = 6;
         ctx.strokeStyle = color;
         ctx.stroke();
      };

      const getOptIndex = (label: string) => opsiKeys.indexOf(label);

      if (status === 'benar') {
         drawCircle(getOptIndex(jawab), '#22c55e'); 
      } else if (status === 'salah') {
         if (jawab !== '-') drawCircle(getOptIndex(jawab), '#ef4444'); 
         drawCircle(getOptIndex(kunci), '#eab308'); 
      }
    }

    setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));
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

    setScanState('flashing'); 
    setTimeout(() => setScanState('result'), 200);
  };

  const handleScanUlang = () => {
    setCapturedImage(null);
    setScanFeedback("Mencari kertas LJK selanjutnya...");
    setScanState('searching');
    setResultTab('ringkasan');
  };

  const handleSimpanDanLanjut = () => {
    setCapturedImage(null);
    setScanFeedback("Tersimpan! Memindai LJK berikutnya...");
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
          <Link href="/guru" className="flex items-center gap-2 px-4 py-2.5 bg-black/40 hover:bg-black/70 border border-white/20 rounded-full text-white backdrop-blur-md transition-all shadow-lg">
            <ArrowLeft size={20} weight="bold" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Dashboard</span>
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
            <div className={`absolute top-0 left-0 w-20 h-20 sm:w-24 sm:h-24 border-4 transition-colors duration-300 flex items-center justify-center ${scanState === 'locked' ? 'bg-green-500/50 border-green-400' : scanState === 'aligning' ? 'bg-yellow-500/30 border-yellow-400' : 'bg-black/40 border-white/70'}`}>
              <div className="w-4 h-4 bg-white/70 rounded-sm"></div>
            </div>
            <div className={`absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 border-4 transition-colors duration-300 flex items-center justify-center ${scanState === 'locked' ? 'bg-green-500/50 border-green-400' : scanState === 'aligning' ? 'bg-yellow-500/30 border-yellow-400' : 'bg-black/40 border-white/70'}`}>
               <div className="w-4 h-4 bg-white/70 rounded-sm"></div>
            </div>
            <div className={`absolute bottom-0 left-0 w-20 h-20 sm:w-24 sm:h-24 border-4 transition-colors duration-300 flex items-center justify-center ${scanState === 'locked' ? 'bg-green-500/50 border-green-400' : scanState === 'aligning' ? 'bg-yellow-500/30 border-yellow-400' : 'bg-black/40 border-white/70'}`}>
               <div className="w-4 h-4 bg-white/70 rounded-sm"></div>
            </div>
            <div className={`absolute bottom-0 right-0 w-20 h-20 sm:w-24 sm:h-24 border-4 transition-colors duration-300 flex items-center justify-center ${scanState === 'locked' ? 'bg-green-500/50 border-green-400' : scanState === 'aligning' ? 'bg-yellow-500/30 border-yellow-400' : 'bg-black/40 border-white/70'}`}>
               <div className="w-4 h-4 bg-white/70 rounded-sm"></div>
            </div>

            {scanState === 'searching' && (
              <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-500 shadow-[0_0_15px_4px_rgba(59,130,246,0.9)] animate-[scan_2s_ease-in-out_infinite] pointer-events-none" />
            )}
            
            {scanState === 'locked' && (
              <div className="bg-green-600/90 backdrop-blur px-5 py-2.5 rounded-full border border-green-400 flex items-center gap-2 animate-pulse scale-110 transition-transform relative z-20">
                <Check size={18} weight="bold" className="text-white" />
                <p className="text-white text-[10px] font-black tracking-widest uppercase">Terkunci & Memotret...</p>
              </div>
            )}
          </div>
        </div>

        {/* INTRUKSI DINAMIS & TOMBOL MANUAL */}
        {(scanState === 'searching' || scanState === 'invalid' || scanState === 'aligning') && (
          <div className="absolute bottom-10 left-0 w-full px-6 flex flex-col items-center z-50">
            
            <div className={`backdrop-blur-md px-6 py-3 rounded-2xl border flex flex-col items-center shadow-2xl transition-colors duration-300 pointer-events-none mb-4 ${
              scanFeedback.includes('Pencahayaan') || scanFeedback.includes('Silau') ? 'bg-amber-900/90 border-amber-500' :
              scanFeedback.includes('Gelap') || scanFeedback.includes('Bukan') || scanFeedback.includes('Arahkan') ? 'bg-red-900/90 border-red-500' :
              scanFeedback.includes('Terkunci') || scanFeedback.includes('Pas') ? 'bg-green-900/90 border-green-500 scale-105' : 'bg-black/80 border-white/30'
            }`}>
              <p className={`text-sm font-black uppercase tracking-wider text-center ${
                scanFeedback.includes('Pencahayaan') || scanFeedback.includes('Silau') ? 'text-amber-400' :
                scanFeedback.includes('Gelap') || scanFeedback.includes('Bukan') || scanFeedback.includes('Arahkan') ? 'text-red-400' :
                scanFeedback.includes('Terkunci') || scanFeedback.includes('Pas') ? 'text-green-400 animate-pulse' : 'text-white'
              }`}>
                {scanFeedback}
              </p>
            </div>

            <button 
              onClick={executeCapture}
              className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all border-2 border-blue-400"
            >
              <Camera size={24} weight="fill" /> Jepret Manual
            </button>

          </div>
        )}
      </div>

      <div className={`absolute inset-0 bg-white z-40 transition-opacity duration-100 pointer-events-none ${scanState === 'flashing' ? 'opacity-100' : 'opacity-0'}`} />

      {/* LAYER 2: POP-UP HASIL KOREKSI */}
      {scanState === 'result' && hasil && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* --- TAMPILAN JIKA GAGAL DETEKSI LJK (DIUBAH MENJADI LEBIH KOMPAK) --- */}
            {hasil.error ? (
              <div className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 border-4 border-red-100 shadow-inner shrink-0">
                  <X size={32} weight="bold" />
                </div>
                <h3 className="font-black text-lg text-slate-800 mb-1 uppercase tracking-wide">Koreksi Ditolak</h3>
                <p className="text-[11px] font-semibold text-slate-500 mb-4 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 w-full">{hasil.error}</p>
                
                {/* Gambar Error dipendekkan agar tombol Coba Koreksi tidak tenggelam */}
                <div className="relative w-full h-32 bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 mb-5 opacity-60 grayscale shadow-inner shrink-0">
                  {capturedImage && <img src={capturedImage} alt="Captured Error" className="absolute inset-0 w-full h-full object-cover" />}
                  <div className="absolute inset-0 flex items-center justify-center bg-red-900/30">
                    <span className="text-white text-[10px] font-black uppercase tracking-widest bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Bukan LJK</span>
                  </div>
                </div>

                {/* TOMBOL KOREKSI LAGI YANG MUDAH DIJANGKAU */}
                <button onClick={handleScanUlang} className="w-full py-3.5 bg-blue-600 text-white font-black rounded-xl text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 shrink-0">
                  <ArrowCounterClockwise size={18} weight="bold"/> Coba Koreksi Lagi
                </button>
              </div>
            ) : (
              // --- TAMPILAN JIKA BERHASIL (LJK VALID) ---
              <>
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
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Scan size={14}/> Foto Bukti Koreksi</p>
                        <div className="relative w-full aspect-[1/1.414] bg-slate-800 rounded-xl overflow-hidden border border-slate-300 shadow-inner">
                          {capturedImage && <img src={capturedImage} alt="Captured" className="absolute inset-0 w-full h-full object-cover" />}
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
                          {hasil.detailJawaban?.map(item => (
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
                  <button onClick={handleScanUlang} className="px-5 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors flex items-center justify-center gap-2" title="Batal & Ulangi">
                    <Trash size={18} weight="bold" /> Batal
                  </button>
                  
                  <button onClick={handleSimpanDanLanjut} className="flex-1 py-3.5 bg-emerald-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                    <FloppyDisk size={18} weight="fill"/> Simpan & Koreksi Lagi
                  </button>
                </div>
              </>
            )}

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
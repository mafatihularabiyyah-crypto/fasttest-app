"use client";

import { useEffect, useRef, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Lightning, Warning, Check, X, ArrowCounterClockwise, 
  FloppyDisk, Scan, XCircle, Trash, CheckCircle, ChartBar
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

  const searchParams = useSearchParams();
  const namaUjian = searchParams.get('namaUjian') || "Ujian Default";

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

  // --- 2. FUNGSI AI SUPER KETAT (HANYA BISA KERTAS LJK ASLI) ---
  const checkLJKInFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return false;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx || video.videoWidth === 0) return false;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const boxWidth = Math.min(canvas.width * 0.85, 400); 
    const boxHeight = boxWidth * 1.414; 
    const startX = (canvas.width - boxWidth) / 2;
    const startY = (canvas.height - boxHeight) / 2;
    const anchorSize = boxWidth * 0.12; // Ukuran kotak evaluasi diperkecil agar lebih pas

    // Deteksi Hitam Pekat (Untuk Sudut Jangkar)
    const isAreaDark = (x: number, y: number, w: number, h: number) => {
      const frame = ctx.getImageData(x, y, w, h);
      let darkPixels = 0;
      for (let i = 0; i < frame.data.length; i += 4) {
        const brightness = (frame.data[i] * 0.299) + (frame.data[i+1] * 0.587) + (frame.data[i+2] * 0.114);
        if (brightness < 70) darkPixels++; // Batas gelap diperketat (harus sangat gelap/hitam)
      }
      // Minimal 60% area sudut HARUS HITAM (bukan cuma 30% seperti sebelumnya)
      return (darkPixels / (frame.data.length / 4)) > 0.6; 
    };

    // Deteksi Putih Terang (Untuk Kertas LJK)
    const isAreaLight = (x: number, y: number, w: number, h: number) => {
      const frame = ctx.getImageData(x, y, w, h);
      let lightPixels = 0;
      for (let i = 0; i < frame.data.length; i += 4) {
        const brightness = (frame.data[i] * 0.299) + (frame.data[i+1] * 0.587) + (frame.data[i+2] * 0.114);
        if (brightness > 160) lightPixels++; // Harus terang seperti kertas
      }
      return (lightPixels / (frame.data.length / 4)) > 0.6; 
    };

    // 1. CEK 4 SUDUT: Apakah benar-benar hitam?
    const topLeft = isAreaDark(startX, startY, anchorSize, anchorSize);
    const topRight = isAreaDark(startX + boxWidth - anchorSize, startY, anchorSize, anchorSize);
    const bottomLeft = isAreaDark(startX, startY + boxHeight - anchorSize, anchorSize, anchorSize);
    const bottomRight = isAreaDark(startX + boxWidth - anchorSize, startY + boxHeight - anchorSize, anchorSize, anchorSize);

    // 2. CEK TENGAH: Apakah bagian tengahnya kertas putih? (Mencegah wajah/baju gelap terdeteksi)
    const centerLight = isAreaLight(startX + (boxWidth/2) - anchorSize, startY + (boxHeight/2) - anchorSize, anchorSize * 2, anchorSize * 2);

    // HANYA AKAN MENJEPRET JIKA: 4 Sudut Hitam DAN Tengahnya Putih!
    return topLeft && topRight && bottomLeft && bottomRight && centerLight;
  }, []);

  // --- 3. LOOPING SCANNER (FULL OTOMATIS) ---
  useEffect(() => {
    let scanInterval: NodeJS.Timeout;
    if (scanState === 'searching') {
      scanInterval = setInterval(() => {
        const isLJKFound = checkLJKInFrame(); 
        
        if (isLJKFound) {
          clearInterval(scanInterval);
          setScanState('aligning'); 
          setTimeout(() => {
            setScanState('locked'); 
            setTimeout(() => {
              captureAndProcessOMR(); 
            }, 600); 
          }, 800);
        }
      }, 500); 
    }
    return () => clearInterval(scanInterval);
  }, [scanState, checkLJKInFrame]);

  // --- 4. MESIN OMR ASLI: MEMBACA BULATAN JAWABAN ---
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

    const boxWidth = Math.min(canvas.width * 0.85, 400); 
    const boxHeight = boxWidth * 1.414; 
    const startX = (canvas.width - boxWidth) / 2;
    const startY = (canvas.height - boxHeight) / 2;

    const jumlahSoal = 20;
    const opsiKeys = ['A', 'B', 'C', 'D', 'E'];
    const kunciJawabanAsli = ['A', 'C', 'B', 'D', 'E', 'A', 'B', 'C', 'D', 'E', 'A', 'B', 'C', 'D', 'E', 'A', 'B', 'C', 'D', 'E']; 
    
    const yMulaiSoal = startY + (boxHeight * 0.2); 
    const yJarakAntarSoal = (boxHeight * 0.7) / jumlahSoal; 
    const xMulaiOpsi = startX + (boxWidth * 0.3);
    const xJarakAntarOpsi = boxWidth * 0.1;
    const radiusBulatan = boxWidth * 0.02; 

    const isBubbleFilled = (x: number, y: number) => {
      const imgData = ctx.getImageData(x - radiusBulatan, y - radiusBulatan, radiusBulatan * 2, radiusBulatan * 2);
      const data = imgData.data;
      let totalDark = 0;
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] * 0.299) + (data[i+1] * 0.587) + (data[i+2] * 0.114);
        if (brightness < 120) totalDark++; 
      }
      return (totalDark / (data.length / 4)) > 0.4; 
    };

    let totalBenar = 0;
    let totalSalah = 0;
    let totalKosong = 0;
    const detailKoreksi = [];

    for (let i = 0; i < jumlahSoal; i++) {
      const currentY = yMulaiSoal + (i * yJarakAntarSoal);
      let jawabanTerpilih = '-';
      let jumlahTerisi = 0;

      for (let j = 0; j < opsiKeys.length; j++) {
        const currentX = xMulaiOpsi + (j * xJarakAntarOpsi);
        if (isBubbleFilled(currentX, currentY)) {
          jawabanTerpilih = opsiKeys[j];
          jumlahTerisi++;
          
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 2;
          ctx.strokeRect(currentX - radiusBulatan, currentY - radiusBulatan, radiusBulatan * 2, radiusBulatan * 2);
        }
      }

      const kunci = kunciJawabanAsli[i];
      let status = 'kosong';

      if (jumlahTerisi === 0) {
        status = 'kosong';
        totalKosong++;
      } else if (jumlahTerisi > 1) {
        status = 'salah'; 
        jawabanTerpilih = 'GANDA';
        totalSalah++;
      } else if (jawabanTerpilih === kunci) {
        status = 'benar';
        totalBenar++;
      } else {
        status = 'salah';
        totalSalah++;
      }

      detailKoreksi.push({ no: i + 1, jawab: jawabanTerpilih, kunci, status });
    }

    const nilaiAkhir = Math.round((totalBenar / jumlahSoal) * 100);

    setRealScanResult({
      namaUjianTerdeteksi: namaUjian,
      nama: "Siswa Tidak Dikenal", 
      nis: "000000",
      kelas: "-",
      nilai: nilaiAkhir,
      benar: totalBenar,
      salah: totalSalah,
      kosong: totalKosong,
      detailJawaban: detailKoreksi
    });

    setScanState('flashing'); 
    setTimeout(() => setScanState('result'), 300);
  };

  const handleScanUlang = () => {
    setCapturedImage(null);
    setScanState('searching');
    setResultTab('ringkasan');
  };

  const hasil = realScanResult;

  return (
    <div className="fixed inset-0 bg-black flex flex-col font-sans overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />

      {/* ========================================================= */}
      {/* LAYER 1: KAMERA & PANDUAN SCANNER BERSIIH                   */}
      {/* ========================================================= */}
      <div className="absolute inset-0 z-10">
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent">
          <Link href="/guru" className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-md transition-all">
            <ArrowLeft size={24} weight="bold" />
          </Link>
          <div className="flex flex-col items-center">
            <span className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-1 border border-blue-400 flex items-center gap-1 shadow-lg shadow-blue-500/20">
              <Scan size={12} weight="bold"/> AI SCANNER AKTIF
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

        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div 
            className={`relative w-[85%] max-w-[400px] aspect-[1/1.414] rounded-xl border-2 transition-all duration-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] flex flex-col items-center justify-center overflow-hidden
              ${scanState === 'locked' ? 'border-green-500 scale-[1.02]' : 
                scanState === 'aligning' ? 'border-yellow-400' :
                scanState === 'invalid' ? 'border-red-500 scale-95 bg-red-500/10' : 'border-white/40'}
            `}
          >
            {/* 4 Kotak Anchor */}
            <div className={`absolute top-6 left-6 w-8 h-8 border-2 transition-colors duration-300 rounded-sm ${scanState === 'locked' ? 'bg-green-500/50 border-green-400' : 'bg-black/30 border-white/60'}`}></div>
            <div className={`absolute top-6 right-6 w-8 h-8 border-2 transition-colors duration-300 rounded-sm ${scanState === 'locked' ? 'bg-green-500/50 border-green-400' : 'bg-black/30 border-white/60'}`}></div>
            <div className={`absolute bottom-6 left-6 w-8 h-8 border-2 transition-colors duration-300 rounded-sm ${scanState === 'locked' ? 'bg-green-500/50 border-green-400' : 'bg-black/30 border-white/60'}`}></div>
            <div className={`absolute bottom-6 right-6 w-8 h-8 border-2 transition-colors duration-300 rounded-sm ${scanState === 'locked' ? 'bg-green-500/50 border-green-400' : 'bg-black/30 border-white/60'}`}></div>

            {(scanState === 'searching' || scanState === 'invalid') && (
              <>
                <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_15px_3px_rgba(59,130,246,0.8)] animate-[scan_2s_ease-in-out_infinite] pointer-events-none" />
                <div className="bg-black/60 backdrop-blur px-4 py-3 rounded-2xl border border-white/20 flex flex-col items-center gap-1 text-center absolute">
                  <Scan size={20} className="text-blue-400 animate-pulse mb-1" />
                  <p className="text-white text-[10px] font-bold tracking-widest uppercase">Paskan 4 Kotak LJK</p>
                  <p className="text-white/50 text-[8px] font-bold uppercase mt-1">Otomatis memindai jika pas</p>
                </div>
              </>
            )}

            {scanState === 'aligning' && (
              <div className="bg-yellow-500/90 backdrop-blur px-5 py-2.5 rounded-full border border-yellow-300 flex items-center gap-2 absolute">
                <p className="text-white text-[10px] font-black tracking-widest uppercase">LJK Ditemukan! Mengoreksi...</p>
              </div>
            )}
            
            {scanState === 'locked' && (
              <div className="bg-green-600/90 backdrop-blur px-5 py-2.5 rounded-full border border-green-400 flex items-center gap-2 animate-pulse scale-110 transition-transform absolute">
                <Check size={18} weight="bold" className="text-white" />
                <p className="text-white text-[10px] font-black tracking-widest uppercase">Membaca Bulatan!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`absolute inset-0 bg-white z-40 transition-opacity duration-150 pointer-events-none ${scanState === 'flashing' ? 'opacity-100' : 'opacity-0'}`} />

      {/* ========================================================= */}
      {/* LAYER 2: POP-UP HASIL KOREKSI                             */}
      {/* ========================================================= */}
      {scanState === 'result' && hasil && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <h2 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
                <Check size={20} className="text-green-500 bg-green-100 rounded-full p-1" weight="bold" /> Koreksi Nyata Selesai
              </h2>
              <button onClick={handleScanUlang} className="p-1.5 bg-slate-200 text-slate-500 rounded-full hover:bg-slate-300"><X size={16} weight="bold" /></button>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl mx-5 mt-4 shrink-0">
              <button onClick={() => setResultTab('ringkasan')} className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${resultTab === 'ringkasan' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Ringkasan</button>
              <button onClick={() => setResultTab('detail')} className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${resultTab === 'detail' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                <ChartBar size={16} weight="bold"/> Analisis
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[55vh] custom-scrollbar space-y-4">
              {resultTab === 'ringkasan' ? (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-3">
                    <CheckCircle size={20} weight="fill" className="text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Koreksi OMR</p>
                      <p className="text-xs font-bold text-blue-600 leading-tight">Data dialokasikan ke arsip: <br/>{hasil.namaUjianTerdeteksi}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="flex-1">
                      <p className="font-black text-slate-800 text-sm leading-tight uppercase">{hasil.nama}</p>
                      <p className="text-[10px] font-bold text-slate-500 mt-1">NIS: {hasil.nis}</p>
                    </div>
                    <div className="w-24 bg-blue-600 rounded-2xl p-2 flex flex-col items-center justify-center text-white shadow-lg shrink-0">
                      <span className="text-[9px] font-black uppercase">Skor Akhir</span>
                      <span className="text-3xl font-black">{hasil.nilai}</span>
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
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-2">Rincian & Koreksi Nyata</p>
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
"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Lightning, Warning, User, Check, X, BookmarkSimple, Trash, Eye, Scan
} from "@phosphor-icons/react";

type ScanState = 'idle' | 'searching' | 'aligning' | 'processing' | 'result' | 'duplicate_warning';

// =====================================================================
// KOMPONEN UTAMA SCANNER (Dipisah agar bisa dibungkus Suspense)
// =====================================================================
function ScannerContent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [demoNisGanda, setDemoNisGanda] = useState(false);

  // Tangkap nama ujian dari URL (Dikirim dari halaman Detail Ujian)
  const searchParams = useSearchParams();
  const namaUjian = searchParams.get('namaUjian') || "Ujian Umum";

  // --- 1. MENGHIDUPKAN KAMERA & AUTO-SCAN LOOP ---
  useEffect(() => {
    let stream: MediaStream | null = null;
    let scanTimeout: NodeJS.Timeout;

    const startCameraAndScan = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);

        // --- MULAI SIMULASI AUTO-SCAN (SEPERTI QRIS) ---
        setScanState('searching');
        
        // Simulasi: AI sedang mencari kertas LJK (3 detik)
        scanTimeout = setTimeout(() => {
          setScanState('aligning'); // Kertas ditemukan, fokus...
          
          // Simulasi: Kamera stabil, JEPRET! (1 detik kemudian)
          setTimeout(() => {
            captureFrame();
            setScanState('processing'); // Efek Flash
            
            // Tampilkan hasil
            setTimeout(() => {
              if (demoNisGanda) setScanState('duplicate_warning');
              else setScanState('result');
            }, 1000);

          }, 1000);
        }, 3000);

      } catch (err) {
        console.error("Gagal akses kamera:", err);
        setHasPermission(false);
      }
    };

    startCameraAndScan();

    return () => { 
      if (stream) stream.getTracks().forEach(track => track.stop()); 
      clearTimeout(scanTimeout);
    };
  }, [demoNisGanda]); // Restart loop jika toggle NIS ganda ditekan (untuk demo)

  // --- 2. FUNGSI "MENJEPRET" KAMERA TANPA TOMBOL ---
  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageUrl);
      }
    }
  };

  const resetScanner = () => {
    setCapturedImage(null);
    setScanState('idle');
    window.location.reload(); 
  };

  // --- DATA DUMMY HASIL KOREKSI ---
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
      
      {/* Canvas Tersembunyi untuk mengambil foto */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ======================================================= */}
      {/* LAYER 1: UI KAMERA AUTO-SCAN                            */}
      {/* ======================================================= */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${['idle', 'searching', 'aligning', 'processing'].includes(scanState) ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'}`}>
        
        {/* HEADER KAMERA DINAMIS */}
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent">
          <Link href="/guru" className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-md transition-all">
            <ArrowLeft size={24} weight="bold" />
          </Link>
          
          <div className="flex flex-col items-center">
            <span className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-1 border border-blue-400">
              Sedang Scan LJK
            </span>
            <p className="text-white text-xs font-bold drop-shadow-md text-center max-w-[200px] truncate">
              {namaUjian}
            </p>
          </div>

          <button className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-md transition-all">
            <Lightning size={24} weight="bold" />
          </button>
        </div>

        {hasPermission === false ? (
          <div className="absolute inset-0 flex items-center justify-center text-white p-6 text-center">
            <div><Warning size={48} className="text-red-500 mx-auto mb-4" /><p className="font-bold text-xl">Akses Kamera Ditolak</p></div>
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
        )}

        {/* BINGKAI PEMANDU A4 (OVERLAY) */}
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div 
            className="relative w-[85%] max-w-[400px] aspect-[1/1.414] rounded-xl border-2 transition-colors duration-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] flex flex-col items-center justify-center overflow-hidden"
            style={{ borderColor: scanState === 'aligning' ? '#22c55e' : 'rgba(255,255,255,0.3)' }}
          >
            {/* Sudut Pemandu */}
            <div className={`absolute top-2 left-2 w-10 h-10 border-2 transition-all duration-300 ${scanState === 'aligning' ? 'border-green-500' : 'border-white/50'}`}></div>
            <div className={`absolute top-2 right-2 w-10 h-10 border-2 transition-all duration-300 ${scanState === 'aligning' ? 'border-green-500' : 'border-white/50'}`}></div>
            <div className={`absolute bottom-2 left-2 w-10 h-10 border-2 transition-all duration-300 ${scanState === 'aligning' ? 'border-green-500' : 'border-white/50'}`}></div>
            <div className={`absolute bottom-2 right-2 w-10 h-10 border-2 transition-all duration-300 ${scanState === 'aligning' ? 'border-green-500' : 'border-white/50'}`}></div>

            {/* LASER SCANNER OTOMATIS */}
            {scanState === 'searching' && (
              <>
                <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_15px_3px_rgba(59,130,246,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                <div className="bg-black/60 backdrop-blur px-4 py-2 rounded-full border border-white/20 mt-4 flex items-center gap-2">
                  <Scan size={16} className="text-blue-400 animate-pulse" />
                  <p className="text-white text-[10px] font-bold tracking-widest uppercase">Otomatis Mencari LJK...</p>
                </div>
              </>
            )}

            {scanState === 'aligning' && (
              <div className="bg-green-600/90 backdrop-blur px-4 py-2 rounded-full border border-green-400 flex items-center gap-2 animate-pulse">
                <p className="text-white text-[10px] font-bold tracking-widest uppercase">Jangan Gerak!</p>
              </div>
            )}
          </div>
        </div>

        {/* EFEK FLASH KAMERA */}
        <div className={`absolute inset-0 bg-white z-50 transition-opacity duration-150 pointer-events-none ${scanState === 'processing' ? 'opacity-100' : 'opacity-0'}`} />

        <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col items-center z-30">
          <label className="flex items-center gap-2 text-white text-[10px] font-bold bg-black/50 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur">
            <input type="checkbox" checked={demoNisGanda} onChange={(e) => setDemoNisGanda(e.target.checked)} className="w-3 h-3" />
            Simulasi NIS Ganda
          </label>
        </div>
      </div>

      {/* ======================================================= */}
      {/* LAYER 2: MODAL PERINGATAN NIS GANDA                     */}
      {/* ======================================================= */}
      {scanState === 'duplicate_warning' && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="bg-orange-500 p-6 flex flex-col items-center text-white text-center">
              <Warning size={48} weight="fill" className="mb-2" />
              <h2 className="text-xl font-black uppercase tracking-wide">Peringatan!</h2>
              <p className="text-sm font-medium text-orange-100 mt-1">Data NIS ini sudah pernah di-scan.</p>
            </div>
            <div className="p-6 space-y-3">
              <button onClick={() => setScanState('result')} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                <Trash size={20} weight="bold" /> Hapus Data Lama (Timpa)
              </button>
              <button onClick={() => setScanState('result')} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                <BookmarkSimple size={20} weight="bold" /> Simpan Keduanya
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* LAYER 3: PANEL HASIL DENGAN FOTO ASLI                     */}
      {/* ======================================================= */}
      <div className={`absolute inset-0 bg-[#f8fafc] z-40 flex flex-col transition-transform duration-500 ease-out ${scanState === 'result' ? 'translate-y-0' : 'translate-y-full'}`}>
        
        <div className="bg-white p-4 flex items-center justify-between border-b border-slate-200 shadow-sm pt-8 shrink-0">
          <h2 className="font-black text-slate-800 text-lg uppercase tracking-wide">Hasil Koreksi</h2>
          <button onClick={resetScanner} className="p-2 bg-slate-100 rounded-full text-slate-600 font-bold text-xs">Tutup</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
          
          <div className="flex gap-4">
            <div className="flex-1 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-1 text-slate-400 mb-1"><User size={14} weight="bold" /><span className="text-[9px] font-black uppercase">Siswa</span></div>
              <p className="font-black text-slate-800 text-sm leading-tight">{mockResult.nama}</p>
              <div className="flex gap-2 mt-2 text-[10px] font-bold text-slate-500">
                <span className="bg-slate-100 px-2 py-1 rounded-md">{mockResult.nis}</span>
              </div>
            </div>
            <div className="w-24 bg-blue-600 p-3 rounded-2xl shadow-lg flex flex-col items-center justify-center text-white">
              <span className="text-[9px] font-black uppercase opacity-80 mb-1">NILAI</span>
              <span className="text-3xl font-black">{mockResult.nilai}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Eye size={14} /> Foto Bukti Koreksi
            </h3>
            
            <div className="relative w-full aspect-[1/1.414] rounded-lg overflow-hidden bg-black flex items-center justify-center border border-slate-300">
              {capturedImage && (
                <img src={capturedImage} alt="Captured LJK" className="absolute inset-0 w-full h-full object-cover opacity-90" />
              )}
              <div className="absolute inset-0 z-10 flex flex-col justify-end p-6">
                <div className="w-full h-[60%] grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    {mockResult.detailJawaban.map((item, idx) => (
                      <div key={idx} className="flex gap-1.5 items-center pl-6">
                         {['A','B','C','D','E'].map((opt, optIdx) => {
                           let ringClass = "border-white/20"; 
                           let bgColor = "bg-transparent";

                           if (item.status === 'benar' && opt === item.jawab) {
                             ringClass = "border-green-400 border-2";
                             bgColor = "bg-green-500/60 backdrop-blur-sm"; 
                           } else if (item.status === 'salah' && opt === item.jawab) {
                             ringClass = "border-red-400 border-2";
                             bgColor = "bg-red-500/60 backdrop-blur-sm"; 
                           } else if (item.status === 'salah' && opt === item.kunci) {
                             ringClass = "border-yellow-400 border-2 border-dashed";
                             bgColor = "bg-yellow-400/50"; 
                           } else if (item.status === 'kosong' && opt === item.kunci) {
                             ringClass = "border-yellow-400 border-2 border-dashed";
                             bgColor = "bg-yellow-400/50";
                           }

                           return (
                             <div key={optIdx} className={`w-4 h-4 rounded-full ${ringClass} ${bgColor} flex items-center justify-center`}>
                               {(bgColor !== "bg-transparent") && (
                                 <span className="text-[7px] font-black text-white drop-shadow-md">{opt}</span>
                               )}
                             </div>
                           );
                         })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center gap-4 mt-4 text-[9px] font-bold text-slate-500 uppercase">
               <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Benar</div>
               <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Salah</div>
               <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> Seharusnya</div>
            </div>
          </div>

        </div>

        <div className="absolute bottom-0 left-0 w-full p-4 bg-white border-t border-slate-200 flex gap-3 z-50 shrink-0">
           <button className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-700 font-black rounded-2xl text-[10px] tracking-widest uppercase">
             Edit Manual
           </button>
           <button onClick={resetScanner} className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg text-[10px] tracking-widest uppercase">
             Simpan & Scan Lagi
           </button>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `@keyframes scan { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }`}} />
    </div>
  );
}

// =====================================================================
// EXPORT DEFAULT DENGAN SUSPENSE BOUNDARY (Mencegah Error Build)
// =====================================================================
export default function LJKAutoScanner() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center flex-col gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white font-bold tracking-widest uppercase text-xs">Memuat Scanner...</p>
      </div>
    }>
      <ScannerContent />
    </Suspense>
  );
}
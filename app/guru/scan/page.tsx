"use client";

import { useEffect, useRef, useState, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { 
  ArrowLeft, Lightning, Warning, Check, X, ArrowCounterClockwise, 
  FloppyDisk, Scan, CheckCircle, ChartBar, Trash, Camera, FolderOpen
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlUjianId = searchParams.get('id'); 
  const urlNamaUjian = searchParams.get('namaUjian');

  const supabase = createClient();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null); // BINGKAI PANDUAN VISUAL KITA
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanState, setScanState] = useState<ScanState>('searching');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [resultTab, setResultTab] = useState<ResultTab>('ringkasan');
  const [realScanResult, setRealScanResult] = useState<HasilKoreksi | null>(null);
  const [scanFeedback, setScanFeedback] = useState<string>("Menyiapkan sistem...");

  // STATE UNTUK ALUR BARU (POP-UP PILIH UJIAN)
  const [activeUjianId, setActiveUjianId] = useState<string | null>(urlUjianId);
  const [activeNamaUjian, setActiveNamaUjian] = useState<string>(urlNamaUjian || "Scanner OMR");
  const [showSelector, setShowSelector] = useState<boolean>(!urlUjianId);
  const [listUjianDB, setListUjianDB] = useState<any[]>([]);
  const [tempSelectedId, setTempSelectedId] = useState<string>("");

  // STATE DATA REAL
  const [kunciAsli, setKunciAsli] = useState<string[]>([]);
  const [daftarSantri, setDaftarSantri] = useState<any[]>([]);
  const [isDataReady, setIsDataReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- 0A. AMBIL DAFTAR UJIAN JIKA BELUM ADA ID ---
  useEffect(() => {
    if (showSelector) {
      const fetchListUjian = async () => {
        const { data } = await supabase.from('Ujian').select('id, nama_ujian, created_at').order('created_at', { ascending: false });
        if (data) setListUjianDB(data);
      };
      fetchListUjian();
    }
  }, [showSelector, supabase]);

  const handleMulaiScan = () => {
    if (!tempSelectedId) return;
    const selected = listUjianDB.find(u => String(u.id) === tempSelectedId);
    if (selected) {
      setActiveUjianId(tempSelectedId);
      setActiveNamaUjian(selected.nama_ujian);
      setShowSelector(false);
      router.replace(`?id=${tempSelectedId}&namaUjian=${encodeURIComponent(selected.nama_ujian)}`);
    }
  };

  // --- 0B. AMBIL DATA KUNCI DAN SANTRI (PERBAIKAN ERROR DATABASE) ---
  useEffect(() => {
    const loadDatabase = async () => {
      if (!activeUjianId) return;

      setIsDataReady(false);
      try {
        setScanFeedback("Memuat soal...");
        
        // KITA PECAH JADI 2 QUERY AGAR TIDAK ERROR RELASI
        const { data: soalData, error: errSoal } = await supabase
          .from('Soal')
          .select('id')
          .eq('ujian_id', activeUjianId)
          .order('id', { ascending: true });

        if (errSoal) throw new Error("Gagal ambil tabel Soal: " + errSoal.message);

        if (soalData && soalData.length > 0) {
          const soalIds = soalData.map(s => s.id);
          
          setScanFeedback("Memuat tabel Opsi...");
          // Gunakan nama tabel Opsi sesuai yang ada di screenshot Ustadz
          const { data: opsiData, error: errOpsi } = await supabase
            .from('Opsi')
            .select('soal_id, label, is_correct')
            .in('soal_id', soalIds);

          if (errOpsi) throw new Error("Gagal ambil tabel Opsi: " + errOpsi.message);

          const kunciArray = [];
          for (const soal of soalData) {
             const opsiSoal = opsiData?.filter(o => o.soal_id === soal.id) || [];
             const benar = opsiSoal.find(o => o.is_correct);
             kunciArray.push(benar ? benar.label : '-');
          }
          setKunciAsli(kunciArray);
        } else {
          alert("PERINGATAN: Soal belum dibuat di folder ujian ini! (Demo Mode Aktif)");
          setKunciAsli(['A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D']);
        }

        setScanFeedback("Memuat daftar santri...");
        const { data: santriData } = await supabase.from('Santri').select('id, nama, nis, kelas');
        if (santriData) setDaftarSantri(santriData);

        setIsDataReady(true);
        setScanFeedback("Paskan 4 sudut LJK...");
      } catch (e: any) {
        console.error("DB Error:", e);
        setScanFeedback("⚠️ Error: " + e.message);
      }
    };
    
    if (!showSelector) loadDatabase();
  }, [activeUjianId, showSelector, supabase]);

  // --- 1. HIDUPKAN KAMERA ---
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      if (showSelector) return; 
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          // Resolusi diturunkan sedikit agar lebih ringan diolah
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setHasPermission(true);
      } catch (err) {
        setHasPermission(false);
      }
    };
    startCamera();
    return () => { if (stream) stream.getTracks().forEach(track => track.stop()); };
  }, [showSelector]); 

  // --- RUMUS PEMETAAN KOORDINAT PRESISI TINGGI ---
  const getMappedCoordinates = () => {
    if (!videoRef.current || !boxRef.current) return null;
    const video = videoRef.current;
    const box = boxRef.current.getBoundingClientRect();
    const vidRect = video.getBoundingClientRect();

    if (video.videoWidth === 0) return null;

    const videoRatio = video.videoWidth / video.videoHeight;
    const screenRatio = vidRect.width / vidRect.height;

    let scale, overflowX = 0, overflowY = 0;
    
    if (videoRatio > screenRatio) {
      scale = video.videoHeight / vidRect.height;
      const renderedWidth = video.videoWidth / scale;
      overflowX = (renderedWidth - vidRect.width) / 2;
    } else {
      scale = video.videoWidth / vidRect.width;
      const renderedHeight = video.videoHeight / scale;
      overflowY = (renderedHeight - vidRect.height) / 2;
    }

    return {
      startX: (box.left - vidRect.left + overflowX) * scale,
      startY: (box.top - vidRect.top + overflowY) * scale,
      boxWidth: box.width * scale,
      boxHeight: box.height * scale
    };
  };

  // --- 2. DETEKSI SUDUT (DENGAN PEMETAAN BARU) ---
  const checkLJKInFrame = useCallback(() => {
    if (!isDataReady || !canvasRef.current || !videoRef.current) return { isPerfect: false, matchCount: 0 };
    
    const coords = getMappedCoordinates();
    if (!coords) return { isPerfect: false, matchCount: 0 };

    const { startX, startY, boxWidth, boxHeight } = coords;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const anchorSize = boxWidth * 0.20; // 20% area pencarian sudut
    
    const isBullsEye = (x: number, y: number, size: number) => {
      if (x < 0 || y < 0 || x + size > canvas.width || y + size > canvas.height) return false;
      const frame = ctx?.getImageData(x, y, size, size);
      if (!frame) return false;
      
      let dark = 0, light = 0;
      for (let i = 0; i < frame.data.length; i += 4) {
        const b = (frame.data[i] * 0.299) + (frame.data[i+1] * 0.587) + (frame.data[i+2] * 0.114);
        if (b < 120) dark++;
        else if (b > 150) light++;
      }
      
      const total = frame.data.length / 4;
      // Ada elemen hitam murni dan kertas putih berdampingan
      return (dark / total > 0.05) && (light / total > 0.20); 
    };

    const tl = isBullsEye(startX, startY, anchorSize);
    const tr = isBullsEye(startX + boxWidth - anchorSize, startY, anchorSize);
    const bl = isBullsEye(startX, startY + boxHeight - anchorSize, anchorSize);
    const br = isBullsEye(startX + boxWidth - anchorSize, startY + boxHeight - anchorSize, anchorSize);

    const matches = [tl, tr, bl, br].filter(Boolean).length;

    if (matches === 4) {
      setScanFeedback("Terkunci! Memotret otomatis...");
      return { isPerfect: true, matchCount: 4 };
    } else if (matches > 0) {
      setScanFeedback(`Sudut terlihat: ${matches}/4. Paskan bingkai...`);
    } else {
      setScanFeedback("Arahkan 4 sudut LJK ke bingkai 🔲");
    }

    return { isPerfect: false, matchCount: matches };
  }, [isDataReady]);

  // --- 3. LOOP OTOMATIS ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (scanState === 'searching' && isDataReady && !showSelector) {
      interval = setInterval(() => {
        const { isPerfect } = checkLJKInFrame();
        if (isPerfect) {
          clearInterval(interval);
          executeCapture(true);
        }
      }, 400); 
    }
    return () => clearInterval(interval);
  }, [scanState, isDataReady, showSelector, checkLJKInFrame]);

  // FUNGSI JEPRET MANUAL (MEMAKSA PROSES)
  const handleManualCapture = () => {
    if (kunciAsli.length === 0) {
      alert("Sistem belum siap. Tunggu data dimuat.");
      return;
    }
    setScanState('locked');
    // Jika ditekan manual, paksa true! (Abaikan AI yang ragu-ragu)
    setTimeout(() => { processOMR(true); }, 200); 
  };

  const executeCapture = (isValid: boolean) => {
    setScanState('locked');
    setTimeout(() => { processOMR(isValid); }, 300);
  };

  // --- 4. MESIN OMR (DENGAN KOORDINAT PRESISI) ---
  const processOMR = (isValid: boolean) => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    
    setCapturedImage(canvasRef.current.toDataURL('image/jpeg', 0.8));

    if (!isValid) {
      setRealScanResult({ error: "Gagal mendeteksi LJK. Cobalah pencet 'Jepret Manual' jika sudah pas bingkainya." });
      setScanState('result');
      return;
    }

    const coords = getMappedCoordinates();
    if (!coords) return;

    const { startX: sX, startY: sY, boxWidth: boxW, boxHeight: boxH } = coords;

    let benar = 0, salah = 0, kosong = 0;
    const detail = [];
    const opsi = ['A', 'B', 'C', 'D']; // Sesuai LJK (A,B,C,D)

    // FUNGSI BACA TINTA PENSIL
    const isBubbleFilled = (cx: number, cy: number, radius: number) => {
      const frame = ctx.getImageData(cx - radius, cy - radius, radius * 2, radius * 2);
      let dark = 0;
      for (let i = 0; i < frame.data.length; i += 4) {
        const b = (frame.data[i] * 0.299) + (frame.data[i+1] * 0.587) + (frame.data[i+2] * 0.114);
        if (b < 110) dark++; // Pensil biasanya < 110
      }
      return (dark / (frame.data.length / 4)) > 0.35; // Minimal 35% terisi
    };

    // MENGOREKSI SOAL
    for (let i = 0; i < kunciAsli.length; i++) {
      const kunci = kunciAsli[i] || '-';
      
      // KALIBRASI POSISI BULATAN (Disesuaikan dengan LJK baru Ustadz)
      const col = Math.floor(i / 18); // 18 soal per kolom (sesuai gambar: 1-18, 19-36)
      const row = i % 18;
      
      const xPos = sX + (boxW * 0.23) + (col * (boxW * 0.35));
      const yPos = sY + (boxH * 0.62) + (row * (boxH * 0.018));
      const xStep = boxW * 0.045;
      const radius = boxW * 0.018;

      let jawab = '-';
      let jmlTerisi = 0;

      for (let j = 0; j < opsi.length; j++) {
         if (isBubbleFilled(xPos + (j * xStep), yPos, radius)) {
            jawab = opsi[j];
            jmlTerisi++;
         }
      }

      let status = 'salah';
      if (jmlTerisi === 0) { status = 'kosong'; kosong++; }
      else if (jmlTerisi > 1) { status = 'salah'; jawab = 'GANDA'; salah++; }
      else if (jawab === kunci) { status = 'benar'; benar++; }
      else { status = 'salah'; salah++; }

      detail.push({ no: i + 1, jawab, kunci, status });

      // GAMBAR OVERLAY
      const idx = opsi.indexOf(jawab);
      const kIdx = opsi.indexOf(kunci);
      
      ctx.lineWidth = 4;
      if (status === 'benar') {
        ctx.strokeStyle = '#22c55e'; // Hijau
        ctx.beginPath(); ctx.arc(xPos + (idx * xStep), yPos, radius*1.5, 0, 2*Math.PI); ctx.stroke();
      } else {
        if (idx !== -1) {
          ctx.strokeStyle = '#ef4444'; // Merah
          ctx.beginPath(); ctx.arc(xPos + (idx * xStep), yPos, radius*1.5, 0, 2*Math.PI); ctx.stroke();
        }
        if (kIdx !== -1) {
          ctx.strokeStyle = '#eab308'; // Kuning
          ctx.beginPath(); ctx.arc(xPos + (kIdx * xStep), yPos, radius*1.5, 0, 2*Math.PI); ctx.stroke();
        }
      }
    }

    setCapturedImage(canvasRef.current.toDataURL('image/jpeg', 0.8));
    const nilai = kunciAsli.length > 0 ? Math.round((benar / kunciAsli.length) * 100) : 0;

    setRealScanResult({
      namaUjianTerdeteksi: activeNamaUjian,
      nama: "",
      nis: "-",
      nilai, benar, salah, kosong,
      detailJawaban: detail
    });

    setScanState('result');
  };

  const reset = () => {
    setCapturedImage(null);
    setScanState('searching');
    setRealScanResult(null);
    setScanFeedback("Mencari LJK...");
  };

  const handleSimpanDanLanjut = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      reset();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[999] bg-slate-900 flex flex-col items-center justify-center font-sans overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />

      {/* Kontainer Utama Kamera (Dibatasi lebarnya agar tidak raksasa di Laptop) */}
      <div className="relative w-full h-full max-w-md bg-black shadow-2xl flex flex-col overflow-hidden">
        
        {/* --- POP-UP PILIH UJIAN --- */}
        {showSelector && (
          <div className="absolute inset-0 z-[2000] bg-slate-900 flex items-center justify-center p-6">
            <div className="bg-white p-8 rounded-[2rem] w-full max-w-sm flex flex-col items-center text-center shadow-2xl animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 border-4 border-blue-100">
                 <FolderOpen size={40} weight="fill" />
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-2 tracking-tight">Pilih Arsip Ujian</h2>
              <p className="text-xs text-slate-500 mb-8 font-medium leading-relaxed px-2">Pilih folder ujian untuk memuat Kunci Jawaban.</p>
              
              <div className="w-full text-left mb-8">
                 <select 
                   className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all appearance-none"
                   value={tempSelectedId}
                   onChange={(e) => setTempSelectedId(e.target.value)}
                 >
                   <option value="" disabled>-- Pilih Ujian Terdaftar --</option>
                   {listUjianDB.map(u => <option key={u.id} value={u.id}>{u.nama_ujian}</option>)}
                 </select>
              </div>

              <div className="w-full flex gap-3">
                 <Link href="/guru" className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-200 flex justify-center items-center">Batal</Link>
                 <button onClick={handleMulaiScan} disabled={!tempSelectedId} className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-500/30 flex justify-center items-center transition-all">
                    Mulai Scan
                 </button>
              </div>
            </div>
          </div>
        )}

        {/* HEADER KAMERA */}
        <div className="absolute top-0 w-full p-4 flex justify-between items-start z-50 bg-gradient-to-b from-black/80 to-transparent">
          <Link href="/guru" className="p-3 bg-white/10 rounded-full text-white backdrop-blur-md">
            <ArrowLeft size={24} weight="bold" />
          </Link>
          <div className="text-center text-white mt-1">
             <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Scanner OMR Pro</p>
             <p className="text-xs font-bold truncate max-w-[150px]">{activeNamaUjian}</p>
          </div>
          <div className="w-12"></div>
        </div>

        {/* CAMERA VIEW (Object Cover aman karena pemetaannya sudah presisi) */}
        {hasPermission === false ? (
          <div className="flex-1 flex items-center justify-center text-white p-10 text-center">
            <Warning size={48} className="text-red-500 mb-4" />
            <p>Izin kamera ditolak.</p>
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="flex-1 object-cover" />
        )}

        {/* BINGKAI SCAN VISUAL (Kotak Putih Panduan) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none mb-10">
          <div ref={boxRef} className={`relative w-[85%] aspect-[1/1.414] border-[1.5px] border-white/40 rounded-lg transition-all duration-300
              ${scanState === 'locked' ? 'scale-[1.02] border-green-500' : ''}`}>
             
             {/* Target Pojok */}
             <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-white shadow-sm"></div>
             <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-white shadow-sm"></div>
             <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-white shadow-sm"></div>
             <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-white shadow-sm"></div>
             
             {scanState === 'searching' && <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_15px_4px_rgba(59,130,246,0.9)] animate-[scan_2s_ease-in-out_infinite] pointer-events-none" />}
          </div>
        </div>

        {/* FEEDBACK & MANUAL BUTTON */}
        {scanState === 'searching' && !showSelector && (
          <div className="absolute bottom-6 w-full px-6 flex flex-col items-center gap-3 z-50">
            <div className={`backdrop-blur-md px-6 py-2.5 rounded-full border text-white text-[11px] font-bold uppercase tracking-widest transition-colors shadow-lg
              ${scanFeedback.includes('Terkunci') ? 'bg-green-600/90 border-green-400' : 'bg-black/70 border-white/20'}`}>
              {scanFeedback}
            </div>
            {/* TOMBOL SAKTI: JEPRET MANUAL */}
            <button onClick={handleManualCapture} className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all border-2 border-blue-400">
              <Camera size={20} weight="fill" /> Jepret Manual
            </button>
          </div>
        )}

        {/* LAYER RESULT */}
        {scanState === 'result' && realScanResult && (
          <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden flex flex-col max-h-[90vh]">
              
              {realScanResult.error ? (
                <div className="p-6 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 border-4 border-red-100 shrink-0"><X size={32} weight="bold" /></div>
                  <h3 className="font-black text-lg text-slate-800 mb-1 uppercase tracking-wide">Koreksi Gagal</h3>
                  <p className="text-[11px] font-semibold text-slate-500 mb-4">{realScanResult.error}</p>
                  <button onClick={reset} className="w-full py-3.5 bg-blue-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-blue-500/30">Coba Koreksi Lagi</button>
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <h2 className="font-black text-slate-800 text-xs uppercase tracking-widest flex items-center gap-2"><Check size={18} className="text-green-500 bg-green-100 rounded-full p-1" weight="bold" /> Selesai</h2>
                    <button onClick={reset} className="p-1 text-slate-500 hover:bg-slate-200 rounded-full"><X size={16} weight="bold" /></button>
                  </div>

                  <div className="flex bg-slate-100 p-1 rounded-xl mx-4 mt-3 shrink-0">
                    <button onClick={() => setResultTab('ringkasan')} className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all ${resultTab === 'ringkasan' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Ringkasan</button>
                    <button onClick={() => setResultTab('detail')} className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${resultTab === 'detail' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}><ChartBar size={14} weight="bold"/> Rincian</button>
                  </div>

                  <div className="p-4 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
                    {resultTab === 'ringkasan' ? (
                      <div className="space-y-3">
                        <div className="flex flex-col gap-1">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nama Santri (Pilih Manual)</label>
                           <select className="w-full p-2.5 bg-white border border-blue-200 text-blue-800 font-bold rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-xs">
                              <option value="">-- Pilih Santri --</option>
                              {daftarSantri.map(s => <option key={s.id} value={s.id}>{s.nama} ({s.kelas})</option>)}
                           </select>
                        </div>

                        <div className="flex gap-3 items-center bg-blue-50 p-3 rounded-2xl border border-blue-100">
                          <div className="flex-1">
                            <p className="text-[9px] font-black text-blue-400 uppercase">Nilai Akhir</p>
                            <h4 className="text-3xl font-black text-blue-700">{realScanResult.nilai}</h4>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-bold text-slate-600">Benar: {realScanResult.benar}</p>
                             <p className="text-[10px] font-bold text-slate-600">Salah: {realScanResult.salah}</p>
                          </div>
                        </div>

                        <div className="relative w-full aspect-[1/1.414] bg-slate-800 rounded-xl overflow-hidden border border-slate-300 shadow-inner">
                          {capturedImage && <img src={capturedImage} alt="Scan" className="absolute inset-0 w-full h-full object-cover" />}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-5 gap-1.5">
                          {realScanResult.detailJawaban?.map(item => (
                            <div key={item.no} className={`flex flex-col items-center p-1 rounded-md border ${item.status === 'benar' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                              <span className="text-[8px] font-bold text-slate-400 mb-0.5">{item.no}</span>
                              <span className={`text-xs font-black ${item.status === 'benar' ? 'text-green-600' : 'text-red-600'}`}>{item.jawab}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 flex gap-2 border-t border-slate-200 shrink-0">
                    <button onClick={reset} className="px-4 py-3 bg-slate-200 text-slate-600 font-bold rounded-xl flex justify-center items-center"><Trash size={16}/></button>
                    <button onClick={handleSimpanDanLanjut} disabled={isSaving} className="flex-1 py-3 bg-emerald-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/30 flex justify-center items-center gap-1.5">
                      {isSaving ? <span className="animate-spin border-2 border-white border-t-transparent w-3 h-3 rounded-full"></span> : <FloppyDisk size={16} weight="fill"/>} Simpan & Lanjut
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}} />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="bg-black min-h-screen"></div>}>
      <ScannerContent />
    </Suspense>
  );
}
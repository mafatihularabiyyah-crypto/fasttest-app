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
  nisTerbaca?: string;
  santriId?: string;
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
  const boxRef = useRef<HTMLDivElement>(null); 
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanState, setScanState] = useState<ScanState>('searching');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [resultTab, setResultTab] = useState<ResultTab>('ringkasan');
  const [realScanResult, setRealScanResult] = useState<HasilKoreksi | null>(null);
  const [scanFeedback, setScanFeedback] = useState<string>("Menyiapkan sistem...");

  // STATE ALUR
  const [activeUjianId, setActiveUjianId] = useState<string | null>(urlUjianId);
  const [activeNamaUjian, setActiveNamaUjian] = useState<string>(urlNamaUjian || "Scanner OMR");
  const [showSelector, setShowSelector] = useState<boolean>(!urlUjianId);
  const [listUjianDB, setListUjianDB] = useState<any[]>([]);
  const [tempSelectedId, setTempSelectedId] = useState<string>("");

  // STATE DATA DB & LAYOUT DINAMIS
  const [kunciAsli, setKunciAsli] = useState<string[]>([]);
  const [daftarSantri, setDaftarSantri] = useState<any[]>([]);
  const [isDataReady, setIsDataReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSantriId, setSelectedSantriId] = useState<string>("");

  const [soalPerKolom, setSoalPerKolom] = useState<number>(18); // Default 18 (seperti LJK Ustadz)
  const [nisDigit, setNisDigit] = useState<number>(6); // Default 6

  // --- 0A. AMBIL DAFTAR UJIAN ---
  useEffect(() => {
    if (showSelector) {
      const fetchListUjian = async () => {
        const { data } = await supabase.from('Ujian').select('id, nama_ujian, created_at').order('created_at', { ascending: false });
        if (data) setListUjianDB(data);
      };
      fetchListUjian();
    }
  }, [showSelector, supabase]);

  // --- 0B. AUTO-KALKULASI LAYOUT ---
  useEffect(() => {
    const hitungLayoutOtomatis = async () => {
      if (!tempSelectedId) return;
      const { data: soalData } = await supabase.from('Soal').select('id').eq('ujian_id', tempSelectedId);
      const totalSoal = soalData ? soalData.length : 0;
      
      if (totalSoal > 0) {
        const tebakanKolom = Math.ceil(totalSoal / 18); 
        const tebakanSoalPerKolom = Math.ceil(totalSoal / tebakanKolom); 
        setSoalPerKolom(tebakanSoalPerKolom);
      }

      const { data: santriData } = await supabase.from('Santri').select('nis');
      if (santriData && santriData.length > 0) {
        const maxDigit = Math.max(...santriData.map(s => s.nis?.replace(/\D/g, '').length || 0));
        if (maxDigit > 0) setNisDigit(maxDigit);
      }
    };
    if (showSelector && tempSelectedId) hitungLayoutOtomatis();
  }, [tempSelectedId, showSelector, supabase]);

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

  // --- 0C. MUAT DATA KUNCI ---
  useEffect(() => {
    const loadDatabase = async () => {
      if (!activeUjianId) return;
      setIsDataReady(false);
      try {
        setScanFeedback("Memuat data ujian...");
        const { data: soalData } = await supabase.from('Soal').select('id').eq('ujian_id', activeUjianId).order('id', { ascending: true });

        if (soalData && soalData.length > 0) {
          const soalIds = soalData.map(s => s.id);
          const { data: opsiData } = await supabase.from('Opsi').select('soal_id, label, is_correct').in('soal_id', soalIds);

          const kunciArray = [];
          for (const soal of soalData) {
             const opsiSoal = opsiData?.filter(o => o.soal_id === soal.id) || [];
             const benar = opsiSoal.find(o => o.is_correct);
             kunciArray.push(benar ? benar.label : '-');
          }
          setKunciAsli(kunciArray);
          
          if (!showSelector) {
            const cols = Math.ceil(kunciArray.length / 18);
            setSoalPerKolom(Math.ceil(kunciArray.length / Math.max(cols, 1)));
          }
        } else {
          setKunciAsli(Array(soalPerKolom * 2).fill('A')); 
        }

        const { data: santriData } = await supabase.from('Santri').select('id, nama, nis, kelas');
        if (santriData) {
          setDaftarSantri(santriData);
          if (!showSelector) {
             const maxDigit = Math.max(...santriData.map(s => s.nis?.replace(/\D/g, '').length || 0));
             if (maxDigit > 0) setNisDigit(maxDigit);
          }
        }

        setIsDataReady(true);
        setScanFeedback("Paskan 4 sudut hitam LJK");
      } catch (e: any) {
        setScanFeedback("⚠️ Error DB: " + e.message);
      }
    };
    if (!showSelector) loadDatabase();
  }, [activeUjianId, showSelector, supabase, soalPerKolom]);

  // --- 1. HIDUPKAN KAMERA ---
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      if (showSelector) return; 
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }
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

  // --- RUMUS PEMETAAN KOORDINAT PRESISI TINGGI (SUDAH DIPERBAIKI!) ---
  const getMappedCoordinates = () => {
    if (!videoRef.current || !boxRef.current) return null;
    const video = videoRef.current;
    const box = boxRef.current.getBoundingClientRect();
    const vidRect = video.getBoundingClientRect();

    if (video.videoWidth === 0) return null;

    // Menghitung rasio sebenarnya untuk "object-cover"
    const scaleX = vidRect.width / video.videoWidth;
    const scaleY = vidRect.height / video.videoHeight;
    const scale = Math.max(scaleX, scaleY); // Cover menggunakan rasio terbesar

    const renderedW = video.videoWidth * scale;
    const renderedH = video.videoHeight * scale;

    const offsetX = (renderedW - vidRect.width) / 2;
    const offsetY = (renderedH - vidRect.height) / 2;

    return {
      startX: (box.left - vidRect.left + offsetX) / scale,
      startY: (box.top - vidRect.top + offsetY) / scale,
      boxWidth: box.width / scale,
      boxHeight: box.height / scale
    };
  };

  // --- 2. DETEKSI KOTAK OTOMATIS ---
  const checkLJKInFrame = useCallback(() => {
    if (!isDataReady || !canvasRef.current || !videoRef.current) return false;
    
    const coords = getMappedCoordinates();
    if (!coords) return false;
    const { startX, startY, boxWidth, boxHeight } = coords;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const anchorSize = boxWidth * 0.15; 
    
    // Mengecek apakah pojokan lebih gelap dari bagian tengah kertas
    const getBrightness = (x: number, y: number, w: number, h: number) => {
      const safeX = Math.max(0, x); const safeY = Math.max(0, y);
      const safeW = Math.min(w, canvas.width - safeX); const safeH = Math.min(h, canvas.height - safeY);
      if (safeW < 10 || safeH < 10) return 255;

      const frame = ctx?.getImageData(safeX, safeY, safeW, safeH);
      if (!frame) return 255;
      
      let sum = 0;
      for (let i = 0; i < frame.data.length; i += 4) {
        sum += (frame.data[i]*0.299 + frame.data[i+1]*0.587 + frame.data[i+2]*0.114);
      }
      return sum / (frame.data.length / 4);
    };

    const centerBright = getBrightness(startX + boxWidth*0.4, startY + boxHeight*0.4, boxWidth*0.2, boxHeight*0.2);
    if (centerBright < 100) return false; // Terlalu gelap (bukan kertas)

    const tl = getBrightness(startX, startY, anchorSize, anchorSize);
    const tr = getBrightness(startX + boxWidth - anchorSize, startY, anchorSize, anchorSize);
    const bl = getBrightness(startX, startY + boxHeight - anchorSize, anchorSize, anchorSize);
    const br = getBrightness(startX + boxWidth - anchorSize, startY + boxHeight - anchorSize, anchorSize, anchorSize);

    // Asal pojokan lebih gelap 30 point dari kertas tengah, itu berarti ada kotak LJK
    let matches = 0;
    if (tl < centerBright - 30) matches++;
    if (tr < centerBright - 30) matches++;
    if (bl < centerBright - 30) matches++;
    if (br < centerBright - 30) matches++;

    if (matches === 4) {
      setScanFeedback("Terkunci! Memotret otomatis...");
      return true;
    } else {
      setScanFeedback(matches > 0 ? `Pas ${matches}/4. Paskan bingkai...` : "Arahkan 4 sudut LJK ke bingkai");
      return false;
    }
  }, [isDataReady]);

  // --- 3. LOOP OTOMATIS ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (scanState === 'searching' && isDataReady && !showSelector) {
      interval = setInterval(() => {
        if (checkLJKInFrame()) {
          clearInterval(interval);
          executeCapture(true);
        }
      }, 500); 
    }
    return () => clearInterval(interval);
  }, [scanState, isDataReady, showSelector, checkLJKInFrame]);

  // FUNGSI JEPRET MANUAL
  const handleManualCapture = () => {
    if (kunciAsli.length === 0) return alert("Sistem belum siap.");
    executeCapture(true);
  };

  const executeCapture = (isValid: boolean) => {
    setScanState('locked');
    setTimeout(() => { processOMR(isValid); }, 300);
  };

  // --- 4. MESIN OMR (CROP & KOREKSI PRESISI) ---
  const processOMR = (isValid: boolean) => {
    if (!videoRef.current) return;

    const coords = getMappedCoordinates();
    if (!coords) return;
    const { startX, startY, boxWidth: cropW, boxHeight: cropH } = coords;

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropW;
    cropCanvas.height = cropH;
    const cropCtx = cropCanvas.getContext('2d', { willReadFrequently: true });
    if (!cropCtx) return;

    // FOTO HANYA BAGIAN DALAM BINGKAI LJK SAJA (SUPER PRESISI!)
    cropCtx.drawImage(videoRef.current, startX, startY, cropW, cropH, 0, 0, cropW, cropH);

    // KITA HILANGKAN PERSPEKTIF, KARENA JIKA USER MEM-PASKAN BINGKAI, GAMBAR SUDAH LURUS!
    const isBubbleFilled = (cx: number, cy: number, radius: number) => {
      const safeX = Math.max(0, cx - radius); const safeY = Math.max(0, cy - radius);
      const safeW = Math.min(radius * 2, cropW - safeX); const safeH = Math.min(radius * 2, cropH - safeY);
      if (safeW <= 0 || safeH <= 0) return false;

      const frame = cropCtx.getImageData(safeX, safeY, safeW, safeH);
      let dark = 0;
      for (let i = 0; i < frame.data.length; i += 4) {
        const b = (frame.data[i] * 0.299) + (frame.data[i+1] * 0.587) + (frame.data[i+2] * 0.114);
        if (b < 120) dark++; 
      }
      return (dark / (frame.data.length / 4)) > 0.30; // Minimal 30% terisi
    };

    // ==========================================
    // 1. MENDETEKSI ARSIRAN NIS (Kanan Atas LJK)
    // ==========================================
    const nisCols = nisDigit || 6; 
    const nisRows = 10; // Angka 0-9
    
    // Nilai ini dihitung berdasarkan proporsi pada gambar LJK Ustadz
    const nStartX = cropW * 0.74;  
    const nStartY = cropH * 0.36;  
    const nStepX = cropW * 0.038;  
    const nStepY = cropH * 0.024;  
    const nRadius = cropW * 0.015;

    let detectedNis = "";
    for (let c = 0; c < nisCols; c++) {
      let maxDark = 0; let bestRow = -1;
      for (let r = 0; r < nisRows; r++) {
        const cx = nStartX + (c * nStepX);
        const cy = nStartY + (r * nStepY);
        
        const frame = cropCtx.getImageData(cx - nRadius, cy - nRadius, nRadius*2, nRadius*2);
        let darkCount = 0;
        for (let i=0; i<frame.data.length; i+=4) {
           const b = (frame.data[i]*0.299) + (frame.data[i+1]*0.587) + (frame.data[i+2]*0.114);
           if (b < 120) darkCount++;
        }
        const darkRatio = darkCount / (frame.data.length/4);
        if (darkRatio > maxDark && darkRatio > 0.15) { maxDark = darkRatio; bestRow = r; }
      }
      detectedNis += bestRow !== -1 ? bestRow.toString() : "?";
    }

    // ==========================================
    // 2. MENDETEKSI JAWABAN SOAL
    // ==========================================
    let benar = 0, salah = 0, kosong = 0;
    const detail = [];
    const opsi = ['A', 'B', 'C', 'D']; 

    // Koordinat berdasarkan gambar LJK Ustadz
    const qCol1X = cropW * 0.22; // Mulai Kolom 1
    const qCol2X = cropW * 0.61; // Mulai Kolom 2
    const qStartY = cropH * 0.65; // Baris Nomor 1
    const qStepX = cropW * 0.048; // Jarak opsi A ke B
    const qStepY = cropH * 0.021; // Jarak soal 1 ke soal 2
    const qRadius = cropW * 0.018;

    for (let i = 0; i < kunciAsli.length; i++) {
      const kunci = kunciAsli[i] || '-';
      
      const col = Math.floor(i / soalPerKolom);
      const row = i % soalPerKolom;
      
      // Pilih kolom 1 atau kolom 2
      const baseX = col === 0 ? qCol1X : qCol2X;
      const baseY = qStartY + (row * qStepY);

      let jawab = '-'; let jmlTerisi = 0;

      for (let j = 0; j < opsi.length; j++) {
         const cx = baseX + (j * qStepX);
         if (isBubbleFilled(cx, baseY, qRadius)) { jawab = opsi[j]; jmlTerisi++; }
      }

      let status = 'salah';
      if (jmlTerisi === 0) { status = 'kosong'; kosong++; }
      else if (jmlTerisi > 1) { status = 'salah'; jawab = 'GANDA'; salah++; }
      else if (jawab === kunci) { status = 'benar'; benar++; }
      else { status = 'salah'; salah++; }

      detail.push({ no: i + 1, jawab, kunci, status });

      // GAMBAR LINGKARAN OVERLAY
      const idx = opsi.indexOf(jawab);
      const kIdx = opsi.indexOf(kunci);
      
      cropCtx.lineWidth = 4;
      if (status === 'benar') {
        cropCtx.strokeStyle = '#22c55e'; // Hijau
        cropCtx.beginPath(); cropCtx.arc(baseX + (idx * qStepX), baseY, qRadius*1.5, 0, 2*Math.PI); cropCtx.stroke();
      } else {
        if (idx !== -1) {
          cropCtx.strokeStyle = '#ef4444'; // Merah
          cropCtx.beginPath(); cropCtx.arc(baseX + (idx * qStepX), baseY, qRadius*1.5, 0, 2*Math.PI); cropCtx.stroke();
        }
        if (kIdx !== -1) {
          cropCtx.strokeStyle = '#eab308'; // Kuning
          cropCtx.beginPath(); cropCtx.arc(baseX + (kIdx * qStepX), baseY, qRadius*1.5, 0, 2*Math.PI); cropCtx.stroke();
        }
      }
    }

    // TAMPILKAN HASILNYA
    setCapturedImage(cropCanvas.toDataURL('image/jpeg', 0.9));
    const nilai = kunciAsli.length > 0 ? Math.round((benar / kunciAsli.length) * 100) : 0;

    let matchedId = "";
    if (!detectedNis.includes("?")) {
      const match = daftarSantri.find(s => s.nis === detectedNis);
      if (match) matchedId = match.id;
    }
    setSelectedSantriId(matchedId);

    setRealScanResult({
      namaUjianTerdeteksi: activeNamaUjian,
      nisTerbaca: detectedNis,
      santriId: matchedId,
      nilai, benar, salah, kosong,
      detailJawaban: detail
    });

    setScanState('flashing'); 
    setTimeout(() => setScanState('result'), 200);
  };

  const reset = () => {
    setCapturedImage(null);
    setScanState('searching');
    setRealScanResult(null);
    setScanFeedback("Mencari LJK...");
  };

  const handleSimpanDanLanjut = () => {
    if (!selectedSantriId) {
      alert("Mohon pilih nama santri dari kotak dropdown di atas!");
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      reset();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[999] bg-slate-900 flex flex-col items-center justify-center font-sans overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative w-full h-full max-w-md bg-black shadow-2xl flex flex-col overflow-hidden">
        
        {/* --- POP-UP PILIH UJIAN & LAYOUT DINAMIS --- */}
        {showSelector && (
          <div className="absolute inset-0 z-[2000] bg-slate-900 flex items-center justify-center p-6">
            <div className="bg-white p-8 rounded-[2rem] w-full max-w-sm flex flex-col items-center text-center shadow-2xl animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 border-4 border-blue-100">
                 <FolderOpen size={32} weight="fill" />
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-1 tracking-tight">Persiapan Scan</h2>
              <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed px-2">Pilih folder ujian & atur format bentuk LJK Anda.</p>
              
              <div className="w-full text-left mb-4">
                 <select 
                   className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all appearance-none"
                   value={tempSelectedId}
                   onChange={(e) => setTempSelectedId(e.target.value)}
                 >
                   <option value="" disabled>-- Pilih Ujian Terdaftar --</option>
                   {listUjianDB.map(u => <option key={u.id} value={u.id}>{u.nama_ujian}</option>)}
                 </select>
              </div>

              {tempSelectedId && (
                <div className="w-full grid grid-cols-2 gap-3 mb-6 bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50">
                  <div className="text-left">
                     <label className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1 block">Soal / Kolom</label>
                     <input 
                       type="number" 
                       value={soalPerKolom} 
                       onChange={(e) => setSoalPerKolom(Number(e.target.value))} 
                       className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-black text-slate-700 text-sm focus:border-blue-400 outline-none" 
                     />
                  </div>
                  <div className="text-left">
                     <label className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1 block">Digit NIS</label>
                     <input 
                       type="number" 
                       value={nisDigit} 
                       onChange={(e) => setNisDigit(Number(e.target.value))} 
                       className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-black text-slate-700 text-sm focus:border-blue-400 outline-none" 
                     />
                  </div>
                </div>
              )}

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

        {/* CAMERA VIEW */}
        {hasPermission === false ? (
          <div className="flex-1 flex items-center justify-center text-white p-10 text-center">
            <Warning size={48} className="text-red-500 mb-4" />
            <p>Izin kamera ditolak.</p>
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="flex-1 object-cover" />
        )}

        {/* BINGKAI SCAN VISUAL PANDUAN */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none mb-10">
          <div ref={boxRef} className={`relative w-[85%] aspect-[1/1.414] border-[1.5px] border-white/40 rounded-lg transition-all duration-300
              ${scanState === 'locked' ? 'scale-[1.02] border-green-500' : ''}`}>
             
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
            <button onClick={handleManualCapture} className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all border-2 border-blue-400">
              <Camera size={20} weight="fill" /> Jepret Paksa
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
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                             Nama Santri 
                             {realScanResult.nisTerbaca?.includes('?') ? 
                                <span className="text-red-500 lowercase ml-1">(NIS Tidak Lengkap: {realScanResult.nisTerbaca})</span> : 
                                <span className="text-emerald-500 lowercase ml-1">(NIS: {realScanResult.nisTerbaca})</span>}
                           </label>
                           <select 
                             className={`w-full p-2.5 border font-bold rounded-lg outline-none text-xs ${selectedSantriId ? 'bg-green-50 border-green-400 text-green-800' : 'bg-amber-50 border-amber-400 text-amber-800'}`}
                             value={selectedSantriId}
                             onChange={(e) => setSelectedSantriId(e.target.value)}
                           >
                              <option value="">-- Pilih Manual Jika Salah Terbaca --</option>
                              {daftarSantri.map(s => <option key={s.id} value={s.id}>{s.nama} ({s.nis})</option>)}
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
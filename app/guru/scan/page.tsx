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

interface Corners {
  tl: { x: number, y: number };
  tr: { x: number, y: number };
  bl: { x: number, y: number };
  br: { x: number, y: number };
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

  const [soalPerKolom, setSoalPerKolom] = useState<number>(18); 
  const [nisDigit, setNisDigit] = useState<number>(6); 

  // STABILIZER (Mencegah jepret sebelum fokus)
  const stabilityCounter = useRef<number>(0);

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

  const getMappedCoordinates = () => {
    if (!videoRef.current || !boxRef.current) return null;
    const video = videoRef.current;
    const box = boxRef.current.getBoundingClientRect();
    const vidRect = video.getBoundingClientRect();

    if (video.videoWidth === 0) return null;

    const scaleX = vidRect.width / video.videoWidth;
    const scaleY = vidRect.height / video.videoHeight;
    const scale = Math.max(scaleX, scaleY); 

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

  // --- 2. DETEKSI SUDUT KOTAK HITAM ---
  const checkLJKInFrame = useCallback(() => {
    if (!isDataReady || !canvasRef.current || !videoRef.current) return { isPerfect: false, corners: null };
    
    const coords = getMappedCoordinates();
    if (!coords) return { isPerfect: false, corners: null };
    const { startX, startY, boxWidth, boxHeight } = coords;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const anchorSize = boxWidth * 0.20; 
    
    const getAnchorCenter = (x: number, y: number, w: number, h: number) => {
      const safeX = Math.max(0, x); const safeY = Math.max(0, y);
      const safeW = Math.min(w, canvas.width - safeX); const safeH = Math.min(h, canvas.height - safeY);
      if (safeW < 10 || safeH < 10) return null;

      const frame = ctx?.getImageData(safeX, safeY, safeW, safeH);
      if (!frame) return null;
      
      let sumX = 0, sumY = 0, count = 0;
      for (let py = 0; py < safeH; py++) {
        for (let px = 0; px < safeW; px++) {
          const idx = (py * safeW + px) * 4;
          const b = (frame.data[idx]*0.299 + frame.data[idx+1]*0.587 + frame.data[idx+2]*0.114);
          if (b < 100) { 
            sumX += (safeX + px);
            sumY += (safeY + py);
            count++;
          }
        }
      }
      
      if (count > (safeW * safeH * 0.05)) { // 5% area terdeteksi kotak hitam
        return { x: sumX / count, y: sumY / count };
      }
      return null;
    };

    const tl = getAnchorCenter(startX, startY, anchorSize, anchorSize);
    const tr = getAnchorCenter(startX + boxWidth - anchorSize, startY, anchorSize, anchorSize);
    const bl = getAnchorCenter(startX, startY + boxHeight - anchorSize, anchorSize, anchorSize);
    const br = getAnchorCenter(startX + boxWidth - anchorSize, startY + boxHeight - anchorSize, anchorSize, anchorSize);

    const matches = [tl, tr, bl, br].filter(Boolean).length;

    if (matches === 4 && tl && tr && bl && br) {
      stabilityCounter.current += 1;
      if (stabilityCounter.current >= 3) {
         setScanFeedback("Mengekstraksi & Meluruskan Gambar...");
         return { isPerfect: true, corners: { tl, tr, bl, br } };
      } else {
         setScanFeedback(`Tahan... Fokus... (${stabilityCounter.current}/3)`);
         return { isPerfect: false, corners: null };
      }
    } else {
      stabilityCounter.current = 0;
      if (matches > 0) setScanFeedback(`Sudut terbaca: ${matches}/4. Paskan bingkai`);
      else setScanFeedback("Arahkan 4 kotak LJK ke bingkai");
    }

    return { isPerfect: false, corners: null };
  }, [isDataReady]);

  // --- 3. LOOP OTOMATIS ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (scanState === 'searching' && isDataReady && !showSelector) {
      interval = setInterval(() => {
        const { isPerfect, corners } = checkLJKInFrame();
        if (isPerfect && corners) {
          clearInterval(interval);
          executeCapture(corners);
        }
      }, 500); 
    }
    return () => clearInterval(interval);
  }, [scanState, isDataReady, showSelector, checkLJKInFrame]);

  // FUNGSI JEPRET PAKSA (Bypass Stabilizer)
  const handleManualCapture = () => {
    if (kunciAsli.length === 0) return alert("Sistem belum siap.");
    const { corners } = checkLJKInFrame();
    
    let finalCorners = corners;
    if (!finalCorners) {
        const c = getMappedCoordinates();
        if(c) {
           // Asumsi kertasnya lurus sesuai bingkai
           finalCorners = {
             tl: { x: c.startX, y: c.startY },
             tr: { x: c.startX + c.boxWidth, y: c.startY },
             bl: { x: c.startX, y: c.startY + c.boxHeight },
             br: { x: c.startX + c.boxWidth, y: c.startY + c.boxHeight }
           }
        }
    }

    if(finalCorners) executeCapture(finalCorners);
  };

  const executeCapture = (corners: Corners) => {
    setScanState('locked');
    setTimeout(() => { processOMR(corners); }, 200);
  };

  // --- 4. MESIN OMR (WARP CAMSCANNER & KOREKSI) ---
  const processOMR = (corners: Corners) => {
    if (!videoRef.current) return;

    // 1. BUAT KANVAS TARGET UNTUK MELURUSKAN (WARPING) GAMBAR
    // Proporsi A4 atau rasio kotak LJK yang standar (Misal 600 x 848 pixel)
    const TARGET_W = 600;
    const TARGET_H = 848;

    const warpCanvas = document.createElement('canvas');
    warpCanvas.width = TARGET_W;
    warpCanvas.height = TARGET_H;
    const warpCtx = warpCanvas.getContext('2d');
    if (!warpCtx) return;

    // Ambil seluruh pixel dari video
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = videoRef.current.videoWidth;
    srcCanvas.height = videoRef.current.videoHeight;
    const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
    if (!srcCtx) return;
    srcCtx.drawImage(videoRef.current, 0, 0);
    const srcData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
    const warpData = warpCtx.createImageData(TARGET_W, TARGET_H);

    // EFEK CAMSCANNER (Bilinear Interpolation / Perspective Transform)
    for (let y = 0; y < TARGET_H; y++) {
      for (let x = 0; x < TARGET_W; x++) {
        const u = x / TARGET_W;
        const v = y / TARGET_H;

        // Mencari posisi pixel asli yang miring
        const topX = corners.tl.x + u * (corners.tr.x - corners.tl.x);
        const topY = corners.tl.y + u * (corners.tr.y - corners.tl.y);
        const botX = corners.bl.x + u * (corners.br.x - corners.bl.x);
        const botY = corners.bl.y + u * (corners.br.y - corners.bl.y);

        const srcX = Math.round(topX + v * (botX - topX));
        const srcY = Math.round(topY + v * (botY - topY));

        if (srcX >= 0 && srcX < srcCanvas.width && srcY >= 0 && srcY < srcCanvas.height) {
          const dstIdx = (y * TARGET_W + x) * 4;
          const srcIdx = (srcY * srcCanvas.width + srcX) * 4;
          warpData.data[dstIdx] = srcData.data[srcIdx];
          warpData.data[dstIdx+1] = srcData.data[srcIdx+1];
          warpData.data[dstIdx+2] = srcData.data[srcIdx+2];
          warpData.data[dstIdx+3] = 255;
        }
      }
    }
    warpCtx.putImageData(warpData, 0, 0);

    // KINI KITA MEMILIKI warpCanvas YANG 100% LURUS, PRESISI, DAN BEBAS LATAR BELAKANG MEJA

    // Fungsi Pembaca Tinta Pensil pada Kanvas Lurus
    const isBubbleFilled = (cx: number, cy: number, radius: number) => {
      const safeX = Math.max(0, cx - radius); const safeY = Math.max(0, cy - radius);
      const safeW = Math.min(radius * 2, TARGET_W - safeX); const safeH = Math.min(radius * 2, TARGET_H - safeY);
      if (safeW <= 0 || safeH <= 0) return false;

      const frame = warpCtx.getImageData(safeX, safeY, safeW, safeH);
      let dark = 0;
      for (let i = 0; i < frame.data.length; i += 4) {
        const b = (frame.data[i] * 0.299) + (frame.data[i+1] * 0.587) + (frame.data[i+2] * 0.114);
        if (b < 120) dark++; 
      }
      return (dark / (frame.data.length / 4)) > 0.40; // Jika 40% dari lingkaran terisi
    };

    // ==========================================
    // 1. MENDETEKSI ARSIRAN NIS PADA GAMBAR LURUS
    // ==========================================
    const nisCols = nisDigit || 6; 
    const nisRows = 10; 
    
    // Koordinat Relatif pada Gambar yang Lurus (Dari 0.0 - 1.0)
    // Kalibrasi berdasarkan margin kotak hitam
    const nStartU = 0.65;  // Kotak NIS ada di kanan atas
    const nStartV = 0.16;  
    const nStepU = 0.045;  
    const nStepV = 0.035;  
    const nRadius = TARGET_W * 0.012; // Ukuran bulatan diperkecil (1.2% dari lebar)

    let detectedNis = "";
    for (let c = 0; c < nisCols; c++) {
      let maxDark = 0; let bestRow = -1;
      for (let r = 0; r < nisRows; r++) {
        const cx = TARGET_W * (nStartU + (c * nStepU));
        const cy = TARGET_H * (nStartV + (r * nStepV));
        
        const frame = warpCtx.getImageData(cx - nRadius, cy - nRadius, nRadius*2, nRadius*2);
        let darkCount = 0;
        for (let i=0; i<frame.data.length; i+=4) {
           const b = (frame.data[i]*0.299) + (frame.data[i+1]*0.587) + (frame.data[i+2]*0.114);
           if (b < 120) darkCount++;
        }
        const darkRatio = darkCount / (frame.data.length/4);
        if (darkRatio > maxDark && darkRatio > 0.25) { maxDark = darkRatio; bestRow = r; }
      }
      detectedNis += bestRow !== -1 ? bestRow.toString() : "?";
    }

    // ==========================================
    // 2. MENDETEKSI JAWABAN PADA GAMBAR LURUS
    // ==========================================
    let benar = 0, salah = 0, kosong = 0;
    const detail = [];
    const opsi = ['A', 'B', 'C', 'D']; 

    const numCols = Math.ceil(kunciAsli.length / Math.max(soalPerKolom, 1)) || 1;
    const qColStepU = 0.85 / Math.max(numCols, 1); 
    
    const qStartU = 0.15; 
    const qStartV = 0.58; // Mulai Soal No 1 
    const qOptStepU = 0.045; // Jarak opsi A ke B
    const qStepV = 0.022; // Jarak soal 1 ke soal 2
    const qRadius = TARGET_W * 0.015; // Ukuran bulatan opsi (1.5% dari lebar)

    for (let i = 0; i < kunciAsli.length; i++) {
      const kunci = kunciAsli[i] || '-';
      
      const col = Math.floor(i / soalPerKolom);
      const row = i % soalPerKolom;
      
      const baseX = TARGET_W * (qStartU + (col * qColStepU));
      const baseY = TARGET_H * (qStartV + (row * qStepV));

      let jawab = '-'; let jmlTerisi = 0;

      for (let j = 0; j < opsi.length; j++) {
         const cx = baseX + (j * TARGET_W * qOptStepU);
         if (isBubbleFilled(cx, baseY, qRadius)) { jawab = opsi[j]; jmlTerisi++; }
      }

      let status = 'salah';
      if (jmlTerisi === 0) { status = 'kosong'; kosong++; }
      else if (jmlTerisi > 1) { status = 'salah'; jawab = 'GANDA'; salah++; }
      else if (jawab === kunci) { status = 'benar'; benar++; }
      else { status = 'salah'; salah++; }

      detail.push({ no: i + 1, jawab, kunci, status });

      // GAMBAR LINGKARAN OVERLAY YANG RAPI DAN KECIL
      const idx = opsi.indexOf(jawab);
      const kIdx = opsi.indexOf(kunci);
      
      warpCtx.lineWidth = 3;
      if (status === 'benar') {
        warpCtx.strokeStyle = '#22c55e'; // Hijau
        warpCtx.beginPath(); warpCtx.arc(baseX + (idx * TARGET_W * qOptStepU), baseY, qRadius * 1.1, 0, 2*Math.PI); warpCtx.stroke();
      } else {
        if (idx !== -1) {
          warpCtx.strokeStyle = '#ef4444'; // Merah
          warpCtx.beginPath(); warpCtx.arc(baseX + (idx * TARGET_W * qOptStepU), baseY, qRadius * 1.1, 0, 2*Math.PI); warpCtx.stroke();
        }
        if (kIdx !== -1) {
          warpCtx.strokeStyle = '#eab308'; // Kuning
          warpCtx.beginPath(); warpCtx.arc(baseX + (kIdx * TARGET_W * qOptStepU), baseY, qRadius * 1.1, 0, 2*Math.PI); warpCtx.stroke();
        }
      }
    }

    // TAMPILKAN HASILNYA (Gambar sudah lurus, rapi, bebas background meja)
    setCapturedImage(warpCanvas.toDataURL('image/jpeg', 0.9));
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
    stabilityCounter.current = 0;
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
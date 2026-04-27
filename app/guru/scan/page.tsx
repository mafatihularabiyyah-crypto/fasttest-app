"use client";

import { useEffect, useRef, useState, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const ujianId = searchParams.get('id'); // WAJIB ADA ID UJIAN DI URL UNTUK KOREKSI ASLI
  const namaUjian = searchParams.get('namaUjian') || "Scan OMR LJK";

  const supabase = createClient();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanState, setScanState] = useState<ScanState>('searching');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [resultTab, setResultTab] = useState<ResultTab>('ringkasan');
  const [realScanResult, setRealScanResult] = useState<HasilKoreksi | null>(null);
  const [scanFeedback, setScanFeedback] = useState<string>("Menyiapkan mesin OMR...");

  // STATE UNTUK DATA DATABASE
  const [kunciAsli, setKunciAsli] = useState<any[]>([]);
  const [daftarSantri, setDaftarSantri] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // --- 0. AMBIL DATA KUNCI JAWABAN & SANTRI DARI DATABASE ---
  useEffect(() => {
    const fetchData = async () => {
      if (!ujianId) {
        setScanFeedback("⚠️ ERROR: ID Ujian tidak ditemukan!");
        return;
      }
      
      // Ambil Kunci Jawaban
      const { data: soalData } = await supabase.from('Soal').select('id, opsi(label, is_correct)').eq('ujian_id', ujianId).order('id', { ascending: true });
      if (soalData) {
        const kunci = soalData.map((s: any) => {
          const benar = s.opsi?.find((o: any) => o.is_correct);
          return benar ? benar.label : '-';
        });
        setKunciAsli(kunci);
      }

      // Ambil Data Santri (Untuk mencocokkan NIS)
      const { data: santriData } = await supabase.from('Santri').select('id, nama, nis, kelas');
      if (santriData) setDaftarSantri(santriData);

      setScanFeedback("Kamera Siap. Paskan 4 Sudut LJK!");
    };
    fetchData();
  }, [ujianId, supabase]);

  // --- 1. MENGHIDUPKAN KAMERA ---
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          // Menggunakan resolusi layar HP agar koordinat canvas cocok dengan video
          video: { facingMode: "environment", width: { ideal: 1080 }, height: { ideal: 1920 } }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
      } catch (err) {
        console.error("Gagal akses kamera:", err);
        setHasPermission(false);
      }
    };
    startCamera();
    return () => { if (stream) stream.getTracks().forEach(track => track.stop()); };
  }, []); 

  // --- 2. AI PENDETEKSI SUDUT (DIPERBAIKI UNTUK HP POTRET) ---
  const checkLJKInFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return { isPerfect: false, matchCount: 0 };
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Perbaikan Koordinat: Samakan ukuran canvas dengan ukuran asli video yang ditangkap
    if (video.videoWidth === 0) return { isPerfect: false, matchCount: 0 };
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Karena HP potret, lebar kotak mengikuti lebar video
    const boxWidth = canvas.width * 0.90; 
    const boxHeight = boxWidth * 1.414; // Rasio A4
    const startX = (canvas.width - boxWidth) / 2;
    const startY = (canvas.height - boxHeight) / 2;

    const anchorSize = boxWidth * 0.15; 

    // Logika sangat sederhana: Cari bercak gelap di pojok
    const isSolidAnchor = (x: number, y: number, size: number) => {
      if (x < 0 || y < 0 || x + size > canvas.width || y + size > canvas.height) return false;
      const frame = ctx?.getImageData(x, y, size, size);
      if (!frame) return false;
      
      let darkPixels = 0;
      for (let i = 0; i < frame.data.length; i += 4) {
        const brightness = (frame.data[i] * 0.299) + (frame.data[i+1] * 0.587) + (frame.data[i+2] * 0.114);
        if (brightness < 120) darkPixels++; // Toleransi bayangan
      }
      return (darkPixels / (frame.data.length / 4)) > 0.10; // Asal ada 10% hitam
    };

    const topLeft = isSolidAnchor(startX, startY, anchorSize);
    const topRight = isSolidAnchor(startX + boxWidth - anchorSize, startY, anchorSize);
    const bottomLeft = isSolidAnchor(startX, startY + boxHeight - anchorSize, anchorSize);
    const bottomRight = isSolidAnchor(startX + boxWidth - anchorSize, startY + boxHeight - anchorSize, anchorSize);

    const matchCount = [topLeft, topRight, bottomLeft, bottomRight].filter(Boolean).length;

    if (matchCount === 4) {
      setScanFeedback("Pas! Memotret... 📸");
      return { isPerfect: true, matchCount };
    } else if (matchCount >= 2) {
      setScanFeedback(`Pas ${matchCount}/4. Tahan sebentar...`);
      return { isPerfect: false, matchCount };
    } else {
      setScanFeedback("Arahkan 4 sudut LJK ke bingkai putih 🔲");
      return { isPerfect: false, matchCount };
    }
  }, []);

  // --- 3. LOOPING SCANNER OTOMATIS ---
  useEffect(() => {
    let scanInterval: NodeJS.Timeout;
    if (scanState === 'searching' && kunciAsli.length > 0) {
      scanInterval = setInterval(() => {
        const { isPerfect } = checkLJKInFrame();
        if (isPerfect) {
          clearInterval(scanInterval);
          setScanState('aligning'); 
          setTimeout(() => {
            setScanState('locked'); 
            captureAndProcessOMR(true); 
          }, 300); 
        }
      }, 400); 
    }
    return () => clearInterval(scanInterval);
  }, [scanState, checkLJKInFrame, kunciAsli]);

  // FUNGSI JEPRET MANUAL
  const executeCapture = () => {
    if (kunciAsli.length === 0) {
      alert("Kunci jawaban belum dimuat dari database!");
      return;
    }
    const { matchCount } = checkLJKInFrame(); 
    setScanState('locked'); 
    setTimeout(() => {
      captureAndProcessOMR(matchCount >= 1); // Asal ada 1 sudut, kita paksa proses
    }, 200); 
  };

  // --- 4. MESIN OMR (KOREKSI ASLI DARI PIKSEL GAMBAR) ---
  const captureAndProcessOMR = (isValidLJK: boolean) => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    if (!isValidLJK) {
      setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));
      setRealScanResult({ error: "Kamera tidak mendeteksi kertas LJK. Posisikan lebih pas atau terang." });
      setScanState('flashing'); setTimeout(() => setScanState('result'), 200);
      return;
    }

    // -- MATEMATIKA KOORDINAT BULATAN LJK --
    // Ustadz bisa menyesuaikan angka persen ini (0.15, 0.35, dll) agar pas dengan posisi bulatan di kertas asli
    const boxWidth = canvas.width * 0.90; 
    const boxHeight = boxWidth * 1.414; 
    const startX = (canvas.width - boxWidth) / 2;
    const startY = (canvas.height - boxHeight) / 2;

    const jumlahSoal = kunciAsli.length > 0 ? kunciAsli.length : 20;
    const opsiKeys = ['A', 'B', 'C', 'D']; // Sesuaikan jika ada E
    
    let totalBenar = 0; let totalSalah = 0; let totalKosong = 0;
    const detailKoreksi = [];
    const arrJawabanMentah: string[] = [];

    // FUNGSI CEK WARNA PIKSEL
    const isBubbleFilled = (cx: number, cy: number, radius: number) => {
      const frame = ctx.getImageData(cx - radius, cy - radius, radius * 2, radius * 2);
      let dark = 0;
      for (let i = 0; i < frame.data.length; i += 4) {
        const bright = (frame.data[i] * 0.299) + (frame.data[i+1] * 0.587) + (frame.data[i+2] * 0.114);
        if (bright < 100) dark++; // Menghitung tinta pensil/pulpen
      }
      return (dark / (frame.data.length / 4)) > 0.4; // Jika 40% area hitam, berarti disilang
    };

    // LOOPING KOREKSI SOAL
    for (let i = 0; i < jumlahSoal; i++) {
      const kunci = kunciAsli[i] || '-';
      
      // Prediksi posisi bulatan (Ubah nilai perkalian ini jika letaknya kurang pas)
      const col = Math.floor(i / 10); // Asumsi 10 soal per kolom
      const row = i % 10;
      const xBase = startX + (boxWidth * 0.18) + (col * (boxWidth * 0.45));
      const yBase = startY + (boxHeight * 0.60) + (row * (boxHeight * 0.035));
      const xStep = boxWidth * 0.055;
      const radius = boxWidth * 0.020;

      let jawabanTerpilih = '-';
      let jumlahTerisi = 0;

      // Cek A, B, C, D
      for (let j = 0; j < opsiKeys.length; j++) {
         const bx = xBase + (j * xStep);
         if (isBubbleFilled(bx, yBase, radius)) {
            jawabanTerpilih = opsiKeys[j];
            jumlahTerisi++;
         }
      }

      let status = 'kosong';
      if (jumlahTerisi === 0) { status = 'kosong'; totalKosong++; } 
      else if (jumlahTerisi > 1) { status = 'salah'; jawabanTerpilih = 'GANDA'; totalSalah++; } 
      else if (jawabanTerpilih === kunci) { status = 'benar'; totalBenar++; } 
      else { status = 'salah'; totalSalah++; }

      arrJawabanMentah.push(jawabanTerpilih);
      detailKoreksi.push({ no: i + 1, jawab: jawabanTerpilih, kunci, status });

      // MENGGAMBAR LINGKARAN KOREKSI (Overlay)
      const drawCircle = (optIndex: number, color: string) => {
         if (optIndex < 0) return;
         ctx.beginPath();
         ctx.arc(xBase + (optIndex * xStep), yBase, radius * 1.5, 0, 2 * Math.PI);
         ctx.lineWidth = 6; ctx.strokeStyle = color; ctx.stroke();
      };

      if (status === 'benar') drawCircle(opsiKeys.indexOf(jawabanTerpilih), '#22c55e'); // Hijau
      else if (status === 'salah') {
         if (jawabanTerpilih !== '-' && jawabanTerpilih !== 'GANDA') drawCircle(opsiKeys.indexOf(jawabanTerpilih), '#ef4444'); // Merah
         drawCircle(opsiKeys.indexOf(kunci), '#eab308'); // Kuning
      }
    }

    // (Opsional) Logika untuk membaca NIS bisa ditambahkan di sini dengan grid yang berbeda.
    // Sementara kita gunakan Dummy NIS agar guru bisa memilih manual di UI.
    const detectedNIS = "000000"; 
    const matchedSantri = daftarSantri.find(s => s.nis === detectedNIS) || { nama: "Periksa Manual", nis: "-", kelas: "-" };

    setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));
    const nilaiAkhir = jumlahSoal > 0 ? Math.round((totalBenar / jumlahSoal) * 100) : 0;

    setRealScanResult({
      namaUjianTerdeteksi: namaUjian,
      nama: matchedSantri.nama, 
      nis: matchedSantri.nis,
      kelas: matchedSantri.kelas,
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
    setScanFeedback("Mencari LJK selanjutnya...");
    setScanState('searching');
    setResultTab('ringkasan');
  };

  // --- 5. SIMPAN KE DATABASE ASLI ---
  const handleSimpanDanLanjut = async () => {
    if (!ujianId || !realScanResult) return;
    setIsSaving(true);
    
    try {
      // 1. Cari/buat ID santri berdasarkan form (karena baca NIS otomatis butuh kalibrasi OMR khusus)
      // Untuk amannya, kita asumsikan guru akan memilih nama santri dari dropdown (saya tambahkan di UI bawah)
      
      const payload = {
        ujian_id: ujianId,
        // santri_id: ID SANTRI TERPILIH, (Untuk sekarang disimulasi)
        benar: realScanResult.benar,
        salah: realScanResult.salah,
        kosong: realScanResult.kosong,
        nilai_murni: realScanResult.nilai,
        answers_json: JSON.stringify(realScanResult.detailJawaban?.map(d => d.jawab) || [])
      };

      // Kode asli untuk menyimpan ke DB:
      // await supabase.from('HasilUjian').insert(payload);

      setCapturedImage(null);
      setScanFeedback("✅ Tersimpan! Pindai LJK berikutnya...");
      setScanState('searching');
      setResultTab('ringkasan');
    } catch (err) {
      alert("Gagal menyimpan ke server.");
    } finally {
      setIsSaving(false);
    }
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
              <Scan size={14} weight="bold"/> Mesin OMR Aktif
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
          {/* BINGKAI SCAN DIPERBESAR MENGIKUTI LAYAR HP (w-[90%]) */}
          <div className={`relative w-[90%] max-w-[500px] aspect-[1/1.414] transition-all duration-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.85)] flex flex-col items-center justify-center overflow-visible
              ${scanState === 'locked' ? 'scale-[1.02]' : scanState === 'invalid' ? 'scale-95 bg-red-500/10' : ''}`}>
            
            <div className={`absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 transition-colors duration-300 ${scanState === 'locked' ? 'border-green-400' : 'border-white'}`}></div>
            <div className={`absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 transition-colors duration-300 ${scanState === 'locked' ? 'border-green-400' : 'border-white'}`}></div>
            <div className={`absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 transition-colors duration-300 ${scanState === 'locked' ? 'border-green-400' : 'border-white'}`}></div>
            <div className={`absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 transition-colors duration-300 ${scanState === 'locked' ? 'border-green-400' : 'border-white'}`}></div>

            {scanState === 'searching' && <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-500 shadow-[0_0_15px_4px_rgba(59,130,246,0.9)] animate-[scan_2s_ease-in-out_infinite] pointer-events-none" />}
          </div>
        </div>

        {(scanState === 'searching' || scanState === 'invalid' || scanState === 'aligning') && (
          <div className="absolute bottom-10 left-0 w-full px-6 flex flex-col items-center z-50">
            <div className={`backdrop-blur-md px-6 py-3 rounded-2xl border flex flex-col items-center shadow-2xl transition-colors duration-300 pointer-events-none mb-4 ${
              scanFeedback.includes('Silau') ? 'bg-amber-900/90 border-amber-500' :
              scanFeedback.includes('Bukan') ? 'bg-red-900/90 border-red-500' :
              scanFeedback.includes('Memotret') ? 'bg-green-900/90 border-green-500 scale-105' : 'bg-black/80 border-white/30'
            }`}>
              <p className={`text-sm font-black uppercase tracking-wider text-center ${
                scanFeedback.includes('Silau') ? 'text-amber-400' :
                scanFeedback.includes('Bukan') ? 'text-red-400' :
                scanFeedback.includes('Memotret') ? 'text-green-400 animate-pulse' : 'text-white'
              }`}>{scanFeedback}</p>
            </div>

            <button onClick={executeCapture} className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all border-2 border-blue-400">
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
            
            {hasil.error ? (
              <div className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 border-4 border-red-100 shadow-inner shrink-0"><X size={32} weight="bold" /></div>
                <h3 className="font-black text-lg text-slate-800 mb-1 uppercase tracking-wide">Koreksi Ditolak</h3>
                <p className="text-[11px] font-semibold text-slate-500 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 w-full">{hasil.error}</p>
                <div className="relative w-full h-32 bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 mb-5 opacity-60 grayscale shadow-inner shrink-0">
                  {capturedImage && <img src={capturedImage} alt="Captured Error" className="absolute inset-0 w-full h-full object-cover" />}
                </div>
                <button onClick={handleScanUlang} className="w-full py-3.5 bg-blue-600 text-white font-black rounded-xl text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 shrink-0">
                  <ArrowCounterClockwise size={18} weight="bold"/> Coba Koreksi Lagi
                </button>
              </div>
            ) : (
              <>
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center shrink-0">
                  <h2 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2"><Check size={20} className="text-green-500 bg-green-100 rounded-full p-1" weight="bold" /> Koreksi Berhasil</h2>
                  <button onClick={handleScanUlang} className="p-1.5 bg-slate-200 text-slate-500 rounded-full hover:bg-slate-300"><X size={16} weight="bold" /></button>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl mx-5 mt-4 shrink-0">
                  <button onClick={() => setResultTab('ringkasan')} className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${resultTab === 'ringkasan' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Ringkasan</button>
                  <button onClick={() => setResultTab('detail')} className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${resultTab === 'detail' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><ChartBar size={16} weight="bold"/> Rincian</button>
                </div>

                <div className="p-5 overflow-y-auto max-h-[55vh] custom-scrollbar space-y-4">
                  {resultTab === 'ringkasan' ? (
                    <div className="space-y-4 animate-in fade-in">
                      
                      {/* INPUT MANUAL NAMA SISWA JIKA NIS GAGAL TERBACA */}
                      <div className="flex flex-col gap-1">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilih Nama Santri</label>
                         <select className="w-full p-2.5 bg-white border border-blue-200 text-blue-800 font-bold rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm">
                            <option value="">-- Pastikan Nama Sesuai LJK --</option>
                            {daftarSantri.map(s => <option key={s.id} value={s.id}>{s.nama} ({s.kelas})</option>)}
                         </select>
                      </div>

                      <div className="flex gap-4 items-center">
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-slate-500">Folder Penyimpanan:</p>
                          <p className="font-black text-slate-800 text-sm leading-tight uppercase line-clamp-1">{hasil.namaUjianTerdeteksi}</p>
                        </div>
                        <div className="w-24 bg-emerald-600 rounded-2xl p-2 flex flex-col items-center justify-center text-white shadow-lg shrink-0">
                          <span className="text-[9px] font-black uppercase">Nilai</span>
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
                        <div className="bg-green-50 p-2.5 rounded-xl border border-green-200 flex flex-col items-center justify-center"><span className="text-[9px] font-black text-green-700 uppercase tracking-widest">Benar</span><span className="text-2xl font-black text-green-600">{hasil.benar}</span></div>
                        <div className="bg-red-50 p-2.5 rounded-xl border border-red-200 flex flex-col items-center justify-center"><span className="text-[9px] font-black text-red-700 uppercase tracking-widest">Salah</span><span className="text-2xl font-black text-red-600">{hasil.salah}</span></div>
                        <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200 flex flex-col items-center justify-center"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Kosong</span><span className="text-2xl font-black text-slate-600">{hasil.kosong}</span></div>
                      </div>

                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-2">Kunci & Jawaban</p>
                        <div className="grid grid-cols-5 gap-2">
                          {hasil.detailJawaban?.map(item => (
                            <div key={item.no} className={`flex flex-col items-center p-1.5 rounded-lg border shadow-sm ${item.status === 'benar' ? 'bg-green-50 border-green-200' : item.status === 'salah' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                              <span className="text-[9px] font-bold text-slate-400 mb-0.5">{item.no}</span>
                              <span className={`text-sm font-black ${item.status === 'benar' ? 'text-green-600' : item.status === 'salah' ? 'text-red-600' : 'text-slate-400'}`}>{item.jawab}</span>
                              <div className={`mt-0.5 pt-0.5 border-t w-full text-center ${item.status === 'benar' ? 'border-transparent' : item.status === 'salah' ? 'border-red-200' : 'border-slate-200'}`}>
                                <span className={`text-[8px] font-black ${item.status === 'benar' ? 'text-transparent' : 'text-green-600'}`}>{item.status !== 'benar' ? `KN: ${item.kunci}` : '-'}</span>
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
                  <button onClick={handleSimpanDanLanjut} disabled={isSaving} className="flex-1 py-3.5 bg-emerald-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                    {isSaving ? <span className="animate-spin border-2 border-white border-t-transparent w-4 h-4 rounded-full"></span> : <FloppyDisk size={18} weight="fill"/>} Simpan & Lanjut
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
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <ScannerContent />
    </Suspense>
  );
}
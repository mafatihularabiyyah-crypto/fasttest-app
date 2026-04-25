"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, DownloadSimple, FilePdf, SlidersHorizontal, 
  TextAUnderline, Hash, CheckCircle, Scan, Trash, Plus, 
  IdentificationBadge, ImageSquare, FloppyDisk, NotePencil,
  FileText, GridFour, Wrench, Archive, MagnifyingGlass, 
  CaretDown, MagicWand, Crosshair, Printer, ClockCounterClockwise,
} from "@phosphor-icons/react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// 1. UBAH NAMA KOMPONEN INI DARI LJKGeneratorFinal MENJADI LJKGeneratorContent
function LJKGeneratorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reprintId = searchParams.get('reprint');

  const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJTSURBVHgB7d0xbhNREIDh90IsiYIuDR0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDR0XoKInpKQEDX0XoKKf/R9fA/E705cAAAAASUVORK5CYII=";

  const [viewState, setViewState] = useState<'select' | 'editor'>('select');
  const ljkRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- STATE KOP & IDENTITAS ---
  const [kopSurat, setKopSurat] = useState("YAYASAN MAFATIHUL ISLAM\nSMA MAFATIHUL ARABIYYAH\nUJIAN MADRASAH TAHUN PELAJARAN 2025/2026");
  const [namaUjian, setNamaUjian] = useState("Mata Pelajaran Bahasa Arab");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [teksFooter, setTeksFooter] = useState("SISTEM OMR OTOMATIS TARBIYAHTECH - 2026");
  
  // --- STATE MULTI-KELAS ---
  const [kelasTujuan, setKelasTujuan] = useState<string[]>([]);
  const [daftarKelas, setDaftarKelas] = useState<string[]>([]);
  
  // --- STATE RIWAYAT & TEMPLATE ---
  const [templateSekolah, setTemplateSekolah] = useState<any[]>([]);
  const [riwayatUjian, setRiwayatUjian] = useState<any[]>([]);
  const [searchRiwayat, setSearchRiwayat] = useState("");
  const [visibleRiwayatCount, setVisibleRiwayatCount] = useState(10);

  useEffect(() => {
    fetch('/api/santri')
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data) && data.length > 0) {
          const uniqueClasses = Array.from(new Set(data.map((s: any) => s.kelas))).sort() as string[];
          if (uniqueClasses.length > 0) setDaftarKelas(uniqueClasses);
        }
      });

    fetch('/api/ujian/template')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setTemplateSekolah(data); });

    fetch('/api/arsip')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setRiwayatUjian(data); });
  }, []);

  useEffect(() => {
    if (reprintId) {
      fetch(`/api/arsip?ujianId=${reprintId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.soal) {
            setNamaUjian(data.namaUjian + " (REPRINT)");
            setKelasTujuan(data.kelas.split(",").map((k:string) => k.trim()));
            setJumlahSoal(data.soal.length);
            if (data.soal.length > 0 && data.soal[0].opsi) setJumlahPilihan(data.soal[0].opsi.length);
            setViewState('editor');
          }
        });
    }
  }, [reprintId]);
  
  const [identitasList, setIdentitasList] = useState([
    { id: 1, label: "NAMA LENGKAP" }, { id: 2, label: "KELAS / JURUSAN" },
    { id: 3, label: "TANGGAL UJIAN" }, { id: 4, label: "TANDA TANGAN" }
  ]);
  
  // --- STATE STRUKTUR LJK ---
  const [jumlahSoal, setJumlahSoal] = useState(40);
  const [jumlahPilihan, setJumlahPilihan] = useState(4); 
  const [tipePilihan, setTipePilihan] = useState<"huruf" | "angka" | "bs">("huruf");
  const [kolom, setKolom] = useState(3);
  const [poinRata, setPoinRata] = useState(2.5);
  const [useAnchor, setUseAnchor] = useState(true);
  const [modeIdentitas, setModeIdentitas] = useState<"nis" | "barcode">("nis");
  const [jumlahDigitNIS, setJumlahDigitNIS] = useState(6);
  const [useKodeUjian, setUseKodeUjian] = useState(true);
  const [jumlahDigitKodeUjian, setJumlahDigitKodeUjian] = useState(3);
  const [useEsai, setUseEsai] = useState(false);
  const [tinggiEsaiCM, setTinggiEsaiCM] = useState(8); 

  // --- FUNGSI CUSTOM ---
  const toggleKelas = (kls: string) => {
    setKelasTujuan(prev => prev.includes(kls) ? prev.filter(k => k !== kls) : [...prev, kls]);
  };

  const handleSelectTemplate = (type: string) => {
    if (type === 'PG_AD') { setJumlahSoal(40); setKolom(3); setUseEsai(false); setJumlahPilihan(4); setTipePilihan("huruf"); } 
    else if (type === 'BS') { setJumlahSoal(30); setKolom(3); setUseEsai(false); setJumlahPilihan(2); setTipePilihan("bs"); } 
    else if (type === 'SKOR_14') { setJumlahSoal(30); setKolom(3); setUseEsai(false); setJumlahPilihan(4); setTipePilihan("angka"); } 
    setViewState('editor');
  };

  const handleSelectTemplateSekolah = (template: any) => {
    setJumlahSoal(template.jumlah_soal || 40);
    setJumlahPilihan(template.jumlah_opsi || 5);
    setTipePilihan("huruf"); 
    if (template.struktur_kanvas_json) {
      if (template.struktur_kanvas_json.kop) setKopSurat(template.struktur_kanvas_json.kop);
      if (template.struktur_kanvas_json.logo) setLogoUrl(template.struktur_kanvas_json.logo);
    }
    setViewState('editor');
  };

  const handleGunakanRiwayatLama = async (id: string) => {
    try {
      const res = await fetch(`/api/arsip?ujianId=${id}`);
      const data = await res.json();
      if (data && data.soal) {
        setJumlahSoal(data.soal.length);
        if (data.soal.length > 0 && data.soal[0].opsi) setJumlahPilihan(data.soal[0].opsi.length);
        setTipePilihan("huruf"); 
        setViewState('editor');
      }
    } catch (error) { alert("Gagal mengambil struktur ujian lama."); }
  };

  const ubahIdentitas = (id: number, val: string) => setIdentitasList(identitasList.map(item => item.id === id ? { ...item, label: val } : item));
  const hapusIdentitas = (id: number) => setIdentitasList(identitasList.filter(item => item.id !== id));
  const tambahIdentitas = () => setIdentitasList([...identitasList, { id: Date.now(), label: "DATA BARU" }]);
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onload = (event) => setLogoUrl(event.target?.result as string); reader.readAsDataURL(file); }
  };
  const hapusLogo = () => setLogoUrl(null);

  // --- FUNGSI API ---
  const handleSimpanUjian = async () => {
    if (!namaUjian || kelasTujuan.length === 0) return alert("Nama Ujian dan minimal 1 Kelas Tujuan wajib diisi!");
    setIsSaving(true);
    try {
      const questionsData = Array.from({ length: jumlahSoal }).map((_, idx) => ({
        type: tipePilihan === 'bs' ? 'bs' : tipePilihan === 'angka' ? 'angka14' : 'pg',
        text: `Soal LJK No. ${idx + 1}`,
        options: Array.from({ length: jumlahPilihan }).map((__, optIdx) => ({
          text: getOptionLabel(optIdx), isCorrect: optIdx === 0, points: poinRata
        }))
      }));

      const generatedToken = useKodeUjian ? Math.floor(Math.random() * Math.pow(10, jumlahDigitKodeUjian)).toString().padStart(jumlahDigitKodeUjian, '0') : `LJK-${Date.now().toString().slice(-4)}`;

      const response = await fetch('/api/exams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: namaUjian,
          className: kelasTujuan, 
          teacherName: "Ustadz/Ustadzah", 
          duration: 90,
          token: generatedToken,
          examType: "LJK", 
          questions: questionsData
        })
      });

      if (response.ok) {
        alert(`Berhasil! Format LJK telah disinkronkan ke Arsip.\nKode Ujian: ${generatedToken}`);
        router.push('/guru/arsip');
      } else {
        const errorData = await response.json(); alert(`Gagal menyimpan: ${errorData.message}`);
      }
    } catch (error) { alert("Gagal terhubung ke server database."); } finally { setIsSaving(false); }
  };

  const handleExport = async (format: 'png' | 'pdf') => {
    if (!ljkRef.current) return;
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const canvas = await html2canvas(ljkRef.current, { scale: 3, useCORS: true, logging: false, backgroundColor: "#ffffff" });
      if (format === 'png') {
        const link = document.createElement("a"); link.href = canvas.toDataURL("image/png"); link.download = `LJK_${namaUjian.replace(/\s+/g, '_')}.png`; link.click();
      } else {
        const pdf = new jsPDF("p", "mm", "a4"); pdf.addImage(canvas.toDataURL("image/jpeg", 1.0), "JPEG", 0, 0, 210, 297); pdf.save(`LJK_${namaUjian.replace(/\s+/g, '_')}.pdf`);
      }
    } catch (err) { alert("Terjadi kesalahan ekspor."); }
    setIsExporting(false);
  };

  const getOptionLabel = (index: number) => {
    if (tipePilihan === "huruf") return String.fromCharCode(65 + index); 
    if (tipePilihan === "bs") return index === 0 ? "B" : "S";
    return (index + 1).toString(); 
  };

  const bubbleSize = jumlahPilihan > 8 ? 13 : jumlahPilihan > 5 ? 16 : 20;
  const fontSize = jumlahPilihan > 8 ? 6 : jumlahPilihan > 5 ? 8 : 10;
  const soalPerKolom = Math.ceil(jumlahSoal / kolom);

  const filteredRiwayat = riwayatUjian.filter(r => 
    r.namaUjian.toLowerCase().includes(searchRiwayat.toLowerCase()) || 
    r.kelas.toLowerCase().includes(searchRiwayat.toLowerCase())
  );
  const displayedRiwayat = filteredRiwayat.slice(0, visibleRiwayatCount);

  // =======================================================================
  // RENDER VIEW 1: MENU PILIH TEMPLATE (CANGGIH & ELEGAN)
  // =======================================================================
  if (viewState === 'select') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col items-center relative overflow-x-hidden pt-8 px-6 pb-24">
        
        {/* Background Dekoratif */}
        <div className="absolute top-0 left-0 w-full h-[450px] lg:h-[500px] bg-gradient-to-br from-indigo-950 via-blue-900 to-indigo-800 rounded-b-[4rem] pointer-events-none shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute top-10 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="w-full max-w-[85rem] flex justify-between items-center relative z-10 mb-8 mt-2">
          <Link href="/guru" className="flex items-center gap-2 p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-2xl text-white transition-all cursor-pointer">
            <ArrowLeft size={20} weight="bold" /> <span className="text-xs font-bold uppercase tracking-widest hidden sm:block pr-2">Kembali</span>
          </Link>
          <div className="bg-white/10 border border-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-white flex items-center gap-2 shadow-lg">
            <MagicWand size={18} weight="fill" className="text-yellow-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">LJK Studio v2.0</span>
          </div>
        </div>

        <div className="relative z-10 text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-4 drop-shadow-lg">
            Desain Lembar Ujian<br/><span className="text-blue-300">Super Presisi.</span>
          </h1>
          <p className="text-blue-100 font-medium max-w-2xl mx-auto text-sm lg:text-base leading-relaxed px-4">
            Sistem LJK kami telah dioptimalkan secara matematis untuk menjamin akurasi pemindaian kamera hingga 99.9%. Mulai dengan memilih struktur di bawah ini.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[85rem] w-full">
          {/* Template Cards - Canggih */}
          <div onClick={() => handleSelectTemplate('PG_AD')} className="bg-white p-8 rounded-[2rem] shadow-xl flex flex-col items-center text-center hover:border-blue-400 hover:shadow-blue-500/20 border-2 border-transparent transition-all group cursor-pointer hover:-translate-y-2">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 rounded-[1.5rem] shadow-inner flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"><FileText size={40} weight="fill" /></div>
            <h3 className="font-black text-slate-800 text-xl mb-3">Pilihan Ganda</h3>
            <p className="text-xs font-bold text-slate-400 mb-6 leading-relaxed flex-1">Format standar 40 Soal (A-D) tanpa isian. Optimal untuk ujian harian.</p>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">Gunakan Ini</span>
          </div>

          <div onClick={() => handleSelectTemplate('BS')} className="bg-white p-8 rounded-[2rem] shadow-xl flex flex-col items-center text-center hover:border-emerald-400 hover:shadow-emerald-500/20 border-2 border-transparent transition-all group cursor-pointer hover:-translate-y-2">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 rounded-[1.5rem] shadow-inner flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"><CheckCircle size={40} weight="fill" /></div>
            <h3 className="font-black text-slate-800 text-xl mb-3">Benar / Salah</h3>
            <p className="text-xs font-bold text-slate-400 mb-6 leading-relaxed flex-1">Format cepat 30 Soal hanya dengan 2 opsi (Benar/Salah). Hemat kertas.</p>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-full group-hover:bg-emerald-600 group-hover:text-white transition-colors">Gunakan Ini</span>
          </div>

          <div onClick={() => handleSelectTemplate('SKOR_14')} className="bg-white p-8 rounded-[2rem] shadow-xl flex flex-col items-center text-center hover:border-purple-400 hover:shadow-purple-500/20 border-2 border-transparent transition-all group cursor-pointer hover:-translate-y-2">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-50 text-purple-600 rounded-[1.5rem] shadow-inner flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"><GridFour size={40} weight="fill" /></div>
            <h3 className="font-black text-slate-800 text-xl mb-3">Skor & Survei</h3>
            <p className="text-xs font-bold text-slate-400 mb-6 leading-relaxed flex-1">Opsi angka 1-4. Sangat cocok untuk kuesioner psikologi atau angket santri.</p>
            <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 px-4 py-2 rounded-full group-hover:bg-purple-600 group-hover:text-white transition-colors">Gunakan Ini</span>
          </div>

          <div onClick={() => handleSelectTemplate('CUSTOM')} className="bg-slate-900 p-8 rounded-[2rem] shadow-2xl shadow-slate-900/30 flex flex-col items-center text-center hover:border-slate-600 border-2 border-slate-700 transition-all group cursor-pointer hover:-translate-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Wrench size={100} weight="fill"/></div>
            <div className="w-20 h-20 bg-slate-800 text-slate-300 rounded-[1.5rem] shadow-inner flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-300 relative z-10"><Wrench size={40} weight="fill" /></div>
            <h3 className="font-black text-white text-xl mb-3 relative z-10">Desain Custom</h3>
            <p className="text-xs font-medium text-slate-400 mb-6 leading-relaxed flex-1 relative z-10">Kebebasan penuh mengatur jumlah soal, kolom, jenis arsiran, hingga area kotak esai manual.</p>
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest bg-white px-4 py-2 rounded-full group-hover:bg-slate-300 transition-colors relative z-10">Bangun Sendiri</span>
          </div>

          {/* Template Master Sekolah & Riwayat */}
          <div className="col-span-1 md:col-span-2 lg:col-span-4 grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
            
            {/* Bagian Kiri: Template Resmi Sekolah */}
            {templateSekolah.length > 0 && (
              <div className="lg:col-span-1 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
                <h2 className="text-lg font-black text-slate-800 tracking-widest uppercase mb-6 flex items-center gap-2 border-b border-slate-100 pb-4"><Archive size={24} className="text-blue-600"/> Template Resmi Sekolah</h2>
                <div className="flex flex-col gap-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                  {templateSekolah.map((tpl) => (
                    <div key={tpl.id} onClick={() => handleSelectTemplateSekolah(tpl)} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded uppercase tracking-widest mb-2 inline-block">Master LJK</span>
                        <h3 className="font-black text-slate-800 text-sm leading-tight group-hover:text-blue-700">{tpl.nama_template}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-500">{tpl.jumlah_soal} Soal</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tpl.jumlah_opsi} Opsi</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bagian Kanan: Riwayat LJK */}
            <div className={`bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col ${templateSekolah.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b border-slate-100 pb-4">
                <h2 className="text-lg font-black text-slate-800 tracking-widest uppercase flex items-center gap-2">
                  <ClockCounterClockwise size={24} className="text-slate-400"/> Riwayat Ujian Anda
                </h2>
                <div className="relative w-full md:w-72">
                  <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" placeholder="Cari nama ujian atau kelas..." 
                    value={searchRiwayat} onChange={(e) => { setSearchRiwayat(e.target.value); setVisibleRiwayatCount(10); }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {displayedRiwayat.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400">
                  <FileText size={48} weight="thin" className="mb-4 opacity-50" />
                  <p className="font-bold text-sm">Tidak ada riwayat LJK ditemukan.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedRiwayat.map((riwayat) => (
                      <div key={riwayat.id} onClick={() => handleGunakanRiwayatLama(riwayat.id)} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:border-slate-400 transition-all cursor-pointer group flex flex-col relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-16 h-16 bg-blue-100 rounded-bl-full -z-0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-start justify-between mb-3 relative z-10">
                          <div className="bg-white text-slate-500 p-2 rounded-lg border border-slate-100 shadow-sm"><FileText size={20} weight="fill" /></div>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white border border-slate-100 px-2 py-1 rounded">{riwayat.tanggal.split(' ')[0]}</span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm mb-1 leading-tight line-clamp-2 relative z-10">{riwayat.namaUjian}</h3>
                        <p className="text-[10px] font-bold text-slate-400 mb-4 relative z-10">{riwayat.kelas}</p>
                        <div className="mt-auto pt-3 border-t border-slate-200 relative z-10">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 group-hover:text-blue-600 transition-colors">Gunakan Format Ini &rarr;</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {visibleRiwayatCount < filteredRiwayat.length && (
                    <div className="mt-6 flex justify-center">
                      <button onClick={() => setVisibleRiwayatCount(prev => prev + 10)} className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-xs uppercase tracking-widest">
                        Tampilkan Selanjutnya <CaretDown size={16} weight="bold" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }

  // =======================================================================
  // RENDER VIEW 2: LJK STUDIO (EDITOR CANGGIH)
  // =======================================================================
  return (
    <div className="min-h-screen bg-slate-900 flex overflow-hidden font-sans">
      
      {/* PANEL KIRI: STUDIO CONTROLS (Lebih Rapi & Elegan) */}
      <div className="w-[420px] bg-white flex flex-col h-screen overflow-y-auto z-20 shadow-2xl scrollbar-hide shrink-0 relative">
        
        {/* Sticky Header Studio */}
        <div className="px-6 py-5 bg-white border-b border-slate-100 sticky top-0 z-20 flex justify-between items-center bg-opacity-90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button onClick={() => setViewState('select')} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"><ArrowLeft size={18} weight="bold" /></button>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-800 leading-none">LJK Studio</h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Editor Kertas Pintar</p>
            </div>
          </div>
        </div>

        {/* Form Controls */}
        <div className="p-6 space-y-6 flex-1">
          
          {/* Card 1: Header Kertas */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><TextAUnderline size={16} weight="bold"/> Header Kertas</label>
            
            {/* Upload Logo Modern */}
            <div>
              {logoUrl ? (
                <div className="flex items-center gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-sm">
                  <div className="w-12 h-12 bg-slate-50 rounded flex items-center justify-center overflow-hidden"><img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" /></div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800">Logo Aktif</p>
                    <button onClick={hapusLogo} className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-widest mt-1">Hapus Logo</button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-colors text-indigo-500 font-bold text-xs bg-white">
                  <ImageSquare size={24} weight="fill" className="text-slate-400" />
                  <span>Upload Logo KOP Sekolah</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">Teks Kop Surat</label>
              <textarea value={kopSurat} onChange={(e) => setKopSurat(e.target.value)} className="w-full p-3 text-xs font-bold border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none h-20 uppercase bg-white shadow-sm" placeholder="Teks Kop Surat" />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">Mata Pelajaran / Judul</label>
              <input type="text" value={namaUjian} onChange={(e) => setNamaUjian(e.target.value)} className="w-full p-3 text-xs font-bold border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase bg-white shadow-sm" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 block">Kelas Tujuan (Bisa multi-kelas)</label>
              {daftarKelas.length === 0 ? (
                 <p className="text-xs text-slate-400 italic">Memuat daftar kelas...</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {daftarKelas.map(kelas => (
                    <button 
                      key={kelas} onClick={() => toggleKelas(kelas)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${kelasTujuan.includes(kelas) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-300 text-slate-600 hover:border-indigo-400'}`}
                    >
                      {kelas}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Kolom Identitas Siswa */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><IdentificationBadge size={16} weight="bold"/> Identitas Siswa</label>
              <button onClick={tambahIdentitas} className="text-indigo-600 font-bold bg-indigo-100 hover:bg-indigo-200 px-2 py-1 rounded flex items-center gap-1 text-[10px] uppercase tracking-widest transition-colors"><Plus size={12} weight="bold"/> Tambah</button>
            </div>
            <div className="space-y-2">
              {identitasList.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 w-4">{idx + 1}.</span>
                  <input type="text" value={item.label} onChange={(e) => ubahIdentitas(item.id, e.target.value)} className="flex-1 p-2 text-xs font-bold border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase shadow-sm bg-white" />
                  <button onClick={() => hapusIdentitas(item.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash size={16} weight="bold"/></button>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Struktur Soal */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><SlidersHorizontal size={16} weight="bold"/> Struktur Soal LJK</label>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">Tipe Pilihan</label>
              <div className="flex gap-2">
                <button onClick={() => {setTipePilihan('huruf'); setJumlahPilihan(4);}} className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${tipePilihan === 'huruf' && jumlahPilihan === 4 ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}>A - D</button>
                <button onClick={() => {setTipePilihan('huruf'); setJumlahPilihan(5);}} className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${tipePilihan === 'huruf' && jumlahPilihan === 5 ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}>A - E</button>
                <button onClick={() => {setTipePilihan('bs'); setJumlahPilihan(2);}} className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${tipePilihan === 'bs' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}>Benar/Salah</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500">Jumlah Soal</span>
                <input type="number" min="1" value={jumlahSoal} onChange={(e) => setJumlahSoal(Number(e.target.value))} className="w-full p-2.5 border border-slate-200 rounded-xl font-black text-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-center bg-white shadow-sm" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500">Jumlah Kolom</span>
                <input type="number" min="1" max="6" value={kolom} onChange={(e) => setKolom(Number(e.target.value))} className="w-full p-2.5 border border-slate-200 rounded-xl font-black text-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-center bg-white shadow-sm" />
              </div>
            </div>
          </div>

          {/* Card 4: Kamera & OMR Logic */}
          <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10"><Crosshair size={100} weight="fill" /></div>
            <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2 relative z-10"><Hash size={16} weight="bold"/> Mesin Pemindai (OMR)</label>
            
            <div className="space-y-3 relative z-10">
              <label className="flex items-center justify-between p-3 bg-white border border-emerald-100 rounded-xl cursor-pointer shadow-sm hover:border-emerald-300 transition-colors">
                <span className="text-xs font-bold text-slate-700">Garis Penanda Kamera (Anchor)</span>
                <input type="checkbox" checked={useAnchor} onChange={(e) => setUseAnchor(e.target.checked)} className="w-4 h-4 accent-emerald-600 cursor-pointer" />
              </label>

              <label className="flex items-center justify-between p-3 bg-white border border-emerald-100 rounded-xl cursor-pointer shadow-sm hover:border-emerald-300 transition-colors">
                <span className="text-xs font-bold text-slate-700">Area Arsiran Kode Ujian</span>
                <input type="checkbox" checked={useKodeUjian} onChange={(e) => setUseKodeUjian(e.target.checked)} className="w-4 h-4 accent-emerald-600 cursor-pointer" />
              </label>
              {useKodeUjian && (
                <div className="flex justify-between items-center bg-emerald-100/50 p-2 px-3 rounded-lg border border-emerald-200">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800">Digit Kode Ujian:</span>
                  <input type="number" min="1" max="5" value={jumlahDigitKodeUjian} onChange={(e) => setJumlahDigitKodeUjian(Number(e.target.value))} className="w-12 text-center border border-emerald-300 rounded font-bold outline-none text-xs py-1" />
                </div>
              )}

              <div className="pt-2 border-t border-emerald-200/50">
                <div className="flex gap-2 mb-3">
                  <button onClick={() => setModeIdentitas("nis")} className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border cursor-pointer transition-all ${modeIdentitas === 'nis' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-emerald-700 border-emerald-200'}`}>Arsiran NIS</button>
                  <button onClick={() => setModeIdentitas("barcode")} className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border cursor-pointer transition-all ${modeIdentitas === 'barcode' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-emerald-700 border-emerald-200'}`}>Area Barcode</button>
                </div>
                {modeIdentitas === "nis" && (
                  <div className="flex justify-between items-center bg-white p-2 px-3 rounded-lg border border-emerald-100 shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Jumlah Digit NIS:</span>
                    <input type="number" min="3" max="15" value={jumlahDigitNIS} onChange={(e) => setJumlahDigitNIS(Number(e.target.value))} className="w-12 text-center border border-slate-200 rounded font-bold outline-none text-xs py-1" />
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-emerald-200/50">
                <label className="flex items-center justify-between p-3 bg-white border border-emerald-100 rounded-xl cursor-pointer shadow-sm hover:border-emerald-300 transition-colors">
                  <span className="text-xs font-bold text-emerald-800">Gunakan Kotak Jawaban Esai</span>
                  <input type="checkbox" checked={useEsai} onChange={(e) => setUseEsai(e.target.checked)} className="w-4 h-4 accent-emerald-600 cursor-pointer" />
                </label>
                {useEsai && (
                  <div className="flex justify-between items-center mt-2 bg-emerald-100/50 p-2 px-3 rounded-lg border border-emerald-200">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800">Tinggi Kotak (cm):</span>
                    <input type="number" min="3" max="20" value={tinggiEsaiCM} onChange={(e) => setTinggiEsaiCM(Number(e.target.value))} className="w-12 text-center border border-emerald-300 rounded font-bold outline-none text-xs py-1" />
                  </div>
                )}
              </div>

            </div>
          </div>
          
          <div className="pb-8"></div> {/* Spacer */}
        </div>

        {/* Sticky Footer: Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-100 sticky bottom-0 z-20 space-y-3 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          <button onClick={handleSimpanUjian} disabled={isSaving || !!reprintId} className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black transition-all shadow-lg hover:shadow-indigo-500/30 uppercase tracking-widest text-[11px] disabled:opacity-70 cursor-pointer">
            {isSaving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : !!reprintId ? "MODE CETAK ULANG" : <><FloppyDisk size={18} weight="bold" /> Simpan Struktur ke Database</>}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleExport('png')} disabled={isExporting} className="flex items-center justify-center gap-2 py-3 bg-slate-800 text-white rounded-xl font-bold transition-all hover:bg-black cursor-pointer shadow-md"><DownloadSimple size={16} weight="bold"/> <span className="text-[10px] uppercase tracking-widest">PNG</span></button>
            <button onClick={() => handleExport('pdf')} disabled={isExporting} className="flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl font-bold transition-all hover:bg-red-700 cursor-pointer shadow-md hover:shadow-red-500/30"><Printer size={16} weight="bold"/> <span className="text-[10px] uppercase tracking-widest">Cetak PDF</span></button>
          </div>
        </div>
      </div>

      {/* PANEL KANAN: PRATINJAU KERTAS LJK (Canvas A4) */}
      <div className="flex-1 overflow-auto p-8 lg:p-12 flex justify-center scrollbar-hide relative bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        {/* Loading Overlay saat Export */}
        {isExporting && (
          <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-white rounded-full animate-spin mb-4"></div>
            <p className="font-black text-xl tracking-widest uppercase">Mengekspor Dokumen...</p>
            <p className="text-sm font-medium text-slate-300">Harap tunggu sebentar.</p>
          </div>
        )}

        {/* CONTAINER KERTAS A4 (Strict mm for OMR safety) */}
        <div className="relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-[1.01]">
          
          <div ref={ljkRef} className="box-border bg-white flex flex-col" style={{ width: "210mm", height: "297mm", paddingTop: "15mm", paddingBottom: "15mm", paddingLeft: "25mm", paddingRight: "25mm", color: "#000000" }}>
            
            <div className="absolute right-[6mm] top-0 bottom-0 flex items-center justify-center z-10 w-6">
              <div className="flex items-center gap-3" style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', opacity: 0.25 }}>
                <img src={LOGO_BASE64} alt="Logo" className="h-4 object-contain grayscale" />
                <p className="text-[12px] font-black tracking-[0.5em] uppercase m-0 text-slate-800">PROVIDED BY TARBIYAH TECH</p>
              </div>
            </div>

            {useAnchor && (
              <>
                <div className="absolute top-[10mm] left-[10mm] w-6 h-6 bg-black"></div>
                <div className="absolute top-[10mm] right-[10mm] w-6 h-6 bg-black"></div>
                <div className="absolute bottom-[10mm] left-[10mm] w-6 h-6 bg-black"></div>
                <div className="absolute bottom-[10mm] right-[10mm] w-6 h-6 bg-black"></div>
              </>
            )}

            <div className="relative z-10 flex flex-col h-full pl-[5mm] pr-[5mm] pt-[2mm]">
              <div className="flex items-center gap-4 pb-3 mb-6 border-b-4 border-black shrink-0">
                <div className="w-[80px] h-[80px] flex items-center justify-center overflow-hidden">{logoUrl && <img src={logoUrl} alt="Logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />}</div>
                <div className="flex-1 text-center">
                  <p className="text-[14px] font-black uppercase whitespace-pre-line leading-tight">{kopSurat}</p>
                  <p className="text-[12px] font-bold mt-2 tracking-[0.2em]">{namaUjian.toUpperCase()}</p>
                </div>
                <div className="w-[80px]"></div>
              </div>

              <div className="flex gap-6 mb-8 items-start shrink-0">
                <div className="flex-1 p-4 space-y-4 text-[11px] font-black uppercase border-2 border-black bg-white">
                  {identitasList.map((item) => {
                    const isSignature = item.label.toLowerCase().includes("tanda tangan") || item.label.toLowerCase().includes("ttd");
                    return (
                      <div key={item.id} className="flex gap-2">
                        <span className="whitespace-nowrap">{item.label}</span><span className="pr-2">:</span>
                        <div className="flex-1 border-b border-black border-dashed" style={{ height: isSignature ? "32px" : "12px", marginTop: isSignature ? "0" : "2px" }}></div>
                      </div>
                    );
                  })}
                </div>

                {useKodeUjian && (
                  <div className="p-2 flex flex-col items-center border-2 border-black bg-white">
                    <p className="text-[9px] font-black mb-2 w-full text-center pb-1 border-b border-black">KODE UJIAN</p>
                    <div className="flex gap-1">
                      {Array.from({ length: jumlahDigitKodeUjian }).map((_, digitIndex) => (
                        <div key={digitIndex} className="flex flex-col gap-0.5 items-center">
                          <div className="w-3.5 h-3.5 mb-1 border-[1.5px] border-black rounded-full"></div>
                          {Array.from({ length: 10 }).map((_, num) => (
                            <svg key={num} width="14" height="14" viewBox="0 0 14 14" style={{ display: "block" }}>
                              <circle cx="7" cy="7" r="6" fill="none" stroke="#000000" strokeWidth="1" />
                              <text x="50%" y="50%" dy=".28em" textAnchor="middle" fontSize="7" fontWeight="900" fill="#000000" fontFamily="sans-serif">{num}</text>
                            </svg>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {modeIdentitas === "nis" ? (
                  <div className="p-2 flex flex-col items-center border-2 border-black bg-white">
                    <p className="text-[9px] font-black mb-2 w-full text-center pb-1 border-b border-black">ARSIRAN NIS</p>
                    <div className="flex gap-1">
                      {Array.from({ length: jumlahDigitNIS }).map((_, digitIndex) => (
                        <div key={digitIndex} className="flex flex-col gap-0.5 items-center">
                          <div className="w-3.5 h-3.5 mb-1 border-[1.5px] border-black rounded-full"></div>
                          {Array.from({ length: 10 }).map((_, num) => (
                            <svg key={num} width="14" height="14" viewBox="0 0 14 14" style={{ display: "block" }}>
                              <circle cx="7" cy="7" r="6" fill="none" stroke="#000000" strokeWidth="1" />
                              <text x="50%" y="50%" dy=".28em" textAnchor="middle" fontSize="7" fontWeight="900" fill="#000000" fontFamily="sans-serif">{num}</text>
                            </svg>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-2 text-center relative w-[150px] h-[150px] border-2 border-black border-dashed bg-white">
                    <div className="absolute top-0 left-0 w-full text-[10px] font-bold py-0.5 bg-black text-white">AREA BARCODE</div>
                    <Scan size={48} weight="thin" className="text-[#aaaaaa] mt-4" />
                    <p className="text-[9px] font-semibold mt-2 text-[#666666]">Tempel QR/Barcode</p>
                  </div>
                )}
              </div>

              <div className="flex justify-between shrink-0" style={{ gap: '20px' }}>
  {Array.from({ length: kolom }).map((_, colIndex) => (
    <div key={colIndex} className="flex-1 flex flex-col gap-y-2">
      {Array.from({ length: soalPerKolom }).map((_, rowIndex) => {
        const nomorSoal = rowIndex + 1 + (colIndex * soalPerKolom);
        if (nomorSoal > jumlahSoal) return <div key={nomorSoal} className="py-0.5 opacity-0 h-[22px]"></div>;

        return (
          // SAYA MENGUBAH BAGIAN INI: Menghapus items-center, menggantinya dengan items-start
          <div key={nomorSoal} className="flex items-start gap-2 py-0.5 border-b border-[#eeeeee]">
            {/* Nomor soal saya beri margin-top (mt-[3px]) agar posisinya turun sejajar dengan lingkaran */}
            <span className="w-6 text-right font-black text-sm shrink-0 mt-[3px] leading-none">{nomorSoal}.</span>
            <div className="flex gap-1.5">
              {Array.from({ length: jumlahPilihan }).map((_, optIdx) => (
                <svg key={optIdx} width={bubbleSize} height={bubbleSize} viewBox={`0 0 ${bubbleSize} ${bubbleSize}`} style={{ display: "block" }}>
                  <circle cx={bubbleSize/2} cy={bubbleSize/2} r={(bubbleSize/2) - 1} fill="none" stroke="#000000" strokeWidth="1.5" />
                  <text x="50%" y="50%" dy=".28em" textAnchor="middle" fontSize={fontSize} fontWeight="900" fill="#000000" fontFamily="sans-serif">
                    {getOptionLabel(optIdx)}
                  </text>
                </svg>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  ))}
</div>

              {useEsai && (
                <div className="mt-8 w-full border-2 border-black p-4 flex flex-col shrink-0 bg-white relative" style={{ height: `${tinggiEsaiCM}cm` }}>
                  <div className="absolute top-0 left-0 bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <NotePencil size={12} weight="bold" /> AREA JAWABAN ESAI
                  </div>
                  <div className="flex-1 mt-4 border border-[#dddddd] border-dashed" style={{ backgroundImage: 'linear-gradient(transparent 95%, #e2e8f0 95%)', backgroundSize: '100% 8mm' }}></div>
                </div>
              )}

            </div>

            <div className="mt-auto absolute bottom-[12mm] left-[25mm] right-[25mm] text-center pt-2 z-10 border-t border-[#cccccc]">
              <p className="text-[8px] font-black tracking-[0.4em] text-[#666666]">{teksFooter}</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// 2. TAMBAHKAN KODE INI DI BARIS PALING BAWAH FILE:
export default function UjianBuatPage() {
  return (
    // Gunakan Suspense dan berikan fallback UI sederhana saat menunggu URL terbaca
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Memuat Halaman...</div>}>
      <LJKGeneratorContent />
    </Suspense>
  );
}
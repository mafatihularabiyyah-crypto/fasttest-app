"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, DownloadSimple, FilePdf, SlidersHorizontal, 
  TextAUnderline, Hash, CheckCircle, Scan, Trash, Plus, 
  IdentificationBadge, ImageSquare, FloppyDisk, NotePencil,
  FileText, GridFour, Wrench, Archive, MagnifyingGlass, CaretDown, FolderOpen
} from "@phosphor-icons/react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function LJKGeneratorFinal() {
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
  const [kelasTujuan, setKelasTujuan] = useState<string[]>([]); // Sekarang Array
  const [daftarKelas, setDaftarKelas] = useState<string[]>([]);
  
  // --- STATE RIWAYAT & TEMPLATE ---
  const [templateSekolah, setTemplateSekolah] = useState<any[]>([]);
  const [riwayatUjian, setRiwayatUjian] = useState<any[]>([]);
  const [searchRiwayat, setSearchRiwayat] = useState("");
  const [visibleRiwayatCount, setVisibleRiwayatCount] = useState(10);
  
  // DUMMY FOLDER ARSIP TAHUNAN (Bisa diganti dengan data dari API nanti)
  const arsipTahunan = ["Tahun Ajaran 2023/2024", "Tahun Ajaran 2024/2025"];

  useEffect(() => {
    // Load Kelas
    fetch('/api/santri')
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data) && data.length > 0) {
          const uniqueClasses = Array.from(new Set(data.map((s: any) => s.kelas))).sort() as string[];
          if (uniqueClasses.length > 0) setDaftarKelas(uniqueClasses);
        }
      });

    // Load Template Sekolah
    fetch('/api/ujian/template')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setTemplateSekolah(data); });

    // Load SELURUH Riwayat Ujian
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
            // Handle jika kelasnya banyak (string pisah koma dari DB)
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
          className: kelasTujuan, // Mengirim ARRAY kelas
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

  // Filter Data Riwayat
  const filteredRiwayat = riwayatUjian.filter(r => 
    r.namaUjian.toLowerCase().includes(searchRiwayat.toLowerCase()) || 
    r.kelas.toLowerCase().includes(searchRiwayat.toLowerCase())
  );
  const displayedRiwayat = filteredRiwayat.slice(0, visibleRiwayatCount);

  // =======================================================================
  // RENDER VIEW 1: MENU PILIH TEMPLATE
  // =======================================================================
  if (viewState === 'select') {
    return (
      <div className="min-h-screen bg-[#f8fafc] font-sans flex flex-col items-center relative overflow-x-hidden pt-24 px-6 pb-24">
        <div className="absolute top-0 left-0 w-full h-[45vh] bg-[#1d4ed8] rounded-b-[2.5rem] pointer-events-none"></div>
        <Link href="/guru" className="absolute top-8 left-8 p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-all cursor-pointer">
          <ArrowLeft size={24} weight="bold" />
        </Link>

        <div className="relative z-10 text-center mb-12 mt-8">
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">Pilih Template LJK</h1>
          <p className="text-blue-100 font-medium max-w-lg mx-auto text-sm lg:text-base">Gunakan template standar, format sekolah, atau duplikasi LJK yang pernah Anda buat.</p>
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full">
          {/* Template Dasar */}
          <div onClick={() => handleSelectTemplate('PG_AD')} className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center text-center hover:border-blue-400 border-2 border-transparent transition-all group cursor-pointer">
            <div className="w-20 h-20 bg-blue-100 text-blue-500 rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform"><FileText size={40} weight="fill" /></div>
            <h3 className="font-black text-slate-800 text-xl mb-2">Pilihan Ganda</h3>
            <p className="text-xs font-bold text-slate-400 mb-8 leading-relaxed">40 Pilihan Ganda (A-D)<br/>Tanpa Esai</p>
          </div>
          <div onClick={() => handleSelectTemplate('BS')} className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center text-center hover:border-emerald-400 border-2 border-transparent transition-all group cursor-pointer">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform"><CheckCircle size={40} weight="fill" /></div>
            <h3 className="font-black text-slate-800 text-xl mb-2">Benar / Salah</h3>
            <p className="text-xs font-bold text-slate-400 mb-8 leading-relaxed">30 Soal (B/S)<br/>Tanpa Esai</p>
          </div>
          <div onClick={() => handleSelectTemplate('SKOR_14')} className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center text-center hover:border-purple-400 border-2 border-transparent transition-all group cursor-pointer">
            <div className="w-20 h-20 bg-purple-100 text-purple-500 rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform"><GridFour size={40} weight="fill" /></div>
            <h3 className="font-black text-slate-800 text-xl mb-2">Skor & Survei</h3>
            <p className="text-xs font-bold text-slate-400 mb-8 leading-relaxed">30 Soal Angka (1-4)<br/>Tanpa Esai</p>
          </div>
          <div onClick={() => handleSelectTemplate('CUSTOM')} className="bg-[#1e293b] p-8 rounded-3xl shadow-xl flex flex-col items-center text-center hover:border-slate-400 border-2 border-[#334155] transition-all group cursor-pointer">
            <div className="w-20 h-20 bg-[#334155] text-slate-300 rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform"><Wrench size={40} weight="fill" /></div>
            <h3 className="font-black text-white text-xl mb-2">Desain Custom</h3>
            <p className="text-xs font-medium text-slate-400 mb-8 leading-relaxed">Atur sendiri jumlah soal, opsi, kolom, dan esai.</p>
          </div>

          {/* Template Master Sekolah */}
          {templateSekolah.length > 0 && (
            <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-8 pt-8 border-t border-blue-400/30">
              <h2 className="text-xl font-black text-slate-800 tracking-widest uppercase mb-6 flex items-center gap-2"><Archive size={24} className="text-blue-600"/> Template Resmi Sekolah</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templateSekolah.map((tpl) => (
                  <div key={tpl.id} onClick={() => handleSelectTemplateSekolah(tpl)} className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-3xl shadow-xl border-2 border-indigo-100 hover:border-indigo-400 hover:-translate-y-1 transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-indigo-600 text-white p-3 rounded-xl shadow-md"><FilePdf size={24} weight="fill" /></div>
                      <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">MASTER LJK</span>
                    </div>
                    <h3 className="font-black text-slate-800 text-lg mb-1 leading-tight">{tpl.nama_template}</h3>
                    <div className="flex gap-2 mt-4">
                      <span className="bg-white border border-indigo-100 text-indigo-600 text-xs font-bold px-3 py-1.5 rounded-lg flex-1 text-center">{tpl.jumlah_soal} Soal</span>
                      <span className="bg-white border border-indigo-100 text-indigo-600 text-xs font-bold px-3 py-1.5 rounded-lg flex-1 text-center">{tpl.jumlah_opsi} Opsi</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Riwayat LJK Sebelumnya + Pencarian */}
          <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-8 pt-8 border-t border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <h2 className="text-xl font-black text-slate-800 tracking-widest uppercase flex items-center gap-2">
                <FileText size={24} className="text-slate-400"/> Riwayat Ujian LJK Anda
              </h2>
              <div className="relative w-full md:w-72">
                <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" placeholder="Cari nama ujian atau kelas..." 
                  value={searchRiwayat} onChange={(e) => { setSearchRiwayat(e.target.value); setVisibleRiwayatCount(10); }}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>
            </div>

            {displayedRiwayat.length === 0 ? (
              <p className="text-center text-slate-400 font-bold py-8">Tidak ada riwayat LJK yang ditemukan.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayedRiwayat.map((riwayat) => (
                  <div key={riwayat.id} onClick={() => handleGunakanRiwayatLama(riwayat.id)} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div className="bg-slate-100 text-slate-500 p-2 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors"><FileText size={20} weight="fill" /></div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">{riwayat.tanggal.split(' ')[0]}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm mb-1 leading-tight line-clamp-2">{riwayat.namaUjian}</h3>
                    <p className="text-[10px] font-bold text-slate-400 mb-4">{riwayat.kelas}</p>
                    <div className="mt-auto pt-3 border-t border-slate-100">
                      <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">Gunakan Format Ini &rarr;</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Tombol Selanjutnya (Pagination) */}
            {visibleRiwayatCount < filteredRiwayat.length && (
              <div className="mt-6 flex justify-center">
                <button 
                  onClick={() => setVisibleRiwayatCount(prev => prev + 10)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm text-xs uppercase tracking-widest"
                >
                  Tampilkan Selanjutnya <CaretDown size={16} weight="bold" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // =======================================================================
  // RENDER VIEW 2: EDITOR LJK
  // =======================================================================
  return (
    <div className="min-h-screen bg-[#f1f5f9] flex overflow-hidden font-sans">
      <div className="w-[420px] bg-white border-r border-[#e2e8f0] flex flex-col h-screen overflow-y-auto z-20 shadow-xl scrollbar-hide shrink-0">
        <div className="p-6 bg-[#1d4ed8] text-white sticky top-0 z-10 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-3">
              <button onClick={() => setViewState('select')} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all"><ArrowLeft size={18} weight="bold" /></button>
              <h1 className="text-lg font-black tracking-tight uppercase">LJK Editor</h1>
            </div>
            <button onClick={() => setViewState('select')} className="text-[10px] font-bold bg-white/10 hover:bg-white/20 px-2 py-1 rounded">Ganti Template</button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          <div className="space-y-3 p-4 bg-[#f8fafc] rounded-2xl border border-[#e2e8f0]">
            <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest flex items-center gap-2"><TextAUnderline size={14} /> KOP Surat & Meta Ujian</label>
            <div>
              {logoUrl ? (
                <div className="flex items-center gap-3 bg-white p-2 border border-[#cbd5e1] rounded-xl">
                  <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded" />
                  <button onClick={hapusLogo} className="text-xs font-bold text-red-500 hover:text-red-700 flex-1 text-right">Hapus Logo</button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-[#cbd5e1] rounded-xl cursor-pointer hover:bg-slate-50 text-blue-600 font-bold text-xs"><ImageSquare size={18} /> Upload Logo KOP<input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} /></label>
              )}
            </div>
            <textarea value={kopSurat} onChange={(e) => setKopSurat(e.target.value)} className="w-full p-3 text-xs font-bold border border-[#cbd5e1] rounded-xl outline-none resize-none h-20 uppercase" placeholder="Teks Kop Surat" />
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">Nama Ujian / Mapel</label>
              <input type="text" value={namaUjian} onChange={(e) => setNamaUjian(e.target.value)} className="w-full p-3 text-xs font-bold border border-[#cbd5e1] rounded-xl outline-none uppercase" />
            </div>

            {/* KOMPONEN MULTI-KELAS (PILLS) */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 block">Pilih Kelas (Bisa Lebih Dari Satu)</label>
              {daftarKelas.length === 0 ? (
                 <p className="text-xs text-slate-400 italic">Memuat daftar kelas...</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {daftarKelas.map(kelas => (
                    <button 
                      key={kelas} 
                      onClick={() => toggleKelas(kelas)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${kelasTujuan.includes(kelas) ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-300 text-slate-600 hover:border-blue-400'}`}
                    >
                      {kelas}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">Teks Footer</label>
              <input type="text" value={teksFooter} onChange={(e) => setTeksFooter(e.target.value)} className="w-full p-3 text-xs font-bold border border-[#cbd5e1] rounded-xl outline-none uppercase" />
            </div>
          </div>

          <div className="space-y-3 p-4 bg-[#f8fafc] rounded-2xl border border-[#e2e8f0]">
            <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2"><IdentificationBadge size={14} /> Kolom Identitas</div>
              <button onClick={tambahIdentitas} className="text-blue-600 font-bold bg-blue-100 px-2 py-1 rounded flex items-center gap-1"><Plus size={12}/> Tambah</button>
            </label>
            <div className="space-y-2">
              {identitasList.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 w-4">{idx + 1}.</span>
                  <input type="text" value={item.label} onChange={(e) => ubahIdentitas(item.id, e.target.value)} className="flex-1 p-2 text-xs font-bold border border-[#cbd5e1] rounded outline-none uppercase" />
                  <button onClick={() => hapusIdentitas(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash size={16} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest flex items-center gap-2"><SlidersHorizontal size={14} /> Struktur & Penilaian</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => {setTipePilihan('huruf'); setJumlahPilihan(4);}} className={`px-3 py-2 text-[11px] font-bold rounded-lg border ${tipePilihan === 'huruf' && jumlahPilihan === 4 ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white text-[#64748b]'}`}>A-D</button>
              <button onClick={() => {setTipePilihan('huruf'); setJumlahPilihan(5);}} className={`px-3 py-2 text-[11px] font-bold rounded-lg border ${tipePilihan === 'huruf' && jumlahPilihan === 5 ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white text-[#64748b]'}`}>A-E</button>
              <button onClick={() => {setTipePilihan('bs'); setJumlahPilihan(2);}} className={`px-3 py-2 text-[11px] font-bold rounded-lg border ${tipePilihan === 'bs' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white text-[#64748b]'}`}>B/S</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="space-y-1"><span className="text-[10px] font-bold text-[#64748b]">Jumlah Soal PG</span><input type="number" min="1" value={jumlahSoal} onChange={(e) => setJumlahSoal(Number(e.target.value))} className="w-full p-2 border border-[#cbd5e1] rounded-lg font-bold text-sm outline-none" /></div>
              <div className="space-y-1"><span className="text-[10px] font-bold text-[#64748b]">Kolom Kertas</span><input type="number" min="1" max="6" value={kolom} onChange={(e) => setKolom(Number(e.target.value))} className="w-full p-2 border border-[#cbd5e1] rounded-lg font-black text-blue-600 outline-none" /></div>
            </div>
          </div>

          <div className="space-y-3 p-4 border border-[#e2e8f0] rounded-2xl bg-white">
            <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest flex items-center gap-2"><Hash size={14} /> Fitur Scanner & Area OMR</label>
            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={useAnchor} onChange={(e) => setUseAnchor(e.target.checked)} className="w-4 h-4 cursor-pointer" /><span className="text-xs font-bold cursor-pointer">Corner Anchor & Timing Marks</span></label>
            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={useKodeUjian} onChange={(e) => setUseKodeUjian(e.target.checked)} className="w-4 h-4 cursor-pointer" /><span className="text-xs font-bold cursor-pointer">Arsiran KODE UJIAN</span></label>
            
            <div className="pt-2 border-t border-[#e2e8f0]">
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={useEsai} onChange={(e) => setUseEsai(e.target.checked)} className="w-4 h-4 accent-emerald-600 cursor-pointer" /><span className="text-xs font-bold text-emerald-700 cursor-pointer">Gunakan Kotak Jawaban Esai</span></label>
            </div>
            
            {useEsai && (
              <div className="flex justify-between items-center bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                <span className="text-xs font-bold text-emerald-700">Tinggi Kotak Esai (cm):</span>
                <input type="number" min="3" max="20" value={tinggiEsaiCM} onChange={(e) => setTinggiEsaiCM(Number(e.target.value))} className="w-16 text-center border border-emerald-200 rounded font-bold outline-none text-emerald-700" />
              </div>
            )}

            <div className="pt-2 border-t border-[#e2e8f0]">
              <div className="flex gap-2">
                <button onClick={() => setModeIdentitas("nis")} className={`flex-1 py-1.5 text-xs font-bold rounded-lg border cursor-pointer ${modeIdentitas === 'nis' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-[#cbd5e1]'}`}>Arsiran NIS</button>
                <button onClick={() => setModeIdentitas("barcode")} className={`flex-1 py-1.5 text-xs font-bold rounded-lg border cursor-pointer ${modeIdentitas === 'barcode' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-[#cbd5e1]'}`}>Area Barcode</button>
              </div>
            </div>
            {modeIdentitas === "nis" && (
              <div className="flex justify-between items-center bg-[#f8fafc] p-2 rounded-lg border border-[#e2e8f0]">
                <span className="text-xs font-bold">Jumlah Digit NIS:</span>
                <input type="number" min="3" max="15" value={jumlahDigitNIS} onChange={(e) => setJumlahDigitNIS(Number(e.target.value))} className="w-16 text-center border border-[#cbd5e1] rounded font-bold outline-none" />
              </div>
            )}
            {useKodeUjian && (
              <div className="flex justify-between items-center bg-[#f8fafc] p-2 rounded-lg border border-[#e2e8f0]">
                <span className="text-xs font-bold">Digit KODE UJIAN:</span>
                <input type="number" min="1" max="5" value={jumlahDigitKodeUjian} onChange={(e) => setJumlahDigitKodeUjian(Number(e.target.value))} className="w-16 text-center border border-[#cbd5e1] rounded font-bold outline-none" />
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-[#f1f5f9] bg-white sticky bottom-0 z-20 space-y-2 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
          <button onClick={handleSimpanUjian} disabled={isSaving || !!reprintId} className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black transition-all shadow-lg uppercase tracking-widest text-xs disabled:opacity-70 cursor-pointer">
            {isSaving ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : !!reprintId ? "MODE CETAK ULANG" : <><FloppyDisk size={20} weight="fill" /> Simpan Ke Arsip</>}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleExport('png')} disabled={isExporting} className="flex items-center justify-center gap-2 py-2.5 bg-[#1e293b] text-white rounded-xl font-bold transition-all hover:bg-black cursor-pointer"><DownloadSimple size={16} /> <span className="text-[10px]">EXPORT PNG</span></button>
            <button onClick={() => handleExport('pdf')} disabled={isExporting} className="flex items-center justify-center gap-2 py-2.5 bg-[#dc2626] text-white rounded-xl font-bold transition-all hover:bg-red-700 cursor-pointer"><FilePdf size={16} /> <span className="text-[10px]">CETAK PDF</span></button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-[#cbd5e1] overflow-auto p-8 lg:p-12 flex justify-center scrollbar-hide">
        {isExporting && <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur flex items-center justify-center font-black text-blue-600 animate-pulse text-xl">MEMPROSES DOKUMEN...</div>}

        <div ref={ljkRef} className="shadow-2xl relative box-border bg-white flex flex-col" style={{ width: "210mm", height: "297mm", paddingTop: "15mm", paddingBottom: "15mm", paddingLeft: "25mm", paddingRight: "25mm", color: "#000000" }}>
          
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
                      <div key={nomorSoal} className="flex items-center gap-2 py-0.5 border-b border-[#eeeeee]">
                        <span className="w-6 text-right font-black text-sm">{nomorSoal}.</span>
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
  );
}
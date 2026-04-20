"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, DownloadSimple, FilePdf, SlidersHorizontal, 
  TextAUnderline, Hash, CheckCircle, Scan, Trash, Plus, 
  IdentificationBadge, ImageSquare, FloppyDisk, NotePencil,
  FileText, GridFour, Wrench
} from "@phosphor-icons/react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function LJKGeneratorAdmin() {
  const router = useRouter();
  
  const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJTSURBVHgB7d0xbhNREIDh90IsiYIuDR0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDR0XoKInpKQEDX0XoKKf/R9fA/E705cAAAAASUVORK5CYII=";

  const [viewState, setViewState] = useState<'select' | 'editor'>('select');
  const ljkRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- STATE KOP & IDENTITAS ---
  const [kopSurat, setKopSurat] = useState("YAYASAN MAFATIHUL ISLAM\nSMA MAFATIHUL ARABIYYAH\nUJIAN MADRASAH TAHUN PELAJARAN 2025/2026");
  const [namaUjian, setNamaUjian] = useState("MASTER TEMPLATE SEKOLAH"); // Placeholder Default
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [teksFooter, setTeksFooter] = useState("SISTEM OMR OTOMATIS TARBIYAHTECH - 2026");
  
  const [identitasList, setIdentitasList] = useState([
    { id: 1, label: "NAMA LENGKAP" }, { id: 2, label: "KELAS / JURUSAN" },
    { id: 3, label: "TANGGAL UJIAN" }, { id: 4, label: "TANDA TANGAN" }
  ]);
  
  // --- STATE STRUKTUR LJK ---
  const [jumlahSoal, setJumlahSoal] = useState(40);
  const [jumlahPilihan, setJumlahPilihan] = useState(4); 
  const [tipePilihan, setTipePilihan] = useState<"huruf" | "angka" | "bs">("huruf");
  const [kolom, setKolom] = useState(3);
  const [useAnchor, setUseAnchor] = useState(true);
  const [modeIdentitas, setModeIdentitas] = useState<"nis" | "barcode">("nis");
  const [jumlahDigitNIS, setJumlahDigitNIS] = useState(6);
  const [useKodeUjian, setUseKodeUjian] = useState(true);
  const [jumlahDigitKodeUjian, setJumlahDigitKodeUjian] = useState(3);
  const [useEsai, setUseEsai] = useState(false);
  const [tinggiEsaiCM, setTinggiEsaiCM] = useState(8); 

  // --- FUNGSI CUSTOM ---
  const handleSelectTemplate = (type: string) => {
    if (type === 'PG_AD') { setJumlahSoal(40); setKolom(3); setUseEsai(false); setJumlahPilihan(4); setTipePilihan("huruf"); } 
    else if (type === 'BS') { setJumlahSoal(30); setKolom(3); setUseEsai(false); setJumlahPilihan(2); setTipePilihan("bs"); } 
    else if (type === 'SKOR_14') { setJumlahSoal(30); setKolom(3); setUseEsai(false); setJumlahPilihan(4); setTipePilihan("angka"); } 
    setViewState('editor');
  };

  const ubahIdentitas = (id: number, val: string) => setIdentitasList(identitasList.map(item => item.id === id ? { ...item, label: val } : item));
  const hapusIdentitas = (id: number) => setIdentitasList(identitasList.filter(item => item.id !== id));
  const tambahIdentitas = () => setIdentitasList([...identitasList, { id: Date.now(), label: "DATA BARU" }]);
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onload = (event) => setLogoUrl(event.target?.result as string); reader.readAsDataURL(file); }
  };
  const hapusLogo = () => setLogoUrl(null);

  // --- FUNGSI API (SIMPAN SEBAGAI MASTER) ---
  const handleSimpanMaster = async () => {
    if (!namaUjian) return alert("Nama Template wajib diisi!");
    setIsSaving(true);
    
    // Semua pengaturan desain dibungkus jadi satu JSON
    const konfigurasi = {
      kop: kopSurat,
      logo: logoUrl,
      footer: teksFooter,
      identitas: identitasList,
      useAnchor,
      modeIdentitas,
      jumlahDigitNIS,
      useKodeUjian,
      jumlahDigitKodeUjian,
      useEsai,
      tinggiEsaiCM,
      tipePilihan
    };

    try {
      const response = await fetch('/api/admin/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_template: namaUjian,
          jumlah_soal: jumlahSoal,
          opsi: jumlahPilihan === 5 ? "A-E" : "A-D",
          kolom: kolom,
          konfigurasi_json: konfigurasi // Desain lengkap masuk sini
        })
      });

      if (response.ok) {
        alert(`Berhasil! Template Master "${namaUjian}" telah disimpan dan siap digunakan oleh Guru.`);
        router.push('/admin/template');
      } else {
        const errorData = await response.json(); 
        alert(`Gagal menyimpan: ${errorData.message || errorData.error}`);
      }
    } catch (error) { 
        alert("Gagal terhubung ke server database."); 
    } finally { 
        setIsSaving(false); 
    }
  };

  const handleExport = async (format: 'png' | 'pdf') => {
    if (!ljkRef.current) return;
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const canvas = await html2canvas(ljkRef.current, { scale: 3, useCORS: true, logging: false, backgroundColor: "#ffffff" });
      if (format === 'png') {
        const link = document.createElement("a"); link.href = canvas.toDataURL("image/png"); link.download = `Master_LJK_${namaUjian.replace(/\s+/g, '_')}.png`; link.click();
      } else {
        const pdf = new jsPDF("p", "mm", "a4"); pdf.addImage(canvas.toDataURL("image/jpeg", 1.0), "JPEG", 0, 0, 210, 297); pdf.save(`Master_LJK_${namaUjian.replace(/\s+/g, '_')}.pdf`);
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

  // =======================================================================
  // RENDER VIEW 1: MENU PILIH TEMPLATE (Tampilan Identik dgn Guru)
  // =======================================================================
  if (viewState === 'select') {
    return (
      <div className="min-h-screen bg-[#f8fafc] font-sans flex flex-col items-center relative overflow-x-hidden pt-24 px-6 pb-24">
        <div className="absolute top-0 left-0 w-full h-[45vh] bg-[#1d4ed8] rounded-b-[2.5rem] pointer-events-none"></div>
        <Link href="/admin/template" className="absolute top-8 left-8 p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-all cursor-pointer">
          <ArrowLeft size={24} weight="bold" />
        </Link>

        <div className="relative z-10 text-center mb-12 mt-8">
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">Buat Template Master</h1>
          <p className="text-blue-100 font-medium max-w-lg mx-auto text-sm lg:text-base">Mulai dari preset yang tersedia atau atur sendiri struktur lembar jawaban.</p>
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
        </div>
      </div>
    );
  }

  // =======================================================================
  // RENDER VIEW 2: EDITOR LJK (IDENTIK DENGAN GURU)
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
              {/* ADMIN: Digunakan sebagai Nama Template Master */}
              <label className="text-[10px] font-bold text-slate-500">Nama Template / Ujian</label>
              <input type="text" value={namaUjian} onChange={(e) => setNamaUjian(e.target.value)} className="w-full p-3 text-xs font-bold border border-[#cbd5e1] rounded-xl outline-none uppercase" />
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
          {/* TOMBOL SIMPAN ADMIN (Ke API Template) */}
          <button onClick={handleSimpanMaster} disabled={isSaving} className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl font-black transition-all shadow-lg uppercase tracking-widest text-xs disabled:opacity-70 cursor-pointer">
            {isSaving ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <><FloppyDisk size={20} weight="fill" /> SIMPAN MASTER TEMPLATE</>}
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
"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, DownloadSimple, FilePdf, SlidersHorizontal, 
  TextAUnderline, Hash, CheckCircle, Scan, Trash, Plus, 
  IdentificationBadge, ImageSquare, FloppyDisk, NotePencil,
  FileText, GridFour, Wrench, Printer, Crosshair, Checks
} from "@phosphor-icons/react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function EditorTemplateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('editId');

  const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJTSURBVHgB7d0xbhNREIDh90IsiYIuDR0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDR0XoKInpKQEDX0XoKKf/R9fA/E705cAAAAASUVORK5CYII=";

  const [viewState, setViewState] = useState<'select' | 'editor'>('select');
  const ljkRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- STATE KOP & IDENTITAS ---
  const [namaTemplate, setNamaTemplate] = useState("");
  const [kopSurat, setKopSurat] = useState("YAYASAN MAFATIHUL ISLAM\nSMA MAFATIHUL ARABIYYAH\nLEMBAR JAWABAN STANDAR SEKOLAH");
  const [judulUjianTampilan, setJudulUjianTampilan] = useState("UJIAN SEKOLAH / MADRASAH");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [teksFooter, setTeksFooter] = useState("SISTEM OMR OTOMATIS TARBIYAHTECH - 2026");
  
  const [identitasList, setIdentitasList] = useState([
    { id: 1, label: "NAMA LENGKAP" }, { id: 2, label: "KELAS / JURUSAN" },
    { id: 3, label: "MATA PELAJARAN" }, { id: 4, label: "TANGGAL" }
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

  // --- AMBIL DATA EDIT ---
  useEffect(() => {
    if (editId) {
      fetch(`/api/admin/template?id=${editId}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setNamaTemplate(data.nama_template || "");
            setJumlahSoal(data.jumlah_soal || 40);
            
            if (data.opsi === "A-D") { setJumlahPilihan(4); setTipePilihan("huruf"); }
            else if (data.opsi === "A-E") { setJumlahPilihan(5); setTipePilihan("huruf"); }
            else if (data.opsi === "B/S") { setJumlahPilihan(2); setTipePilihan("bs"); }
            
            setKolom(data.kolom || 3);
            
            // Ekstrak struktur kanvas jika ada
            if (data.struktur_kanvas_json) {
              const str = data.struktur_kanvas_json;
              if (str.kop) setKopSurat(str.kop);
              if (str.judul) setJudulUjianTampilan(str.judul);
              if (str.logo) setLogoUrl(str.logo);
              if (str.identitasList) setIdentitasList(str.identitasList);
              if (str.useAnchor !== undefined) setUseAnchor(str.useAnchor);
              if (str.modeIdentitas) setModeIdentitas(str.modeIdentitas);
              if (str.jumlahDigitNIS) setJumlahDigitNIS(str.jumlahDigitNIS);
              if (str.useKodeUjian !== undefined) setUseKodeUjian(str.useKodeUjian);
              if (str.jumlahDigitKodeUjian) setJumlahDigitKodeUjian(str.jumlahDigitKodeUjian);
              if (str.useEsai !== undefined) setUseEsai(str.useEsai);
              if (str.tinggiEsaiCM) setTinggiEsaiCM(str.tinggiEsaiCM);
            }
            setViewState('editor');
          }
        });
    }
  }, [editId]);

  // --- FUNGSI CUSTOM ---
  const handleSelectTemplate = (type: string) => {
    if (type === 'PG_AD') { setJumlahSoal(40); setKolom(3); setUseEsai(false); setJumlahPilihan(4); setTipePilihan("huruf"); setNamaTemplate("Master Template LJK A-D"); } 
    else if (type === 'BS') { setJumlahSoal(30); setKolom(3); setUseEsai(false); setJumlahPilihan(2); setTipePilihan("bs"); setNamaTemplate("Master Template LJK Benar/Salah"); } 
    else if (type === 'SKOR_14') { setJumlahSoal(30); setKolom(3); setUseEsai(false); setJumlahPilihan(4); setTipePilihan("angka"); setNamaTemplate("Master Template Survei Skor 1-4"); } 
    else { setNamaTemplate("Master Template Custom Baru"); }
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

  // --- FUNGSI SIMPAN API ADMIN ---
  const handleSimpanTemplate = async () => {
    if (!namaTemplate) return alert("Nama Identitas Master wajib diisi!");
    setIsSaving(true);
    
    try {
      const payload = {
        nama_template: namaTemplate,
        jumlah_soal: jumlahSoal,
        opsi: tipePilihan === 'bs' ? 'B/S' : jumlahPilihan === 5 ? 'A-E' : 'A-D',
        kolom: kolom,
        struktur_kanvas_json: {
          kop: kopSurat,
          judul: judulUjianTampilan,
          logo: logoUrl,
          identitasList,
          useAnchor,
          modeIdentitas,
          jumlahDigitNIS,
          useKodeUjian,
          jumlahDigitKodeUjian,
          useEsai,
          tinggiEsaiCM
        }
      };

      const method = editId ? 'PUT' : 'POST';
      const bodyPayload = editId ? { id: editId, ...payload } : payload;

      const response = await fetch('/api/admin/template', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      if (response.ok) {
        alert(`Berhasil menyimpan Master Template: ${namaTemplate}`);
        router.push('/admin/template');
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
      const safeName = (namaTemplate || 'TEMPLATE_LJK').replace(/\s+/g, '_');
      if (format === 'png') {
        const link = document.createElement("a"); link.href = canvas.toDataURL("image/png"); link.download = `${safeName}.png`; link.click();
      } else {
        const pdf = new jsPDF("p", "mm", "a4"); pdf.addImage(canvas.toDataURL("image/jpeg", 1.0), "JPEG", 0, 0, 210, 297); pdf.save(`${safeName}.pdf`);
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
  // RENDER VIEW 1: MENU PILIH TEMPLATE ADMIN
  // =======================================================================
  if (viewState === 'select') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col items-center relative overflow-x-hidden pt-8 px-6 pb-24">
        <div className="absolute top-0 left-0 w-full h-[400px] bg-indigo-900 rounded-b-[4rem] pointer-events-none shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        </div>

        <div className="w-full max-w-[85rem] flex justify-between items-center relative z-10 mb-8 mt-2">
          <Link href="/admin/template" className="flex items-center gap-2 p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-2xl text-white transition-all cursor-pointer">
            <ArrowLeft size={20} weight="bold" /> <span className="text-xs font-bold uppercase tracking-widest hidden sm:block pr-2">Kembali ke Manajemen</span>
          </Link>
          <div className="bg-white/10 border border-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-white flex items-center gap-2 shadow-lg">
            <Wrench size={18} weight="fill" className="text-yellow-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Admin LJK Studio</span>
          </div>
        </div>

        <div className="relative z-10 text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 drop-shadow-lg">
            Standarisasi Template Sekolah
          </h1>
          <p className="text-indigo-200 font-medium max-w-2xl mx-auto text-sm lg:text-base leading-relaxed px-4">
            Buat rancangan LJK yang akan menjadi master acuan dan bisa langsung digunakan oleh seluruh guru di sekolah ini.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[85rem] w-full">
          <div onClick={() => handleSelectTemplate('PG_AD')} className="bg-white p-8 rounded-[2rem] shadow-xl flex flex-col items-center text-center hover:border-blue-400 hover:shadow-blue-500/20 border-2 border-transparent transition-all group cursor-pointer hover:-translate-y-2">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 rounded-[1.5rem] shadow-inner flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"><FileText size={40} weight="fill" /></div>
            <h3 className="font-black text-slate-800 text-xl mb-3">Pilihan Ganda</h3>
            <p className="text-xs font-bold text-slate-400 mb-6 leading-relaxed flex-1">Format standar 40 Soal (A-D) tanpa isian. Optimal untuk ujian harian.</p>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">Gunakan Basis Ini</span>
          </div>

          <div onClick={() => handleSelectTemplate('BS')} className="bg-white p-8 rounded-[2rem] shadow-xl flex flex-col items-center text-center hover:border-emerald-400 hover:shadow-emerald-500/20 border-2 border-transparent transition-all group cursor-pointer hover:-translate-y-2">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 rounded-[1.5rem] shadow-inner flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"><CheckCircle size={40} weight="fill" /></div>
            <h3 className="font-black text-slate-800 text-xl mb-3">Benar / Salah</h3>
            <p className="text-xs font-bold text-slate-400 mb-6 leading-relaxed flex-1">Format cepat 30 Soal hanya dengan 2 opsi (Benar/Salah). Hemat kertas.</p>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-full group-hover:bg-emerald-600 group-hover:text-white transition-colors">Gunakan Basis Ini</span>
          </div>

          <div onClick={() => handleSelectTemplate('SKOR_14')} className="bg-white p-8 rounded-[2rem] shadow-xl flex flex-col items-center text-center hover:border-purple-400 hover:shadow-purple-500/20 border-2 border-transparent transition-all group cursor-pointer hover:-translate-y-2">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-50 text-purple-600 rounded-[1.5rem] shadow-inner flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"><GridFour size={40} weight="fill" /></div>
            <h3 className="font-black text-slate-800 text-xl mb-3">Skor & Survei</h3>
            <p className="text-xs font-bold text-slate-400 mb-6 leading-relaxed flex-1">Opsi angka 1-4. Sangat cocok untuk kuesioner psikologi atau angket santri.</p>
            <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 px-4 py-2 rounded-full group-hover:bg-purple-600 group-hover:text-white transition-colors">Gunakan Basis Ini</span>
          </div>

          <div onClick={() => handleSelectTemplate('CUSTOM')} className="bg-slate-900 p-8 rounded-[2rem] shadow-2xl shadow-slate-900/30 flex flex-col items-center text-center hover:border-slate-600 border-2 border-slate-700 transition-all group cursor-pointer hover:-translate-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Wrench size={100} weight="fill"/></div>
            <div className="w-20 h-20 bg-slate-800 text-slate-300 rounded-[1.5rem] shadow-inner flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-300 relative z-10"><Wrench size={40} weight="fill" /></div>
            <h3 className="font-black text-white text-xl mb-3 relative z-10">Desain Custom</h3>
            <p className="text-xs font-medium text-slate-400 mb-6 leading-relaxed flex-1 relative z-10">Rancang format LJK dari nol untuk kebutuhan spesifik sekolah.</p>
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest bg-white px-4 py-2 rounded-full group-hover:bg-slate-300 transition-colors relative z-10">Bangun dari Awal</span>
          </div>
        </div>
      </div>
    );
  }

  // =======================================================================
  // RENDER VIEW 2: LJK STUDIO (ADMIN EDITOR)
  // =======================================================================
  return (
    <div className="min-h-screen bg-slate-900 flex overflow-hidden font-sans">
      
      {/* PANEL KIRI: STUDIO CONTROLS */}
      <div className="w-[420px] bg-white flex flex-col h-screen overflow-y-auto z-20 shadow-2xl scrollbar-hide shrink-0 relative">
        
        <div className="px-6 py-5 bg-white border-b border-slate-100 sticky top-0 z-20 flex justify-between items-center bg-opacity-90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button onClick={() => setViewState('select')} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"><ArrowLeft size={18} weight="bold" /></button>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-800 leading-none">Admin Studio</h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Master Template Editor</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 flex-1">
          
          {/* Card: Penamaan Master (Khusus Admin) */}
          <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-200 space-y-4">
            <label className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2">
              <IdentificationBadge size={16} weight="bold"/> Identitas Master Template
            </label>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600">Nama Template (Muncul di tabel Admin & Pilihan Guru)</label>
              <input type="text" required value={namaTemplate} onChange={(e) => setNamaTemplate(e.target.value)} placeholder="Contoh: MASTER UAS GANJIL" className="w-full p-3 text-sm font-bold border border-indigo-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent uppercase bg-white shadow-sm text-indigo-900 placeholder:text-indigo-300" />
            </div>
          </div>

          {/* Card 1: Header Kertas */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><TextAUnderline size={16} weight="bold"/> Teks Header & Kop</label>
            
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
              <label className="text-[10px] font-bold text-slate-500">Teks Kop Surat Utama</label>
              <textarea value={kopSurat} onChange={(e) => setKopSurat(e.target.value)} className="w-full p-3 text-xs font-bold border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-20 uppercase bg-white shadow-sm" placeholder="Teks Kop Surat" />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">Teks Judul Bawah Kop (Misal: UJIAN SEKOLAH)</label>
              <input type="text" value={judulUjianTampilan} onChange={(e) => setJudulUjianTampilan(e.target.value)} className="w-full p-3 text-xs font-bold border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 uppercase bg-white shadow-sm" />
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
                  <input type="text" value={item.label} onChange={(e) => ubahIdentitas(item.id, e.target.value)} className="flex-1 p-2 text-xs font-bold border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 uppercase shadow-sm bg-white" />
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
                <button onClick={() => {setTipePilihan('bs'); setJumlahPilihan(2);}} className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${tipePilihan === 'bs' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}>Ben/Sal</button>
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
            <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2 relative z-10"><Hash size={16} weight="bold"/> Setting Mesin Pemindai</label>
            
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
          
          <div className="pb-8"></div>
        </div>

        {/* Sticky Footer: Action Buttons ADMIN */}
        <div className="p-4 bg-white border-t border-slate-100 sticky bottom-0 z-20 space-y-3 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          <button onClick={handleSimpanTemplate} disabled={isSaving || !namaTemplate} className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black transition-all shadow-lg hover:shadow-indigo-500/30 uppercase tracking-widest text-[11px] disabled:opacity-50 cursor-pointer">
            {isSaving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <><FloppyDisk size={18} weight="bold" /> Simpan Ke Master Database</>}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleExport('png')} disabled={isExporting} className="flex items-center justify-center gap-2 py-3 bg-slate-800 text-white rounded-xl font-bold transition-all hover:bg-black cursor-pointer shadow-md"><DownloadSimple size={16} weight="bold"/> <span className="text-[10px] uppercase tracking-widest">Tes Export PNG</span></button>
            <button onClick={() => handleExport('pdf')} disabled={isExporting} className="flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl font-bold transition-all hover:bg-red-700 cursor-pointer shadow-md hover:shadow-red-500/30"><Printer size={16} weight="bold"/> <span className="text-[10px] uppercase tracking-widest">Tes Export PDF</span></button>
          </div>
        </div>
      </div>

      {/* PANEL KANAN: PRATINJAU KERTAS LJK (Canvas A4) - TAMPILAN SAMA PERSIS DENGAN GURU */}
      <div className="flex-1 overflow-auto p-8 lg:p-12 flex justify-center scrollbar-hide relative bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        {isExporting && (
          <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-white rounded-full animate-spin mb-4"></div>
            <p className="font-black text-xl tracking-widest uppercase">Mengekspor Dokumen...</p>
          </div>
        )}

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
                  <p className="text-[12px] font-bold mt-2 tracking-[0.2em]">{judulUjianTampilan.toUpperCase()}</p>
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
                        <div key={nomorSoal} className="flex items-start gap-2 py-0.5 border-b border-[#eeeeee]">
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

export default function AdminEditorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Memuat Studio Admin...</div>}>
      <EditorTemplateContent />
    </Suspense>
  );
}
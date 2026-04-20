"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  ArrowLeft, DownloadSimple, FilePdf, SlidersHorizontal, 
  TextAUnderline, Hash, CheckCircle, Scan, Trash, Plus, 
  IdentificationBadge, ImageSquare, FloppyDisk, NotePencil,
  FileText, MagnifyingGlass, CaretLeft, ListChecks, PencilSimple,
  FilePng
} from "@phosphor-icons/react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function MasterTemplateLJKPage() {
  const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJTSURBVHgB7d0xbhNREIDh90IsiYIuDR0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDV0XoKInpKQEDR0XoKInpKQEDX0XoKKf/R9fA/E705cAAAAASUVORK5CYII=";

  // --- STATE NAVIGASI & LIST ---
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [daftarTemplate, setDaftarTemplate] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterOpsi, setFilterOpsi] = useState("Semua");

  // --- STATE EDITOR LJK ---
  const ljkRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  // State Input Editor
  const [kopSurat, setKopSurat] = useState("YAYASAN MAFATIHUL ISLAM\nSMA MAFATIHUL ARABIYYAH\nUJIAN MADRASAH TAHUN PELAJARAN 2025/2026");
  const [namaUjian, setNamaUjian] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [teksFooter, setTeksFooter] = useState("SISTEM OMR OTOMATIS TARBIYAHTECH - 2026");
  const [identitasList, setIdentitasList] = useState([
    { id: 1, label: "NAMA LENGKAP" }, { id: 2, label: "KELAS / JURUSAN" },
    { id: 3, label: "TANGGAL UJIAN" }, { id: 4, label: "TANDA TANGAN" }
  ]);
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

  // --- AMBIL DATA ---
  const fetchTemplate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/template');
      const data = await res.json();
      if (Array.isArray(data)) setDaftarTemplate(data);
    } catch (error) { console.error(error); }
    setIsLoading(false);
  };

  useEffect(() => { fetchTemplate(); }, []);

  // --- LOGIKA FILTER TABEL ---
  const filteredData = useMemo(() => {
    return daftarTemplate.filter(t => {
      const matchSearch = t.nama_template.toLowerCase().includes(search.toLowerCase());
      const matchOpsi = filterOpsi === "Semua" ? true : t.opsi === filterOpsi;
      return matchSearch && matchOpsi;
    });
  }, [daftarTemplate, search, filterOpsi]);

  // --- FUNGSI HELPER EDITOR (YANG SEBELUMNYA HILANG) ---
  const ubahIdentitas = (id: number, val: string) => setIdentitasList(identitasList.map(item => item.id === id ? { ...item, label: val } : item));
  const hapusIdentitas = (id: number) => setIdentitasList(identitasList.filter(item => item.id !== id));
  const tambahIdentitas = () => setIdentitasList([...identitasList, { id: Date.now(), label: "DATA BARU" }]);
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onload = (event) => setLogoUrl(event.target?.result as string); reader.readAsDataURL(file); }
  };
  const hapusLogo = () => setLogoUrl(null);

  // --- FUNGSI AKSI TABEL ---
  const handleEdit = (template: any) => {
    const config = template.konfigurasi_json || {};
    setEditId(template.id);
    setNamaUjian(template.nama_template);
    setJumlahSoal(template.jumlah_soal);
    setJumlahPilihan(template.opsi === "A-E" ? 5 : template.opsi === "B/S" ? 2 : 4);
    setKolom(template.kolom);
    
    // Load config JSON
    if (config.kop) setKopSurat(config.kop);
    if (config.logo) setLogoUrl(config.logo);
    if (config.footer) setTeksFooter(config.footer);
    if (config.identitas) setIdentitasList(config.identitas);
    setUseAnchor(config.useAnchor ?? true);
    setModeIdentitas(config.modeIdentitas || "nis");
    setJumlahDigitNIS(config.jumlahDigitNIS || 6);
    setUseKodeUjian(config.useKodeUjian ?? true);
    setJumlahDigitKodeUjian(config.jumlahDigitKodeUjian || 3);
    setUseEsai(config.useEsai ?? false);
    setTinggiEsaiCM(config.tinggiEsaiCM || 8);
    setTipePilihan(config.tipePilihan || "huruf");

    setViewMode('editor');
  };

  const handleHapus = async (id: string, nama: string) => {
    if (!confirm(`Hapus template "${nama}"?`)) return;
    const res = await fetch(`/api/admin/template?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchTemplate();
  };

  // --- FUNGSI SIMPAN EDITOR ---
  const handleSimpanMaster = async () => {
    if (!namaUjian) return alert("Nama Template wajib diisi!");
    setIsSaving(true);
    const konfigurasi = {
      kop: kopSurat, logo: logoUrl, footer: teksFooter, identitas: identitasList,
      useAnchor, modeIdentitas, jumlahDigitNIS, useKodeUjian, jumlahDigitKodeUjian,
      useEsai, tinggiEsaiCM, tipePilihan
    };

    try {
      const res = await fetch('/api/admin/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_template: namaUjian,
          jumlah_soal: jumlahSoal,
          opsi: tipePilihan === 'bs' ? 'B/S' : jumlahPilihan === 5 ? "A-E" : "A-D",
          kolom: kolom,
          konfigurasi_json: konfigurasi 
        })
      });
      if (res.ok) {
        alert("Berhasil disimpan!");
        setViewMode('list');
        fetchTemplate();
      }
    } catch (error) { alert("Error simpan."); }
    setIsSaving(false);
  };

  // --- EXPORT PNG/PDF ---
  const handleExport = async (format: 'png' | 'pdf') => {
    if (!ljkRef.current) return;
    setIsExporting(true);
    const canvas = await html2canvas(ljkRef.current, { scale: 3, useCORS: true, backgroundColor: "#ffffff" });
    if (format === 'png') {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `Master_LJK_${namaUjian}.png`;
      link.click();
    } else {
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(canvas.toDataURL("image/jpeg", 1.0), "JPEG", 0, 0, 210, 297);
      pdf.save(`Master_LJK_${namaUjian}.pdf`);
    }
    setIsExporting(false);
  };

  const getOptionLabel = (index: number) => {
    if (tipePilihan === "huruf") return String.fromCharCode(65 + index); 
    if (tipePilihan === "bs") return index === 0 ? "B" : "S";
    return (index + 1).toString(); 
  };

  const bubbleSize = jumlahPilihan > 8 ? 13 : 18;
  const fontSize = jumlahPilihan > 8 ? 6 : 9;
  const soalPerKolom = Math.ceil(jumlahSoal / kolom);

  // =======================================================================
  // VIEW 1: TABEL DATA MASTER TEMPLATE
  // =======================================================================
  if (viewMode === 'list') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          {/* NAVIGASI DASHBOARD */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 mb-8 pb-4">
            <Link href="/admin" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-sm shadow-sm transition-all">
              <CaretLeft size={16} weight="bold" /> Dashboard
            </Link>
            <div className="flex gap-2">
              <Link href="/admin/guru" className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-white transition-all">Guru</Link>
              <Link href="/admin/santri" className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-white transition-all">Santri</Link>
              <button className="px-5 py-2.5 rounded-xl font-black text-indigo-700 bg-white shadow-sm border border-slate-200">Master LJK</button>
            </div>
          </div>

          {/* HEADER & TAMBAH DATA */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <ListChecks size={36} className="text-indigo-600" weight="fill" /> Manajemen Master LJK
              </h1>
              <p className="text-sm font-bold text-slate-500 mt-1">Standarisasi format lembar jawaban untuk seluruh pengajar sekolah.</p>
            </div>
            <button 
              onClick={() => { setEditId(null); setNamaUjian(""); setViewMode('editor'); }} 
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all text-sm"
            >
              <Plus size={20} weight="bold" /> Buat Template Baru
            </button>
          </div>

          {/* PENCARIAN & FILTER */}
          <div className="bg-white rounded-t-3xl border border-slate-200 border-b-0 p-5 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" placeholder="Cari nama template..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select 
              value={filterOpsi} onChange={(e) => setFilterOpsi(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Semua">Semua Opsi</option>
              <option value="A-D">4 Pilihan (A-D)</option>
              <option value="A-E">5 Pilihan (A-E)</option>
              <option value="B/S">Benar / Salah</option>
            </select>
          </div>

          {/* TABEL DATA */}
          <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-4 pl-8">Nama Identitas Master</th>
                    <th className="p-4 text-center">Jml Soal</th>
                    <th className="p-4 text-center">Opsi</th>
                    <th className="p-4 text-center">Kolom</th>
                    <th className="p-4 pr-8 text-right">Aksi Kelola</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-bold">Memuat data master...</td></tr>
                  ) : filteredData.length === 0 ? (
                    <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-bold">Template tidak ditemukan.</td></tr>
                  ) : filteredData.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 pl-8">
                        <div className="font-black text-slate-800 uppercase text-sm">{t.nama_template}</div>
                        <div className="text-[10px] text-slate-400 font-bold">Dibuat: {new Date(t.created_at).toLocaleDateString('id-ID')}</div>
                      </td>
                      <td className="p-4 text-center font-black text-slate-700">{t.jumlah_soal}</td>
                      <td className="p-4 text-center">
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black">{t.opsi}</span>
                      </td>
                      <td className="p-4 text-center font-bold text-slate-500">{t.kolom} Kolom</td>
                      <td className="p-4 pr-8 text-right space-x-1">
                        <button onClick={() => handleEdit(t)} className="p-2 text-indigo-500 hover:bg-indigo-100 rounded-lg transition-all" title="Edit Template"><PencilSimple size={18} weight="bold"/></button>
                        <button onClick={() => handleHapus(t.id, t.nama_template)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all" title="Hapus"><Trash size={18} weight="bold"/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FOOTER TABEL */}
          <div className="bg-slate-50 border border-slate-200 border-t-0 p-4 px-8 rounded-b-3xl flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-widest">
            <span>Total Record: {filteredData.length} Template</span>
            <span>FastTest institutional standards</span>
          </div>
        </div>
      </div>
    );
  }

  // =======================================================================
  // VIEW 2: FULL BLUE EDITOR (PERSIS GURU)
  // =======================================================================
  return (
    <div className="min-h-screen bg-[#f1f5f9] flex overflow-hidden font-sans">
      <div className="w-[420px] bg-white border-r border-[#e2e8f0] flex flex-col h-screen overflow-y-auto z-20 shadow-xl scrollbar-hide shrink-0">
        <div className="p-6 bg-[#1d4ed8] text-white sticky top-0 z-10 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setViewMode('list')} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all"><ArrowLeft size={18} weight="bold" /></button>
            <h1 className="text-lg font-black tracking-tight uppercase">Editor Master</h1>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Panel Editor Desain */}
          <div className="space-y-3 p-4 bg-[#f8fafc] rounded-2xl border border-[#e2e8f0]">
            <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest block mb-1">KOP & Identitas Master</label>
            <div>
              {logoUrl ? (
                <div className="flex items-center gap-3 bg-white p-2 border border-[#cbd5e1] rounded-xl mb-2">
                  <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded" />
                  <button onClick={hapusLogo} className="text-xs font-bold text-red-500 hover:text-red-700 flex-1 text-right">Hapus Logo</button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 w-full p-3 mb-2 border-2 border-dashed border-[#cbd5e1] rounded-xl cursor-pointer hover:bg-slate-50 text-blue-600 font-bold text-xs"><ImageSquare size={18} /> Upload Logo KOP<input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} /></label>
              )}
            </div>
            <textarea value={kopSurat} onChange={(e) => setKopSurat(e.target.value)} className="w-full p-3 text-xs font-bold border border-[#cbd5e1] rounded-xl h-20 uppercase outline-none" placeholder="Teks Kop Surat" />
            <input type="text" value={namaUjian} onChange={(e) => setNamaUjian(e.target.value)} className="w-full p-3 text-xs font-bold border border-[#cbd5e1] rounded-xl uppercase outline-none" placeholder="Nama Template Master" />
            <input type="text" value={teksFooter} onChange={(e) => setTeksFooter(e.target.value)} className="w-full p-3 text-xs font-bold border border-[#cbd5e1] rounded-xl uppercase outline-none" placeholder="Teks Footer" />
          </div>

          <div className="space-y-4 p-4 border border-[#e2e8f0] rounded-2xl bg-white">
            <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest block">Format LJK Master</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => {setTipePilihan('huruf'); setJumlahPilihan(4);}} className={`px-3 py-2 text-[11px] font-bold rounded-lg border ${tipePilihan === 'huruf' && jumlahPilihan === 4 ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white text-[#64748b]'}`}>A-D</button>
              <button onClick={() => {setTipePilihan('huruf'); setJumlahPilihan(5);}} className={`px-3 py-2 text-[11px] font-bold rounded-lg border ${tipePilihan === 'huruf' && jumlahPilihan === 5 ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white text-[#64748b]'}`}>A-E</button>
              <button onClick={() => {setTipePilihan('bs'); setJumlahPilihan(2);}} className={`px-3 py-2 text-[11px] font-bold rounded-lg border ${tipePilihan === 'bs' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white text-[#64748b]'}`}>B/S</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="space-y-1"><span className="text-[10px] font-bold text-[#64748b]">Jml Soal</span><input type="number" min="1" value={jumlahSoal} onChange={(e) => setJumlahSoal(Number(e.target.value))} className="w-full p-2 border border-[#cbd5e1] rounded-lg font-bold text-sm outline-none" /></div>
              <div className="space-y-1"><span className="text-[10px] font-bold text-[#64748b]">Kolom</span><input type="number" min="1" max="6" value={kolom} onChange={(e) => setKolom(Number(e.target.value))} className="w-full p-2 border border-[#cbd5e1] rounded-lg font-black text-blue-600 outline-none" /></div>
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

          {/* Opsi Identitas List */}
          <div className="space-y-3 p-4 bg-[#f8fafc] rounded-2xl border border-[#e2e8f0]">
             <div className="flex justify-between items-center mb-1"><label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest">Kolom Identitas</label><button onClick={tambahIdentitas} className="text-[10px] font-black text-blue-600">+ TAMBAH</button></div>
             {identitasList.map(item => (
                <div key={item.id} className="flex gap-2"><input type="text" value={item.label} onChange={(e) => ubahIdentitas(item.id, e.target.value)} className="flex-1 p-2 text-[10px] font-bold border rounded outline-none uppercase" /><button onClick={() => hapusIdentitas(item.id)} className="text-red-400"><Trash size={14}/></button></div>
             ))}
          </div>
        </div>

        {/* Action Bottom */}
        <div className="mt-auto p-4 border-t border-[#f1f5f9] bg-white sticky bottom-0 z-20 space-y-2 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
          <button onClick={handleSimpanMaster} disabled={isSaving} className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black transition-all shadow-lg uppercase tracking-widest text-xs disabled:opacity-70">
            {isSaving ? "Menyimpan..." : <><FloppyDisk size={20} weight="fill" /> SIMPAN MASTER TEMPLATE</>}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleExport('png')} className="flex items-center justify-center gap-2 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-[10px]"><FilePng size={16}/> PNG</button>
            <button onClick={() => handleExport('pdf')} className="flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-xl font-bold text-[10px]"><FilePdf size={16}/> PDF</button>
          </div>
        </div>
      </div>

      {/* AREA CANVAS LJK */}
      <div className="flex-1 bg-[#cbd5e1] overflow-auto p-12 flex justify-center scrollbar-hide">
        <div ref={ljkRef} className="shadow-2xl relative box-border bg-white flex flex-col" style={{ width: "210mm", height: "297mm", padding: "15mm 25mm", color: "#000000" }}>
          
          {/* Logo Watermark Branding */}
          <div className="absolute right-[6mm] top-0 bottom-0 flex items-center justify-center z-10 w-6 opacity-20">
            <div className="flex items-center gap-3 rotate-[-90deg] whitespace-nowrap">
              <img src={LOGO_BASE64} alt="Logo" className="h-4 grayscale" />
              <p className="text-[12px] font-black tracking-[0.5em] uppercase m-0">FASTTEST INSTITUTIONAL</p>
            </div>
          </div>

          {/* Corner Anchors */}
          {useAnchor && (
            <><div className="absolute top-[10mm] left-[10mm] w-6 h-6 bg-black"></div><div className="absolute top-[10mm] right-[10mm] w-6 h-6 bg-black"></div><div className="absolute bottom-[10mm] left-[10mm] w-6 h-6 bg-black"></div><div className="absolute bottom-[10mm] right-[10mm] w-6 h-6 bg-black"></div></>
          )}

          {/* HEADER AREA */}
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-4 pb-3 mb-6 border-b-4 border-black">
              <div className="w-[80px] h-[80px] flex items-center justify-center overflow-hidden">
                {logoUrl ? <img src={logoUrl} alt="Logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} /> : <div className="w-20 h-20 bg-slate-100 rounded flex items-center justify-center font-bold text-[10px] text-slate-400">LOGO</div>}
              </div>
              <div className="flex-1 text-center uppercase">
                <p className="text-[14px] font-black whitespace-pre-line leading-tight">{kopSurat}</p>
                <p className="text-[12px] font-bold mt-2 tracking-[0.2em]">{namaUjian || "NAMA MASTER TEMPLATE"}</p>
              </div>
              <div className="w-20"></div>
            </div>

            <div className="flex gap-6 mb-8 items-start">
              <div className="flex-1 p-4 space-y-4 text-[11px] font-black border-2 border-black uppercase bg-white">
                {identitasList.map(item => {
                  const isSignature = item.label.toLowerCase().includes("tanda tangan") || item.label.toLowerCase().includes("ttd");
                  return (
                    <div key={item.id} className="flex gap-2">
                      <span className="whitespace-nowrap">{item.label} :</span>
                      <div className="flex-1 border-b border-black border-dashed" style={{ height: isSignature ? "32px" : "12px", marginTop: isSignature ? "0" : "2px" }}></div>
                    </div>
                  );
                })}
              </div>
              {useKodeUjian && (
                <div className="p-2 border-2 border-black bg-white flex flex-col items-center">
                  <p className="text-[9px] font-black mb-1">KODE</p>
                  <div className="flex gap-1">{Array.from({length: jumlahDigitKodeUjian}).map((_, i) => (<div key={i} className="flex flex-col gap-0.5"><div className="w-3.5 h-3.5 border-black border-[1.5px] rounded-full mb-1"></div>{[0,1,2,3,4,5,6,7,8,9].map(n => <div key={n} className="w-3.5 h-3.5 border-black border rounded-full text-[6px] flex items-center justify-center font-black">{n}</div>)}</div>))}</div>
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

            {/* BUBBLE AREA */}
            <div className="flex justify-between gap-6">
              {Array.from({ length: kolom }).map((_, col) => (
                <div key={col} className="flex-1 flex flex-col gap-1.5">
                  {Array.from({ length: soalPerKolom }).map((_, row) => {
                    const no = row + 1 + (col * soalPerKolom);
                    if (no > jumlahSoal) return <div key={no} className="py-0.5 opacity-0 h-[22px]"></div>;
                    return (
                      <div key={no} className="flex items-center gap-1.5 border-b border-slate-100 py-1">
                        <span className="w-5 text-right font-black text-xs">{no}.</span>
                        <div className="flex gap-1">
                          {Array.from({ length: jumlahPilihan }).map((_, opt) => (
                            <div key={opt} className="w-4 h-4 border-[1.5px] border-black rounded-full flex items-center justify-center text-[7px] font-black">{getOptionLabel(opt)}</div>
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

            <div className="mt-auto text-center border-t border-slate-200 pt-2 text-[8px] font-black text-slate-400 tracking-widest uppercase">
              {teksFooter}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
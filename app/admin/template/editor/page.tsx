"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, DownloadSimple, FilePdf, SlidersHorizontal, 
  TextAUnderline, Hash, CheckCircle, Scan, Trash, Plus, 
  IdentificationBadge, ImageSquare, FloppyDisk, NotePencil,
  FileText, GridFour, Wrench, Archive, MagnifyingGlass, CaretDown
} from "@phosphor-icons/react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function MasterLJKEditorAdmin() {
  const router = useRouter();
  const ljkRef = useRef<HTMLDivElement>(null);
  
  // --- STATE KOP & IDENTITAS ---
  const [kopSurat, setKopSurat] = useState("YAYASAN MAFATIHUL ISLAM\nSMA MAFATIHUL ARABIYYAH\nUJIAN MADRASAH TAHUN PELAJARAN 2025/2026");
  const [namaUjian, setNamaUjian] = useState("Mata Pelajaran Bahasa Arab");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [teksFooter, setTeksFooter] = useState("SISTEM OMR OTOMATIS TARBIYAHTECH - 2026");
  const [identitasList, setIdentitasList] = useState([
    { id: 1, label: "NAMA LENGKAP" }, { id: 2, label: "KELAS / JURUSAN" },
    { id: 3, label: "TANGGAL UJIAN" }, { id: 4, label: "TANDA TANGAN" }
  ]);
  
  // --- STATE STRUKTUR ---
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

  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- LOGIKA SIMPAN SEBAGAI MASTER ---
  const handleSimpanMaster = async () => {
    if (!namaUjian) return alert("Nama Template wajib diisi!");
    setIsSaving(true);
    
    // Bungkus semua desain ke dalam JSON
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
      tinggiEsaiCM
    };

    try {
      const res = await fetch('/api/admin/template', {
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

      if (res.ok) {
        alert("✅ Berhasil! Template Master telah disimpan dan otomatis muncul di akun Guru.");
        router.push('/admin/template');
      } else {
        alert("❌ Gagal menyimpan ke database.");
      }
    } catch (error) {
      alert("Terjadi kesalahan jaringan.");
    }
    setIsSaving(false);
  };

  // --- FUNGSI UI LAINNYA (SAMA DENGAN GURU) ---
  const ubahIdentitas = (id: number, val: string) => setIdentitasList(identitasList.map(item => item.id === id ? { ...item, label: val } : item));
  const tambahIdentitas = () => setIdentitasList([...identitasList, { id: Date.now(), label: "DATA BARU" }]);
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onload = (event) => setLogoUrl(event.target?.result as string); reader.readAsDataURL(file); }
  };
  const getOptionLabel = (index: number) => {
    if (tipePilihan === "huruf") return String.fromCharCode(65 + index); 
    if (tipePilihan === "bs") return index === 0 ? "B" : "S";
    return (index + 1).toString(); 
  };
  const handleExport = async (format: 'png' | 'pdf') => {
    if (!ljkRef.current) return;
    setIsExporting(true);
    const canvas = await html2canvas(ljkRef.current, { scale: 3, useCORS: true });
    if (format === 'png') {
        const link = document.createElement("a"); link.href = canvas.toDataURL("image/png"); link.download = `Master_LJK.png`; link.click();
    } else {
        const pdf = new jsPDF("p", "mm", "a4"); pdf.addImage(canvas.toDataURL("image/jpeg", 1.0), "JPEG", 0, 0, 210, 297); pdf.save(`Master_LJK.pdf`);
    }
    setIsExporting(false);
  };

  const bubbleSize = jumlahPilihan > 8 ? 13 : 20;
  const fontSize = jumlahPilihan > 8 ? 6 : 10;
  const soalPerKolom = Math.ceil(jumlahSoal / kolom);

  return (
    <div className="min-h-screen bg-slate-100 flex overflow-hidden font-sans">
      {/* SIDEBAR EDITOR */}
      <div className="w-[420px] bg-white border-r border-slate-200 flex flex-col h-screen overflow-y-auto z-20 shadow-xl">
        <div className="p-6 bg-indigo-600 text-white sticky top-0 z-10 flex items-center gap-3">
          <Link href="/admin/template" className="p-1.5 bg-white/20 rounded-lg"><ArrowLeft size={18} weight="bold" /></Link>
          <h1 className="text-lg font-black uppercase">Master LJK Admin</h1>
        </div>

        <div className="p-5 space-y-6">
          {/* Section Kop */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Desain KOP & Identitas</label>
            <textarea value={kopSurat} onChange={(e) => setKopSurat(e.target.value)} className="w-full p-3 text-xs font-bold border rounded-xl h-20 uppercase" placeholder="Kop Surat" />
            <input type="text" value={namaUjian} onChange={(e) => setNamaUjian(e.target.value)} className="w-full p-3 text-xs font-bold border rounded-xl uppercase" placeholder="Nama Template" />
          </div>

          {/* Section Identitas */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-slate-500 uppercase">Kolom Identitas</label>
              <button onClick={tambahIdentitas} className="text-xs font-bold text-indigo-600">+ Tambah</button>
            </div>
            {identitasList.map((item) => (
              <div key={item.id} className="flex gap-2">
                <input type="text" value={item.label} onChange={(e) => ubahIdentitas(item.id, e.target.value)} className="flex-1 p-2 text-xs font-bold border rounded uppercase" />
                <button onClick={() => setIdentitasList(identitasList.filter(i => i.id !== item.id))} className="text-red-500"><Trash size={16}/></button>
              </div>
            ))}
          </div>

          {/* Pengaturan OMR */}
          <div className="space-y-4 p-4 border rounded-2xl bg-white">
            <label className="text-[10px] font-black text-slate-500 uppercase">Struktur LJK</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><span className="text-[10px] font-bold">Soal</span><input type="number" value={jumlahSoal} onChange={e => setJumlahSoal(Number(e.target.value))} className="w-full p-2 border rounded-lg font-bold" /></div>
              <div className="space-y-1"><span className="text-[10px] font-bold">Kolom</span><input type="number" value={kolom} onChange={e => setKolom(Number(e.target.value))} className="w-full p-2 border rounded-lg font-bold" /></div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto p-4 border-t bg-white sticky bottom-0 z-20 space-y-2">
          <button onClick={handleSimpanMaster} disabled={isSaving} className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-black shadow-lg uppercase text-xs">
            {isSaving ? "Menyimpan..." : "Simpan Sebagai Master Template"}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleExport('png')} className="py-2.5 bg-slate-800 text-white rounded-xl font-bold text-[10px]">EXPORT PNG</button>
            <button onClick={() => handleExport('pdf')} className="py-2.5 bg-red-600 text-white rounded-xl font-bold text-[10px]">CETAK PDF</button>
          </div>
        </div>
      </div>

      {/* CANVAS LJK (PREVIEW) */}
      <div className="flex-1 bg-slate-300 overflow-auto p-12 flex justify-center">
        <div ref={ljkRef} className="shadow-2xl relative box-border bg-white flex flex-col" style={{ width: "210mm", height: "297mm", padding: "15mm 25mm" }}>
          
          {/* Corner Anchors */}
          {useAnchor && (
            <>
              <div className="absolute top-[10mm] left-[10mm] w-6 h-6 bg-black"></div>
              <div className="absolute top-[10mm] right-[10mm] w-6 h-6 bg-black"></div>
              <div className="absolute bottom-[10mm] left-[10mm] w-6 h-6 bg-black"></div>
              <div className="absolute bottom-[10mm] right-[10mm] w-6 h-6 bg-black"></div>
            </>
          )}

          {/* Header LJK */}
          <div className="flex items-center gap-4 pb-3 mb-6 border-b-4 border-black">
             {logoUrl && <img src={logoUrl} className="w-20 h-20 object-contain" />}
             <div className="flex-1 text-center uppercase">
                <p className="text-[14px] font-black whitespace-pre-line">{kopSurat}</p>
                <p className="text-[12px] font-bold mt-2 tracking-widest">{namaUjian}</p>
             </div>
          </div>

          {/* Identitas Area */}
          <div className="flex gap-6 mb-8 items-start">
             <div className="flex-1 p-4 space-y-4 text-[11px] font-black border-2 border-black">
                {identitasList.map(item => (
                  <div key={item.id} className="flex gap-2">
                    <span className="whitespace-nowrap">{item.label} :</span>
                    <div className="flex-1 border-b border-black border-dashed h-3"></div>
                  </div>
                ))}
             </div>
             {useKodeUjian && (
                <div className="p-2 border-2 border-black flex flex-col items-center">
                   <p className="text-[9px] font-black mb-1">KODE</p>
                   <div className="flex gap-1">
                      {Array.from({length: jumlahDigitKodeUjian}).map((_, i) => (
                        <div key={i} className="flex flex-col gap-0.5">
                           <div className="w-3.5 h-3.5 border border-black rounded-full mb-1"></div>
                           {[0,1,2,3,4,5,6,7,8,9].map(n => <div key={n} className="w-3.5 h-3.5 border border-black rounded-full text-[7px] flex items-center justify-center font-black">{n}</div>)}
                        </div>
                      ))}
                   </div>
                </div>
             )}
          </div>

          {/* Bubble Area */}
          <div className="flex justify-between gap-6">
             {Array.from({length: kolom}).map((_, col) => (
               <div key={col} className="flex-1 flex flex-col gap-2">
                  {Array.from({length: soalPerKolom}).map((_, row) => {
                    const no = row + 1 + (col * soalPerKolom);
                    if (no > jumlahSoal) return null;
                    return (
                      <div key={no} className="flex items-center gap-2 border-b border-slate-100 py-1">
                         <span className="w-5 text-right font-black text-xs">{no}.</span>
                         <div className="flex gap-1">
                            {Array.from({length: jumlahPilihan}).map((_, opt) => (
                               <div key={opt} className="w-4 h-4 border-2 border-black rounded-full flex items-center justify-center text-[8px] font-black">
                                  {getOptionLabel(opt)}
                               </div>
                            ))}
                         </div>
                      </div>
                    );
                  })}
               </div>
             ))}
          </div>

          <div className="mt-auto text-center border-t border-slate-300 pt-2 text-[8px] font-black tracking-widest">
            {teksFooter}
          </div>
        </div>
      </div>
    </div>
  );
}
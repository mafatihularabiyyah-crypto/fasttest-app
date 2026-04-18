"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, FloppyDisk, ImageSquare, TextAUnderline, 
  Hash, ListNumbers, Layout, Trash, Eye
} from "@phosphor-icons/react";

export default function MasterTemplateLJK() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // --- STATE DESAIN TEMPLATE ---
  const [namaTemplate, setNamaTemplate] = useState("MASTER LJK PTS 2026");
  const [kopSurat, setKopSurat] = useState("YAYASAN MAFATIHUL ISLAM\nSMA MAFATIHUL ARABIYYAH\nUJIAN TENGAH SEMESTER");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [jumlahSoal, setJumlahSoal] = useState(40);
  const [jumlahOpsi, setJumlahOpsi] = useState(5);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setLogoUrl(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTemplate = async () => {
    if (!namaTemplate) return alert("Nama Template wajib diisi!");
    
    setIsSaving(true);
    try {
      const res = await fetch('/api/ujian/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_template: namaTemplate,
          jumlah_soal: jumlahSoal,
          jumlah_opsi: jumlahOpsi,
          struktur_kanvas_json: {
            kop: kopSurat,
            logo: logoUrl,
            // Anda bisa menambah koordinat koordinat OMR di sini nanti
          }
        })
      });

      if (res.ok) {
        alert("Master Template LJK Berhasil Disimpan!");
        router.push('/guru/arsip');
      }
    } catch (error) {
      alert("Gagal terhubung ke database.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* HEADER EDITOR */}
      <div className="bg-slate-900 text-white p-4 shadow-xl flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/guru" className="p-2 hover:bg-white/10 rounded-lg transition-all">
            <ArrowLeft size={20} weight="bold" />
          </Link>
          <h1 className="text-sm font-black uppercase tracking-widest">Studio Master Template LJK</h1>
        </div>
        <button 
          onClick={handleSaveTemplate}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-500/30"
        >
          {isSaving ? "Menyimpan..." : <><FloppyDisk size={18} weight="fill" /> Simpan Template</>}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* PANEL PENGATURAN (KIRI) */}
        <div className="w-80 bg-white border-r border-slate-200 p-6 overflow-y-auto space-y-8 shadow-inner">
          <section className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Layout size={14} /> Identitas Template
            </label>
            <input 
              type="text" value={namaTemplate} onChange={(e) => setNamaTemplate(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Contoh: Template UAS 2026"
            />
          </section>

          <section className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <TextAUnderline size={14} /> Desain Kop Surat
            </label>
            <textarea 
              value={kopSurat} onChange={(e) => setKopSurat(e.target.value)}
              className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 uppercase leading-relaxed"
            />
            <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 text-blue-600 font-bold text-xs">
              <ImageSquare size={20} /> {logoUrl ? "Ganti Logo" : "Upload Logo Sekolah"}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          </section>

          <section className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Hash size={14} /> Struktur Soal
            </label>
            <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1">
                 <span className="text-[9px] font-bold text-slate-500">Jumlah Soal</span>
                 <input type="number" value={jumlahSoal} onChange={(e) => setJumlahSoal(Number(e.target.value))} className="w-full p-2 border border-slate-200 rounded-lg font-bold text-sm" />
               </div>
               <div className="space-y-1">
                 <span className="text-[9px] font-bold text-slate-500">Pilihan (A-E)</span>
                 <input type="number" value={jumlahOpsi} max={5} onChange={(e) => setJumlahOpsi(Number(e.target.value))} className="w-full p-2 border border-slate-200 rounded-lg font-bold text-sm" />
               </div>
            </div>
          </section>
        </div>

        {/* AREA PREVIEW (KANAN) */}
        <div className="flex-1 p-12 overflow-auto bg-slate-200 flex justify-center">
          <div className="bg-white shadow-2xl p-[20mm] flex flex-col" style={{ width: "210mm", minHeight: "297mm", color: "black" }}>
            <div className="border-b-4 border-black pb-4 mb-8 flex items-center gap-6">
              <div className="w-20 h-20 bg-slate-100 flex items-center justify-center border border-slate-200 rounded">
                {logoUrl ? <img src={logoUrl} className="max-w-full max-h-full object-contain" /> : <ImageSquare size={32} className="text-slate-300"/>}
              </div>
              <div className="flex-1 text-center">
                <p className="text-lg font-black uppercase whitespace-pre-line leading-tight">{kopSurat}</p>
              </div>
              <div className="w-20"></div>
            </div>
            
            <div className="flex-1 border-2 border-slate-100 border-dashed rounded-3xl flex items-center justify-center">
               <p className="text-slate-300 font-black uppercase tracking-widest text-sm">Area Dinamis Lembar Jawaban ({jumlahSoal} Soal)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, Plus, Trash, CaretLeft, CheckCircle, 
  GridFour, MagnifyingGlass, ListChecks
} from "@phosphor-icons/react";

export default function MasterTemplateLJKPage() {
  const [daftarTemplate, setDaftarTemplate] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    nama_template: "", 
    jumlah_soal: 40, 
    opsi: "A-D", 
    kolom: 2 
  });

  const fetchTemplate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/template');
      const data = await res.json();
      if (Array.isArray(data)) setDaftarTemplate(data);
    } catch (error) { console.error("Gagal memuat:", error); }
    setIsLoading(false);
  };

  useEffect(() => { fetchTemplate(); }, []);

  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert("Master Template berhasil ditambahkan!");
        setIsModalOpen(false);
        setFormData({ nama_template: "", jumlah_soal: 40, opsi: "A-D", kolom: 2 });
        fetchTemplate();
      } else { alert("Gagal menyimpan."); }
    } catch (error) { alert("Terjadi kesalahan sistem."); }
    setIsSaving(false);
  };

  const handleHapus = async (id: string, nama: string) => {
    if (!confirm(`Yakin ingin menghapus template "${nama}"? Guru tidak akan bisa lagi menggunakan format ini.`)) return;
    try {
      const res = await fetch(`/api/admin/template?id=${id}`, { method: 'DELETE' });
      if (res.ok) setDaftarTemplate(daftarTemplate.filter(t => t.id !== id));
    } catch (error) { alert("Gagal menghapus."); }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* NAVIGASI TABS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 mb-8 pb-4">
          <Link href="/admin" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition-all text-sm shadow-sm">
            <CaretLeft size={16} weight="bold" /> Dashboard Utama
          </Link>
          
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/guru" className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">Manajemen Guru</Link>
            <Link href="/admin/santri" className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">Data Santri Aktif</Link>
            <Link href="/admin/template" className="px-5 py-2.5 rounded-xl font-black text-indigo-700 bg-indigo-100/50 shadow-sm transition-colors">Master Template LJK</Link>
          </div>
        </div>

        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <ListChecks size={36} className="text-indigo-600" weight="fill" /> Master Template LJK
            </h1>
            <p className="text-sm font-bold text-slate-500 mt-1">Buat standar format lembar jawaban untuk digunakan seluruh pengajar.</p>
          </div>
          <div>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/30 w-full sm:w-auto text-sm">
              <Plus size={20} weight="bold" /> Buat Template Baru
            </button>
          </div>
        </div>

        {/* DAFTAR TEMPLATE */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-slate-500 font-bold">Memuat daftar template...</div>
          ) : daftarTemplate.length === 0 ? (
            <div className="col-span-full bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                <FileText size={40} weight="duotone" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Belum Ada Template</h3>
              <p className="text-slate-500 text-sm max-w-sm">Anda belum membuat standar LJK. Silakan klik "Buat Template Baru" untuk memulai standarisasi ujian sekolah.</p>
            </div>
          ) : (
            daftarTemplate.map((template) => (
              <div key={template.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group relative overflow-hidden flex flex-col">
                
                {/* Dekorasi Visual LJK Mini di Background */}
                <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-10 transition-opacity pointer-events-none">
                  <GridFour size={150} weight="fill" />
                </div>

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <MagnifyingGlass size={28} weight="fill" />
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-black text-[10px] tracking-widest uppercase rounded-lg">Aktif</span>
                </div>
                
                <h3 className="text-xl font-black text-slate-800 mb-2 relative z-10 line-clamp-1" title={template.nama_template}>
                  {template.nama_template}
                </h3>
                
                <div className="space-y-2 mb-6 relative z-10">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-bold">Jumlah Soal:</span>
                    <span className="text-slate-800 font-black">{template.jumlah_soal} Butir</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-bold">Pilihan Ganda:</span>
                    <span className="text-slate-800 font-black">{template.opsi}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-bold">Layout Cetak:</span>
                    <span className="text-slate-800 font-black">{template.kolom} Kolom</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 flex justify-end relative z-10">
                  <button onClick={() => handleHapus(template.id, template.nama_template)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Hapus Template">
                    <Trash size={20} weight="bold" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* MODAL CREATOR LJK */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
              
              {/* KOLOM KIRI: FORM PENGATURAN */}
              <div className="w-full md:w-1/2 p-8 border-r border-slate-100 overflow-y-auto">
                <h3 className="text-2xl font-black text-slate-800 mb-2">Desain Template LJK</h3>
                <p className="text-xs font-bold text-slate-500 mb-8">Atur parameter kertas ujian yang akan digunakan oleh pengajar.</p>
                
                <form onSubmit={handleSimpan} className="space-y-5">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nama Identitas Template</label>
                    <input required type="text" value={formData.nama_template} onChange={e => setFormData({...formData, nama_template: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700" placeholder="Cth: Ujian Tengah Semester (SD)"/>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Jumlah Soal</label>
                      <input required type="number" min="1" max="100" value={formData.jumlah_soal} onChange={e => setFormData({...formData, jumlah_soal: parseInt(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"/>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Opsi Pilihan Ganda</label>
                      <select value={formData.opsi} onChange={e => setFormData({...formData, opsi: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 appearance-none">
                        <option value="A-D">4 Pilihan (A, B, C, D)</option>
                        <option value="A-E">5 Pilihan (A, B, C, D, E)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Layout Kolom Cetak</label>
                    <div className="flex gap-3">
                      {[1, 2, 3].map(num => (
                        <button key={num} type="button" onClick={() => setFormData({...formData, kolom: num})} className={`flex-1 py-3 rounded-2xl border-2 font-black text-sm transition-all ${formData.kolom === num ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'}`}>
                          {num} Kolom
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl transition-colors">Batal</button>
                    <button type="submit" disabled={isSaving} className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-500/30 transition-all flex justify-center items-center gap-2">
                      {isSaving ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <><CheckCircle size={20} weight="bold"/> Simpan Template</>}
                    </button>
                  </div>
                </form>
              </div>

              {/* KOLOM KANAN: PREVIEW VISUAL */}
              <div className="hidden md:block w-1/2 bg-slate-100 p-8 flex-col items-center justify-center overflow-y-auto">
                <div className="text-center mb-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Live Preview Desain</h4>
                  <p className="text-[10px] text-slate-400">Simulasi visual bentuk LJK</p>
                </div>
                
                {/* Kertas Simulasi LJK */}
                <div className="bg-white w-full max-w-sm mx-auto aspect-[1/1.4] shadow-md border border-slate-200 rounded p-6 relative">
                  
                  {/* Marka Scanner (Bintik Hitam di sudut) */}
                  <div className="absolute top-4 left-4 w-4 h-4 bg-black rounded-full"></div>
                  <div className="absolute top-4 right-4 w-4 h-4 bg-black rounded-full"></div>
                  <div className="absolute bottom-4 left-4 w-4 h-4 bg-black rounded-full"></div>
                  <div className="absolute bottom-4 right-4 w-4 h-4 bg-black rounded-full"></div>

                  <div className="text-center border-b border-black/10 pb-4 mb-4 mt-2">
                    <h5 className="font-black text-[10px] uppercase text-black">{formData.nama_template || "NAMA TEMPLATE"}</h5>
                    <div className="text-[8px] mt-1 space-y-1 opacity-50">
                      <div className="h-2 bg-slate-200 w-3/4 mx-auto rounded"></div>
                      <div className="h-2 bg-slate-200 w-1/2 mx-auto rounded"></div>
                    </div>
                  </div>

                  {/* Simulasi Kolom Jawaban */}
                  <div className={`grid gap-x-4 gap-y-2`} style={{ gridTemplateColumns: `repeat(${formData.kolom}, minmax(0, 1fr))` }}>
                    {Array.from({ length: Math.min(formData.jumlah_soal, 30) }).map((_, i) => (
                      <div key={i} className="flex items-center gap-1.5 mb-1">
                        <span className="text-[7px] font-bold w-3 text-right">{i + 1}.</span>
                        {Array.from({ length: formData.opsi === "A-E" ? 5 : 4 }).map((_, j) => (
                          <div key={j} className="w-2.5 h-2.5 border border-slate-400 rounded-full"></div>
                        ))}
                      </div>
                    ))}
                  </div>
                  {formData.jumlah_soal > 30 && (
                     <div className="text-center mt-4 text-[8px] text-slate-400 font-bold italic">... dan {formData.jumlah_soal - 30} soal lainnya</div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
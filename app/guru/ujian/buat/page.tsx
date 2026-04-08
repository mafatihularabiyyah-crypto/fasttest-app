"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { 
  ArrowLeft, DownloadSimple, FilePdf, SlidersHorizontal, 
  TextAUnderline, Hash, CheckCircle, Scan, Trash, Plus, 
  IdentificationBadge, ImageSquare
} from "@phosphor-icons/react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function LJKGeneratorFinal() {
  const ljkRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // --- 1. STATE IDENTITAS & KOP ---
  const [kopSurat, setKopSurat] = useState("YAYASAN MAFATIHUL ISLAM\nSMA MAFATIHUL ARABIYYAH\nUJIAN MADRASAH TAHUN PELAJARAN 2025/2026");
  const [namaUjian, setNamaUjian] = useState("Mata Pelajaran Bahasa Arab");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [teksFooter, setTeksFooter] = useState("SISTEM OMR OTOMATIS TARBIYAHTECH - 2026");
  
  const [identitasList, setIdentitasList] = useState([
    { id: 1, label: "NAMA LENGKAP" },
    { id: 2, label: "KELAS / JURUSAN" },
    { id: 3, label: "TANGGAL UJIAN" },
    { id: 4, label: "TANDA TANGAN" }
  ]);
  
  // --- 2. STATE STRUKTUR SOAL ---
  const [jumlahSoal, setJumlahSoal] = useState(40);
  const [jumlahPilihan, setJumlahPilihan] = useState(5); // A-E
  const [tipePilihan, setTipePilihan] = useState<"huruf" | "angka">("huruf");
  const [kolom, setKolom] = useState(3);

  // --- 3. STATE PENILAIAN ---
  const [poinRata, setPoinRata] = useState(2.5);

  // --- 4. STATE ADVANCED ---
  const [useAnchor, setUseAnchor] = useState(true);
  const [modeIdentitas, setModeIdentitas] = useState<"nis" | "barcode">("nis");
  const [jumlahDigitNIS, setJumlahDigitNIS] = useState(10);

  // --- FUNGSI CUSTOM IDENTITAS ---
  const ubahIdentitas = (id: number, val: string) => setIdentitasList(identitasList.map(item => item.id === id ? { ...item, label: val } : item));
  const hapusIdentitas = (id: number) => setIdentitasList(identitasList.filter(item => item.id !== id));
  const tambahIdentitas = () => setIdentitasList([...identitasList, { id: Date.now(), label: "DATA BARU" }]);

  // --- FUNGSI UPLOAD LOGO ---
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setLogoUrl(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };
  const hapusLogo = () => setLogoUrl(null);

  // --- FUNGSI EXPORT (RESOLUSI TINGGI) ---
  const handleExport = async (format: 'png' | 'pdf') => {
    if (!ljkRef.current) return;
    setIsExporting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const canvas = await html2canvas(ljkRef.current, {
        scale: 3, 
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      if (format === 'png') {
        const dataURL = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = dataURL; link.download = `LJK_${namaUjian.replace(/\s+/g, '_')}.png`; link.click();
      } else {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = (canvas.height * pdfW) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
        pdf.save(`LJK_${namaUjian.replace(/\s+/g, '_')}.pdf`);
      }
    } catch (err) {
      console.error("Export Error:", err); alert("Terjadi kesalahan ekspor.");
    }
    setIsExporting(false);
  };

  const getOptionLabel = (index: number) => tipePilihan === "huruf" ? String.fromCharCode(65 + index) : (index + 1).toString();

  // Dinamisasi Ukuran Opsi
  const bubbleSize = jumlahPilihan > 8 ? 13 : jumlahPilihan > 5 ? 16 : 20;
  const fontSize = jumlahPilihan > 8 ? 6 : jumlahPilihan > 5 ? 8 : 10;

  // PERBAIKAN: Hitung jumlah soal per kolom agar nomor mengurut ke bawah
  const soalPerKolom = Math.ceil(jumlahSoal / kolom);

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex overflow-hidden font-sans">
      
      {/* ========================================= */}
      {/* PANEL KIRI: KONTROL PENGATURAN            */}
      {/* ========================================= */}
      <div className="w-[420px] bg-white border-r border-[#e2e8f0] flex flex-col h-screen overflow-y-auto z-20 shadow-xl scrollbar-hide">
        <div className="p-6 bg-blue-700 text-white sticky top-0 z-10">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/guru" className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all">
              <ArrowLeft size={18} weight="bold" />
            </Link>
            <h1 className="text-lg font-black tracking-tight uppercase">LJK Generator</h1>
          </div>
          <p className="text-xs text-blue-100 font-medium">Pengaturan Kertas TarbiyahTech</p>
        </div>

        <div className="p-5 space-y-6">
          {/* Header & Logo */}
          <div className="space-y-3 p-4 bg-[#f8fafc] rounded-2xl border border-[#e2e8f0]">
            <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest flex items-center gap-2">
              <TextAUnderline size={14} /> KOP Surat & Footer
            </label>
            
            {/* Upload Logo */}
            <div>
              <span className="text-[10px] font-bold text-[#64748b] block mb-1">Logo Sekolah/Lembaga</span>
              {logoUrl ? (
                <div className="flex items-center gap-3 bg-white p-2 border border-[#cbd5e1] rounded-xl">
                  <img src={logoUrl} alt="Logo Preview" className="w-10 h-10 object-contain rounded" />
                  <button onClick={hapusLogo} className="text-xs font-bold text-red-500 hover:text-red-700 flex-1 text-right">Hapus Logo</button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-[#cbd5e1] rounded-xl cursor-pointer hover:bg-slate-50 transition-all text-blue-600 font-bold text-xs">
                  <ImageSquare size={18} /> Upload Logo
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              )}
            </div>

            <textarea 
              value={kopSurat} onChange={(e) => setKopSurat(e.target.value)} placeholder="Teks KOP Surat..."
              className="w-full p-3 text-xs font-bold border border-[#cbd5e1] rounded-xl outline-none resize-none h-20 uppercase"
            />
            <input 
              type="text" value={namaUjian} onChange={(e) => setNamaUjian(e.target.value)} placeholder="Mata Pelajaran..."
              className="w-full p-3 text-xs font-bold border border-[#cbd5e1] rounded-xl outline-none uppercase"
            />
            <input 
              type="text" value={teksFooter} onChange={(e) => setTeksFooter(e.target.value)} placeholder="Teks Footer..."
              className="w-full p-3 text-xs font-bold border border-[#cbd5e1] rounded-xl outline-none uppercase"
            />
          </div>

          {/* Kustomisasi Identitas */}
          <div className="space-y-3 p-4 bg-[#f8fafc] rounded-2xl border border-[#e2e8f0]">
            <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2"><IdentificationBadge size={14} /> Kolom Identitas</div>
              <button onClick={tambahIdentitas} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-100 px-2 py-1 rounded font-bold">
                <Plus size={12} weight="bold"/> Tambah
              </button>
            </label>
            <div className="space-y-2">
              {identitasList.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 w-4">{idx + 1}.</span>
                  <input 
                    type="text" value={item.label} onChange={(e) => ubahIdentitas(item.id, e.target.value)}
                    className="flex-1 p-2 text-xs font-bold border border-[#cbd5e1] rounded outline-none uppercase"
                  />
                  <button onClick={() => hapusIdentitas(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                    <Trash size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Struktur Soal & Penilaian */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest flex items-center gap-2">
              <SlidersHorizontal size={14} /> Struktur & Penilaian
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#64748b]">Jumlah Soal</span>
                <input type="number" value={jumlahSoal} onChange={(e) => setJumlahSoal(Number(e.target.value))} className="w-full p-2 border border-[#cbd5e1] rounded-lg font-bold text-sm outline-none" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#64748b]">Opsi (A-Z / 1-9)</span>
                <input type="number" value={jumlahPilihan} onChange={(e) => setJumlahPilihan(Number(e.target.value))} className="w-full p-2 border border-[#cbd5e1] rounded-lg font-bold text-sm outline-none" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setTipePilihan("huruf")} className={`py-2 text-xs font-bold rounded-xl border ${tipePilihan === 'huruf' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-[#cbd5e1] text-[#64748b]'}`}>A, B, C</button>
              <button onClick={() => setTipePilihan("angka")} className={`py-2 text-xs font-bold rounded-xl border ${tipePilihan === 'angka' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-[#cbd5e1] text-[#64748b]'}`}>1, 2, 3</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1">
                 <span className="text-[10px] font-bold text-[#64748b]">Kolom Kertas</span>
                 <input type="number" min="1" value={kolom} onChange={(e) => setKolom(Number(e.target.value))} className="w-full p-2 border border-[#cbd5e1] rounded-lg font-black text-blue-600 outline-none" />
               </div>
               <div className="space-y-1">
                 <span className="text-[10px] font-bold text-[#64748b]">Poin / Soal</span>
                 <input type="number" step="0.5" value={poinRata} onChange={(e) => setPoinRata(Number(e.target.value))} className="w-full p-2 border border-[#cbd5e1] rounded-lg font-black text-blue-600 outline-none" />
               </div>
            </div>
          </div>

          {/* Scanner Settings */}
          <div className="space-y-3 p-4 border border-[#e2e8f0] rounded-2xl">
            <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest flex items-center gap-2">
              <Hash size={14} /> Fitur Scanner
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={useAnchor} onChange={(e) => setUseAnchor(e.target.checked)} className="w-4 h-4" />
              <span className="text-xs font-bold">Corner Anchor Marker</span>
            </label>
            <div className="pt-2 border-t border-[#e2e8f0]">
              <div className="flex gap-2">
                <button onClick={() => setModeIdentitas("nis")} className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${modeIdentitas === 'nis' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-[#cbd5e1]'}`}>Arsiran NIS</button>
                <button onClick={() => setModeIdentitas("barcode")} className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${modeIdentitas === 'barcode' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-[#cbd5e1]'}`}>Area Barcode</button>
              </div>
            </div>
            {modeIdentitas === "nis" && (
              <div className="flex justify-between items-center bg-[#f8fafc] p-2 rounded-lg border border-[#e2e8f0]">
                <span className="text-xs font-bold">Jumlah Digit NIS:</span>
                <input type="number" min="3" max="15" value={jumlahDigitNIS} onChange={(e) => setJumlahDigitNIS(Number(e.target.value))} className="w-16 text-center border border-[#cbd5e1] rounded font-bold outline-none" />
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto p-4 border-t border-[#f1f5f9] grid grid-cols-2 gap-2 bg-white sticky bottom-0">
          <button onClick={() => handleExport('png')} disabled={isExporting} className="flex flex-col items-center py-3 bg-[#1e293b] text-white rounded-xl font-bold transition-all hover:bg-black disabled:opacity-50">
            <DownloadSimple size={20} className="mb-1" />
            <span className="text-[10px]">EXPORT PNG</span>
          </button>
          <button onClick={() => handleExport('pdf')} disabled={isExporting} className="flex flex-col items-center py-3 bg-[#dc2626] text-white rounded-xl font-bold transition-all hover:bg-red-700 disabled:opacity-50">
            <FilePdf size={20} className="mb-1" />
            <span className="text-[10px]">CETAK PDF</span>
          </button>
        </div>
      </div>

      {/* ========================================= */}
      {/* PANEL KANAN: LIVE PREVIEW (A4 PRECISE)    */}
      {/* ========================================= */}
      <div className="flex-1 bg-[#cbd5e1] overflow-auto p-12 flex justify-center scrollbar-hide">
        
        {isExporting && (
          <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-md flex items-center justify-center">
            <div className="font-black text-blue-600 animate-pulse text-xl">MEMPROSES DOKUMEN...</div>
          </div>
        )}

        {/* CONTAINER KERTAS A4 */}
        <div 
          ref={ljkRef}
          className="shadow-2xl relative box-border"
          style={{ width: "210mm", minHeight: "297mm", padding: "12mm", backgroundColor: "#ffffff", color: "#000000" }}
        >
          {/* PERBAIKAN: Watermark Vertikal Berada Paling Kanan & Tengah Sempurna */}
          <div className="absolute right-[4mm] top-0 bottom-0 flex items-center justify-center z-10 w-6">
            <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', opacity: 0.35 }}>
              <p className="text-[12px] font-black tracking-[0.5em] uppercase text-black font-sans m-0">
                PROVIDED BY TARBIYAH TECH
              </p>
            </div>
          </div>

          {/* ANCHOR POINTS OMR */}
          {useAnchor && (
            <>
              <div className="absolute top-[5mm] left-[5mm] w-6 h-6" style={{ backgroundColor: "#000000" }}></div>
              <div className="absolute top-[5mm] right-[5mm] w-6 h-6" style={{ backgroundColor: "#000000" }}></div>
              <div className="absolute bottom-[5mm] left-[5mm] w-6 h-6" style={{ backgroundColor: "#000000" }}></div>
              <div className="absolute bottom-[5mm] right-[5mm] w-6 h-6" style={{ backgroundColor: "#000000" }}></div>
            </>
          )}

          {/* HEADER DENGAN LOGO DINAMIS */}
          <div className="flex items-center gap-4 pb-3 mb-6 relative z-10" style={{ borderBottom: "4px solid #000000", paddingRight: '20px' }}>
            <div className="w-[80px] h-[80px] flex items-center justify-center overflow-hidden">
              {logoUrl && <img src={logoUrl} alt="Logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />}
            </div>
            <div className="flex-1 text-center">
              <p className="text-[14px] font-black uppercase whitespace-pre-line leading-tight">{kopSurat}</p>
              <p className="text-[12px] font-bold mt-2 tracking-[0.2em]">{namaUjian.toUpperCase()}</p>
            </div>
            <div className="w-[80px]"></div>
          </div>

          {/* AREA IDENTITAS */}
          <div className="flex gap-6 mb-8 relative z-10" style={{ alignItems: 'flex-start', paddingRight: '20px' }}>
            
            {/* DATA TEXT (NAMA, KELAS, DLL) */}
            <div className="flex-1 p-4 space-y-4 text-[11px] font-black uppercase" style={{ border: "2px solid #000000" }}>
              {identitasList.map((item) => {
                const isSignature = item.label.toLowerCase().includes("tanda tangan") || item.label.toLowerCase().includes("ttd");
                return (
                  <div key={item.id} className="flex gap-2">
                    <span className="whitespace-nowrap">{item.label}</span>
                    <span className="pr-2">:</span>
                    <div className="flex-1" style={{ borderBottom: "1px dashed #000000", height: isSignature ? "32px" : "12px", marginTop: isSignature ? "0" : "2px" }}></div>
                  </div>
                );
              })}
            </div>

            {/* OPSI KANAN (NIS ARSIRAN) */}
            {modeIdentitas === "nis" ? (
              <div className="p-2 flex flex-col items-center" style={{ border: "2px solid #000000" }}>
                <p className="text-[9px] font-black mb-2 w-full text-center pb-1" style={{ borderBottom: "1px solid #000000" }}>ARSIRAN NIS</p>
                <div className="flex gap-1">
                  {Array.from({ length: jumlahDigitNIS }).map((_, digitIndex) => (
                    <div key={digitIndex} className="flex flex-col gap-0.5 items-center">
                      <div className="w-3.5 h-3.5 mb-1" style={{ border: "1.5px solid #000000", borderRadius: "50%" }}></div>
                      {Array.from({ length: 10 }).map((_, num) => (
                        <svg key={num} width="14" height="14" viewBox="0 0 14 14" style={{ display: "block" }}>
                          <circle cx="7" cy="7" r="6" fill="none" stroke="#000000" strokeWidth="1" />
                          <text x="50%" y="50%" dy=".35em" textAnchor="middle" fontSize="7" fontWeight="900" fill="#000000" fontFamily="sans-serif">
                            {num}
                          </text>
                        </svg>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-2 text-center relative w-[150px] h-[150px]" style={{ border: "2px dashed #000000" }}>
                <div className="absolute top-0 left-0 w-full text-[10px] font-bold py-0.5" style={{ backgroundColor: "#000000", color: "#ffffff" }}>AREA BARCODE</div>
                <Scan size={48} weight="thin" style={{ color: "#aaaaaa", marginTop: "16px" }} />
                <p className="text-[9px] font-semibold mt-2" style={{ color: "#666666" }}>Tempel QR/Barcode</p>
              </div>
            )}
          </div>

          {/* PERBAIKAN: GRID JAWABAN MENGURUT KE BAWAH (KOLOM PER KOLOM) */}
          <div className="flex justify-between relative z-10" style={{ paddingRight: '20px', gap: '24px' }}>
            {Array.from({ length: kolom }).map((_, colIndex) => (
              <div key={colIndex} className="flex-1 flex flex-col gap-y-2">
                {Array.from({ length: soalPerKolom }).map((_, rowIndex) => {
                  const nomorSoal = rowIndex + 1 + (colIndex * soalPerKolom);
                  // Jangan tampilkan jika melebihi jumlah soal (misal sisa di kolom terakhir)
                  if (nomorSoal > jumlahSoal) return <div key={nomorSoal} className="py-0.5 opacity-0 h-[22px]"></div>;

                  return (
                    <div key={nomorSoal} className="flex items-center gap-2 py-0.5" style={{ borderBottom: "1px solid #eeeeee" }}>
                      <span className="w-6 text-right font-black text-sm">{nomorSoal}.</span>
                      <div className="flex gap-1.5">
                        {Array.from({ length: jumlahPilihan }).map((_, optIdx) => (
                          <svg key={optIdx} width={bubbleSize} height={bubbleSize} viewBox={`0 0 ${bubbleSize} ${bubbleSize}`} style={{ display: "block" }}>
                            <circle cx={bubbleSize/2} cy={bubbleSize/2} r={(bubbleSize/2) - 1} fill="none" stroke="#000000" strokeWidth="1.5" />
                            <text x="50%" y="50%" dy=".35em" textAnchor="middle" fontSize={fontSize} fontWeight="900" fill="#000000" fontFamily="sans-serif">
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

          {/* FOOTER BAWAH FIX */}
          <div className="absolute bottom-[8mm] left-[12mm] w-[186mm] text-center pt-2 z-10" style={{ borderTop: "1px solid #cccccc" }}>
            <p className="text-[8px] font-black tracking-[0.4em]" style={{ color: "#666666" }}>
              {teksFooter}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
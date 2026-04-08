"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { 
  ArrowLeft, DownloadSimple, FilePdf, SlidersHorizontal, 
  TextAUnderline, Hash, CheckCircle, Scan, Trash, Plus, 
  IdentificationBadge, ImageSquare, FloppyDisk
} from "@phosphor-icons/react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function LJKGeneratorFinal() {
  const ljkRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
  const [tipePilihan, setTipePilihan] = useState<"huruf" | "angka" | "bs">("huruf");
  const [kolom, setKolom] = useState(3);
  const [poinRata, setPoinRata] = useState(2.5);

  // --- 3. STATE ADVANCED (SCANNER & KODE UJIAN UNIK) ---
  const [useAnchor, setUseAnchor] = useState(true);
  const [modeIdentitas, setModeIdentitas] = useState<"nis" | "barcode">("nis");
  const [jumlahDigitNIS, setJumlahDigitNIS] = useState(6);
  // FITUR: KODE UJIAN (Bukan hanya mapel, tapi ID Ujian)
  const [useKodeUjian, setUseKodeUjian] = useState(true);
  const [jumlahDigitKodeUjian, setJumlahDigitKodeUjian] = useState(3);

  // --- FUNGSI CUSTOM ---
  const ubahIdentitas = (id: number, val: string) => setIdentitasList(identitasList.map(item => item.id === id ? { ...item, label: val } : item));
  const hapusIdentitas = (id: number) => setIdentitasList(identitasList.filter(item => item.id !== id));
  const tambahIdentitas = () => setIdentitasList([...identitasList, { id: Date.now(), label: "DATA BARU" }]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setLogoUrl(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };
  const hapusLogo = () => setLogoUrl(null);

  const handleSimpanUjian = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert(`Berhasil! Format LJK dengan Kode Ujian ini telah disimpan ke Database. Mesin Scan akan otomatis mengenali kertas ini nanti.`);
    }, 1500);
  };

  const handleExport = async (format: 'png' | 'pdf') => {
    if (!ljkRef.current) return;
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const canvas = await html2canvas(ljkRef.current, { scale: 3, useCORS: true, logging: false, backgroundColor: "#ffffff" });
      if (format === 'png') {
        const dataURL = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = dataURL; link.download = `LJK_${namaUjian.replace(/\s+/g, '_')}.png`; link.click();
      } else {
        const imgData = canvas.toDataURL("image/jpeg", 1.0);
        const pdf = new jsPDF("p", "mm", "a4");
        pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
        pdf.save(`LJK_${namaUjian.replace(/\s+/g, '_')}.pdf`);
      }
    } catch (err) {
      console.error("Export Error:", err); alert("Terjadi kesalahan ekspor.");
    }
    setIsExporting(false);
  };

  const getOptionLabel = (index: number) => {
    if (tipePilihan === "huruf") return String.fromCharCode(65 + index);
    if (tipePilihan === "bs") return index === 0 ? "B" : "S";
    return (index + 1).toString();
  };

  const handlePilihTipe = (tipe: "huruf" | "angka" | "bs") => {
    setTipePilihan(tipe);
    if (tipe === "bs") setJumlahPilihan(2);
  };

  const bubbleSize = jumlahPilihan > 8 ? 13 : jumlahPilihan > 5 ? 16 : 20;
  const fontSize = jumlahPilihan > 8 ? 6 : jumlahPilihan > 5 ? 8 : 10;
  const soalPerKolom = Math.ceil(jumlahSoal / kolom);
  const patternKetebalan = [10, 7, 4, 2];

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex overflow-hidden font-sans">
      {/* PANEL KIRI: PENGATURAN */}
      <div className="w-[420px] bg-white border-r border-[#e2e8f0] flex flex-col h-screen overflow-y-auto z-20 shadow-xl scrollbar-hide shrink-0">
        <div className="p-6 bg-blue-700 text-white sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/guru" className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all"><ArrowLeft size={18} weight="bold" /></Link>
            <h1 className="text-lg font-black tracking-tight uppercase">LJK Generator</h1>
          </div>
          <p className="text-xs text-blue-100 font-medium">Pengaturan Kertas TarbiyahTech</p>
        </div>

        <div className="p-5 space-y-6">
          <div className="space-y-3 p-4 bg-[#f8fafc] rounded-2xl border border-[#e2e8f0]">
            <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest flex items-center gap-2"><TextAUnderline size={14} /> KOP Surat & Footer</label>
            <div>
              {logoUrl ? (
                <div className="flex items-center gap-3 bg-white p-2 border border-[#cbd5e1] rounded-xl">
                  <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded" />
                  <button onClick={hapusLogo} className="text-xs font-bold text-red-500 hover:text-red-700 flex-1 text-right">Hapus Logo</button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-[#cbd5e1] rounded-xl cursor-pointer hover:bg-slate-50 text-blue-600 font-bold text-xs"><ImageSquare size={18} /> Upload Logo<input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} /></label>
              )}
            </div>
            <textarea value={kopSurat} onChange={(e) => setKopSurat(e.target.value)} className="w-full p-3 text-xs font-bold border border-[#cbd5e1] rounded-xl outline-none resize-none h-20 uppercase" />
            <input type="text" value={namaUjian} onChange={(e) => setNamaUjian(e.target.value)} className="w-full p-3 text-xs font-bold border border-[#cbd5e1] rounded-xl outline-none uppercase" />
            <input type="text" value={teksFooter} onChange={(e) => setTeksFooter(e.target.value)} className="w-full p-3 text-xs font-bold border border-[#cbd5e1] rounded-xl outline-none uppercase" />
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
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => handlePilihTipe("huruf")} className={`py-2 text-xs font-bold rounded-xl border ${tipePilihan === 'huruf' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-[#cbd5e1] text-[#64748b]'}`}>A, B, C</button>
              <button onClick={() => handlePilihTipe("angka")} className={`py-2 text-xs font-bold rounded-xl border ${tipePilihan === 'angka' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-[#cbd5e1] text-[#64748b]'}`}>1, 2, 3</button>
              <button onClick={() => handlePilihTipe("bs")} className={`py-2 text-xs font-bold rounded-xl border ${tipePilihan === 'bs' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-[#cbd5e1] text-[#64748b]'}`}>B / S</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><span className="text-[10px] font-bold text-[#64748b]">Jumlah Soal</span><input type="number" min="1" value={jumlahSoal} onChange={(e) => setJumlahSoal(Number(e.target.value))} className="w-full p-2 border border-[#cbd5e1] rounded-lg font-bold text-sm outline-none" /></div>
              <div className="space-y-1"><span className="text-[10px] font-bold text-[#64748b]">Opsi per Soal</span><input type="number" min="2" max="10" value={jumlahPilihan} onChange={(e) => setJumlahPilihan(Number(e.target.value))} disabled={tipePilihan === 'bs'} className="w-full p-2 border border-[#cbd5e1] rounded-lg font-bold text-sm outline-none disabled:opacity-50" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1"><span className="text-[10px] font-bold text-[#64748b]">Kolom Kertas</span><input type="number" min="1" max="6" value={kolom} onChange={(e) => setKolom(Number(e.target.value))} className="w-full p-2 border border-[#cbd5e1] rounded-lg font-black text-blue-600 outline-none" /></div>
               <div className="space-y-1"><span className="text-[10px] font-bold text-[#64748b]">Poin / Soal</span><input type="number" step="0.5" value={poinRata} onChange={(e) => setPoinRata(Number(e.target.value))} className="w-full p-2 border border-[#cbd5e1] rounded-lg font-black text-blue-600 outline-none" /></div>
            </div>
          </div>

          <div className="space-y-3 p-4 border border-[#e2e8f0] rounded-2xl">
            <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest flex items-center gap-2"><Hash size={14} /> Fitur Scanner & Area OMR</label>
            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={useAnchor} onChange={(e) => setUseAnchor(e.target.checked)} className="w-4 h-4" /><span className="text-xs font-bold">Corner Anchor & Timing Marks</span></label>
            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={useKodeUjian} onChange={(e) => setUseKodeUjian(e.target.checked)} className="w-4 h-4" /><span className="text-xs font-bold">Arsiran KODE UJIAN</span></label>
            
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
            {useKodeUjian && (
              <div className="flex justify-between items-center bg-[#f8fafc] p-2 rounded-lg border border-[#e2e8f0]">
                <span className="text-xs font-bold">Digit KODE UJIAN:</span>
                <input type="number" min="1" max="5" value={jumlahDigitKodeUjian} onChange={(e) => setJumlahDigitKodeUjian(Number(e.target.value))} className="w-16 text-center border border-[#cbd5e1] rounded font-bold outline-none" />
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-[#f1f5f9] bg-white sticky bottom-0 z-20 space-y-2 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
          <button onClick={handleSimpanUjian} disabled={isSaving} className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black transition-all shadow-lg uppercase tracking-widest text-xs disabled:opacity-70">
            {isSaving ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <><FloppyDisk size={20} weight="fill" /> Simpan Data Ujian</>}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleExport('png')} disabled={isExporting} className="flex items-center justify-center gap-2 py-2.5 bg-[#1e293b] text-white rounded-xl font-bold transition-all hover:bg-black"><DownloadSimple size={16} /> <span className="text-[10px]">EXPORT PNG</span></button>
            <button onClick={() => handleExport('pdf')} disabled={isExporting} className="flex items-center justify-center gap-2 py-2.5 bg-[#dc2626] text-white rounded-xl font-bold transition-all hover:bg-red-700"><FilePdf size={16} /> <span className="text-[10px]">CETAK PDF</span></button>
          </div>
        </div>
      </div>

      {/* PANEL KANAN: LIVE PREVIEW (KERTAS A4) */}
      <div className="flex-1 bg-[#cbd5e1] overflow-auto p-8 lg:p-12 flex justify-center scrollbar-hide">
        {isExporting && <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur flex items-center justify-center font-black text-blue-600 animate-pulse text-xl">MEMPROSES DOKUMEN...</div>}

        <div ref={ljkRef} className="shadow-2xl relative box-border bg-white" style={{ width: "210mm", height: "297mm", paddingTop: "15mm", paddingBottom: "15mm", paddingLeft: "25mm", paddingRight: "25mm", color: "#000000" }}>
          
          <div className="absolute right-[6mm] top-0 bottom-0 flex items-center justify-center z-10 w-6">
            <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', opacity: 0.35 }}><p className="text-[12px] font-black tracking-[0.5em] uppercase m-0">PROVIDED BY TARBIYAH TECH</p></div>
          </div>

          {useAnchor && (
            <>
              <div className="absolute top-[10mm] left-[10mm] w-6 h-6 bg-black"></div>
              <div className="absolute top-[10mm] right-[10mm] w-6 h-6 bg-black"></div>
              <div className="absolute bottom-[10mm] left-[10mm] w-6 h-6 bg-black"></div>
              <div className="absolute bottom-[10mm] right-[10mm] w-6 h-6 bg-black"></div>
              <div className="absolute top-[30mm] bottom-[30mm] left-[13mm] w-4 flex flex-col justify-between items-center z-0">
                {Array.from({ length: 24 }).map((_, i) => <div key={`L${i}`} className="w-3.5 bg-black" style={{ height: `${patternKetebalan[i % 4]}px` }}></div>)}
              </div>
              <div className="absolute top-[30mm] bottom-[30mm] right-[13mm] w-4 flex flex-col justify-between items-center z-0">
                {Array.from({ length: 24 }).map((_, i) => <div key={`R${i}`} className="w-3.5 bg-black" style={{ height: `${patternKetebalan[i % 4]}px` }}></div>)}
              </div>
            </>
          )}

          <div className="flex items-center gap-4 pb-3 mb-6 relative z-10 border-b-4 border-black">
            <div className="w-[80px] h-[80px] flex items-center justify-center overflow-hidden">{logoUrl && <img src={logoUrl} alt="Logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />}</div>
            <div className="flex-1 text-center">
              <p className="text-[14px] font-black uppercase whitespace-pre-line leading-tight">{kopSurat}</p>
              <p className="text-[12px] font-bold mt-2 tracking-[0.2em]">{namaUjian.toUpperCase()}</p>
            </div>
            <div className="w-[80px]"></div>
          </div>

          <div className="flex gap-6 mb-8 relative z-10 items-start">
            <div className="flex-1 p-4 space-y-4 text-[11px] font-black uppercase border-2 border-black">
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

            {/* KODE UJIAN BLOK OMR */}
            {useKodeUjian && (
              <div className="p-2 flex flex-col items-center border-2 border-black">
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

            {/* AREA NIS / BARCODE */}
            {modeIdentitas === "nis" ? (
              <div className="p-2 flex flex-col items-center border-2 border-black">
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
              <div className="flex flex-col items-center justify-center p-2 text-center relative w-[150px] h-[150px] border-2 border-black border-dashed">
                <div className="absolute top-0 left-0 w-full text-[10px] font-bold py-0.5 bg-black text-white">AREA BARCODE</div>
                <Scan size={48} weight="thin" className="text-[#aaaaaa] mt-4" />
                <p className="text-[9px] font-semibold mt-2 text-[#666666]">Tempel QR/Barcode</p>
              </div>
            )}
          </div>

          <div className="flex justify-between relative z-10" style={{ gap: '20px' }}>
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

          <div className="absolute bottom-[12mm] left-[25mm] right-[25mm] text-center pt-2 z-10 border-t border-[#cccccc]">
            <p className="text-[8px] font-black tracking-[0.4em] text-[#666666]">{teksFooter}</p>
          </div>

        </div>
      </div>
    </div>
  );
}
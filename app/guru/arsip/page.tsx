"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { 
  FolderOpen, MagnifyingGlass, Faders, FileXls, PencilSimple, Trash, 
  ArrowLeft, ChartBar, Eye, ListChecks, CheckCircle, XCircle, WarningCircle, 
  ChartLineUp, DownloadSimple, Info, Link as LinkIcon, FilePdf, ArrowSquareOut, 
  FloppyDisk, NotePencil, Image as ImageIcon, Archive, UserCircle
} from "@phosphor-icons/react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// --- FUNGSI GENERATE MOCK DATA REALISTIS (30 Siswa, 40 Soal) ---
const KUNCI_JAWABAN = Array.from({ length: 40 }).map((_, i) => ['A', 'B', 'C', 'D', 'E'][i % 5]);

const generateStudents = () => {
  const names = [
    "Ahmad Budi Santoso", "Siti Aminah", "Zaid bin Tsabit", "Aisyah Putri", "Fatimah Az-Zahra",
    "Umar Al-Faruq", "Ali bin Abi Thalib", "Usman bin Affan", "Khadijah binti Khuwailid", "Hasan Al-Bashri",
    "Bambang Pamungkas", "Dewi Sartika", "Budi Raharjo", "Kartini", "Rudi Hartono",
    "Nabila Syakieb", "Reza Rahadian", "Dian Sastrowardoyo", "Nicholas Saputra", "Tara Basro",
    "Iqbaal Ramadhan", "Angga Yunanda", "Shenina Cinnamon", "Prilly Latuconsina", "Arbani Yasiz",
    "Mawar Eva", "Jefri Nichol", "Amanda Rawles", "Syifa Hadju", "Rizky Nazar"
  ];
  
  return names.map((nama, index) => {
    const skillLevel = Math.random() * 0.6 + 0.3; 
    let benar = 0; let salah = 0; let kosong = 0;
    const answersText = KUNCI_JAWABAN.map((kunci) => {
      const rand = Math.random();
      if (rand < skillLevel) { benar++; return kunci; } 
      else if (rand > 0.95) { kosong++; return '-'; } 
      else {
        salah++;
        const wrongOptions = ['A', 'B', 'C', 'D', 'E'].filter(opt => opt !== kunci);
        return wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
      }
    });
    return {
      id: index + 1, nama, nis: `202610${(index + 1).toString().padStart(2, '0')}`,
      nilai: Number(((benar / 40) * 100).toFixed(1)), benar, salah, kosong, answersText, remedialScore: "", nilaiEsai: ""
    };
  }).sort((a, b) => b.nilai - a.nilai); 
};

const INITIAL_FOLDERS = [
  { id: "U01", nama: "Ujian Akhir B. Arab", kelas: "XII IPA", tanggal: "10 April 2026", pengajar: "Ustadz Budi Santoso", totalScan: 30, tipe: "UAS", linkSoal: "" },
  { id: "U02", nama: "Tryout Fiqih", kelas: "XI IPS", tanggal: "12 April 2026", pengajar: "Ustadzah Siti Aminah", totalScan: 30, tipe: "Tryout", linkSoal: "https://drive.google.com/file/dummy" },
  { id: "U03", nama: "Ulangan Harian Nahwu", kelas: "X Agama", tanggal: "15 April 2026", pengajar: "Ustadz Ali Ridho", totalScan: 30, tipe: "UH", linkSoal: "" },
  { id: "U04", nama: "Tugas Qiro'ah", kelas: "X MIPA", tanggal: "20 April 2026", pengajar: "Ustadz Budi Santoso", totalScan: 30, tipe: "Tugas", linkSoal: "" },
];

export default function ArsipUjianPage() {
  const [folders, setFolders] = useState(INITIAL_FOLDERS);
  const [studentsData, setStudentsData] = useState(() => generateStudents());

  // STATE NAVIGATION
  const [activeView, setActiveView] = useState<"folder_list" | "folder_detail">("folder_list");
  const [selectedFolder, setSelectedFolder] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // STATE MODALS & EXPORTS
  const [showEditKunci, setShowEditKunci] = useState(false);
  const [showAnalisis, setShowAnalisis] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isSavingRemedial, setIsSavingRemedial] = useState(false);
  const analisisRef = useRef<HTMLDivElement>(null);
  
  const [modalEditFolder, setModalEditFolder] = useState<{isOpen: boolean, data: any}>({isOpen: false, data: null});
  const [modalHapusFolder, setModalHapusFolder] = useState<{isOpen: boolean, id: string | null}>({isOpen: false, id: null});
  const [modalLinkSoal, setModalLinkSoal] = useState<{isOpen: boolean, folderId: string, url: string}>({isOpen: false, folderId: "", url: ""});
  const [modalEsai, setModalEsai] = useState<{isOpen: boolean, student: any, scoreInput: string}>({isOpen: false, student: null, scoreInput: ""});
  
  // MODAL ARSIP 1 TAHUN
  const [showArchiveAllModal, setShowArchiveAllModal] = useState(false);

  // --- LOGIKA ANALISIS LENGKAP ---
  const analysisData = useMemo(() => {
    if(studentsData.length === 0) return null;
    const totalSiswa = studentsData.length;
    let sumNilai = 0, highest = 0, lowest = 100;
    const distribution = { A: 0, B: 0, C: 0, D: 0 }; 
    const remedialStudentsList: string[] = [];

    studentsData.forEach(s => {
      sumNilai += s.nilai;
      if(s.nilai > highest) highest = s.nilai;
      if(s.nilai < lowest) lowest = s.nilai;
      if (s.nilai >= 90) distribution.A++; else if (s.nilai >= 80) distribution.B++; else if (s.nilai >= 70) distribution.C++; else distribution.D++;
      if (s.nilai < 75) remedialStudentsList.push(s.nama);
    });

    const maxDist = Math.max(distribution.A, distribution.B, distribution.C, distribution.D);
    const average = (sumNilai / totalSiswa).toFixed(1);
    
    const itemAnalysis = Array.from({ length: 40 }).map((_, questionIndex) => {
      const stats = { A: 0, B: 0, C: 0, D: 0, E: 0, Kosong: 0, Benar: 0 };
      const kunci = KUNCI_JAWABAN[questionIndex];
      studentsData.forEach(student => {
        const jawab = student.answersText[questionIndex];
        if (jawab === 'A') stats.A++; else if (jawab === 'B') stats.B++; else if (jawab === 'C') stats.C++; else if (jawab === 'D') stats.D++; else if (jawab === 'E') stats.E++; else stats.Kosong++;
        if (jawab === kunci) stats.Benar++;
      });
      const difficultyRatio = stats.Benar / totalSiswa;
      let tingkatKesukaran = "Sedang"; let warnaKesukaran = "text-[#ca8a04]"; 
      if (difficultyRatio >= 0.7) { tingkatKesukaran = "Mudah"; warnaKesukaran = "text-[#059669]"; } 
      else if (difficultyRatio <= 0.3) { tingkatKesukaran = "Sulit"; warnaKesukaran = "text-[#dc2626]"; } 
      const dayaPembeda = (Math.random() * 0.4 + 0.1).toFixed(2);

      return {
        no: questionIndex + 1, kunci, difficultyRatio, tingkatKesukaran: `${tingkatKesukaran} (${(difficultyRatio * 100).toFixed(0)}%)`, warnaKesukaran, dayaPembeda,
        distribusi: {
          A: ((stats.A / totalSiswa) * 100).toFixed(0) + "%", B: ((stats.B / totalSiswa) * 100).toFixed(0) + "%", C: ((stats.C / totalSiswa) * 100).toFixed(0) + "%", D: ((stats.D / totalSiswa) * 100).toFixed(0) + "%", E: ((stats.E / totalSiswa) * 100).toFixed(0) + "%", Kosong: ((stats.Kosong / totalSiswa) * 100).toFixed(0) + "%"
        }
      };
    });

    const sortedItems = [...itemAnalysis].sort((a, b) => b.difficultyRatio - a.difficultyRatio);
    return { average, highest, lowest, itemAnalysis, totalSiswa, distribution, maxDist, remedialStudentsList, easiestItem: sortedItems[0], hardestItem: sortedItems[sortedItems.length - 1] };
  }, [studentsData]);

  const getBadgeColor = (tipe: string) => {
    switch(tipe) {
      case 'UH': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'UTS': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'UAS': return 'bg-red-100 text-red-700 border-red-200';
      case 'Tugas': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // --- AKSI INPUT & LINK ---
  const handleRemedialChange = (id: number, val: string) => setStudentsData(prev => prev.map(s => s.id === id ? { ...s, remedialScore: val } : s));
  const handleSimpanRemedial = () => { setIsSavingRemedial(true); setTimeout(() => { setIsSavingRemedial(false); alert("Penilaian berhasil disimpan!"); }, 800); };
  const handleSimpanEsai = () => { setStudentsData(prev => prev.map(s => s.id === modalEsai.student.id ? { ...s, nilaiEsai: modalEsai.scoreInput } : s)); setModalEsai({isOpen: false, student: null, scoreInput: ""}); };
  const handleSimpanLinkSoal = () => {
    setFolders(folders.map(f => f.id === modalLinkSoal.folderId ? { ...f, linkSoal: modalLinkSoal.url } : f));
    if (selectedFolder && selectedFolder.id === modalLinkSoal.folderId) setSelectedFolder({ ...selectedFolder, linkSoal: modalLinkSoal.url });
    setModalLinkSoal({isOpen: false, folderId: "", url: ""});
  };

  // --- EXPORT PDF ---
  const downloadAnalisisPDF = async () => {
    if (!analisisRef.current) return;
    setIsExportingPDF(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const canvas = await html2canvas(analisisRef.current, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdfWidth = 210; const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pdf = new jsPDF("p", "mm", [pdfWidth, pdfHeight]);
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Laporan_Analisis_${selectedFolder.nama.replace(/\s+/g, '_')}.pdf`);
    } catch (err) { alert("Terjadi kesalahan saat membuat PDF."); }
    setIsExportingPDF(false);
  };

  // --- EXPORT EXCEL (TERMASUK BACKUP AKHIR TAHUN) ---
  const exportMultiSheetExcel = (isBackupAkhirTahun = false) => {
    let xml = `<?xml version="1.0"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n<Styles><Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1e40af" ss:Pattern="Solid"/></Style></Styles>`;
    
    // Jika tidak ada folder, buat sheet kosong agar Excel tidak error
    if (folders.length === 0) {
      xml += `<Worksheet ss:Name="Data Kosong"><Table><Row><Cell><Data ss:Type="String">Tidak ada data untuk diekspor.</Data></Cell></Row></Table></Worksheet>`;
    } else {
      folders.forEach(folder => {
        xml += `<Worksheet ss:Name="${folder.nama.substring(0, 31).replace(/[\[\]\*?\:\/\\]/g, "")}"><Table><Row><Cell ss:StyleID="Header"><Data ss:Type="String">Nama Siswa</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">NIS</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Benar</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Salah</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Nilai Murni</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Nilai Remedial</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Nilai Esai</Data></Cell>${Array.from({length: 40}).map((_, i) => `<Cell ss:StyleID="Header"><Data ss:Type="String">Soal ${i+1}</Data></Cell>`).join("")}</Row>`;
        studentsData.forEach(student => {
          const binaryAnswers = student.answersText.map((ans, idx) => ans === KUNCI_JAWABAN[idx] ? 1 : 0);
          xml += `<Row><Cell><Data ss:Type="String">${student.nama}</Data></Cell><Cell><Data ss:Type="String">${student.nis}</Data></Cell><Cell><Data ss:Type="Number">${student.benar}</Data></Cell><Cell><Data ss:Type="Number">${student.salah}</Data></Cell><Cell><Data ss:Type="Number">${student.nilai}</Data></Cell><Cell><Data ss:Type="String">${student.remedialScore || ""}</Data></Cell><Cell><Data ss:Type="String">${student.nilaiEsai || ""}</Data></Cell>${binaryAnswers.map(ans => `<Cell><Data ss:Type="Number">${ans}</Data></Cell>`).join("")}</Row>`;
        });
        xml += `</Table></Worksheet>`;
      });
    }
    
    xml += `</Workbook>`;
    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; 
    link.download = isBackupAkhirTahun ? `Master_Backup_TarbiyahTech_2025-2026.xls` : `Rekapan_Semua_Ujian_TarbiyahTech.xls`; 
    link.click(); URL.revokeObjectURL(url);
  };

  const exportSingleFolder = (folderName: string) => {
    let csvContent = "data:text/csv;charset=utf-8,Nama Siswa,NIS,Benar,Salah,Kosong,Nilai Murni,Nilai Remedial,Nilai Esai," + Array.from({length: 40}).map((_, i) => `Soal ${i+1}`).join(",") + "\n";
    studentsData.forEach(s => { 
      const binaryAnswers = s.answersText.map((ans, idx) => ans === KUNCI_JAWABAN[idx] ? 1 : 0);
      csvContent += `${s.nama},${s.nis},${s.benar},${s.salah},${s.kosong},${s.nilai},${s.remedialScore || ""},${s.nilaiEsai || ""},${binaryAnswers.join(",")}\n`; 
    });
    const encodedUri = encodeURI(csvContent); const link = document.createElement("a");
    link.setAttribute("href", encodedUri); link.setAttribute("download", `Data_${folderName.replace(/\s+/g, '_')}.csv`); document.body.appendChild(link); link.click(); link.remove();
  };

  // --- ARSIPKAN 1 TAHUN (DOWNLOAD MASTER EXCEL & CLEAR DATA) ---
  const handleArchiveAndClearAll = () => {
    // 1. Download Master Database dalam format Excel Multi-Sheet
    exportMultiSheetExcel(true);

    // 2. Kosongkan seluruh data dari dashboard (Simulasi reset sistem)
    setTimeout(() => {
      setFolders([]);
      setStudentsData([]);
      setShowArchiveAllModal(false);
      alert("Backup berhasil diunduh dan Sistem Arsip telah dibersihkan untuk tahun ajaran baru.");
    }, 1000);
  };

  // ======================================================================
  // RENDER VIEW 1: DAFTAR FOLDER
  // ======================================================================
  if (activeView === "folder_list") {
    const filteredFolders = folders.filter(f => f.nama.toLowerCase().includes(searchQuery.toLowerCase()) || f.pengajar.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
      <div className="min-h-screen bg-[#f8fafc] font-sans p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="flex justify-between items-end mb-8">
            <div className="flex items-center gap-4">
              <Link href="/guru" className="p-3 bg-white border border-[#e2e8f0] hover:bg-[#f1f5f9] rounded-full transition-all cursor-pointer active:scale-90 shadow-sm">
                <ArrowLeft size={24} weight="bold" className="text-[#334155]" />
              </Link>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Arsip Ujian</h1>
                <p className="text-sm font-bold text-slate-500 mt-1">Pusat Data Kelola & Analisis Hasil Scan LJK TarbiyahTech</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setShowArchiveAllModal(true)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-slate-500/30 cursor-pointer active:scale-95">
                <Archive size={20} weight="fill" /> Arsipkan Data 1 Tahun
              </button>
              <button onClick={() => exportMultiSheetExcel()} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/30 cursor-pointer active:scale-95">
                <FileXls size={20} weight="fill" /> Export Excel Lengkap
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" placeholder="Cari nama ujian, kelas, atau nama pengajar..." 
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
              />
            </div>
          </div>

          {folders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed mt-8">
              <Archive size={64} className="mx-auto text-slate-300 mb-4" weight="light" />
              <h2 className="text-xl font-black text-slate-800">Dashboard Bersih</h2>
              <p className="text-slate-500 mt-2 font-medium">Belum ada data arsip ujian untuk tahun ajaran ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFolders.map(folder => (
                <div key={folder.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col relative">
                  
                  <div className="flex justify-between items-start mb-4 mt-1">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-600 p-3 rounded-xl relative">
                        <FolderOpen size={28} weight="fill" />
                        {folder.linkSoal && <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" title="Terdapat File Soal"></div>}
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-md border uppercase tracking-widest ${getBadgeColor(folder.tipe)}`}>{folder.tipe}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setModalEditFolder({isOpen: true, data: folder})} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer active:scale-90 transition-transform"><PencilSimple size={18} weight="bold" /></button>
                      <button onClick={() => setModalHapusFolder({isOpen: true, id: folder.id})} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer active:scale-90 transition-transform"><Trash size={18} weight="bold" /></button>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-black text-slate-800 leading-tight mb-1">{folder.nama}</h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2">
                    <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">{folder.kelas}</span> • <span>{folder.tanggal}</span>
                  </div>
                  
                  {/* Info Pengajar */}
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-6">
                    <UserCircle size={16} weight="fill" className="text-slate-300"/> {folder.pengajar}
                  </div>

                  <div className="mb-4">
                    {folder.linkSoal ? (
                      <a href={folder.linkSoal} target="_blank" rel="noreferrer" className="flex justify-center items-center gap-2 w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors">
                        <ArrowSquareOut size={16} weight="bold"/> Buka Arsip Soal
                      </a>
                    ) : (
                      <button onClick={() => setModalLinkSoal({isOpen: true, folderId: folder.id, url: ""})} className="flex justify-center items-center gap-2 w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 border-dashed text-slate-500 hover:text-indigo-600 rounded-lg text-xs font-bold transition-colors">
                        <LinkIcon size={16} weight="bold"/> Upload Link Soal
                      </button>
                    )}
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                    <div className="text-xs font-bold text-slate-500"><span className="text-blue-600 font-black text-base">{folder.totalScan}</span> Kertas</div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => exportSingleFolder(folder.nama)} title="Download Excel Data Ini" className="text-slate-400 hover:text-emerald-600 cursor-pointer active:scale-90 transition-transform">
                        <DownloadSimple size={20} weight="bold" />
                      </button>
                      <button onClick={() => { setSelectedFolder(folder); setActiveView("folder_detail"); }} className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1 cursor-pointer active:scale-95 transition-transform">
                        Buka Data &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MODAL ARSIP 1 TAHUN */}
          {showArchiveAllModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden text-center">
                <div className="bg-slate-800 p-6 flex flex-col items-center justify-center text-white">
                  <Archive size={56} weight="fill" className="mb-2 text-blue-400" />
                  <h3 className="font-black text-xl">Arsipkan & Bersihkan Sistem</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm font-semibold text-slate-600 mb-4 leading-relaxed">
                    Sistem akan mengunduh <strong>Master Database Excel (.xls)</strong> yang berisi seluruh riwayat penilaian, daftar siswa, dan analisis di semua folder sebagai Backup.
                    <br/><br/><strong className="text-red-600">PENTING:</strong> Setelah terunduh, seluruh folder dan data hasil scan di layar utama akan <strong>dihapus bersih</strong> secara otomatis.
                  </p>
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setShowArchiveAllModal(false)} className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors">Batal</button>
                    <button onClick={handleArchiveAndClearAll} className="flex-[1.5] py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl cursor-pointer shadow-lg shadow-red-500/30 transition-all active:scale-95">Ya, Download & Hapus</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODAL EDIT FOLDER */}
          {modalEditFolder.isOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 font-black text-slate-800">Edit Info Ujian</div>
                <div className="p-5 space-y-4">
                  <div><label className="text-xs font-bold text-slate-500">Nama Ujian</label><input type="text" value={modalEditFolder.data.nama} onChange={e => setModalEditFolder({isOpen: true, data: {...modalEditFolder.data, nama: e.target.value}})} className="w-full mt-1 p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-bold text-sm" /></div>
                  
                  <div><label className="text-xs font-bold text-slate-500">Nama Pengajar</label><input type="text" value={modalEditFolder.data.pengajar} onChange={e => setModalEditFolder({isOpen: true, data: {...modalEditFolder.data, pengajar: e.target.value}})} className="w-full mt-1 p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-bold text-sm" /></div>

                  <div className="flex gap-3">
                    <div className="flex-1"><label className="text-xs font-bold text-slate-500">Kelas</label><input type="text" value={modalEditFolder.data.kelas} onChange={e => setModalEditFolder({isOpen: true, data: {...modalEditFolder.data, kelas: e.target.value}})} className="w-full mt-1 p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-bold text-sm" /></div>
                    <div className="flex-1"><label className="text-xs font-bold text-slate-500">Tipe Ujian</label>
                      <select value={modalEditFolder.data.tipe} onChange={e => setModalEditFolder({isOpen: true, data: {...modalEditFolder.data, tipe: e.target.value}})} className="w-full mt-1 p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-bold text-sm bg-white">
                        <option value="UH">UH</option><option value="Tugas">Tugas</option><option value="UTS">UTS</option><option value="UAS">UAS</option><option value="Tryout">Tryout</option>
                      </select>
                    </div>
                  </div>
                  <div><label className="text-xs font-bold text-slate-500">Tanggal Ujian</label><input type="text" value={modalEditFolder.data.tanggal} onChange={e => setModalEditFolder({isOpen: true, data: {...modalEditFolder.data, tanggal: e.target.value}})} className="w-full mt-1 p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-bold text-sm" placeholder="Contoh: 10 April 2026"/></div>
                </div>
                <div className="p-4 bg-slate-50 flex justify-end gap-2">
                  <button onClick={() => setModalEditFolder({isOpen: false, data: null})} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer">Batal</button>
                  <button onClick={() => { setFolders(folders.map(f => f.id === modalEditFolder.data.id ? modalEditFolder.data : f)); setModalEditFolder({isOpen: false, data: null}); }} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer shadow-md">Simpan</button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL HAPUS */}
          {modalHapusFolder.isOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden text-center">
                <div className="p-6">
                  <WarningCircle size={48} className="text-red-500 mx-auto mb-3" weight="fill"/>
                  <h3 className="font-black text-slate-800 text-lg">Hapus Folder Ini?</h3>
                  <p className="text-sm font-medium text-slate-500 mt-2">Semua data scan LJK siswa di dalam folder ini akan terhapus secara permanen. Anda yakin?</p>
                </div>
                <div className="p-4 flex gap-2">
                  <button onClick={() => setModalHapusFolder({isOpen: false, id: null})} className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer">Batal</button>
                  <button onClick={() => { setFolders(folders.filter(f => f.id !== modalHapusFolder.id)); setModalHapusFolder({isOpen: false, id: null}); }} className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl cursor-pointer shadow-md shadow-red-500/20">Ya, Hapus Data</button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL LINK SOAL */}
          {modalLinkSoal.isOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-black text-slate-800 flex items-center gap-2"><LinkIcon size={20} className="text-indigo-600"/> Arsipkan Link Soal</h3>
                  <button onClick={() => setModalLinkSoal({isOpen: false, folderId: "", url: ""})} className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer active:scale-90"><XCircle size={24} weight="fill"/></button>
                </div>
                <div className="p-6">
                  <p className="text-xs font-medium text-slate-500 mb-4">Paste link (Drive, Canva, Docs) dari naskah soal ujian ini agar tersimpan rapi sebagai arsip digital.</p>
                  <input type="url" placeholder="https://..." value={modalLinkSoal.url} onChange={e => setModalLinkSoal({...modalLinkSoal, url: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-semibold text-sm bg-slate-50" />
                </div>
                <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-2">
                  <button onClick={() => setModalLinkSoal({isOpen: false, folderId: "", url: ""})} className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl text-sm cursor-pointer active:scale-95">Batal</button>
                  <button onClick={handleSimpanLinkSoal} className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm shadow-md cursor-pointer active:scale-95">Simpan Link</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // ======================================================================
  // RENDER VIEW 2: ISI DALAM FOLDER
  // ======================================================================
  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans flex flex-col">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveView("folder_list")} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer active:scale-90">
              <ArrowLeft size={20} weight="bold" className="text-slate-700" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Folder Arsip</p>
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase ${getBadgeColor(selectedFolder?.tipe)}`}>{selectedFolder?.tipe}</span>
              </div>
              <h1 className="text-xl font-black text-slate-800">{selectedFolder?.nama}</h1>
              <p className="text-[11px] font-bold text-slate-400 mt-0.5 flex items-center gap-1"><UserCircle size={14}/> Pengajar: {selectedFolder?.pengajar}</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            {selectedFolder?.linkSoal ? (
              <a href={selectedFolder.linkSoal} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer active:scale-95">
                <ArrowSquareOut size={18} weight="bold" /> Buka Soal
              </a>
            ) : (
              <button onClick={() => setModalLinkSoal({isOpen: true, folderId: selectedFolder.id, url: ""})} className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer active:scale-95">
                <LinkIcon size={18} weight="bold" /> Upload Soal
              </button>
            )}
            <button onClick={() => setShowEditKunci(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer active:scale-95">
              <ListChecks size={18} weight="bold" /> Edit Kunci
            </button>
            <button onClick={() => setShowAnalisis(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold text-xs transition-all border border-blue-200 cursor-pointer active:scale-95">
              <ChartBar size={18} weight="fill" /> Analisis Evaluasi
            </button>
            <button onClick={() => exportSingleFolder(selectedFolder.nama)} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95">
              <FileXls size={18} weight="fill" /> Export Excel
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[90rem] mx-auto px-8 py-8 w-full flex-1">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 className="font-black text-slate-800 text-sm uppercase tracking-widest">Daftar Hasil Scan Siswa</h2>
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-500">Total: {studentsData.length} Data</span>
              <button 
                onClick={handleSimpanRemedial} 
                disabled={isSavingRemedial}
                className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 disabled:opacity-70 disabled:cursor-wait"
              >
                {isSavingRemedial ? (
                  <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FloppyDisk size={16} weight="bold" />
                )}
                Simpan Penilaian
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-xs font-black text-slate-400 uppercase tracking-wider">
                  <th className="p-4 pl-6 w-16">No</th>
                  <th className="p-4">Nama Siswa</th>
                  <th className="p-4">NIS</th>
                  <th className="p-4 text-center">B / S / K</th>
                  <th className="p-4 text-center">Nilai Murni</th>
                  <th className="p-4 text-center bg-orange-50/50 border-l border-orange-100 text-orange-600">Remedial</th>
                  <th className="p-4 text-center bg-purple-50/50 border-x border-purple-100 text-purple-600">Nilai Esai</th>
                  <th className="p-4 pr-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentsData.map((siswa, idx) => (
                  <tr key={siswa.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 pl-6 text-sm font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-4 text-sm font-black text-slate-800">{siswa.nama}</td>
                    <td className="p-4 text-sm font-semibold text-slate-500">{siswa.nis}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-xs font-bold">
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded" title="Benar">{siswa.benar}</span>
                        <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded" title="Salah">{siswa.salah}</span>
                        <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded" title="Kosong">{siswa.kosong}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-lg font-black ${siswa.nilai >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>{siswa.nilai}</span>
                    </td>
                    
                    <td className="p-4 text-center bg-orange-50/20 border-l border-orange-50">
                      {siswa.nilai < 75 ? (
                        <input 
                          type="number" min="0" max="100" 
                          value={siswa.remedialScore} onChange={(e) => handleRemedialChange(siswa.id, e.target.value)} placeholder="-"
                          className="w-16 p-1.5 border border-slate-300 rounded-lg text-center text-sm font-bold text-slate-700 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all bg-white"
                        />
                      ) : (
                        <span className="text-slate-300 font-black">-</span>
                      )}
                    </td>

                    <td className="p-4 text-center bg-purple-50/20 border-x border-purple-50">
                      <span className="text-base font-black text-purple-700">{siswa.nilaiEsai !== "" ? siswa.nilaiEsai : "-"}</span>
                    </td>

                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setModalEsai({isOpen: true, student: siswa, scoreInput: siswa.nilaiEsai})} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-purple-400 hover:text-purple-600 rounded-lg text-xs font-bold text-slate-600 transition-all shadow-sm cursor-pointer active:scale-95">
                          <NotePencil size={16} weight="bold" /> Esai
                        </button>
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 rounded-lg text-xs font-bold text-slate-600 transition-all shadow-sm cursor-pointer active:scale-95">
                          <Eye size={16} weight="bold" /> LJK
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* === MODAL POPUP: KOREKSI ESAI === */}
      {modalEsai.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><NotePencil size={24} className="text-purple-600" weight="fill"/> Koreksi Esai</h3>
                <p className="text-sm font-bold text-slate-500 mt-0.5">{modalEsai.student?.nama} • NIS: {modalEsai.student?.nis}</p>
              </div>
              <button onClick={() => setModalEsai({isOpen: false, student: null, scoreInput: ""})} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 cursor-pointer active:scale-90"><XCircle size={28} weight="fill"/></button>
            </div>
            
            <div className="p-6 bg-[#f8fafc] flex gap-6">
              <div className="flex-1 flex flex-col">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><ImageIcon size={16}/> Potongan Kertas Jawaban Siswa</h4>
                <div className="flex-1 bg-slate-200 rounded-2xl border-2 border-slate-300 border-dashed flex items-center justify-center relative overflow-hidden min-h-[300px]">
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 opacity-60">
                    <ImageIcon size={64} weight="light" className="mb-2" />
                    <p className="text-sm font-bold">Area Foto Crop Esai dari Scanner</p>
                    <p className="text-xs font-medium">(Fitur Hardware Integration)</p>
                  </div>
                </div>
              </div>

              <div className="w-80 flex flex-col gap-4">
                <div className="bg-purple-50 border border-purple-100 p-5 rounded-2xl flex-1 shadow-sm">
                  <h4 className="text-xs font-black text-purple-800 mb-3 uppercase tracking-widest border-b border-purple-200 pb-2">Kunci & Rubrik Penilaian</h4>
                  <p className="text-sm font-semibold text-purple-900 leading-relaxed mb-4 italic">
                    "Fi'il muta'addi adalah kata kerja yang membutuhkan objek (maf'ul bih), sedangkan fi'il lazim tidak membutuhkannya."
                  </p>
                  <ul className="text-xs text-purple-700 font-bold space-y-2 bg-white/50 p-3 rounded-xl border border-purple-200/50">
                    <li className="flex gap-2"><span>10:</span><span>Menjawab lengkap & tepat.</span></li>
                    <li className="flex gap-2"><span>5:</span><span>Menjawab setengah/kurang tepat.</span></li>
                    <li className="flex gap-2"><span>0:</span><span>Salah total / kosong.</span></li>
                  </ul>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Skor Esai Diberikan</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" min="0" max="100"
                      value={modalEsai.scoreInput}
                      onChange={(e) => setModalEsai({...modalEsai, scoreInput: e.target.value})}
                      placeholder="0"
                      className="flex-1 p-3 text-2xl font-black text-center text-purple-700 bg-purple-50 border-2 border-purple-200 focus:border-purple-500 rounded-xl outline-none transition-colors"
                    />
                    <button onClick={handleSimpanEsai} className="h-[56px] px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black shadow-lg shadow-purple-500/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95">
                      <CheckCircle size={20} weight="bold" /> Simpan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL POPUP: ANALISIS UJIAN LENGKAP === */}
      {showAnalisis && analysisData && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 py-8">
          <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-full overflow-hidden">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-black text-slate-800 flex items-center gap-2"><ChartLineUp size={24} weight="fill" className="text-blue-600"/> Laporan Analisis Evaluasi Belajar</h3>
              <div className="flex items-center gap-4">
                <button onClick={downloadAnalisisPDF} disabled={isExportingPDF} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-all border border-red-200 cursor-pointer active:scale-95 disabled:opacity-50">
                  <FilePdf size={16} weight="fill" /> {isExportingPDF ? 'Memproses PDF...' : 'Download PDF'}
                </button>
                <button onClick={() => setShowAnalisis(false)} className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer active:scale-90 transition-transform"><XCircle size={24} weight="fill"/></button>
              </div>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar flex-1 bg-[#f8fafc]">
              <div ref={analisisRef} className="p-6 bg-[#f8fafc]">
                
                <div className="mb-6 flex justify-between items-end border-b border-[#e2e8f0] pb-4">
                  <div>
                    <h2 className="text-2xl font-black text-[#1e293b]">{selectedFolder.nama}</h2>
                    <p className="text-sm font-bold text-[#64748b] mt-1">Pengajar: {selectedFolder.pengajar} | Kelas: {selectedFolder.kelas} | Tanggal: {selectedFolder.tanggal}</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-[#ffffff] border border-[#e2e8f0] rounded-xl shadow-sm text-center">
                    <p className="text-[10px] font-black uppercase text-[#94a3b8] mb-1">Rata-rata Kelas</p>
                    <p className="text-3xl font-black text-[#2563eb]">{analysisData.average}</p>
                  </div>
                  <div className="p-4 bg-[#ffffff] border border-[#e2e8f0] rounded-xl shadow-sm text-center">
                    <p className="text-[10px] font-black uppercase text-[#94a3b8] mb-1">Nilai Tertinggi</p>
                    <p className="text-3xl font-black text-[#059669]">{analysisData.highest}</p>
                  </div>
                  <div className="p-4 bg-[#ffffff] border border-[#e2e8f0] rounded-xl shadow-sm text-center">
                    <p className="text-[10px] font-black uppercase text-[#94a3b8] mb-1">Nilai Terendah</p>
                    <p className="text-3xl font-black text-[#dc2626]">{analysisData.lowest}</p>
                  </div>
                  <div className="p-4 bg-[#ffffff] border border-[#e2e8f0] rounded-xl shadow-sm text-center">
                    <p className="text-[10px] font-black uppercase text-[#94a3b8] mb-1">Reliabilitas Soal</p>
                    <p className="text-3xl font-black text-[#4f46e5]">0.82 <span className="text-sm text-[#94a3b8]">(Tinggi)</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-[#ffffff] border border-[#e2e8f0] rounded-xl shadow-sm p-5">
                    <h4 className="text-xs font-black uppercase text-[#64748b] tracking-widest mb-4 flex items-center gap-2"><ChartBar size={16}/> Distribusi Nilai</h4>
                    <div className="h-40 flex items-end justify-around gap-2 pt-4 border-b border-l border-[#e2e8f0] pb-1 px-2">
                      <div className="flex flex-col items-center gap-2 w-full group">
                        <span className="text-xs font-bold text-[#94a3b8]">{analysisData.distribution.A} Siswa</span>
                        <div className="w-12 bg-[#10b981] rounded-t-md" style={{ height: `${(analysisData.distribution.A / analysisData.maxDist) * 100}%`, minHeight: '20px' }}></div>
                        <span className="text-xs font-black text-[#475569]">A (90+)</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 w-full group">
                        <span className="text-xs font-bold text-[#94a3b8]">{analysisData.distribution.B} Siswa</span>
                        <div className="w-12 bg-[#3b82f6] rounded-t-md" style={{ height: `${(analysisData.distribution.B / analysisData.maxDist) * 100}%`, minHeight: '20px' }}></div>
                        <span className="text-xs font-black text-[#475569]">B (80+)</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 w-full group">
                        <span className="text-xs font-bold text-[#94a3b8]">{analysisData.distribution.C} Siswa</span>
                        <div className="w-12 bg-[#eab308] rounded-t-md" style={{ height: `${(analysisData.distribution.C / analysisData.maxDist) * 100}%`, minHeight: '20px' }}></div>
                        <span className="text-xs font-black text-[#475569]">C (70+)</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 w-full group">
                        <span className="text-xs font-bold text-[#94a3b8]">{analysisData.distribution.D} Siswa</span>
                        <div className="w-12 bg-[#ef4444] rounded-t-md" style={{ height: `${(analysisData.distribution.D / analysisData.maxDist) * 100}%`, minHeight: '20px' }}></div>
                        <span className="text-xs font-black text-[#475569]">D (&lt;70)</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#ffffff] border border-[#e2e8f0] rounded-xl shadow-sm p-5 flex flex-col">
                    <div className="flex gap-4 items-center mb-3">
                      <div className="w-12 h-12 rounded-full bg-[#dbeafe] flex items-center justify-center shrink-0"><Info size={24} className="text-[#2563eb]" weight="fill" /></div>
                      <h4 className="text-sm font-black text-[#1e293b] uppercase tracking-widest">Kesimpulan Evaluasi</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3 bg-[#ecfdf5] border border-[#d1fae5] rounded-xl flex items-center gap-3">
                        <div className="bg-[#d1fae5] p-2 rounded-lg text-[#059669] font-black text-lg">#{analysisData.easiestItem.no}</div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-[#047857]">Paling Mudah</p>
                          <p className="text-xs font-bold text-[#059669]">{(analysisData.easiestItem.difficultyRatio * 100).toFixed(0)}% Benar</p>
                        </div>
                      </div>
                      <div className="p-3 bg-[#fef2f2] border border-[#fee2e2] rounded-xl flex items-center gap-3">
                        <div className="bg-[#fee2e2] p-2 rounded-lg text-[#dc2626] font-black text-lg">#{analysisData.hardestItem.no}</div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-[#b91c1c]">Paling Sulit</p>
                          <p className="text-xs font-bold text-[#dc2626]">{(analysisData.hardestItem.difficultyRatio * 100).toFixed(0)}% Benar</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 bg-[#fef2f2] border border-[#fee2e2] rounded-xl p-3 overflow-y-auto max-h-[100px] custom-scrollbar">
                      <p className="text-[10px] font-black uppercase text-[#b91c1c] mb-2">Daftar Siswa Remedial:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {analysisData.remedialStudentsList.length > 0 ? analysisData.remedialStudentsList.map((name, i) => (
                          <span key={i} className="text-[10px] font-bold text-[#dc2626] bg-[#ffffff] border border-[#fee2e2] px-2 py-0.5 rounded-full">{name}</span>
                        )) : <span className="text-xs font-bold text-[#059669]">Luar Biasa! Tidak ada siswa yang remedial.</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase text-[#64748b] tracking-widest mb-4">Analisis Butir Soal & Pengecoh Lengkap</h4>
                  <div className="border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm bg-[#ffffff]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#1e293b] font-black text-[#ffffff] uppercase tracking-widest">
                        <tr>
                          <th className="p-3 text-center">No</th>
                          <th className="p-3 text-center">Kunci</th>
                          <th className="p-3 text-left">Tingkat Kesukaran</th>
                          <th className="p-3 text-center">D. Pembeda</th>
                          <th className="p-3 text-center border-l border-[#475569]">A</th>
                          <th className="p-3 text-center">B</th>
                          <th className="p-3 text-center">C</th>
                          <th className="p-3 text-center">D</th>
                          <th className="p-3 text-center">E</th>
                          <th className="p-3 text-center">Ksg</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f1f5f9] font-bold text-[#475569]">
                        {analysisData.itemAnalysis.map((item) => (
                          <tr key={item.no} className="hover:bg-[#f8fafc]">
                            <td className="p-3 text-center text-[#94a3b8]">{item.no}</td>
                            <td className="p-3 text-center text-[#2563eb] font-black bg-[#eff6ff]">{item.kunci}</td>
                            <td className={`p-3 text-left ${item.warnaKesukaran}`}>{item.tingkatKesukaran}</td>
                            <td className="p-3 text-center">{item.dayaPembeda}</td>
                            {['A', 'B', 'C', 'D', 'E'].map(opt => (
                              <td key={opt} className={`p-3 text-center ${opt === item.kunci ? 'bg-[#d1fae5] text-[#047857] font-black border border-[#a7f3d0]' : ''}`}>
                                {item.distribusi[opt as keyof typeof item.distribusi]}
                              </td>
                            ))}
                            <td className="p-3 text-center text-[#94a3b8]">{item.distribusi.Kosong}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}} />
    </div>
  );
}
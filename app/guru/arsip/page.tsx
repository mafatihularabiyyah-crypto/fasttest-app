"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, DownloadSimple, FilePdf, Eye, MagnifyingGlass, 
  X, ChartBar, UserList, ImageSquare, Funnel
} from "@phosphor-icons/react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- DUMMY DATA DATABASE ---
// Di dunia nyata, data ini diambil dari Supabase setelah proses Scan
const dataHasilUjian = [
  { id: 1, nama: "Ahmad Budi Santoso", nis: "20261001", kelas: "XII IPA 1", skor: 85, benar: 34, salah: 4, kosong: 2, fotoLJK: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?q=80&w=400&auto=format&fit=crop" },
  { id: 2, nama: "Siti Aminah Putri", nis: "20261002", kelas: "XII IPA 1", skor: 92, benar: 37, salah: 3, kosong: 0, fotoLJK: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?q=80&w=400&auto=format&fit=crop" },
  { id: 3, nama: "Rizky Fauzi", nis: "20261003", kelas: "XII IPA 1", skor: 45, benar: 18, salah: 20, kosong: 2, fotoLJK: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?q=80&w=400&auto=format&fit=crop" },
  { id: 4, nama: "Dina Mariana", nis: "20261004", kelas: "XII IPA 1", skor: 78, benar: 31, salah: 9, kosong: 0, fotoLJK: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?q=80&w=400&auto=format&fit=crop" },
  { id: 5, nama: "Eko Prasetyo", nis: "20261005", kelas: "XII IPA 1", skor: 65, benar: 26, salah: 12, kosong: 2, fotoLJK: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?q=80&w=400&auto=format&fit=crop" },
];

export default function DashboardArsip() {
  const [search, setSearch] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("XII IPA 1");
  const [modalData, setModalData] = useState<any>(null); // Untuk pop-up foto LJK

  // Filter Data berdasarkan pencarian
  const filteredData = dataHasilUjian.filter((siswa) => 
    siswa.nama.toLowerCase().includes(search.toLowerCase()) || 
    siswa.nis.includes(search)
  );

  // Kalkulasi Statistik Kelas
  const rataRata = Math.round(filteredData.reduce((acc, curr) => acc + curr.skor, 0) / (filteredData.length || 1));
  const tertinggi = Math.max(...filteredData.map(s => s.skor), 0);
  const terendah = Math.min(...filteredData.map(s => s.skor), 0);

  // ==========================================
  // FUNGSI 1: EXPORT KE EXCEL (XLSX)
  // ==========================================
  const exportToExcel = () => {
    // Siapkan data yang rapi untuk Excel
    const dataForExcel = filteredData.map((s, index) => ({
      "No": index + 1,
      "NIS": s.nis,
      "Nama Lengkap": s.nama,
      "Kelas": s.kelas,
      "Skor Akhir": s.skor,
      "Benar": s.benar,
      "Salah": s.salah,
      "Kosong": s.kosong
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Hasil_${selectedKelas}`);
    XLSX.writeFile(workbook, `Rekap_Nilai_${selectedKelas.replace(/\s/g, '_')}.xlsx`);
  };

  // ==========================================
  // FUNGSI 2: EXPORT KE PDF LENGKAP
  // ==========================================
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header Laporan
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN HASIL UJIAN", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Kelas: ${selectedKelas}`, 14, 30);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}`, 14, 35);
    doc.text(`Rata-rata Kelas: ${rataRata} | Tertinggi: ${tertinggi} | Terendah: ${terendah}`, 14, 40);

    // Persiapkan Data Tabel
    const tableColumn = ["No", "NIS", "Nama Lengkap", "Benar", "Salah", "Kosong", "SKOR"];
    const tableRows = filteredData.map((s, idx) => [
      idx + 1, s.nis, s.nama, s.benar, s.salah, s.kosong, s.skor
    ]);

    // Generate Tabel
    autoTable(doc, {
      startY: 45,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255 }, // Warna Biru TarbiyahTech
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    // Save File
    doc.save(`Laporan_PDF_${selectedKelas.replace(/\s/g, '_')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* HEADER DASHBOARD */}
      <div className="bg-blue-700 text-white p-6 shadow-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Link href="/guru" className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all">
              <ArrowLeft size={24} weight="bold" />
            </Link>
            <div>
              <h1 className="text-xl font-black uppercase tracking-widest">Dashboard Arsip</h1>
              <p className="text-xs text-blue-200 font-medium">Manajemen Hasil Ujian & Ekspor Data</p>
            </div>
          </div>

          <div className="flex w-full md:w-auto gap-3">
            <button onClick={exportToExcel} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-green-500/30 transition-all">
              <DownloadSimple size={18} weight="bold" /> Excel
            </button>
            <button onClick={exportToPDF} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-red-500/30 transition-all">
              <FilePdf size={18} weight="bold" /> PDF
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        
        {/* BARIS STATISTIK */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><ChartBar size={24} weight="fill" /></div>
            <div><p className="text-xs font-bold text-slate-400 uppercase">Rata-Rata Kelas</p><p className="text-2xl font-black text-slate-800">{rataRata}</p></div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600"><ChartBar size={24} weight="fill" /></div>
            <div><p className="text-xs font-bold text-slate-400 uppercase">Nilai Tertinggi</p><p className="text-2xl font-black text-slate-800">{tertinggi}</p></div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600"><ChartBar size={24} weight="fill" /></div>
            <div><p className="text-xs font-bold text-slate-400 uppercase">Nilai Terendah</p><p className="text-2xl font-black text-slate-800">{terendah === Infinity ? 0 : terendah}</p></div>
          </div>
        </div>

        {/* KONTROL PENCARIAN & FILTER */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" weight="bold" />
            <input 
              type="text" placeholder="Cari nama atau NIS siswa..." 
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Funnel size={20} className="text-slate-400" />
            <select 
              value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)}
              className="w-full md:w-auto py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm text-slate-700"
            >
              <option value="XII IPA 1">Kelas: XII IPA 1</option>
              <option value="XII IPA 2">Kelas: XII IPA 2</option>
              <option value="XII IPS 1">Kelas: XII IPS 1</option>
            </select>
          </div>
        </div>

        {/* TABEL DATA SISWA */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-xs font-black text-slate-500 uppercase tracking-widest">
                  <th className="p-4">Siswa</th>
                  <th className="p-4 text-center">B / S / K</th>
                  <th className="p-4 text-center">Skor Akhir</th>
                  <th className="p-4 text-center">Aksi Arsip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.length > 0 ? filteredData.map((siswa) => (
                  <tr key={siswa.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="font-black text-slate-800">{siswa.nama}</p>
                      <p className="text-xs font-bold text-slate-400">NIS: {siswa.nis}</p>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-xs font-bold">
                        <span className="text-green-600 bg-green-50 px-2 py-1 rounded">{siswa.benar}</span>
                        <span className="text-red-600 bg-red-50 px-2 py-1 rounded">{siswa.salah}</span>
                        <span className="text-slate-500 bg-slate-100 px-2 py-1 rounded">{siswa.kosong}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-4 py-1.5 rounded-full font-black text-sm ${siswa.skor >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {siswa.skor}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => setModalData(siswa)}
                        className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors"
                      >
                        <Eye size={16} weight="bold" /> Lihat Bukti
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 font-bold">Tidak ada data siswa ditemukan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL POP-UP BUKTI SCAN (LOW-RES ARCHIVE)  */}
      {/* ========================================== */}
      {modalData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-2 text-slate-700 font-black uppercase tracking-widest text-sm">
                <ImageSquare size={20} className="text-blue-600" /> Arsip Bukti Koreksi
              </div>
              <button onClick={() => setModalData(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <X size={20} weight="bold" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              <div className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-100 flex justify-between items-center">
                <div>
                  <p className="font-black text-slate-800 text-lg">{modalData.nama}</p>
                  <p className="text-xs font-bold text-slate-500">NIS: {modalData.nis} | Kelas: {modalData.kelas}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Skor</p>
                  <p className="text-3xl font-black text-blue-600 leading-none">{modalData.skor}</p>
                </div>
              </div>

              <div className="mb-2 flex justify-between items-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Foto Lembar LJK</p>
                <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md">Compressed (± 80KB)</span>
              </div>
              
              {/* Tempat Foto Arsip */}
              <div className="w-full aspect-[1/1.414] bg-slate-200 rounded-xl overflow-hidden border-2 border-slate-300 relative group">
                <img src={modalData.fotoLJK} alt="Arsip LJK" className="w-full h-full object-cover" />
                
                {/* Overlay Simulasi Lingkaran Analisis (Membuktikan ini dikoreksi sistem) */}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                   <div className="w-full h-full border-4 border-green-500/50 m-4 rounded-lg pointer-events-none"></div>
                </div>
              </div>
              
              <p className="text-[10px] text-slate-400 text-center mt-3 font-medium">
                *Foto ini telah dikompresi di sisi browser saat pemindaian untuk menghemat kuota data penyimpanan *cloud*.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
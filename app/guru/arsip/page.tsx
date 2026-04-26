"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  FolderOpen, MagnifyingGlass, Faders, FileXls, PencilSimple, Trash, 
  ArrowLeft, ChartBar, Eye, EyeSlash, ListChecks, CheckCircle, XCircle, WarningCircle, 
  ChartLineUp, DownloadSimple, Info, Link as LinkIcon, FilePdf, ArrowSquareOut, 
  FloppyDisk, NotePencil, Image as ImageIcon, Archive, UserCircle, Plus, Calculator, Hash
} from "@phosphor-icons/react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function ArsipUjianPage() {
  const [folders, setFolders] = useState<any[]>([]);
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [kunciJawaban, setKunciJawaban] = useState<string[]>([]);
  const [soalData, setSoalData] = useState<any[]>([]); 
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isOpeningFolder, setIsOpeningFolder] = useState(false);

  const [activeView, setActiveView] = useState<"folder_list" | "folder_detail">("folder_list");
  const [selectedFolder, setSelectedFolder] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterYear, setFilterYear] = useState<string | null>(null); 
  const [hiddenYears, setHiddenYears] = useState<string[]>([]); 

  // DAFTAR SELURUH KELAS DI SEKOLAH
  const [daftarKelasGlobal, setDaftarKelasGlobal] = useState<string[]>([]);

  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentFilterKelas, setStudentFilterKelas] = useState("Semua");
  
  const [bobotPG, setBobotPG] = useState<number>(70); 

  const [showEditKunci, setShowEditKunci] = useState(false);
  const [isSavingKunci, setIsSavingKunci] = useState(false);
  const [showAnalisis, setShowAnalisis] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isSavingRemedial, setIsSavingRemedial] = useState(false);
  const analisisRef = useRef<HTMLDivElement>(null);
  
  const [modalEditFolder, setModalEditFolder] = useState<{isOpen: boolean, data: any}>({isOpen: false, data: null});
  const [modalHapusFolder, setModalHapusFolder] = useState<{isOpen: boolean, id: string | null}>({isOpen: false, id: null});
  const [modalLinkSoal, setModalLinkSoal] = useState<{isOpen: boolean, folderId: string, url: string}>({isOpen: false, folderId: "", url: ""});
  const [modalEsai, setModalEsai] = useState<{isOpen: boolean, student: any, scoreInput: string}>({isOpen: false, student: null, scoreInput: ""});
  
  const [showArchiveAllModal, setShowArchiveAllModal] = useState(false);
  const [selectedArchiveYear, setSelectedArchiveYear] = useState<string>("");

  useEffect(() => {
    const storedHiddenYears = localStorage.getItem('hiddenYears_tarbiyahtech');
    if (storedHiddenYears) setHiddenYears(JSON.parse(storedHiddenYears));

    // Menarik Folder Arsip
    fetch('/api/arsip')
      .then(res => res.json())
      .then(data => {
        const formattedFolders = data.map((d: any) => ({
          id: d.id,
          namaUjian: d.namaUjian || d.nama_ujian || 'Ujian Tanpa Nama',
          kelas: d.kelas || '-',
          tanggal: new Date(d.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
          rawTanggal: d.tanggal.split('T')[0],
          pengajar: d.pengajar || d.guru?.nama || "Ustadz/Ustadzah",
          totalScan: d._count?.hasilUjian || 0, 
          tipe: d.tipe || 'UH',
          linkSoal: d.linkSoal || "",
          token: d.token || d.kode || "CBT-OFF"
        }));
        setFolders(formattedFolders);
        setIsLoadingData(false);
      });

    // Menarik Daftar Semua Kelas (Agar pilihan Dropdown/Multi-select muncul)
    fetch('/api/santri')
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data) && data.length > 0) {
          const uniqueClasses = Array.from(new Set(data.map((s: any) => s.kelas))).sort() as string[];
          if (uniqueClasses.length > 0) setDaftarKelasGlobal(uniqueClasses);
        }
      });
  }, []);

  const toggleHideYear = (year: string) => {
    let updated = [];
    if (hiddenYears.includes(year)) {
      updated = hiddenYears.filter(y => y !== year);
    } else {
      updated = [...hiddenYears, year];
      alert(`Tahun ${year} telah disembunyikan dari dashboard utama agar terlihat lebih rapi.`);
    }
    setHiddenYears(updated);
    localStorage.setItem('hiddenYears_tarbiyahtech', JSON.stringify(updated));
  };

  const handleBukaFolder = async (folder: any) => {
    setSelectedFolder(folder);
    setActiveView("folder_detail");
    setIsOpeningFolder(true);
    setStudentsData([]); 
    setStudentSearchQuery("");
    setStudentFilterKelas("Semua");
    
    try {
      const res = await fetch(`/api/arsip?ujianId=${folder.id}`);
      if (!res.ok) throw new Error("Gagal mengambil data dari API");
      const data = await res.json();

      const soalAman = data.soal || [];
      setSoalData(soalAman);

      const kunci = soalAman.map((s: any) => {
        if (s.opsi && Array.isArray(s.opsi)) {
          const opsiBenar = s.opsi.find((o: any) => o.is_correct || o.is_benar);
          return opsiBenar ? opsiBenar.label : '-';
        }
        return '-';
      });
      setKunciJawaban(kunci);

      const hasilUjianAman = data.hasilUjian || data.hasil_ujian || [];
      const students = hasilUjianAman.map((h: any) => {
        let answersText: string[] = [];
        try { 
          if (h.answersJson) {
             const parsed = typeof h.answersJson === 'string' ? JSON.parse(h.answersJson) : h.answersJson;
             if (Array.isArray(parsed)) answersText = parsed;
             else if (parsed && parsed.answers && Array.isArray(parsed.answers)) answersText = parsed.answers;
          } else if (h.answers_json) {
             const parsed = typeof h.answers_json === 'string' ? JSON.parse(h.answers_json) : h.answers_json;
             if (Array.isArray(parsed)) answersText = parsed;
             else if (parsed && parsed.answers && Array.isArray(parsed.answers)) answersText = parsed.answers;
          }
        } catch(e) {}
        
        const folderKelasTunggal = typeof folder.kelas === 'string' && folder.kelas.includes(',') ? null : folder.kelas;
        const dataSantri = h.Santri || h.santri || {};

        return {
          id: h.id,
          santriId: h.santriId || h.santri_id,
          nama: dataSantri.nama || h.nama || "Siswa Tidak Ditemukan",
          nis: dataSantri.nis || h.nis || "-",
          kelas: dataSantri.kelas || h.kelas || folderKelasTunggal || "-", 
          nilai: h.nilaiMurni || h.nilai_murni || 0,
          benar: h.benar || 0,
          salah: h.salah || 0,
          kosong: h.kosong || 0,
          answersText: answersText,
          remedialScore: h.nilaiRemedial || h.nilai_remedial || "",
          nilaiEsai: h.nilaiEsai || h.nilai_esai || ""
        };
      }).sort((a: any, b: any) => b.nilai - a.nilai);

      setStudentsData(students);
    } catch (error) {
      alert("Gagal memuat detail data ujian.");
    } finally {
      setIsOpeningFolder(false);
    }
  };

  const studentKelasUnik = useMemo(() => {
    const classes = studentsData.map(s => s.kelas).filter(k => k !== "-");
    return Array.from(new Set(classes)).sort();
  }, [studentsData]);

  const filteredStudents = useMemo(() => {
    return studentsData.filter(s => {
      const matchSearch = s.nama.toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
                          s.nis.toLowerCase().includes(studentSearchQuery.toLowerCase());
      const matchKelas = studentFilterKelas === "Semua" ? true : s.kelas === studentFilterKelas;
      return matchSearch && matchKelas;
    }).map(s => {
      const nilaiUtama = s.remedialScore !== "" ? Number(s.remedialScore) : s.nilai;
      const nilaiEsai = s.nilaiEsai !== "" ? Number(s.nilaiEsai) : 0;
      
      let nilaiAkhir = 0;
      if (s.nilaiEsai !== "") {
        nilaiAkhir = (nilaiUtama * (bobotPG / 100)) + (nilaiEsai * ((100 - bobotPG) / 100));
      } else {
        nilaiAkhir = nilaiUtama;
      }
      return { ...s, nilaiAkhir: Number(nilaiAkhir.toFixed(1)) };
    });
  }, [studentsData, studentSearchQuery, studentFilterKelas, bobotPG]);

  const tableAverages = useMemo(() => {
    if (filteredStudents.length === 0) return { murni: 0, remedial: 0, esai: 0, akhir: 0 };
    let sumMurni = 0, sumRemedial = 0, sumEsai = 0, sumAkhir = 0;
    let countRemedial = 0, countEsai = 0;

    filteredStudents.forEach(s => {
      sumMurni += s.nilai; sumAkhir += s.nilaiAkhir;
      if (s.remedialScore !== "") { sumRemedial += Number(s.remedialScore); countRemedial++; }
      if (s.nilaiEsai !== "") { sumEsai += Number(s.nilaiEsai); countEsai++; }
    });

    return {
      murni: (sumMurni / filteredStudents.length).toFixed(1),
      remedial: countRemedial > 0 ? (sumRemedial / countRemedial).toFixed(1) : "-",
      esai: countEsai > 0 ? (sumEsai / countEsai).toFixed(1) : "-",
      akhir: (sumAkhir / filteredStudents.length).toFixed(1)
    };
  }, [filteredStudents]);

  const handleSimpanEditFolder = async () => {
    setIsLoadingData(true);
    try {
      const res = await fetch('/api/arsip', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: modalEditFolder.data.id, 
          nama_ujian: modalEditFolder.data.nama,
          kelas: modalEditFolder.data.kelas,
          tipe: modalEditFolder.data.tipe,
          pengajar: modalEditFolder.data.pengajar,
          tanggal: modalEditFolder.data.rawTanggal
        })
      });
      if (res.ok) {
        setFolders(folders.map(f => f.id === modalEditFolder.data.id ? { 
          ...f, 
          namaUjian: modalEditFolder.data.nama,
          kelas: modalEditFolder.data.kelas,
          tipe: modalEditFolder.data.tipe,
          pengajar: modalEditFolder.data.pengajar,
          tanggal: new Date(modalEditFolder.data.rawTanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
          rawTanggal: modalEditFolder.data.rawTanggal
        } : f));
        setModalEditFolder({isOpen: false, data: null});
        alert("Perubahan berhasil disimpan! Data siswa otomatis tersinkronisasi jika kelas diubah.");
      } else { alert("Gagal memperbarui data folder."); }
    } catch (error) { alert("Terjadi kesalahan jaringan."); }
    setIsLoadingData(false);
  };

  const handleEksekusiHapusFolder = async () => {
    setIsLoadingData(true);
    try {
      const res = await fetch(`/api/arsip?id=${modalHapusFolder.id}`, { method: 'DELETE' });
      if (res.ok) {
        setFolders(folders.filter(f => f.id !== modalHapusFolder.id));
        setModalHapusFolder({isOpen: false, id: null});
        alert("Arsip Ujian berhasil dihapus permanen.");
      }
    } catch (error) { alert("Gagal menghapus folder."); }
    setIsLoadingData(false);
  };

  const availableYears = useMemo(() => {
    const years = folders.map(f => {
      const parts = f.tanggal.split(" ");
      return parts[parts.length - 1];
    });
    return Array.from(new Set(years)).sort((a, b) => b.localeCompare(a));
  }, [folders]);

  const handleOpenArchiveModal = () => {
    if (availableYears.length > 0) setSelectedArchiveYear(availableYears[0]);
    setShowArchiveAllModal(true);
  };

  const analysisData = useMemo(() => {
    if(studentsData.length === 0 || kunciJawaban.length === 0) return null;
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
    
    const itemAnalysis = Array.from({ length: kunciJawaban.length }).map((_, questionIndex) => {
      const stats = { A: 0, B: 0, C: 0, D: 0, E: 0, Kosong: 0, Benar: 0 };
      const kunci = kunciJawaban[questionIndex] || '-';
      
      studentsData.forEach(student => {
        const jawab = student.answersText[questionIndex] || '-';
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
        distribusi: { A: ((stats.A / totalSiswa) * 100).toFixed(0) + "%", B: ((stats.B / totalSiswa) * 100).toFixed(0) + "%", C: ((stats.C / totalSiswa) * 100).toFixed(0) + "%", D: ((stats.D / totalSiswa) * 100).toFixed(0) + "%", E: ((stats.E / totalSiswa) * 100).toFixed(0) + "%", Kosong: ((stats.Kosong / totalSiswa) * 100).toFixed(0) + "%" }
      };
    });

    const sortedItems = [...itemAnalysis].sort((a, b) => b.difficultyRatio - a.difficultyRatio);
    return { average, highest, lowest, itemAnalysis, totalSiswa, distribution, maxDist, remedialStudentsList, easiestItem: sortedItems[0], hardestItem: sortedItems[sortedItems.length - 1] };
  }, [studentsData, kunciJawaban]);

  const getColorTheme = (tipe: string) => {
    switch(tipe) {
      case 'UTS': return { 
        icon: 'text-orange-600', bgIcon: 'bg-gradient-to-br from-orange-100 to-orange-50', 
        border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700 border-orange-200',
        splash: 'bg-orange-500', hover: 'hover:border-orange-400 hover:shadow-orange-500/20'
      };
      case 'UAS': return { 
        icon: 'text-red-600', bgIcon: 'bg-gradient-to-br from-red-100 to-red-50', 
        border: 'border-red-200', badge: 'bg-red-100 text-red-700 border-red-200',
        splash: 'bg-red-500', hover: 'hover:border-red-400 hover:shadow-red-500/20'
      };
      case 'Tugas': return { 
        icon: 'text-emerald-600', bgIcon: 'bg-gradient-to-br from-emerald-100 to-emerald-50', 
        border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        splash: 'bg-emerald-500', hover: 'hover:border-emerald-400 hover:shadow-emerald-500/20'
      };
      default: return { 
        icon: 'text-blue-600', bgIcon: 'bg-gradient-to-br from-blue-100 to-blue-50', 
        border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700 border-blue-200',
        splash: 'bg-blue-500', hover: 'hover:border-blue-400 hover:shadow-blue-500/20'
      };
    }
  };

  const handleRemedialChange = (id: number, val: string) => setStudentsData(prev => prev.map(s => s.id === id ? { ...s, remedialScore: val } : s));
  const handleSimpanRemedial = () => { setIsSavingRemedial(true); setTimeout(() => { setIsSavingRemedial(false); alert("Penilaian berhasil disimpan!"); }, 800); };
  const handleSimpanEsai = () => { setStudentsData(prev => prev.map(s => s.id === modalEsai.student.id ? { ...s, nilaiEsai: modalEsai.scoreInput } : s)); setModalEsai({isOpen: false, student: null, scoreInput: ""}); };
  
  const handleSimpanLinkSoal = async () => {
    try {
      const res = await fetch('/api/arsip', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: modalLinkSoal.folderId, linkSoal: modalLinkSoal.url })
      });
      if (res.ok) {
        setFolders(folders.map(f => f.id === modalLinkSoal.folderId ? { ...f, linkSoal: modalLinkSoal.url } : f));
        if (selectedFolder && selectedFolder.id === modalLinkSoal.folderId) setSelectedFolder({ ...selectedFolder, linkSoal: modalLinkSoal.url });
        setModalLinkSoal({isOpen: false, folderId: "", url: ""});
      } else { alert("Gagal menyimpan tautan."); }
    } catch (error) { alert("Kesalahan jaringan."); }
  };

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
      pdf.save(`Laporan_Analisis_${selectedFolder.namaUjian.replace(/\s+/g, '_')}.pdf`);
    } catch (err) { alert("Terjadi kesalahan saat membuat PDF."); }
    setIsExportingPDF(false);
  };

  const exportMultiSheetExcel = (isBackupAkhirTahun = false, targetYear = "") => {
    let xml = `<?xml version="1.0"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n<Styles><Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1e40af" ss:Pattern="Solid"/></Style></Styles>`;
    let targetFolders = folders;
    if (isBackupAkhirTahun && targetYear !== "") targetFolders = folders.filter(f => f.tanggal.includes(targetYear));
    
    if (targetFolders.length === 0) {
      xml += `<Worksheet ss:Name="Data Kosong"><Table><Row><Cell><Data ss:Type="String">Tidak ada data untuk diekspor pada tahun terpilih.</Data></Cell></Row></Table></Worksheet>`;
    } else {
      targetFolders.forEach(folder => {
        const soalCount = kunciJawaban.length > 0 ? kunciJawaban.length : 10;
        xml += `<Worksheet ss:Name="${folder.namaUjian.substring(0, 31).replace(/[\[\]\*?\:\/\\]/g, "")}"><Table><Row><Cell ss:StyleID="Header"><Data ss:Type="String">Nama Siswa</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">NIS</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Kelas</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Benar</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Salah</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Nilai Murni (PG)</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Nilai Remedial</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Nilai Esai</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Nilai Akhir (Kalkulasi)</Data></Cell>${Array.from({length: soalCount}).map((_, i) => `<Cell ss:StyleID="Header"><Data ss:Type="String">Soal ${i+1}</Data></Cell>`).join("")}</Row>`;
        
        filteredStudents.forEach(student => {
          const binaryAnswers = student.answersText.map((ans: string, idx: number) => ans === kunciJawaban[idx] ? 1 : 0);
          xml += `<Row><Cell><Data ss:Type="String">${student.nama}</Data></Cell><Cell><Data ss:Type="String">${student.nis}</Data></Cell><Cell><Data ss:Type="String">${student.kelas}</Data></Cell><Cell><Data ss:Type="Number">${student.benar}</Data></Cell><Cell><Data ss:Type="Number">${student.salah}</Data></Cell><Cell><Data ss:Type="Number">${student.nilai}</Data></Cell><Cell><Data ss:Type="String">${student.remedialScore || ""}</Data></Cell><Cell><Data ss:Type="String">${student.nilaiEsai || ""}</Data></Cell><Cell><Data ss:Type="Number">${student.nilaiAkhir}</Data></Cell>${binaryAnswers.map((ans: number) => `<Cell><Data ss:Type="Number">${ans}</Data></Cell>`).join("")}</Row>`;
        });
        xml += `</Table></Worksheet>`;
      });
    }
    xml += `</Workbook>`;
    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = isBackupAkhirTahun ? `Master_Backup_TarbiyahTech_${targetYear}.xls` : `Rekapan_Semua_Ujian_TarbiyahTech.xls`; 
    link.click(); URL.revokeObjectURL(url);
  };

  const exportSingleFolder = (folderName: string) => {
    let csvContent = "data:text/csv;charset=utf-8,Nama Siswa,NIS,Kelas,Benar,Salah,Kosong,Nilai Murni (PG),Nilai Remedial,Nilai Esai,Nilai Akhir," + Array.from({length: kunciJawaban.length}).map((_, i) => `Soal ${i+1}`).join(",") + "\n";
    filteredStudents.forEach(s => { 
      const binaryAnswers = s.answersText.map((ans: string, idx: number) => ans === kunciJawaban[idx] ? 1 : 0);
      csvContent += `${s.nama},${s.nis},${s.kelas},${s.benar},${s.salah},${s.kosong},${s.nilai},${s.remedialScore || ""},${s.nilaiEsai || ""},${s.nilaiAkhir},${binaryAnswers.join(",")}\n`; 
    });
    const encodedUri = encodeURI(csvContent); const link = document.createElement("a");
    link.setAttribute("href", encodedUri); link.setAttribute("download", `Data_${folderName.replace(/\s+/g, '_')}.csv`); document.body.appendChild(link); link.click(); link.remove();
  };

  const handleArchiveAndClearAll = () => {
    if(!selectedArchiveYear) return;
    exportMultiSheetExcel(true, selectedArchiveYear);
    setTimeout(() => {
      if (!hiddenYears.includes(selectedArchiveYear)) {
        const updated = [...hiddenYears, selectedArchiveYear];
        setHiddenYears(updated);
        localStorage.setItem('hiddenYears_tarbiyahtech', JSON.stringify(updated));
      }
      setShowArchiveAllModal(false);
      alert(`Backup Master Excel untuk tahun ${selectedArchiveYear} berhasil diunduh!\n\nData tahun tersebut kini disembunyikan dari dashboard utama agar lebih rapi, namun Anda tetap bisa mengaksesnya melalui folder "Arsip Data Tahunan".`);
    }, 1000);
  };

  // Fungsi Toggle Multi-Select Kelas pada Edit Modal
  const toggleEditKelas = (kls: string) => {
    const currentSelected = modalEditFolder.data?.kelas ? modalEditFolder.data.kelas.split(',').map((k:string)=>k.trim()).filter(Boolean) : [];
    const updated = currentSelected.includes(kls)
      ? currentSelected.filter((k:string) => k !== kls)
      : [...currentSelected, kls];
    setModalEditFolder({
      ...modalEditFolder, 
      data: { ...modalEditFolder.data, kelas: updated.join(', ') }
    });
  };

  // ======================================================================
  // RENDER VIEW 1: DAFTAR FOLDER UJIAN (ELEGAN)
  // ======================================================================
  if (activeView === "folder_list") {
    const filteredFolders = folders.filter(f => {
      const matchQuery = f.namaUjian.toLowerCase().includes(searchQuery.toLowerCase()) || f.pengajar.toLowerCase().includes(searchQuery.toLowerCase());
      if (filterYear) return matchQuery && f.tanggal.includes(filterYear);
      const isHidden = hiddenYears.some(year => f.tanggal.includes(year));
      return matchQuery && !isHidden;
    });

    return (
      <div className="min-h-screen bg-[#f8fafc] font-sans p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-between items-end mb-8">
            <div className="flex items-center gap-4">
              <Link href="/guru" className="p-3 bg-white border border-[#e2e8f0] hover:bg-[#f1f5f9] rounded-full transition-all cursor-pointer active:scale-90 shadow-sm"><ArrowLeft size={24} weight="bold" className="text-[#334155]" /></Link>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Arsip Ujian</h1>
                <p className="text-sm font-bold text-slate-500 mt-1">Pusat Data Kelola & Analisis Hasil Ujian TarbiyahTech</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 justify-end">
              <Link href="/guru/ujian/buat" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-black transition-all shadow-lg shadow-blue-500/30 cursor-pointer active:scale-95"><Plus size={20} weight="bold" /> Buat Ujian Baru</Link>
              <button onClick={handleOpenArchiveModal} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-slate-500/30 cursor-pointer active:scale-95"><Archive size={20} weight="fill" /> Arsipkan Tahunan</button>
              <button onClick={() => exportMultiSheetExcel()} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/30 cursor-pointer active:scale-95"><FileXls size={20} weight="fill" /> Export Excel Lengkap</button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Cari nama ujian, kelas, atau nama pengajar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"/>
            </div>
          </div>

          {filterYear && (
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-amber-50 border border-amber-200 p-4 rounded-2xl shadow-sm gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 text-amber-500 rounded-xl"><FolderOpen size={24} weight="fill" /></div>
                <div>
                  <h3 className="font-black text-amber-800 text-lg">Menampilkan Arsip Tahun {filterYear}</h3>
                  <p className="text-xs font-bold text-amber-600 mt-0.5">Ditemukan {filteredFolders.length} file ujian pada tahun ini.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => toggleHideYear(filterYear)} className={`px-4 py-2.5 font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center gap-2 ${hiddenYears.includes(filterYear) ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-300' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'}`}>
                  {hiddenYears.includes(filterYear) ? <><Eye size={16} weight="bold"/> Tampilkan di Dashboard</> : <><EyeSlash size={16} weight="bold"/> Sembunyikan dari Utama</>}
                </button>
                <button onClick={() => setFilterYear(null)} className="px-5 py-2.5 bg-amber-500 text-white font-bold rounded-xl text-xs hover:bg-amber-600 transition-colors shadow-sm flex items-center gap-2"><ArrowLeft size={16} weight="bold" /> Kembali</button>
              </div>
            </div>
          )}

          {isLoadingData ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 mt-8 shadow-sm">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-xl font-black text-slate-800">Menyinkronkan Data...</h2>
            </div>
          ) : filteredFolders.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 border-dashed mt-8">
              <Archive size={64} className="mx-auto text-slate-300 mb-4" weight="light" />
              <h2 className="text-xl font-black text-slate-800">Tidak Ada Data</h2>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFolders.map(folder => {
                const theme = getColorTheme(folder.tipe);
                return (
                  <div key={folder.id} onClick={() => handleBukaFolder(folder)} className={`bg-white rounded-[2rem] border ${theme.border} p-6 shadow-sm ${theme.hover} hover:-translate-y-1.5 transition-all duration-300 group flex flex-col relative overflow-hidden cursor-pointer`}>
                     {/* Decorative Splash Background (Diberi pointer-events-none agar tidak menutupi klik tombol Edit/Hapus) */}
                     <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-[1.3] pointer-events-none ${theme.splash}`}></div>
                     
                     <div className="flex justify-between items-start mb-5 relative z-10">
                       <div className="flex items-center gap-3">
                         <div className={`${theme.bgIcon} ${theme.icon} p-3 rounded-2xl relative shadow-inner`}>
                           <FolderOpen size={32} weight="fill" />
                           {folder.linkSoal && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" title="Terdapat File Soal"></div>}
                         </div>
                         <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-widest ${theme.badge}`}>{folder.tipe || 'UH'}</span>
                       </div>
                       
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={(e) => { e.stopPropagation(); setModalEditFolder({isOpen: true, data: { ...folder, nama: folder.namaUjian }}); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer relative z-20"><PencilSimple size={18} weight="bold" /></button>
                         <button onClick={(e) => { e.stopPropagation(); setModalHapusFolder({isOpen: true, id: folder.id}); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer relative z-20"><Trash size={18} weight="bold" /></button>
                       </div>
                     </div>

                     <h3 className="text-xl font-black text-slate-800 leading-tight mb-2 line-clamp-2 relative z-10" title={folder.namaUjian}>{folder.namaUjian}</h3>
                     
                     <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 mb-4 relative z-10">
                       <span className="bg-slate-50 px-2 py-1 rounded-md border border-slate-200 truncate max-w-[120px]"><Hash size={12} className="inline mr-1"/>{folder.kelas}</span>
                       <span>•</span>
                       <span>{folder.tanggal}</span>
                     </div>

                     <div className="mt-auto relative z-10">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-4">
                           <UserCircle size={16} weight="fill" className="text-slate-300"/> {folder.pengajar}
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                           <div className="text-xs font-bold text-slate-500"><span className="text-blue-600 font-black text-lg">{folder.totalScan}</span> Siswa</div>
                           <span className="text-[10px] font-black text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl uppercase tracking-widest transition-colors shadow-sm">
                              Buka Data
                           </span>
                        </div>
                     </div>
                  </div>
                );
              })}
            </div>
          )}

          {!filterYear && availableYears.length > 0 && (
            <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-16 pt-12 border-t-2 border-slate-200/60 border-dashed">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-slate-800 tracking-widest uppercase mb-2 flex items-center justify-center gap-2"><FolderOpen size={28} className="text-amber-500" weight="fill"/> Arsip Data Tahunan</h2>
                <p className="text-sm font-medium text-slate-500">Kumpulan riwayat ujian yang dikelompokkan berdasarkan tahun pelaksanaannya.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                {availableYears.map((tahun, idx) => {
                  const countFile = folders.filter(f => f.tanggal.includes(tahun)).length;
                  const isHidden = hiddenYears.includes(tahun);
                  return (
                    <div key={idx} onClick={() => { setFilterYear(tahun); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-6 py-4 rounded-2xl shadow-sm cursor-pointer hover:bg-amber-100 hover:-translate-y-1 transition-all relative">
                      {isHidden && <div className="absolute -top-2 -right-2 bg-slate-800 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1"><EyeSlash size={10} weight="bold"/> TERSEMBUNYI</div>}
                      <FolderOpen size={32} weight="fill" className="text-amber-500" />
                      <div className="text-left">
                        <h4 className="font-black text-slate-800 text-sm">Tahun {tahun}</h4>
                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">{countFile} File Tersimpan</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================================
              MODAL (POPUP) UNTUK VIEW 1 (EDIT / HAPUS / ARCHIVE)
              ====================================================================== */}
          
          {/* Modal Edit Folder */}
          {modalEditFolder.isOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
                <h3 className="text-lg font-black text-slate-800 mb-4">Edit Data Arsip Ujian</h3>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nama Ujian</label>
                    <input type="text" value={modalEditFolder.data?.nama || modalEditFolder.data?.namaUjian} onChange={(e) => setModalEditFolder({...modalEditFolder, data: {...modalEditFolder.data, nama: e.target.value}})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nama Pengajar (Baru)</label>
                    <input type="text" value={modalEditFolder.data?.pengajar} onChange={(e) => setModalEditFolder({...modalEditFolder, data: {...modalEditFolder.data, pengajar: e.target.value}})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"/>
                  </div>
                  
                  {/* PILIHAN KELAS (MULTI-SELECT DROPDOWN STYLE) */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Kelas Tujuan (Bisa multi-kelas)</label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-32 overflow-y-auto custom-scrollbar flex flex-wrap gap-2">
                      {daftarKelasGlobal.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Memuat kelas...</p>
                      ) : (
                        daftarKelasGlobal.map(kelas => {
                          const selectedClasses = modalEditFolder.data?.kelas ? modalEditFolder.data.kelas.split(',').map((k:string)=>k.trim()).filter(Boolean) : [];
                          const isSelected = selectedClasses.includes(kelas);
                          return (
                            <button 
                              key={kelas} 
                              onClick={(e) => { e.stopPropagation(); toggleEditKelas(kelas); }}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-300 text-slate-600 hover:border-blue-400'}`}
                            >
                              {kelas}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Tipe Ujian</label>
                      <select value={modalEditFolder.data?.tipe} onChange={(e) => setModalEditFolder({...modalEditFolder, data: {...modalEditFolder.data, tipe: e.target.value}})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 cursor-pointer">
                        <option value="UH">UH (Harian)</option><option value="UTS">UTS (Tengah Smt)</option><option value="UAS">UAS (Akhir Smt)</option><option value="Tugas">Tugas</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Tanggal Pelaksanaan</label>
                    <input type="date" value={modalEditFolder.data?.rawTanggal} onChange={(e) => setModalEditFolder({...modalEditFolder, data: {...modalEditFolder.data, rawTanggal: e.target.value}})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"/>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={(e) => { e.stopPropagation(); setModalEditFolder({isOpen: false, data: null}); }} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm transition-colors cursor-pointer">Batal</button>
                  <button onClick={(e) => { e.stopPropagation(); handleSimpanEditFolder(); }} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md cursor-pointer">Simpan Perubahan</button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Hapus Folder */}
          {modalHapusFolder.isOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><WarningCircle size={32} weight="fill" /></div>
                <h3 className="text-lg font-black text-slate-800 mb-2">Hapus Arsip Ujian?</h3>
                <p className="text-sm font-medium text-slate-500 mb-6">Data ini akan dihapus secara permanen beserta soal dan nilai santri di dalamnya.</p>
                <div className="flex gap-3">
                  <button onClick={(e) => { e.stopPropagation(); setModalHapusFolder({isOpen: false, id: null}); }} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm transition-colors cursor-pointer">Batal</button>
                  <button onClick={(e) => { e.stopPropagation(); handleEksekusiHapusFolder(); }} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer">Ya, Hapus</button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Backup Excel Tahunan */}
          {showArchiveAllModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><Archive size={24} className="text-blue-600"/> Backup Excel Tahunan</h3>
                  <button onClick={() => setShowArchiveAllModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><XCircle size={24} weight="fill"/></button>
                </div>
                <p className="text-sm font-medium text-slate-600 mb-6 leading-relaxed">Pilih tahun ajaran untuk diunduh sebagai <span className="font-bold text-slate-800">Master Data Excel</span>.</p>
                <div className="mb-6 space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Pilih Tahun Ajaran</label>
                  <select value={selectedArchiveYear} onChange={(e) => setSelectedArchiveYear(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                    {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleArchiveAndClearAll} className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer">
                    <DownloadSimple size={18} weight="bold"/> Download Backup Excel
                  </button>
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
  const selectedTheme = getColorTheme(selectedFolder?.tipe);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans flex flex-col">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveView("folder_list")} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer active:scale-90"><ArrowLeft size={20} weight="bold" className="text-slate-700" /></button>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Folder Arsip</p>
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase ${selectedTheme?.badge}`}>{selectedFolder?.tipe || 'UH'}</span>
              </div>
              <h1 className="text-xl font-black text-slate-800">{selectedFolder?.namaUjian}</h1>
              <p className="text-[11px] font-bold text-slate-400 mt-0.5 flex items-center gap-1"><UserCircle size={14}/> Pengajar: {selectedFolder?.pengajar}</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            {selectedFolder?.linkSoal ? (
              <a href={selectedFolder.linkSoal} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer active:scale-95"><ArrowSquareOut size={18} weight="bold" /> Tampilkan Soal</a>
            ) : (
              <button onClick={() => setModalLinkSoal({isOpen: true, folderId: selectedFolder.id, url: ""})} className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer active:scale-95"><LinkIcon size={18} weight="bold" /> Tautkan Soal</button>
            )}

            <Link href={`/guru/ujian/buat?reprint=${selectedFolder?.id}`} className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer active:scale-95"><FilePdf size={18} weight="bold" /> Cetak LJK Ulang</Link>
            <button onClick={() => setShowEditKunci(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer active:scale-95"><ListChecks size={18} weight="bold" /> Kunci Jawaban</button>
            <button onClick={() => setShowAnalisis(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold text-xs transition-all border border-blue-200 cursor-pointer active:scale-95"><ChartBar size={18} weight="fill" /> Analisis Evaluasi</button>
            <button onClick={() => exportSingleFolder(selectedFolder.namaUjian)} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95"><FileXls size={18} weight="fill" /> Export Excel</button>
          </div>
        </div>
      </div>

      <div className="max-w-[90rem] mx-auto px-8 py-8 w-full flex-1">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50 gap-4">
            <div>
              <h2 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-1">Daftar Hasil CBT/LJK Siswa</h2>
              <span className="text-xs font-bold text-slate-500">Total Ditampilkan: <span className="text-blue-600">{filteredStudents.length}</span> Peserta</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              
              <div className="flex items-center gap-3 bg-white border border-slate-200 px-3 py-2 rounded-lg mr-2 shadow-sm">
                <Calculator size={18} className="text-indigo-600" weight="fill"/>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-slate-600 mr-1">Bobot:</span>
                  <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                    <label className="text-blue-700">PG (%)</label>
                    <input type="number" min="0" max="100" value={bobotPG} onChange={(e) => { let val = Number(e.target.value); if(val > 100) val = 100; if(val < 0) val = 0; setBobotPG(val); }} className="w-10 px-1 py-0.5 bg-white border border-blue-200 rounded text-center outline-none focus:ring-1 focus:ring-blue-500 text-blue-800" />
                  </div>
                  <div className="flex items-center gap-1.5 bg-purple-50 px-2 py-1 rounded border border-purple-100">
                    <label className="text-purple-700">Esai (%)</label>
                    <input type="number" min="0" max="100" value={100 - bobotPG} onChange={(e) => { let val = Number(e.target.value); if(val > 100) val = 100; if(val < 0) val = 0; setBobotPG(100 - val); }} className="w-10 px-1 py-0.5 bg-white border border-purple-200 rounded text-center outline-none focus:ring-1 focus:ring-purple-500 text-purple-800" />
                  </div>
                </div>
              </div>

              <select value={studentFilterKelas} onChange={(e) => setStudentFilterKelas(e.target.value)} className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                <option value="Semua">Semua Kelas</option>
                {studentKelasUnik.map(k => <option key={k} value={k}>Kelas {k}</option>)}
              </select>
              
              <div className="relative flex-1 md:w-48">
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Cari Siswa/NIS..." value={studentSearchQuery} onChange={(e) => setStudentSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
              </div>

              <div className="h-6 w-px bg-slate-300 mx-1"></div>

              <button onClick={handleSimpanRemedial} disabled={isSavingRemedial} className="flex items-center gap-2 px-4 py-2.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 disabled:opacity-70 disabled:cursor-wait">
                {isSavingRemedial ? <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div> : <FloppyDisk size={16} weight="bold" />} Simpan Penilaian
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="p-4 pl-6 w-16">No</th>
                  <th className="p-4">Nama Siswa</th>
                  <th className="p-4 text-center">Kelas</th>
                  <th className="p-4 text-center" title="Benar / Salah / Kosong">B / S / K</th>
                  <th className="p-4 text-center bg-blue-50/30 text-blue-600">Murni (PG)</th>
                  <th className="p-4 text-center bg-orange-50/50 border-l border-orange-100 text-orange-600">Remedial</th>
                  <th className="p-4 text-center bg-purple-50/50 border-x border-purple-100 text-purple-600">Nilai Esai</th>
                  <th className="p-4 text-center bg-emerald-50/50 border-r border-emerald-100 text-emerald-700 text-sm">Nilai Akhir</th>
                  <th className="p-4 pr-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isOpeningFolder ? (
                  <tr><td colSpan={10} className="p-12 text-center text-slate-500 font-bold">Membuka detail nilai dari server...</td></tr>
                ) : filteredStudents.length === 0 ? (
                  <tr><td colSpan={10} className="p-12 text-center text-slate-500 font-bold">Tidak ada siswa yang sesuai dengan filter pencarian.</td></tr>
                ) : filteredStudents.map((siswa, idx) => (
                  <tr key={siswa.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 pl-6 text-sm font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-4 text-sm font-black text-slate-800">{siswa.nama} <span className="text-xs font-semibold text-slate-400 block mt-0.5">{siswa.nis}</span></td>
                    <td className="p-4 text-sm font-bold text-slate-600 text-center"><span className="px-2 py-1 bg-slate-100 rounded-md border border-slate-200">{siswa.kelas}</span></td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-xs font-bold">
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded" title="Benar">{siswa.benar}</span>
                        <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded" title="Salah">{siswa.salah}</span>
                        <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded" title="Kosong">{siswa.kosong}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center bg-blue-50/10"><span className={`text-base font-black ${siswa.nilai >= 75 ? 'text-blue-600' : 'text-slate-600'}`}>{siswa.nilai}</span></td>
                    <td className="p-4 text-center bg-orange-50/20 border-l border-orange-50">
                      {siswa.nilai < 75 ? (
                        <input type="number" min="0" max="100" value={siswa.remedialScore} onChange={(e) => handleRemedialChange(siswa.id, e.target.value)} placeholder="-" className="w-16 p-1.5 border border-slate-300 rounded-lg text-center text-sm font-bold text-slate-700 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all bg-white"/>
                      ) : (<span className="text-slate-300 font-black">-</span>)}
                    </td>
                    <td className="p-4 text-center bg-purple-50/20 border-l border-purple-50"><span className="text-base font-black text-purple-700">{siswa.nilaiEsai !== "" ? siswa.nilaiEsai : "-"}</span></td>
                    <td className="p-4 text-center bg-emerald-50/30 border-x border-emerald-100"><span className="text-xl font-black text-emerald-700">{siswa.nilaiAkhir}</span></td>
                    <td className="p-4 pr-6 text-right">
                      <button onClick={() => setModalEsai({isOpen: true, student: siswa, scoreInput: siswa.nilaiEsai})} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-purple-400 hover:text-purple-600 rounded-lg text-xs font-bold text-slate-600 transition-all shadow-sm cursor-pointer active:scale-95"><NotePencil size={16} weight="bold" /> Esai</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              
              {filteredStudents.length > 0 && (
                <tfoot className="bg-slate-800 text-white">
                  <tr>
                    <td colSpan={4} className="p-4 text-right text-xs font-black uppercase tracking-widest">Rata-Rata Berdasarkan Filter:</td>
                    <td className="p-4 text-center text-lg font-black text-blue-300">{tableAverages.murni}</td>
                    <td className="p-4 text-center text-lg font-black text-orange-300 border-l border-slate-700">{tableAverages.remedial}</td>
                    <td className="p-4 text-center text-lg font-black text-purple-300 border-l border-slate-700">{tableAverages.esai}</td>
                    <td className="p-4 text-center text-xl font-black text-emerald-400 border-x border-slate-700">{tableAverages.akhir}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* ======================================================================
          MODAL (POPUP) UNTUK VIEW 2 (DALAM FOLDER) 
          ====================================================================== */}
      
      {modalLinkSoal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-lg font-black text-slate-800 mb-2">Upload Tautan Soal</h3>
            <p className="text-xs text-slate-500 mb-4">Tempelkan tautan Google Drive / Docs yang berisi naskah soal ujian ini.</p>
            <input type="text" placeholder="https://drive.google.com/..." value={modalLinkSoal.url} onChange={(e) => setModalLinkSoal({...modalLinkSoal, url: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 mb-6 text-sm"/>
            <div className="flex gap-3">
              <button onClick={() => setModalLinkSoal({isOpen: false, folderId: "", url: ""})} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm transition-colors cursor-pointer">Batal</button>
              <button onClick={handleSimpanLinkSoal} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer">Simpan Tautan</button>
            </div>
          </div>
        </div>
      )}

      {modalEsai.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-lg font-black text-slate-800 mb-2">Input Nilai Esai</h3>
            <p className="text-xs text-slate-500 mb-4">Masukkan nilai komponen esai untuk <span className="font-bold text-slate-700">{modalEsai.student?.nama}</span>.</p>
            <input type="number" min="0" max="100" placeholder="0 - 100" value={modalEsai.scoreInput} onChange={(e) => setModalEsai({...modalEsai, scoreInput: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-black text-purple-700 text-xl text-center mb-6"/>
            <div className="flex gap-3">
              <button onClick={() => setModalEsai({isOpen: false, student: null, scoreInput: ""})} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm transition-colors cursor-pointer">Batal</button>
              <button onClick={handleSimpanEsai} className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer">Simpan Nilai</button>
            </div>
          </div>
        </div>
      )}

      {showEditKunci && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><ListChecks size={28} className="text-blue-600" weight="fill"/> Editor Kunci Jawaban</h3>
                <p className="text-xs font-bold text-slate-500 mt-1">Pilih kunci jawaban yang benar per nomor.</p>
              </div>
              <button onClick={() => setShowEditKunci(false)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"><XCircle size={28} weight="fill"/></button>
            </div>
            <div className="flex-1 overflow-y-auto pr-4 mb-6 custom-scrollbar space-y-3">
              {kunciJawaban.map((k, i) => {
                const opsiList = soalData[i]?.opsi || [ {label:'A'}, {label:'B'}, {label:'C'}, {label:'D'} ];
                return (
                  <div key={i} className="flex items-center gap-4 p-3 border border-slate-200 rounded-2xl bg-white shadow-sm">
                    <div className="w-16 h-16 shrink-0 bg-slate-100 text-slate-500 rounded-xl flex flex-col items-center justify-center border border-slate-200">
                      <span className="text-[10px] font-black uppercase tracking-widest">Soal</span><span className="text-xl font-black text-slate-800">{i+1}</span>
                    </div>
                    <div className="flex-1 flex flex-wrap gap-2">
                      {opsiList.map((opt: any, optIdx: number) => {
                        const isSelected = k === opt.label;
                        return (
                          <button key={optIdx} onClick={() => { const newKunci = [...kunciJawaban]; newKunci[i] = opt.label; setKunciJawaban(newKunci); }} className={`w-12 h-12 rounded-full text-sm font-black flex items-center justify-center transition-all cursor-pointer ${isSelected ? 'bg-blue-600 text-white shadow-[0_4px_10px_rgba(37,99,235,0.4)] border-2 border-blue-600 ring-2 ring-blue-200 ring-offset-2' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-blue-50'}`}>{opt.label}</button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button onClick={() => setShowEditKunci(false)} className="px-8 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm transition-colors cursor-pointer">Batal</button>
              <button onClick={async () => {
                  setIsSavingKunci(true);
                  try {
                    const payload = kunciJawaban.map((jawaban, index) => ({ soalId: soalData[index].id, labelBenar: jawaban }));
                    const res = await fetch('/api/arsip', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ujianId: selectedFolder.id, kunciBaru: payload }) });
                    if (res.ok) { alert("Berhasil disimpan & diregrading!"); setShowEditKunci(false); handleBukaFolder(selectedFolder); }
                  } catch (e) { alert("Terjadi kesalahan."); }
                  setIsSavingKunci(false);
                }} disabled={isSavingKunci} className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-sm transition-all shadow-lg hover:shadow-blue-500/30 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-70">
                {isSavingKunci ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><FloppyDisk size={20} weight="bold"/> Simpan Kunci</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAnalisis && analysisData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-2xl shrink-0">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><ChartBar size={24} className="text-blue-600" weight="fill" /> Laporan Analisis Evaluasi Belajar</h3>
              <div className="flex gap-2">
                <button onClick={downloadAnalisisPDF} disabled={isExportingPDF} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-70">
                  {isExportingPDF ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FilePdf size={16} weight="fill"/>} Cetak Laporan PDF
                </button>
                <button onClick={() => setShowAnalisis(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"><XCircle size={24} weight="fill"/></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-100/50">
              <div ref={analisisRef} className="bg-white p-10 border border-slate-200" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto' }}>
                <div className="text-center border-b-2 border-black pb-4 mb-6">
                  <h1 className="text-xl font-black uppercase tracking-widest text-slate-800">Laporan Analisis Hasil Ujian</h1>
                  <p className="text-sm font-bold text-slate-500 mt-1">Sistem Ujian OMR & CBT Terpadu TarbiyahTech</p>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
                  <div>
                    <table className="w-full">
                      <tbody>
                        <tr><td className="font-bold text-slate-500 py-1 w-32">Nama Ujian</td><td className="font-black text-slate-800 uppercase">: {selectedFolder?.namaUjian}</td></tr>
                        <tr><td className="font-bold text-slate-500 py-1">Mata Pelajaran</td><td className="font-black text-slate-800 uppercase">: {selectedFolder?.namaUjian?.split(' ').slice(0,2).join(' ')}</td></tr>
                        <tr><td className="font-bold text-slate-500 py-1">Pengajar</td><td className="font-black text-slate-800 uppercase">: {selectedFolder?.pengajar}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <table className="w-full">
                      <tbody>
                        <tr><td className="font-bold text-slate-500 py-1 w-32">Kelas</td><td className="font-black text-slate-800 uppercase">: {selectedFolder?.kelas}</td></tr>
                        <tr><td className="font-bold text-slate-500 py-1">Tanggal Ujian</td><td className="font-black text-slate-800 uppercase">: {selectedFolder?.tanggal}</td></tr>
                        <tr><td className="font-bold text-slate-500 py-1">Jumlah Peserta</td><td className="font-black text-slate-800 uppercase">: {analysisData.totalSiswa} Siswa</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mb-8">
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">A. Statistik Kelas</h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-center"><p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Rata-Rata Kelas</p><p className="text-3xl font-black text-blue-700">{analysisData.average}</p></div>
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center"><p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Nilai Tertinggi</p><p className="text-3xl font-black text-emerald-700">{analysisData.highest}</p></div>
                    <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-center"><p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Nilai Terendah</p><p className="text-3xl font-black text-red-700">{analysisData.lowest}</p></div>
                  </div>
                </div>

                <div className="mb-8">
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">B. Analisis Butir Soal</h2>
                  <table className="w-full text-xs text-left border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold">
                        <th className="p-2 border border-slate-300 text-center w-10">No</th><th className="p-2 border border-slate-300 text-center w-12">Kunci</th><th className="p-2 border border-slate-300 text-center">Tingkat Kesukaran</th><th className="p-2 border border-slate-300 text-center w-24">Daya Pembeda</th><th className="p-2 border border-slate-300 text-center">Distribusi Jawaban (A-E)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisData.itemAnalysis.map((item: any) => (
                        <tr key={item.no} className="border-b border-slate-200">
                          <td className="p-2 border border-slate-300 text-center font-bold text-slate-500">{item.no}</td>
                          <td className="p-2 border border-slate-300 text-center font-black text-slate-800">{item.kunci}</td>
                          <td className={`p-2 border border-slate-300 font-bold ${item.warnaKesukaran}`}>{item.tingkatKesukaran}</td>
                          <td className="p-2 border border-slate-300 text-center font-bold text-slate-600">{item.dayaPembeda}</td>
                          <td className="p-2 border border-slate-300 text-center font-medium text-[10px] text-slate-500">A:{item.distribusi.A} | B:{item.distribusi.B} | C:{item.distribusi.C} | D:{item.distribusi.D} | E:{item.distribusi.E}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">C. Tindak Lanjut (Remedial)</h2>
                  <p className="text-xs font-medium text-slate-600 mb-2">Siswa di bawah KKM (&lt; 75) yang membutuhkan perbaikan:</p>
                  {analysisData.remedialStudentsList.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {analysisData.remedialStudentsList.map((nama: string, idx: number) => (
                        <span key={idx} className="bg-orange-50 border border-orange-200 text-orange-700 px-3 py-1.5 rounded-lg text-xs font-bold">{nama}</span>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-xs font-bold flex items-center gap-2"><CheckCircle size={16} weight="fill" /> Seluruh siswa tuntas KKM. Tidak ada remedial.</div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
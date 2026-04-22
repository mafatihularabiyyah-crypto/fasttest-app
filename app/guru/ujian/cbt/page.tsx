"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, FloppyDisk, Plus, Trash, CheckCircle, 
  Desktop, Key, Clock, TextAa, ListNumbers,
  MagicWand, UserCircle, Star, CaretDown, CheckSquareOffset,
  ArrowsLeftRight, TextT, X, Image as ImageIcon, 
  FileArrowUp, Info, Eye, Notebook, FilePdf, FileDoc, Check, PaperPlaneTilt
} from "@phosphor-icons/react";
import jsPDF from "jspdf";
// Tambahkan di deretan import paling atas
import { saveDataSmart } from "@/utils/offlineStore";

// --- STRUKTUR DATA MULTIFORMAT ---
type QuestionType = 'pg' | 'kompleks' | 'bs' | 'menjodohkan' | 'isian' | 'upload';

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
  points: number;
  matchText?: string; 
  imageUrl?: string | null;
}

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  imageUrl?: string | null;
  options: Option[];
}

export default function CBTGeneratorSuperFinal() {
  const router = useRouter();

  // --- STATE UI & FLOW ---
  const [viewMode, setViewMode] = useState<'editor' | 'preview_entry' | 'taking_test' | 'result'>('editor');

  // --- STATE METADATA UJIAN ---
  const [examTitle, setExamTitle] = useState("Ujian Akhir Semester");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("1. Berdoa sebelum mengerjakan.\n2. Pastikan koneksi internet stabil.\n3. Dilarang membuka tab/aplikasi lain selama ujian berlangsung.");
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState(""); 
  const [duration, setDuration] = useState(90);
  const [token, setToken] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [examClass, setExamClass] = useState("");
  const [daftarKelas, setDaftarKelas] = useState<string[]>([]);

  // --- STATE JAWABAN SISWA (SIMULASI) ---
  const [studentAnswers, setStudentAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    fetch('/api/classes')
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data) && data.length > 0) {
          setDaftarKelas(data);
          setExamClass(data[0]); 
        }
      })
      .catch(err => console.error("Gagal memuat kelas:", err));
  }, []);

  // --- STATE SOAL DEFAULT ---
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: `q_${Date.now()}`,
      type: "pg",
      text: "",
      imageUrl: null,
      options: [
        { id: `opt_1_a`, text: "", isCorrect: true, points: 10, imageUrl: null },
        { id: `opt_1_b`, text: "", isCorrect: false, points: 0, imageUrl: null },
        { id: `opt_1_c`, text: "", isCorrect: false, points: 0, imageUrl: null },
        { id: `opt_1_d`, text: "", isCorrect: false, points: 0, imageUrl: null },
      ]
    }
  ]);

  // --- LOGIKA HITUNG TOTAL SKOR ---
  const totalSkorMaksimal = useMemo(() => {
    return questions.reduce((total, q) => {
      if (q.type === 'kompleks' || q.type === 'menjodohkan') {
        return total + q.options.reduce((sum, opt) => sum + (opt.isCorrect ? opt.points : 0), 0);
      }
      const correctOpts = q.options.filter(o => o.isCorrect);
      const maxPoints = correctOpts.length > 0 ? Math.max(...correctOpts.map(o => o.points)) : 0;
      return total + maxPoints;
    }, 0);
  }, [questions]);

  const skorSiswa = useMemo(() => {
    let total = 0;
    questions.forEach(q => {
      const ans = studentAnswers[q.id];
      if (!ans) return;

      if (q.type === 'pg' || q.type === 'bs') {
        const opt = q.options.find(o => o.id === ans);
        if (opt?.isCorrect) total += opt.points;
      } else if (q.type === 'isian') {
        const correctOpt = q.options[0];
        if (ans.trim().toLowerCase() === correctOpt.text.trim().toLowerCase()) total += correctOpt.points;
      } else if (q.type === 'kompleks' && Array.isArray(ans)) {
        q.options.forEach(opt => {
          if (opt.isCorrect && ans.includes(opt.id)) total += opt.points;
        });
      }
    });
    return total;
  }, [questions, studentAnswers]);

  // --- FUNGSI EXPORT DOCUMENT ---
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.text(examTitle.toUpperCase(), 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Pengajar: ${teacherName} | Kelas: ${examClass} | Durasi: ${duration} Menit`, 105, 27, { align: "center" });
    doc.line(20, 30, 190, 30);

    let y = 40;
    questions.forEach((q, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}. ${q.text || '...' }`, 20, y, { maxWidth: 170 });
      y += 8;
      
      doc.setFont("helvetica", "normal");
      if (q.type === 'isian') {
        doc.text("Jawaban: ________________________________________________", 25, y);
        y += 10;
      } else if (q.type === 'upload') {
        doc.text("[ Lembar Pengerjaan Esai Panjang / Upload Dokumen ]", 25, y);
        y += 10;
      } else if (q.type === 'menjodohkan') {
        q.options.forEach((opt, oi) => {
          doc.text(`${oi + 1}. ${opt.text || '...'}  (   )   ${opt.matchText || '...'}`, 25, y);
          y += 7;
        });
      } else {
        q.options.forEach((opt, oi) => {
          const label = q.type === 'bs' ? (oi === 0 ? 'B' : 'S') : String.fromCharCode(65 + oi);
          doc.text(`${label}. ${opt.text || '...'}`, 25, y);
          y += 7;
        });
      }
      y += 5;
    });
    doc.save(`Bank_Soal_${examTitle.replace(/\s+/g, '_')}.pdf`);
  };

  const handleExportWord = () => {
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${examTitle}</title></head>
      <body style="font-family: Arial, sans-serif;">
        <h1 style='text-align:center'>${examTitle.toUpperCase()}</h1>
        <p style='text-align:center'>Pengajar: ${teacherName} | Kelas: ${examClass} | Waktu: ${duration} Menit</p>
        <hr>
        ${questions.map((q, i) => `
          <p style="margin-top: 20px;"><b>${i + 1}. ${q.text}</b></p>
          ${q.type === 'isian' ? `<p>Jawaban: ___________________________________</p>` : ''}
          ${q.type === 'upload' ? `<p><i>[Area pengerjaan esai panjang / lampiran]</i></p>` : ''}
          ${q.type === 'menjodohkan' ? q.options.map((opt, oi) => `<p>${oi + 1}. ${opt.text} &nbsp;&nbsp;&nbsp; (....) &nbsp;&nbsp;&nbsp; ${opt.matchText}</p>`).join('') : ''}
          ${(q.type === 'pg' || q.type === 'kompleks' || q.type === 'bs') ? q.options.map((opt, oi) => `<p style="margin-left: 20px;">${q.type === 'bs' ? (oi === 0 ? 'B' : 'S') : String.fromCharCode(65 + oi)}. ${opt.text}</p>`).join('') : ''}
        `).join('')}
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bank_Soal_${examTitle.replace(/\s+/g, '_')}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- FUNGSI UPLOAD GAMBAR (BASE64) ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleHeaderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageUpload(e, setHeaderImage);
  };

  const setQuestionImage = (qId: string, imageUrl: string | null) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, imageUrl } : q));
  };

  const setOptionImage = (qId: string, optId: string, imageUrl: string | null) => {
    setQuestions(questions.map(q => q.id === qId ? {
      ...q, options: q.options.map(opt => opt.id === optId ? { ...opt, imageUrl } : opt)
    } : q));
  };

  // --- FUNGSI MANAJEMEN SOAL & OPSI ---
  const addQuestion = () => {
    const newId = `q_${Date.now()}`;
    setQuestions([...questions, {
      id: newId, type: "pg", text: "", imageUrl: null,
      options: [
        { id: `${newId}_a`, text: "", isCorrect: true, points: 10, imageUrl: null },
        { id: `${newId}_b`, text: "", isCorrect: false, points: 0, imageUrl: null },
        { id: `${newId}_c`, text: "", isCorrect: false, points: 0, imageUrl: null },
        { id: `${newId}_d`, text: "", isCorrect: false, points: 0, imageUrl: null },
      ]
    }]);
  };

  const removeQuestion = (idToRemove: string) => {
    if (questions.length === 1) return alert("Ujian minimal harus memiliki 1 soal.");
    if (confirm("Hapus soal ini?")) setQuestions(questions.filter(q => q.id !== idToRemove));
  };

  const updateQuestionText = (qId: string, newText: string) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, text: newText } : q));
  };

  const changeQuestionType = (qId: string, newType: QuestionType) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        let newOptions: Option[] = [];
        const baseId = `opt_${Date.now()}`;

        if (newType === 'bs') {
          newOptions = [
            { id: `${baseId}_b`, text: "Benar", isCorrect: true, points: 10, imageUrl: null },
            { id: `${baseId}_s`, text: "Salah", isCorrect: false, points: 0, imageUrl: null }
          ];
        } else if (newType === 'isian') {
          newOptions = [{ id: `${baseId}_isian`, text: "", isCorrect: true, points: 10, imageUrl: null }];
        } else if (newType === 'upload') {
          newOptions = [{ id: `${baseId}_up`, text: "Siswa akan upload file disini", isCorrect: true, points: 20, imageUrl: null }];
        } else if (newType === 'menjodohkan') {
          newOptions = [
            { id: `${baseId}_m1`, text: "", matchText: "", isCorrect: true, points: 10, imageUrl: null },
            { id: `${baseId}_m2`, text: "", matchText: "", isCorrect: true, points: 10, imageUrl: null }
          ];
        } else {
          newOptions = [
            { id: `${baseId}_a`, text: "", isCorrect: true, points: 10, imageUrl: null },
            { id: `${baseId}_b`, text: "", isCorrect: false, points: 0, imageUrl: null },
            { id: `${baseId}_c`, text: "", isCorrect: false, points: 0, imageUrl: null },
            { id: `${baseId}_d`, text: "", isCorrect: false, points: 0, imageUrl: null },
          ];
        }
        return { ...q, type: newType, options: newOptions };
      }
      return q;
    }));
  };

  const addOption = (qId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newOpt = { 
          id: `opt_${Date.now()}`, 
          text: "", 
          matchText: "", 
          isCorrect: q.type === 'menjodohkan', 
          points: q.type === 'menjodohkan' ? 10 : 0, 
          imageUrl: null 
        };
        return { ...q, options: [...q.options, newOpt] };
      }
      return q;
    }));
  };

  const removeOption = (qId: string, optId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId && q.options.length > 2) {
        return { ...q, options: q.options.filter(opt => opt.id !== optId) };
      }
      return q;
    }));
  };

  const updateOptionText = (qId: string, optId: string, newText: string, isMatch: boolean = false) => {
    setQuestions(questions.map(q => q.id === qId ? {
      ...q, options: q.options.map(opt => {
        if (opt.id === optId) return isMatch ? { ...opt, matchText: newText } : { ...opt, text: newText };
        return opt;
      })
    } : q));
  };

  const updateOptionPoints = (qId: string, optId: string, newPoints: number) => {
    setQuestions(questions.map(q => q.id === qId ? {
      ...q, options: q.options.map(opt => opt.id === optId ? { ...opt, points: newPoints } : opt)
    } : q));
  };

  const toggleCorrectAnswer = (qId: string, optId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          options: q.options.map(opt => {
            if (q.type === 'kompleks') {
              if (opt.id === optId) return { ...opt, isCorrect: !opt.isCorrect, points: !opt.isCorrect ? 10 : 0 };
              return opt;
            }
            const isNowCorrect = opt.id === optId;
            return { ...opt, isCorrect: isNowCorrect, points: isNowCorrect ? 10 : 0 }; 
          })
        };
      }
      return q;
    }));
  };

  // --- GENERATE TOKEN & SIMPAN ---
  const generateToken = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) { result += chars.charAt(Math.floor(Math.random() * chars.length)); }
    setToken(result);
  };

  // --- FUNGSI SIMPAN PINTAR (ONLINE & OFFLINE) ---
  const handleSaveExam = async () => {
    if (!examTitle || !teacherName || !examClass) return alert("Metadata wajib diisi lengkap!");
    if (!token) return alert("Silakan generate Token ujian terlebih dahulu!");
    
    setIsSaving(true);
    
    // 1. Bungkus semua data ujian yang sudah dibuat guru
    const payloadData = {
      title: examTitle,
      className: examClass,
      teacherName: teacherName,
      duration: duration,
      token: token,
      examType: "CBT",
      questions: questions 
    };

    // 2. Gunakan fungsi cerdas yang kita buat di utils
    // Dia akan otomatis mengecek: "Ada internet nggak? Kalau ada langsung kirim, kalau mati simpan di lokal."
    const result = await saveDataSmart('/api/exams/create', payloadData);

    // 3. Tampilkan pesan sesuai hasilnya
    if (result.mode === 'online') {
      alert(`Ujian CBT Berhasil Disimpan & Dipublikasikan ke Server!\nToken: ${token}`);
    } else {
      alert(`Anda Sedang Offline!\nUjian tersimpan secara aman di perangkat ini. Jangan lupa tekan "Sinkronkan" di Dashboard saat internet kembali menyala.`);
    }

    // 4. Pindah ke halaman dashboard
    router.push('/guru');
    setIsSaving(false);
  };

  const getLabel = (type: QuestionType, index: number) => {
    if (type === 'bs') return index === 0 ? 'B' : 'S';
    if (type === 'isian') return 'Kunci';
    if (type === 'upload') return 'Poin';
    if (type === 'menjodohkan') return (index + 1).toString();
    return String.fromCharCode(65 + index); 
  };


  // =====================================================================
  // RENDER 1: HALAMAN HASIL (RESULT & KOREKSI)
  // =====================================================================
  if (viewMode === 'result') {
    return (
      <div className="min-h-screen bg-slate-100 p-4 md:p-10 font-sans">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 mb-8">
            <div className="bg-indigo-600 p-10 md:p-16 text-white text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
              <CheckCircle size={80} weight="fill" className="mx-auto mb-6 text-emerald-400 relative z-10" />
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight relative z-10">Ujian Selesai!</h1>
              <p className="opacity-90 font-bold mt-3 text-lg relative z-10">Terima kasih, data ujian Anda telah terkirim ke server.</p>
              
              <div className="mt-10 bg-white/10 backdrop-blur-md rounded-3xl p-8 inline-block relative z-10 border border-white/20 shadow-xl">
                <p className="text-sm font-black uppercase tracking-widest opacity-80 mb-2">Nilai Akhir Anda</p>
                <p className="text-7xl font-black">{skorSiswa} <span className="text-2xl opacity-50 font-bold">/ {totalSkorMaksimal}</span></p>
              </div>
            </div>

            <div className="p-8 md:p-12">
              <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <Notebook size={28} className="text-indigo-600" weight="bold"/> Review Koreksi Jawaban
                </h2>
              </div>
              
              <div className="space-y-6">
                {questions.map((q, i) => {
                  const ans = studentAnswers[q.id];
                  
                  let isCorrect = false;
                  if (q.type === 'isian') {
                    isCorrect = ans?.trim().toLowerCase() === q.options[0].text.trim().toLowerCase();
                  } else if (q.type === 'kompleks' && Array.isArray(ans)) {
                    // Cek apakah jawaban kompleks benar (semua jawaban benar terpilih)
                    const correctOptionIds = q.options.filter(o => o.isCorrect).map(o => o.id);
                    isCorrect = correctOptionIds.every(id => ans.includes(id)) && ans.every(id => correctOptionIds.includes(id));
                  } else {
                    isCorrect = q.options.find(o => o.id === ans)?.isCorrect || false;
                  }

                  return (
                    <div key={q.id} className={`p-6 md:p-8 rounded-[2rem] border-2 transition-all ${isCorrect ? 'border-emerald-200 bg-emerald-50/50 shadow-sm' : 'border-red-200 bg-red-50/50 shadow-sm'}`}>
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <div>
                          <p className="font-black text-slate-800 text-lg leading-relaxed">{i+1}. {q.text}</p>
                          {q.imageUrl && <img src={q.imageUrl} className="mt-3 max-h-40 rounded-xl border border-slate-200" alt="Soal" />}
                        </div>
                        {isCorrect ? <CheckCircle size={32} weight="fill" className="text-emerald-500 shrink-0 drop-shadow-sm"/> : <X size={32} weight="bold" className="text-red-500 shrink-0"/>}
                      </div>
                      
                      <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-lg ${isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>Jawaban Anda:</span>
                          <span className={`font-bold ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                            {q.type === 'isian' ? (ans || "(Kosong)") : 
                             q.type === 'upload' ? "File Terunggah" :
                             q.type === 'kompleks' && Array.isArray(ans) ? ans.map(a => q.options.find(o => o.id === a)?.text).join(", ") :
                             q.options.find(o => o.id === ans)?.text || "(Kosong)"}
                          </span>
                        </div>

                        {!isCorrect && q.type !== 'upload' && (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-slate-100">
                            <span className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-indigo-100 text-indigo-700">Kunci Benar:</span>
                            <span className="font-bold text-indigo-700">
                              {q.type === 'isian' ? q.options[0].text : 
                               q.type === 'kompleks' ? q.options.filter(o => o.isCorrect).map(o => o.text).join(", ") :
                               q.options.find(o => o.isCorrect)?.text}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-12 flex flex-col sm:flex-row gap-4">
                <button onClick={() => {setStudentAnswers({}); setViewMode('editor');}} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs border border-slate-200">Kembali Ke Editor</button>
                <button onClick={() => {setStudentAnswers({}); setViewMode('taking_test');}} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all uppercase tracking-widest text-xs">Ulangi Simulasi Ujian</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // RENDER 2: SIMULASI PENGERJAAN (SISWA SEDANG UJIAN)
  // =====================================================================
  if (viewMode === 'taking_test') {
    return (
      <div className="min-h-screen bg-[#f8fafc] font-sans flex flex-col">
        <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-30 flex justify-between items-center px-6 lg:px-10 shadow-sm">
           <div className="font-black text-indigo-600 uppercase tracking-tighter text-xl flex items-center gap-2">
             <Desktop size={24} weight="fill"/> CBT MODE
           </div>
           <div className="flex items-center gap-4">
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2 rounded-xl font-black flex items-center gap-2 shadow-sm animate-pulse">
                <Clock size={20} weight="bold" /> {duration}:00 Menit
              </div>
           </div>
        </header>

        <main className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-10 pb-32">
          <div className="space-y-10">
            {questions.map((q, i) => (
              <div key={q.id} className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                <div className="flex items-start gap-4 mb-6">
                  <span className="w-12 h-12 shrink-0 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-200">{i+1}</span>
                  <div className="pt-1">
                    <p className="text-xl font-bold text-slate-800 leading-relaxed">{q.text}</p>
                    {q.imageUrl && <img src={q.imageUrl} className="mt-6 max-h-80 rounded-2xl border border-slate-200 shadow-sm" alt="Lampiran Soal" />}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3 mt-8">
                  {/* ISIAN */}
                  {q.type === 'isian' && (
                    <input 
                      type="text" 
                      value={studentAnswers[q.id] || ''}
                      onChange={(e) => setStudentAnswers({...studentAnswers, [q.id]: e.target.value})}
                      placeholder="Ketik jawaban Anda disini..." 
                      className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-lg outline-none focus:border-indigo-500 focus:bg-white transition-all" 
                    />
                  )}

                  {/* UPLOAD FILE */}
                  {q.type === 'upload' && (
                    <div className="border-2 border-dashed border-slate-300 bg-slate-50 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                      <FileArrowUp size={48} className="text-slate-400 mb-3" weight="duotone"/>
                      <p className="font-bold text-slate-600">Klik untuk mengunggah file jawaban</p>
                      <p className="text-xs font-medium text-slate-400 mt-1">Maksimal ukuran file 10MB (PDF, JPG, DOCX)</p>
                      <button className="mt-4 px-6 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 shadow-sm">Pilih File</button>
                    </div>
                  )}

                  {/* MENJODOHKAN (SIMULASI SEDERHANA) */}
                  {q.type === 'menjodohkan' && (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Pilih Pasangan yang Tepat:</p>
                      {q.options.map((opt, oi) => (
                        <div key={opt.id} className="flex flex-col sm:flex-row gap-3">
                          <div className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700">{opt.text}</div>
                          <div className="hidden sm:flex items-center justify-center text-slate-300"><ArrowsLeftRight size={24} weight="bold"/></div>
                          <select className="flex-1 p-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer">
                            <option value="">-- Pilih Pasangan --</option>
                            {/* Acak urutan pasangan di dunia nyata, disini statis untuk simulasi */}
                            {q.options.map((o) => <option key={o.id} value={o.id}>{o.matchText}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* PG & BS */}
                  {(q.type === 'pg' || q.type === 'bs') && (
                    q.options.map((opt, oi) => (
                      <button 
                        key={opt.id}
                        onClick={() => setStudentAnswers({...studentAnswers, [q.id]: opt.id})}
                        className={`p-5 text-left rounded-2xl border-2 font-bold transition-all flex items-center gap-5 group ${studentAnswers[q.id] === opt.id ? 'border-indigo-600 bg-indigo-50/50 text-indigo-800 shadow-md' : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'}`}
                      >
                        <span className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border-2 text-sm transition-all ${studentAnswers[q.id] === opt.id ? 'bg-indigo-600 border-indigo-600 text-white font-black scale-110' : 'bg-slate-50 border-slate-200 text-slate-400 font-bold group-hover:bg-white group-hover:border-slate-300'}`}>
                          {getLabel(q.type, oi)}
                        </span>
                        <div className="flex-1 flex flex-col gap-2">
                          <span className="text-base">{opt.text}</span>
                          {opt.imageUrl && <img src={opt.imageUrl} className="max-h-32 rounded-xl object-contain self-start border border-slate-100 mt-2" alt="Opsi" />}
                        </div>
                      </button>
                    ))
                  )}

                  {/* PG KOMPLEKS */}
                  {q.type === 'kompleks' && (
                    q.options.map((opt, oi) => {
                      const isSelected = Array.isArray(studentAnswers[q.id]) && studentAnswers[q.id].includes(opt.id);
                      return (
                        <button 
                          key={opt.id}
                          onClick={() => {
                            const currentAns = Array.isArray(studentAnswers[q.id]) ? studentAnswers[q.id] : [];
                            const newAns = isSelected ? currentAns.filter((id: string) => id !== opt.id) : [...currentAns, opt.id];
                            setStudentAnswers({...studentAnswers, [q.id]: newAns});
                          }}
                          className={`p-5 text-left rounded-2xl border-2 font-bold transition-all flex items-center gap-5 group ${isSelected ? 'border-indigo-600 bg-indigo-50/50 text-indigo-800 shadow-md' : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'}`}
                        >
                          <span className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 text-white font-black scale-110 shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-300 group-hover:bg-white group-hover:text-slate-400'}`}>
                            {isSelected ? <CheckSquareOffset size={24} weight="fill"/> : <div className="w-5 h-5 border-2 border-slate-300 rounded-[4px]"></div>}
                          </span>
                          <div className="flex-1 flex flex-col gap-2">
                            <span className="text-base">{opt.text}</span>
                            {opt.imageUrl && <img src={opt.imageUrl} className="max-h-32 rounded-xl object-contain self-start border border-slate-100 mt-2" alt="Opsi" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>

        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 md:p-6 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          <div className="max-w-4xl mx-auto flex justify-end">
            <button 
              onClick={() => { if(confirm("Kumpulkan jawaban sekarang? Anda tidak bisa kembali setelah menekan tombol ini.")) setViewMode('result'); }}
              className="w-full md:w-auto px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 text-sm uppercase tracking-widest hover:bg-indigo-700 hover:shadow-indigo-600/50 transition-all active:scale-95"
            >
              <PaperPlaneTilt size={24} weight="fill" /> SELESAI & KIRIM JAWABAN
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // RENDER 3: PREVIEW ENTRY (INSTRUKSI MASUK)
  // =====================================================================
  if (viewMode === 'preview_entry') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 relative">
          <button onClick={() => setViewMode('editor')} className="absolute top-4 left-4 z-20 w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"><X size={20} weight="bold" /></button>
          
          {headerImage ? (
            <img src={headerImage} className="w-full h-48 sm:h-56 object-cover" alt="Header" />
          ) : (
            <div className="w-full h-40 bg-indigo-600 flex flex-col items-center justify-center text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <Desktop size={48} weight="fill" className="mb-2 opacity-80" />
              <p className="text-[10px] font-black tracking-[0.3em] opacity-80 uppercase">Computer Based Test</p>
            </div>
          )}
          
          <div className="p-8 sm:p-10">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2 uppercase tracking-tight">{examTitle || "JUDUL UJIAN KOSONG"}</h1>
            <p className="text-sm font-medium text-slate-500 mb-6">{description || "Tidak ada deskripsi ujian."}</p>
            
            <div className="flex flex-wrap gap-3 mb-8 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-100"><UserCircle size={16} className="text-indigo-500"/> {teacherName || "NAMA GURU"}</div>
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-100"><Clock size={16} className="text-indigo-500"/> {duration} MENIT</div>
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-100"><ListNumbers size={16} className="text-indigo-500"/> {questions.length} SOAL</div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 mb-8 shadow-inner">
              <h3 className="text-xs font-black text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-2"><Info size={18} weight="bold"/> Instruksi Pengerjaan</h3>
              <p className="text-amber-900 whitespace-pre-line leading-relaxed font-medium text-sm">{instructions || "Tidak ada instruksi khusus dari pengajar."}</p>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <label className="block text-center text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Masukkan Token Ujian</label>
              <input type="text" placeholder="XXXXXX" className="w-full text-center py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-2xl font-black tracking-[0.5em] text-indigo-600 outline-none focus:border-indigo-500 focus:bg-white transition-all uppercase" />
              <button onClick={() => setViewMode('taking_test')} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all uppercase tracking-widest text-xs mt-2 active:scale-95">Mulai Kerjakan Ujian</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // RENDER 4: EDITOR UTAMA (DEFAULT)
  // =====================================================================
  return (
    <div className="min-h-screen bg-[#f1f5f9] flex overflow-hidden font-sans selection:bg-indigo-200">
      
      {/* PANEL KIRI: PENGATURAN */}
      <div className="w-full md:w-[400px] bg-white border-r border-slate-200 flex flex-col h-screen overflow-y-auto z-20 shadow-2xl shrink-0 absolute md:relative transform -translate-x-full md:translate-x-0 transition-transform">
        <div className="p-6 bg-[#1e1b4b] text-white sticky top-0 z-10 shadow-sm border-b border-indigo-900">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-3">
              <Link href="/guru" className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all cursor-pointer">
                <ArrowLeft size={18} weight="bold" />
              </Link>
              <h1 className="text-lg font-black uppercase tracking-widest">CBT SETTINGS</h1>
            </div>
            <div className="bg-emerald-500 px-3 py-1 rounded-full text-[10px] font-black shadow-lg shadow-emerald-500/30">ONLINE</div>
          </div>
        </div>

        <div className="p-6 space-y-8 flex-1">
          {/* Export Panel */}
          <div className="space-y-4 bg-slate-50 p-5 rounded-3xl border border-slate-200">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3"><Desktop size={16} /> Export Soal & Cetak</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleExportPDF} className="flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 p-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 hover:border-red-300 transition-all shadow-sm"><FilePdf size={18} weight="fill"/> Simpan PDF</button>
              <button onClick={handleExportWord} className="flex items-center justify-center gap-2 bg-white border border-blue-200 text-blue-600 p-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm"><FileDoc size={18} weight="fill"/> Buka di Word</button>
            </div>
          </div>

          {/* Metadata Ujian */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2"><TextAa size={16} /> Konfigurasi Ujian</h3>
            
            {/* Header Image */}
            <div>
              <label className="text-[10px] font-bold text-slate-600 mb-2 block uppercase tracking-wide">Header Visual (Saran: 1200x400px)</label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-3xl cursor-pointer hover:bg-slate-50 hover:border-indigo-300 transition-all relative overflow-hidden group">
                {headerImage ? (
                  <img src={headerImage} className="absolute inset-0 w-full h-full object-cover" alt="Preview Header" />
                ) : (
                  <ImageIcon size={32} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                )}
                {headerImage && <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">Ganti Header</div>}
                {!headerImage && <span className="text-[10px] font-black text-slate-400 mt-2 uppercase">Upload Gambar</span>}
                <input type="file" accept="image/*" className="hidden" onChange={handleHeaderUpload} />
              </label>
              {headerImage && <button onClick={() => setHeaderImage(null)} className="text-[10px] font-bold text-red-500 mt-2 hover:underline flex items-center gap-1 w-full justify-center"><X size={12}/> Hapus Gambar Header</button>}
            </div>

            <div className="space-y-3">
              <input type="text" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800 outline-none focus:border-indigo-500 focus:bg-white text-sm" placeholder="JUDUL UJIAN" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-600 outline-none focus:border-indigo-500 focus:bg-white text-xs min-h-[60px] resize-y" placeholder="Deskripsi Singkat Ujian..." />
              <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-600 outline-none focus:border-indigo-500 focus:bg-white text-xs min-h-[100px] resize-y" placeholder="Instruksi Pengerjaan (Muncul di layar awal saat siswa memasukkan token)..." />
              
              <div className="relative">
                <input type="text" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white pl-10 text-sm" placeholder="Nama Pengajar" />
                <UserCircle size={18} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select value={examClass} onChange={(e) => setExamClass(e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none cursor-pointer focus:border-indigo-500 focus:bg-white">
                  {daftarKelas.length === 0 && <option value="">Pilih Kelas</option>}
                  {daftarKelas.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                <div className="relative">
                  <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-indigo-600 outline-none focus:border-indigo-500 focus:bg-white pl-9 text-sm" />
                  <Clock size={16} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Token Keamanan */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2"><Key size={16} /> Akses Keamanan</h3>
            <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-3xl relative overflow-hidden text-center shadow-inner">
              <input type="text" readOnly value={token} placeholder="TOKEN KOSONG" className="w-full mb-3 bg-white border-2 border-indigo-300 rounded-2xl px-4 py-4 text-center font-black tracking-[0.4em] text-2xl text-indigo-900 outline-none" />
              <button onClick={generateToken} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-xl font-black text-xs flex justify-center items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer uppercase tracking-widest">
                <MagicWand size={18} weight="bold" /> GENERATE TOKEN BARU
              </button>
            </div>
          </div>
        </div>

        {/* Footer Tombol Simpan */}
        <div className="p-4 border-t border-slate-200 bg-white sticky bottom-0 z-20 space-y-3">
          <button onClick={() => setViewMode('preview_entry')} className="w-full py-3.5 bg-slate-50 text-slate-600 font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-200 transition-colors shadow-sm">
            <Eye size={18} weight="fill"/> Simulasi Layar Siswa
          </button>
          <button onClick={handleSaveExam} disabled={isSaving} className="w-full flex items-center justify-center gap-2 py-4 bg-[#1e1b4b] hover:bg-black text-white rounded-2xl font-black transition-all shadow-xl shadow-indigo-900/20 uppercase tracking-widest text-[11px] disabled:opacity-70 cursor-pointer active:scale-95">
            {isSaving ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <><FloppyDisk size={20} weight="fill" /> Publikasikan Ujian</>}
          </button>
        </div>
      </div>

      {/* PANEL KANAN: EDITOR SOAL CBT */}
      <div className="flex-1 bg-slate-100 overflow-y-auto p-4 md:p-10 scrollbar-hide w-full">
        <div className="max-w-4xl mx-auto pb-20">
          
          {/* HEADER EDITOR KANAN */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Tampilan Editor CBT</h2>
              <p className="text-xs md:text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">Computer Based Test Platform</p>
            </div>
            <div className="flex items-center gap-4 bg-indigo-50 px-5 py-3 rounded-2xl border border-indigo-100">
              <div className="text-right">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Skor Maksimal</p>
                <p className="text-2xl md:text-3xl font-black text-indigo-700 leading-none">{totalSkorMaksimal} <span className="text-sm font-bold text-indigo-400">POIN</span></p>
              </div>
              <div className="bg-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md shrink-0">
                <Notebook size={24} weight="bold"/>
              </div>
            </div>
          </div>

          {/* DAFTAR SOAL */}
          <div className="space-y-8">
            {questions.map((q, qIndex) => (
              <div key={q.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden group transition-all hover:border-indigo-300 hover:shadow-md">
                
                {/* Header Per Soal */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-black text-lg shadow-inner shrink-0">
                      {qIndex + 1}
                    </div>
                    <div className="relative w-full sm:w-auto flex-1">
                      <select 
                        value={q.type}
                        onChange={(e) => changeQuestionType(q.id, e.target.value as QuestionType)}
                        className="appearance-none bg-white border border-slate-200 text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-600 py-3 pl-4 pr-10 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 w-full cursor-pointer transition-all shadow-sm"
                      >
                        <option value="pg">Pilihan Ganda (Satu Jawaban)</option>
                        <option value="kompleks">Ganda Kompleks (Banyak Jawaban)</option>
                        <option value="bs">Benar / Salah</option>
                        <option value="menjodohkan">Menjodohkan (Matching)</option>
                        <option value="isian">Isian Singkat (Auto-Grade)</option>
                        <option value="upload">Upload Jawaban (File/Esai)</option>
                      </select>
                      <CaretDown size={14} weight="bold" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <button onClick={() => removeQuestion(q.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-colors self-end sm:self-auto" title="Hapus Soal">
                    <Trash size={20} weight="bold" />
                  </button>
                </div>

                <div className="p-6 md:p-8">
                  {/* TEKS SOAL & GAMBAR SOAL */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                      <label className="text-sm font-black text-slate-800 flex items-center gap-2"><ListNumbers size={18} className="text-indigo-600"/> Pertanyaan Pokok</label>
                      <label className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors uppercase tracking-widest border border-indigo-100">
                        <ImageIcon size={16} weight="bold"/> Tambah Gambar
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, (base64) => setQuestionImage(q.id, base64))} />
                      </label>
                    </div>

                    {/* Preview Gambar Soal */}
                    {q.imageUrl && (
                      <div className="relative mb-4 inline-block bg-slate-50 p-2 rounded-2xl border border-slate-200">
                        <img src={q.imageUrl} alt="Lampiran Soal" className="max-h-64 rounded-xl object-contain" />
                        <button onClick={() => setQuestionImage(q.id, null)} className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg transition-transform hover:scale-110">
                          <X size={14} weight="bold"/>
                        </button>
                      </div>
                    )}

                    <textarea 
                      value={q.text} onChange={(e) => updateQuestionText(q.id, e.target.value)}
                      placeholder="Ketik pertanyaan / stimulus ujian di sini..."
                      className="w-full min-h-[120px] p-5 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-800 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all text-base resize-y shadow-inner"
                    />
                  </div>

                  {/* AREA JAWABAN BERDASARKAN TIPE */}
                  <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                      <Star size={14} className="text-amber-500" weight="fill" /> Pengaturan Jawaban & Skor
                    </label>

                    {/* TIPE: ISIAN SINGKAT */}
                    {q.type === 'isian' && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-end mb-1">
                          <label className="text-xs font-bold text-emerald-600 flex items-center gap-1 uppercase tracking-widest"><TextT size={16}/> Kunci Jawaban Eksak</label>
                          <div className="flex flex-col items-center w-24">
                            <span className="text-[9px] font-black uppercase text-slate-400 mb-1">Poin Benar</span>
                            <input type="number" value={q.options[0].points} onChange={(e) => updateOptionPoints(q.id, q.options[0].id, Number(e.target.value))} className="w-full p-2 text-center font-black rounded-lg border-2 border-emerald-400 text-emerald-700 outline-none shadow-sm" />
                          </div>
                        </div>
                        <input type="text" value={q.options[0].text} onChange={(e) => updateOptionText(q.id, q.options[0].id, e.target.value)} placeholder="Tuliskan jawaban singkat yang benar..." className="w-full p-4 border-2 border-emerald-200 focus:border-emerald-500 rounded-xl font-black text-emerald-800 outline-none bg-white shadow-inner" />
                        <p className="text-[10px] font-bold text-slate-400">Sistem akan mengoreksi otomatis jika jawaban siswa sama persis (Tidak membedakan huruf besar/kecil).</p>
                      </div>
                    )}

                    {/* TIPE: UPLOAD FILE */}
                    {q.type === 'upload' && (
                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-2xl p-8 flex flex-col items-center text-center">
                          <FileArrowUp size={48} className="text-indigo-400 mb-3" weight="duotone"/>
                          <p className="font-black text-indigo-900 text-lg">Upload Dokumen Siswa</p>
                          <p className="text-xs font-bold text-indigo-500 mt-1 max-w-sm mx-auto">Siswa akan diberikan tombol untuk mengunggah file (PDF, Word, JPG) sebagai jawaban esai panjang / portofolio.</p>
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
                           <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Skor Maksimal Soal Ini:</span>
                           <input type="number" value={q.options[0].points} onChange={(e) => updateOptionPoints(q.id, q.options[0].id, Number(e.target.value))} className="w-24 p-3 text-center font-black rounded-xl border-2 border-slate-200 focus:border-indigo-400 outline-none bg-white text-lg text-indigo-600 shadow-sm" />
                        </div>
                      </div>
                    )}

                    {/* TIPE: MENJODOHKAN */}
                    {q.type === 'menjodohkan' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-[auto_1fr_auto_1fr_auto] gap-3 items-center mb-2 pb-2 border-b border-slate-200">
                          <div className="w-6"></div>
                          <div className="font-black text-[10px] text-slate-500 uppercase text-center tracking-widest">Pernyataan (Kiri)</div>
                          <div className="w-8"></div>
                          <div className="font-black text-[10px] text-slate-500 uppercase text-center tracking-widest">Pasangan Benar (Kanan)</div>
                          <div className="w-16 font-black text-[10px] text-slate-500 uppercase text-center tracking-widest">Poin</div>
                        </div>
                        {q.options.map((opt, oIndex) => (
                          <div key={opt.id} className="grid grid-cols-[auto_1fr_auto_1fr_auto_auto] gap-3 items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                            <span className="font-black text-slate-300 w-6 text-right text-xs">{oIndex+1}.</span>
                            <input type="text" value={opt.text} onChange={(e) => updateOptionText(q.id, opt.id, e.target.value)} placeholder="Teks Kiri..." className="w-full p-3 border border-slate-100 bg-slate-50 rounded-xl outline-none focus:bg-white focus:border-indigo-300 font-medium text-sm transition-colors" />
                            <ArrowsLeftRight size={20} className="text-indigo-300 shrink-0" weight="bold"/>
                            <input type="text" value={opt.matchText} onChange={(e) => updateOptionText(q.id, opt.id, e.target.value, true)} placeholder="Teks Kanan..." className="w-full p-3 border-2 border-emerald-100 bg-emerald-50/30 focus:border-emerald-400 rounded-xl outline-none font-bold text-emerald-800 text-sm transition-colors" />
                            <input type="number" value={opt.points} onChange={(e) => updateOptionPoints(q.id, opt.id, Number(e.target.value))} className="w-16 p-2 text-center font-black rounded-xl border border-slate-200 outline-none focus:border-indigo-400" />
                            <button onClick={() => removeOption(q.id, opt.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X size={18} weight="bold"/></button>
                          </div>
                        ))}
                        <button onClick={() => addOption(q.id)} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 px-4 py-3 rounded-xl transition-all border border-indigo-100 border-dashed w-full">+ Tambah Baris Pasangan</button>
                      </div>
                    )}

                    {/* TIPE: PILIHAN GANDA, KOMPLEKS, B/S */}
                    {(q.type === 'pg' || q.type === 'kompleks' || q.type === 'bs') && (
                      <div className="space-y-3">
                        {q.options.map((opt, oIndex) => (
                          <div key={opt.id} className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-3xl transition-all border-2 ${opt.isCorrect ? 'border-emerald-400 bg-emerald-50/40 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                            
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                              <button onClick={() => toggleCorrectAnswer(q.id, opt.id)} className={`w-10 h-10 shrink-0 flex items-center justify-center transition-all cursor-pointer rounded-xl ${opt.isCorrect ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 transform scale-105' : 'bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600'}`}>
                                {q.type === 'kompleks' ? <CheckSquareOffset size={20} weight="fill" /> : <CheckCircle size={20} weight="fill" />}
                              </button>
                              <div className="text-sm font-black text-slate-400 w-6 text-center">{getLabel(q.type, oIndex)}.</div>
                            </div>

                            {/* Container Input Jawaban & Gambar Opsi */}
                            <div className="flex-1 flex flex-col w-full gap-2">
                              <div className="flex items-center gap-2 w-full relative">
                                <input 
                                  type="text" value={opt.text} onChange={(e) => updateOptionText(q.id, opt.id, e.target.value)} placeholder="Ketik teks pilihan jawaban..."
                                  className={`w-full p-3 border-none rounded-xl font-medium outline-none transition-colors ${opt.isCorrect ? 'bg-transparent text-emerald-900' : 'bg-slate-50 text-slate-700 focus:bg-slate-100'}`}
                                />
                                {q.type !== 'bs' && (
                                  <label className="shrink-0 text-slate-400 hover:text-indigo-600 cursor-pointer p-2.5 bg-slate-100 hover:bg-indigo-100 rounded-xl transition-colors absolute right-1 top-1/2 -translate-y-1/2 border border-slate-200" title="Sisipkan Gambar Opsi">
                                    <ImageIcon size={18} weight="bold"/>
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, (base64) => setOptionImage(q.id, opt.id, base64))} />
                                  </label>
                                )}
                              </div>

                              {/* Preview Gambar Opsi */}
                              {opt.imageUrl && (
                                <div className="relative inline-block mt-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 self-start">
                                  <img src={opt.imageUrl} alt="Opsi" className="h-24 rounded-lg object-contain bg-white" />
                                  <button onClick={() => setOptionImage(q.id, opt.id, null)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-md">
                                    <X size={12} weight="bold"/>
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto mt-3 sm:mt-0 justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                              <div className="flex flex-col items-center shrink-0 w-16 relative">
                                <span className="absolute -top-5 text-[9px] font-black uppercase text-slate-400 tracking-widest">Poin</span>
                                <input 
                                  type="number" value={opt.points} onChange={(e) => updateOptionPoints(q.id, opt.id, Number(e.target.value))} 
                                  className={`w-full p-2.5 text-center font-black rounded-xl border-2 outline-none transition-colors ${opt.isCorrect ? 'border-emerald-400 text-emerald-700 bg-white shadow-sm' : 'border-slate-200 text-slate-500 bg-slate-50 focus:border-indigo-400'}`} 
                                />
                              </div>
                              {q.type !== 'bs' && (
                                <button onClick={() => removeOption(q.id, opt.id)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><X size={20} weight="bold"/></button>
                              )}
                            </div>

                          </div>
                        ))}
                        {q.type !== 'bs' && (
                           <button onClick={() => addOption(q.id)} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-4 py-3 rounded-xl hover:bg-indigo-100 transition-all border border-indigo-100 border-dashed w-full mt-2">
                             + Tambah Opsi Pilihan Lain
                           </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <button onClick={addQuestion} className="flex items-center gap-3 px-10 py-5 bg-white border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 font-black rounded-[2.5rem] transition-all hover:shadow-xl cursor-pointer shadow-sm">
              <Plus size={28} weight="bold" /> TAMBAH SOAL BARU
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
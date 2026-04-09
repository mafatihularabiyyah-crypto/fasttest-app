"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, FloppyDisk, Plus, Trash, CheckCircle, 
  Desktop, Key, Clock, TextAa, ListNumbers,
  WarningCircle, MagicWand, UserCircle, Star, CaretDown, CheckSquareOffset
} from "@phosphor-icons/react";

// --- STRUKTUR DATA ---
type QuestionType = 'pg' | 'bs' | 'angka14' | 'kompleks';

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
  points: number;
}

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options: Option[];
}

export default function CBTGenerator() {
  const router = useRouter();

  // --- STATE METADATA UJIAN ---
  const [examTitle, setExamTitle] = useState("Asesmen Akhir Semester - B. Arab");
  const [teacherName, setTeacherName] = useState(""); 
  const [duration, setDuration] = useState(90);
  const [token, setToken] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // STATE SINKRONISASI KELAS
  const [examClass, setExamClass] = useState("");
  const [daftarKelas, setDaftarKelas] = useState<string[]>([]);

  // Mengambil daftar kelas dari database saat halaman dimuat
  useEffect(() => {
    fetch('/api/classes')
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data) && data.length > 0) {
          setDaftarKelas(data);
          setExamClass(data[0]); // Pilih kelas pertama secara otomatis
        }
      })
      .catch(err => console.error("Gagal memuat kelas:", err));
  }, []);

  // --- STATE DAFTAR SOAL ---
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "q_1",
      type: "pg",
      text: "",
      options: [
        { id: "opt_1_a", text: "", isCorrect: false, points: 0 },
        { id: "opt_1_b", text: "", isCorrect: false, points: 0 },
        { id: "opt_1_c", text: "", isCorrect: false, points: 0 },
        { id: "opt_1_d", text: "", isCorrect: false, points: 0 },
        { id: "opt_1_e", text: "", isCorrect: false, points: 0 },
      ]
    }
  ]);

  // --- FUNGSI MANAJEMEN SOAL ---
  const addQuestion = () => {
    const newId = `q_${Date.now()}`;
    setQuestions([
      ...questions,
      {
        id: newId,
        type: "pg",
        text: "",
        options: [
          { id: `${newId}_a`, text: "", isCorrect: false, points: 0 },
          { id: `${newId}_b`, text: "", isCorrect: false, points: 0 },
          { id: `${newId}_c`, text: "", isCorrect: false, points: 0 },
          { id: `${newId}_d`, text: "", isCorrect: false, points: 0 },
          { id: `${newId}_e`, text: "", isCorrect: false, points: 0 },
        ]
      }
    ]);
  };

  const removeQuestion = (idToRemove: string) => {
    if (questions.length === 1) return alert("Ujian minimal harus memiliki 1 soal.");
    setQuestions(questions.filter(q => q.id !== idToRemove));
  };

  const updateQuestionText = (qId: string, newText: string) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, text: newText } : q));
  };

  const changeQuestionType = (qId: string, newType: QuestionType) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        let newOptions: Option[] = [];
        if (newType === 'bs') {
          newOptions = [
            { id: `${qId}_b`, text: "Benar", isCorrect: false, points: 0 },
            { id: `${qId}_s`, text: "Salah", isCorrect: false, points: 0 }
          ];
        } else if (newType === 'angka14') {
          newOptions = [
            { id: `${qId}_1`, text: "1", isCorrect: false, points: 0 },
            { id: `${qId}_2`, text: "2", isCorrect: false, points: 0 },
            { id: `${qId}_3`, text: "3", isCorrect: false, points: 0 },
            { id: `${qId}_4`, text: "4", isCorrect: false, points: 0 }
          ];
        } else {
          newOptions = [
            { id: `${qId}_a`, text: "", isCorrect: false, points: 0 },
            { id: `${qId}_b`, text: "", isCorrect: false, points: 0 },
            { id: `${qId}_c`, text: "", isCorrect: false, points: 0 },
            { id: `${qId}_d`, text: "", isCorrect: false, points: 0 },
            { id: `${qId}_e`, text: "", isCorrect: false, points: 0 },
          ];
        }
        return { ...q, type: newType, options: newOptions };
      }
      return q;
    }));
  };

  const updateOptionText = (qId: string, optId: string, newText: string) => {
    setQuestions(questions.map(q => q.id === qId ? {
      ...q, options: q.options.map(opt => opt.id === optId ? { ...opt, text: newText } : opt)
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

  // --- FUNGSI GENERATE TOKEN & SIMPAN KE DATABASE ---
  const generateToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setToken(result);
  };

  const handleSaveExam = async () => {
    // Validasi Sederhana
    if (!examTitle || !teacherName || !examClass) return alert("Judul Ujian, Nama Pengajar, dan Kelas wajib diisi!");
    if (!token) return alert("Silakan Buat Token Ujian terlebih dahulu!");
    
    const hasEmptyQuestion = questions.some(q => q.text.trim() === "");
    if (hasEmptyQuestion) return alert("Ada teks soal yang masih kosong!");

    const hasNoAnswer = questions.some(q => !q.options.some(opt => opt.isCorrect));
    if (hasNoAnswer) return alert("Pastikan setiap soal sudah memiliki Kunci Jawaban (hijau)!");

    setIsSaving(true);

    try {
      const response = await fetch('/api/exams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: examTitle,
          className: examClass,
          teacherName: teacherName,
          duration: duration,
          token: token,
          examType: "CBT",
          questions: questions 
        })
      });

      if (response.ok) {
        alert(`Ujian CBT Berhasil Disimpan & Disinkronkan dengan Kelas ${examClass}!\nToken Ujian: ${token}`);
        router.push('/guru/arsip'); 
      } else {
        const errorData = await response.json();
        alert(`Gagal menyimpan: ${errorData.message || 'Terjadi kesalahan pada server.'}`);
      }
    } catch (error) {
      console.error("Database Error:", error);
      alert("Gagal terhubung ke server database. Periksa koneksi internet Anda.");
    } finally {
      setIsSaving(false);
    }
  };

  const getLabel = (type: QuestionType, index: number) => {
    if (type === 'bs') return index === 0 ? 'B' : 'S';
    if (type === 'angka14') return (index + 1).toString();
    return String.fromCharCode(65 + index); 
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex overflow-hidden font-sans selection:bg-indigo-200">
      
      {/* PANEL KIRI: PENGATURAN & TOKEN */}
      <div className="w-[400px] bg-white border-r border-slate-200 flex flex-col h-screen overflow-y-auto z-20 shadow-2xl shrink-0">
        
        <div className="p-6 bg-[#1e1b4b] text-white sticky top-0 z-10 shadow-sm border-b border-indigo-900">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-3">
              <Link href="/guru" className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all cursor-pointer">
                <ArrowLeft size={18} weight="bold" />
              </Link>
              <h1 className="text-lg font-black tracking-tight uppercase">CBT Editor</h1>
            </div>
            <Desktop size={24} weight="fill" className="text-indigo-400" />
          </div>
          <p className="text-xs text-indigo-200 font-medium">Platform Ujian Online Multiformat</p>
        </div>

        <div className="p-6 space-y-8 flex-1">
          
          {/* Identitas Ujian */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
              <TextAa size={16} /> Metadata Ujian
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Nama Ujian / Mata Pelajaran</label>
                <input type="text" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-colors" placeholder="Contoh: Tryout UTBK" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Nama Pengajar</label>
                <div className="relative">
                  <input type="text" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-colors pl-10" placeholder="Ustadz / Ustadzah..." />
                  <UserCircle size={18} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Kelas / Jurusan (Database)</label>
                  <select 
                    value={examClass} 
                    onChange={(e) => setExamClass(e.target.value)} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-colors cursor-pointer"
                  >
                    {daftarKelas.length === 0 && <option value="">Memuat data kelas...</option>}
                    {daftarKelas.map(kelas => (
                      <option key={kelas} value={kelas}>{kelas}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Durasi (Menit)</label>
                  <div className="relative">
                    <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-indigo-600 outline-none focus:border-indigo-500 focus:bg-white transition-colors pl-10" min="10" />
                    <Clock size={16} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Area Token Ujian */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
              <Key size={16} /> Akses Keamanan
            </h3>
            <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-2xl relative overflow-hidden">
              <div className="absolute right-[-10%] top-[-10%] opacity-10 pointer-events-none">
                <Key size={100} weight="fill" className="text-indigo-600" />
              </div>
              
              <p className="text-xs font-black text-indigo-800 mb-3 relative z-10 uppercase tracking-wide">Generate Token Siswa</p>
              
              <div className="flex flex-col gap-3 relative z-10">
                <input 
                  type="text" 
                  readOnly 
                  value={token} 
                  placeholder="KLIK TOMBOL DI BAWAH" 
                  className="w-full bg-white border-2 border-indigo-300 rounded-xl px-4 py-4 text-center font-black tracking-[0.4em] text-2xl text-indigo-900 outline-none placeholder:text-sm placeholder:tracking-normal placeholder:font-bold placeholder:text-slate-300"
                />
                <button 
                  onClick={generateToken}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl shadow-lg shadow-indigo-600/30 font-black text-sm transition-all active:scale-95 flex justify-center items-center gap-2 cursor-pointer"
                >
                  <MagicWand size={18} weight="bold" /> Buat Token Baru
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Sidebar (Tombol Simpan) */}
        <div className="p-4 border-t border-slate-200 bg-white sticky bottom-0 z-20">
          <button 
            onClick={handleSaveExam} 
            disabled={isSaving} 
            className="w-full flex items-center justify-center gap-2 py-4 bg-[#1e1b4b] hover:bg-black text-white rounded-xl font-black transition-all shadow-xl shadow-indigo-900/20 uppercase tracking-widest text-xs disabled:opacity-70 cursor-pointer"
          >
            {isSaving ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <><FloppyDisk size={20} weight="fill" /> Simpan Ke Arsip</>
            )}
          </button>
        </div>
      </div>

      {/* PANEL KANAN: AREA EDITOR SOAL MULTIFORMAT */}
      <div className="flex-1 bg-slate-100 overflow-y-auto p-6 md:p-10 scrollbar-hide">
        
        <div className="max-w-4xl mx-auto pb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Bank Soal Ujian</h2>
              <p className="text-sm font-bold text-slate-500 mt-1">Total: <span className="text-indigo-600 text-lg">{questions.length}</span> Butir Soal</p>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-200">
              <Star size={20} className="text-emerald-500" weight="fill" />
              <span className="text-xs font-bold text-slate-600">Sesuaikan Nilai (Poin) di setiap pilihan</span>
            </div>
          </div>

          <div className="space-y-8">
            {questions.map((q, qIndex) => (
              <div key={q.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden group transition-all hover:shadow-lg hover:border-indigo-300">
                
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-black text-lg shadow-inner">
                      {qIndex + 1}
                    </div>
                    <div className="relative">
                      <select 
                        value={q.type}
                        onChange={(e) => changeQuestionType(q.id, e.target.value as QuestionType)}
                        className="appearance-none bg-white border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-600 py-2 pl-4 pr-10 rounded-lg outline-none focus:border-indigo-500 cursor-pointer shadow-sm hover:bg-slate-50"
                      >
                        <option value="pg">Pilihan Ganda (A-E)</option>
                        <option value="kompleks">PG Kompleks (Checkbox)</option>
                        <option value="bs">Benar / Salah</option>
                        <option value="angka14">Skor Angka (1-4)</option>
                      </select>
                      <CaretDown size={14} weight="bold" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <button 
                    onClick={() => removeQuestion(q.id)}
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-colors cursor-pointer"
                    title="Hapus Soal"
                  >
                    <Trash size={20} weight="bold" />
                  </button>
                </div>

                <div className="p-6 md:p-8">
                  <div className="mb-6">
                    <label className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                      <ListNumbers size={18} className="text-indigo-600"/> Pertanyaan Pokok
                    </label>
                    <textarea 
                      value={q.text}
                      onChange={(e) => updateQuestionText(q.id, e.target.value)}
                      placeholder="Ketik pertanyaan atau skenario soal di sini..."
                      className="w-full min-h-[100px] p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-800 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all resize-y text-base"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                        {q.type === 'kompleks' ? <CheckSquareOffset size={18} className="text-indigo-600"/> : <CheckCircle size={18} className="text-indigo-600" />} 
                        {q.type === 'kompleks' ? "Pilihan Jawaban (Bisa pilih >1)" : "Pilihan Jawaban"}
                      </label>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">Klik Icon Kiri Untuk Kunci</span>
                    </div>

                    <div className="space-y-3">
                      {q.options.map((opt, oIndex) => {
                        const isCorrect = opt.isCorrect;
                        return (
                          <div key={opt.id} className={`flex items-center gap-3 p-3 rounded-2xl transition-all border-2 ${isCorrect ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-100 hover:border-slate-300 bg-white'}`}>
                            
                            <button 
                              onClick={() => toggleCorrectAnswer(q.id, opt.id)}
                              className={`w-10 h-10 shrink-0 flex items-center justify-center transition-all cursor-pointer rounded-xl ${isCorrect ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'bg-slate-100 text-slate-300 hover:bg-emerald-100 hover:text-emerald-500'}`}
                            >
                              {q.type === 'kompleks' ? <CheckSquareOffset size={20} weight="fill" /> : <CheckCircle size={20} weight="fill" />}
                            </button>

                            <div className="text-sm font-black text-slate-400 w-6 text-center">
                              {getLabel(q.type, oIndex)}.
                            </div>

                            <input 
                              type="text"
                              value={opt.text}
                              onChange={(e) => updateOptionText(q.id, opt.id, e.target.value)}
                              placeholder={`Opsi Jawaban ${getLabel(q.type, oIndex)}`}
                              className={`flex-1 p-3 border-none rounded-lg font-medium outline-none transition-all ${isCorrect ? 'bg-transparent text-emerald-900' : 'bg-slate-50 text-slate-700 focus:bg-slate-100'}`}
                            />

                            <div className="flex flex-col shrink-0 w-20 relative">
                              <span className="absolute -top-3 right-0 text-[9px] font-black uppercase text-slate-400 bg-white px-1">Poin</span>
                              <input 
                                type="number"
                                value={opt.points}
                                onChange={(e) => updateOptionPoints(q.id, opt.id, Number(e.target.value))}
                                className={`w-full p-2.5 text-center font-black rounded-lg border-2 outline-none transition-colors ${isCorrect ? 'border-emerald-400 text-emerald-700 bg-white' : 'border-slate-200 text-slate-500 bg-slate-50 focus:border-indigo-400'}`}
                              />
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button 
              onClick={addQuestion}
              className="flex items-center gap-2 px-8 py-4 bg-white border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 font-black rounded-[2rem] transition-all hover:shadow-lg cursor-pointer"
            >
              <Plus size={24} weight="bold" /> Tambah Soal Baru
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
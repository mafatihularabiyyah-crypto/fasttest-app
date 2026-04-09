"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, FloppyDisk, Plus, Trash, CheckCircle, 
  Desktop, Key, Clock, TextAa, ListNumbers,
  WarningCircle, MagicWand
} from "@phosphor-icons/react";

// Struktur tipe data untuk Soal
interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
  correctAnswerId: string | null;
}

export default function CBTGenerator() {
  // --- STATE METADATA UJIAN ---
  const [examTitle, setExamTitle] = useState("Ujian Akhir Semester - B. Arab");
  const [examClass, setExamClass] = useState("XII MIPA & IPS");
  const [duration, setDuration] = useState(90); // dalam menit
  const [token, setToken] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // --- STATE DAFTAR SOAL ---
  // Inisialisasi dengan 1 soal kosong
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "q_1",
      text: "",
      options: [
        { id: "opt_1_a", text: "" },
        { id: "opt_1_b", text: "" },
        { id: "opt_1_c", text: "" },
        { id: "opt_1_d", text: "" },
        { id: "opt_1_e", text: "" },
      ],
      correctAnswerId: null
    }
  ]);

  // --- FUNGSI MANAJEMEN SOAL ---
  const addQuestion = () => {
    const newId = `q_${Date.now()}`;
    setQuestions([
      ...questions,
      {
        id: newId,
        text: "",
        options: [
          { id: `${newId}_a`, text: "" },
          { id: `${newId}_b`, text: "" },
          { id: `${newId}_c`, text: "" },
          { id: `${newId}_d`, text: "" },
          { id: `${newId}_e`, text: "" },
        ],
        correctAnswerId: null
      }
    ]);
  };

  const removeQuestion = (idToRemove: string) => {
    if (questions.length === 1) {
      alert("Ujian minimal harus memiliki 1 soal.");
      return;
    }
    setQuestions(questions.filter(q => q.id !== idToRemove));
  };

  const updateQuestionText = (qId: string, newText: string) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, text: newText } : q));
  };

  const updateOptionText = (qId: string, optId: string, newText: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          options: q.options.map(opt => opt.id === optId ? { ...opt, text: newText } : opt)
        };
      }
      return q;
    }));
  };

  const setCorrectAnswer = (qId: string, optId: string) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, correctAnswerId: optId } : q));
  };

  // --- FUNGSI GENERATE TOKEN & SIMPAN ---
  const generateToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setToken(result);
  };

  const handleSaveExam = () => {
    // Validasi Sederhana
    if (!examTitle) return alert("Judul ujian wajib diisi!");
    if (!token) return alert("Silakan Generate Token Ujian terlebih dahulu!");
    
    const hasEmptyQuestion = questions.some(q => q.text.trim() === "");
    if (hasEmptyQuestion) return alert("Ada teks soal yang masih kosong!");

    const hasNoAnswer = questions.some(q => q.correctAnswerId === null);
    if (hasNoAnswer) return alert("Pastikan setiap soal sudah memiliki Kunci Jawaban!");

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert(`Ujian CBT Berhasil Disimpan! Token untuk siswa: ${token}`);
    }, 1500);
  };

  const getOptionLetter = (index: number) => String.fromCharCode(65 + index); // 0 -> A, 1 -> B, dst.

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex overflow-hidden font-sans">
      
      {/* ========================================= */}
      {/* PANEL KIRI: PENGATURAN & TOKEN            */}
      {/* ========================================= */}
      <div className="w-[400px] bg-white border-r border-slate-200 flex flex-col h-screen overflow-y-auto z-20 shadow-xl shrink-0">
        
        {/* Header Sidebar */}
        <div className="p-6 bg-indigo-700 text-white sticky top-0 z-10 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-3">
              <Link href="/guru" className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all cursor-pointer" title="Kembali ke Dashboard">
                <ArrowLeft size={18} weight="bold" />
              </Link>
              <h1 className="text-lg font-black tracking-tight uppercase">CBT Editor</h1>
            </div>
            <Desktop size={24} weight="fill" className="opacity-50" />
          </div>
          <p className="text-xs text-indigo-100 font-medium">Buat Soal Ujian Online Terpusat</p>
        </div>

        <div className="p-6 space-y-6 flex-1">
          
          {/* Pengaturan Dasar */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
              <TextAa size={16} /> Identitas Ujian
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Nama Ujian / Mata Pelajaran</label>
                <input type="text" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-colors" placeholder="Contoh: Tryout UTBK" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Kelas / Jurusan</label>
                  <input type="text" value={examClass} onChange={(e) => setExamClass(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-colors" placeholder="Contoh: XII IPA" />
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
          <div className="space-y-4 mt-8">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
              <Key size={16} /> Akses Keamanan
            </h3>
            <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl relative overflow-hidden">
              {/* Background pattern */}
              <div className="absolute right-[-10%] top-[-10%] opacity-10">
                <Key size={100} weight="fill" className="text-indigo-600" />
              </div>
              
              <p className="text-xs font-bold text-indigo-800 mb-3 relative z-10">Token Ujian Siswa</p>
              
              <div className="flex gap-2 relative z-10">
                <input 
                  type="text" 
                  readOnly 
                  value={token} 
                  placeholder="-----" 
                  className="flex-1 bg-white border border-indigo-200 rounded-xl px-4 py-3 text-center font-black tracking-[0.3em] text-lg text-slate-800 outline-none"
                />
                <button 
                  onClick={generateToken}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl shadow-md transition-colors active:scale-95"
                  title="Generate Token Baru"
                >
                  <MagicWand size={20} weight="bold" />
                </button>
              </div>
              <p className="text-[10px] text-indigo-600/70 font-medium mt-3 leading-relaxed relative z-10">
                Klik tombol <MagicWand size={12} className="inline"/> untuk membuat Token acak. Berikan token ini kepada siswa agar mereka bisa masuk ke portal ujian.
              </p>
            </div>
          </div>

        </div>

        {/* Footer Sidebar (Tombol Simpan) */}
        <div className="p-4 border-t border-slate-100 bg-white sticky bottom-0 z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
          <button 
            onClick={handleSaveExam} 
            disabled={isSaving} 
            className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-black transition-all shadow-lg uppercase tracking-widest text-xs disabled:opacity-70 cursor-pointer"
          >
            {isSaving ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <><FloppyDisk size={20} weight="fill" /> Simpan & Terbitkan Ujian</>
            )}
          </button>
        </div>
      </div>

      {/* ========================================= */}
      {/* PANEL KANAN: AREA EDITOR SOAL               */}
      {/* ========================================= */}
      <div className="flex-1 bg-slate-100 overflow-y-auto p-6 md:p-10 scrollbar-hide">
        
        <div className="max-w-4xl mx-auto">
          {/* Header Info Area Kerja */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Bank Soal Ujian</h2>
              <p className="text-sm font-bold text-slate-500 mt-1">Total Soal: <span className="text-indigo-600">{questions.length}</span> Butir</p>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
              <WarningCircle size={18} className="text-amber-500" weight="fill" />
              <span className="text-xs font-bold text-slate-600">Jangan lupa tentukan Kunci Jawaban</span>
            </div>
          </div>

          {/* List Soal */}
          <div className="space-y-8">
            {questions.map((q, qIndex) => (
              <div key={q.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden group transition-all hover:shadow-md">
                
                {/* Header Soal (Nomor & Tombol Hapus) */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-black text-sm">
                      {qIndex + 1}
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Soal Pilihan Ganda</span>
                  </div>
                  <button 
                    onClick={() => removeQuestion(q.id)}
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Soal"
                  >
                    <Trash size={18} weight="bold" />
                  </button>
                </div>

                <div className="p-6 md:p-8">
                  {/* Input Teks Soal */}
                  <div className="mb-6">
                    <label className="text-xs font-bold text-slate-600 mb-2 block flex items-center gap-2">
                      <ListNumbers size={16} /> Pertanyaan
                    </label>
                    <textarea 
                      value={q.text}
                      onChange={(e) => updateQuestionText(q.id, e.target.value)}
                      placeholder="Ketik pertanyaan di sini..."
                      className="w-full min-h-[100px] p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-800 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all resize-y"
                    />
                  </div>

                  {/* Input Pilihan Jawaban */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-3 block flex items-center gap-2">
                      <CheckCircle size={16} /> Pilihan Jawaban & Kunci
                    </label>
                    <div className="space-y-3">
                      {q.options.map((opt, oIndex) => {
                        const isCorrect = q.correctAnswerId === opt.id;
                        return (
                          <div key={opt.id} className={`flex items-start gap-3 p-2 rounded-xl transition-colors border-2 ${isCorrect ? 'border-emerald-400 bg-emerald-50' : 'border-transparent hover:bg-slate-50'}`}>
                            
                            {/* Tombol Set Kunci Jawaban */}
                            <button 
                              onClick={() => setCorrectAnswer(q.id, opt.id)}
                              title={isCorrect ? "Kunci Jawaban" : "Jadikan Kunci Jawaban"}
                              className={`mt-2 w-8 h-8 shrink-0 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${isCorrect ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'border-slate-300 text-transparent hover:border-emerald-400'}`}
                            >
                              <CheckCircle size={16} weight="bold" />
                            </button>

                            {/* Label A, B, C... */}
                            <div className="mt-2 text-sm font-black text-slate-400 w-6 text-center">
                              {getOptionLetter(oIndex)}.
                            </div>

                            {/* Input Teks Opsi */}
                            <input 
                              type="text"
                              value={opt.text}
                              onChange={(e) => updateOptionText(q.id, opt.id, e.target.value)}
                              placeholder={`Pilihan ${getOptionLetter(oIndex)}`}
                              className={`flex-1 p-3 border rounded-xl font-medium outline-none transition-all ${isCorrect ? 'bg-white border-emerald-200 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-400 focus:bg-white'}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Tombol Tambah Soal Baru */}
          <div className="mt-8 mb-16 flex justify-center">
            <button 
              onClick={addQuestion}
              className="flex items-center gap-2 px-8 py-4 bg-white border-2 border-dashed border-slate-300 hover:border-indigo-500 text-slate-500 hover:text-indigo-600 font-black rounded-[2rem] transition-all hover:shadow-lg cursor-pointer"
            >
              <Plus size={24} weight="bold" /> Tambah Soal Baru
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
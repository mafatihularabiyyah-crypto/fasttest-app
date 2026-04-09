"use client";

import { useState, useEffect } from "react";
import { 
  Clock, UserCircle, CaretLeft, CaretRight, 
  WarningCircle, CheckCircle, List, SignOut, 
  Flag, Info
} from "@phosphor-icons/react";

// --- MOCK DATA SOAL ---
const MOCK_QUESTIONS = [
  {
    id: 1,
    teks: "Fi'il muta'addi adalah kata kerja yang...",
    opsi: [
      "A. Tidak membutuhkan fa'il",
      "B. Membutuhkan objek (maf'ul bih)",
      "C. Hanya berlaku untuk waktu lampau",
      "D. Menunjukkan perintah",
      "E. Berawalan huruf mudhara'ah"
    ]
  },
  {
    id: 2,
    teks: "Manakah di bawah ini yang merupakan contoh dari Isim Fail?",
    opsi: [
      "A. مَكْتُوْبٌ (Maktubun)",
      "B. كَاتِبٌ (Katibun)",
      "C. يَكْتُبُ (Yaktubu)",
      "D. كِتَابٌ (Kitabun)",
      "E. كَتَبَ (Kataba)"
    ]
  },
  {
    id: 3,
    teks: "Hukum membaca Al-Fatihah bagi makmum saat shalat berjamaah jahr (seperti Maghrib) menurut mazhab Syafi'i adalah...",
    opsi: [
      "A. Sunnah Muakkad",
      "B. Mubah",
      "C. Wajib",
      "D. Makruh",
      "E. Haram"
    ]
  },
  {
    id: 4,
    teks: "Perhatikan kalimat berikut: ذَهَبَ أَحْمَدُ إِلَى الْمَدْرَسَةِ. Kata أَحْمَدُ berkedudukan sebagai...",
    opsi: [
      "A. Mubtada'",
      "B. Khabar",
      "C. Maf'ul Bih",
      "D. Fa'il",
      "E. Majrur"
    ]
  },
  {
    id: 5,
    teks: "I'rob dari kata yang digarisbawahi pada ayat (إِنَّ اللّٰهَ غَفُوْرٌ رَحِيْمٌ) adalah...",
    opsi: [
      "A. Marfu' karena menjadi khabar Inna",
      "B. Manshub karena menjadi isim Inna",
      "C. Majrur karena huruf jar",
      "D. Majzum karena syarat",
      "E. Mabni karena isim alam"
    ]
  }
];

export default function StudentExamPortal() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({}); // { questionIndex: optionIndex }
  const [flagged, setFlagged] = useState<Record<number, boolean>>({}); // { questionIndex: boolean }
  
  // State Waktu (Contoh: 90 menit)
  const [timeLeft, setTimeLeft] = useState(90 * 60); 
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Untuk versi mobile

  // Format waktu ke HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Timer Effect
  useEffect(() => {
    if (timeLeft <= 0) {
      // Waktu habis, auto submit
      alert("Waktu Habis! Ujian otomatis diselesaikan.");
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSelectOption = (optIndex: number) => {
    setAnswers(prev => ({ ...prev, [currentQ]: optIndex }));
    // Jika sudah dijawab, hilangkan status ragu-ragu otomatis
    if (flagged[currentQ]) {
      setFlagged(prev => ({ ...prev, [currentQ]: false }));
    }
  };

  const handleToggleFlag = () => {
    setFlagged(prev => ({ ...prev, [currentQ]: !prev[currentQ] }));
  };

  const isLastQuestion = currentQ === MOCK_QUESTIONS.length - 1;
  const isFirstQuestion = currentQ === 0;

  // Hitung statistik singkat
  const totalAnswered = Object.keys(answers).length;
  const totalFlagged = Object.values(flagged).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans flex flex-col selection:bg-blue-200">
      
      {/* ========================================= */}
      {/* 1. HEADER (Fixed Top)                       */}
      {/* ========================================= */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[90rem] mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Kiri: Branding & Judul */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 pr-6 border-r border-slate-200">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black">F</div>
              <span className="font-black text-lg tracking-tight text-slate-800">Fast<span className="text-blue-600">Test</span></span>
            </div>
            <div>
              <h1 className="text-sm lg:text-base font-black text-slate-800 leading-tight">Ujian Akhir Semester - B. Arab</h1>
              <p className="text-[10px] lg:text-xs font-bold text-slate-500">Kelas XII MIPA 1</p>
            </div>
          </div>

          {/* Tengah: Timer (Sangat Penting) */}
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border-2 font-black tracking-widest text-sm lg:text-lg transition-colors ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-slate-50 text-slate-800 border-slate-200'}`}>
            <Clock size={20} weight={timeLeft < 300 ? "fill" : "bold"} className={timeLeft < 300 ? 'text-red-500' : 'text-slate-400'} />
            {formatTime(timeLeft)}
          </div>

          {/* Kanan: Profil & Tombol Nav Mobile */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <UserCircle size={28} weight="fill" className="text-slate-400" />
              <div className="text-right">
                <p className="text-xs font-black text-slate-800">Ahmad Budi</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">NIS: 20261001</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
              <List size={24} weight="bold" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================= */}
      {/* 2. MAIN LAYOUT (Konten Soal & Sidebar)      */}
      {/* ========================================= */}
      <div className="flex-1 max-w-[90rem] mx-auto w-full px-4 lg:px-8 py-6 flex gap-6 relative">
        
        {/* AREA KIRI: KONTEN SOAL UTAMA */}
        <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
          
          {/* Indikator Nomor & Flag */}
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-1.5 rounded-full shadow-sm shadow-blue-500/30">
              <span className="text-xs font-black uppercase tracking-widest">Soal No.</span>
              <span className="text-lg font-black">{currentQ + 1}</span>
            </div>
            {flagged[currentQ] && (
              <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold border border-amber-200 animate-pulse">
                <Flag size={14} weight="fill" /> Ditandai Ragu-ragu
              </div>
            )}
          </div>

          {/* Card Soal */}
          <div className="bg-white p-6 lg:p-10 rounded-[2rem] shadow-sm border border-slate-200 flex-1 flex flex-col relative overflow-hidden">
            {/* Aksen atas Card */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

            {/* Teks Soal */}
            <div className="mb-8">
              <p className="text-lg lg:text-xl font-semibold text-slate-800 leading-relaxed">
                {MOCK_QUESTIONS[currentQ].teks}
              </p>
            </div>

            {/* Opsi Jawaban */}
            <div className="space-y-3 mb-8">
              {MOCK_QUESTIONS[currentQ].opsi.map((opsi, idx) => {
                const isSelected = answers[currentQ] === idx;
                return (
                  <button 
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 flex items-start gap-4 group cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-50 border-blue-500 shadow-md shadow-blue-500/10' 
                        : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    {/* Custom Radio Button */}
                    <div className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 group-hover:border-blue-400'
                    }`}>
                      {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                    </div>
                    <span className={`text-base font-medium leading-relaxed ${isSelected ? 'text-blue-900 font-bold' : 'text-slate-700'}`}>
                      {opsi}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Area Tombol Aksi Bawah */}
            <div className="mt-auto pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              
              {/* Tombol Kiri (Kembali) */}
              <button 
                onClick={() => setCurrentQ(prev => prev - 1)}
                disabled={isFirstQuestion}
                className="flex items-center gap-2 px-5 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95"
              >
                <CaretLeft size={20} weight="bold" /> <span className="hidden sm:inline">Soal Sebelumnya</span>
              </button>

              <div className="flex gap-3 ml-auto">
                {/* Tombol Ragu-ragu */}
                <button 
                  onClick={handleToggleFlag}
                  className={`flex items-center gap-2 px-5 py-3 font-bold rounded-xl transition-all active:scale-95 ${
                    flagged[currentQ] 
                      ? 'bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-200' 
                      : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-600'
                  }`}
                >
                  <Flag size={20} weight={flagged[currentQ] ? "fill" : "bold"} /> 
                  <span className="hidden sm:inline">Ragu-ragu</span>
                </button>

                {/* Tombol Selanjutnya / Selesai */}
                {!isLastQuestion ? (
                  <button 
                    onClick={() => setCurrentQ(prev => prev + 1)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                  >
                    <span className="hidden sm:inline">Selanjutnya</span> <CaretRight size={20} weight="bold" />
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowSubmitModal(true)}
                    className="flex items-center gap-2 px-8 py-3 bg-emerald-500 text-white font-black rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-all active:scale-95 animate-bounce-slow"
                  >
                    <CheckCircle size={20} weight="bold" /> Selesai Ujian
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* ========================================= */}
        {/* 3. SIDEBAR KANAN (Navigasi Nomor Soal)      */}
        {/* ========================================= */}
        {/* Overlay untuk Mobile */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        )}

        <aside className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0 lg:w-72 lg:h-auto lg:shadow-none lg:bg-transparent lg:z-auto flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}>
          
          <div className="p-6 bg-white lg:rounded-3xl lg:shadow-sm lg:border lg:border-slate-200 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Navigasi Soal</h2>
              <button className="lg:hidden p-1 text-slate-400" onClick={() => setIsSidebarOpen(false)}>✕</button>
            </div>

            {/* Rekap Progress */}
            <div className="flex gap-2 mb-6">
              <div className="flex-1 bg-emerald-50 p-2 rounded-lg text-center border border-emerald-100">
                <span className="block text-lg font-black text-emerald-600">{totalAnswered}</span>
                <span className="text-[9px] font-bold text-emerald-700 uppercase">Dijawab</span>
              </div>
              <div className="flex-1 bg-slate-100 p-2 rounded-lg text-center border border-slate-200">
                <span className="block text-lg font-black text-slate-600">{MOCK_QUESTIONS.length - totalAnswered}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase">Sisa</span>
              </div>
            </div>

            {/* Grid Nomor Soal */}
            <div className="grid grid-cols-5 gap-2.5 mb-6 overflow-y-auto pr-1 flex-1 content-start custom-scrollbar">
              {MOCK_QUESTIONS.map((_, idx) => {
                const isAnswered = answers[idx] !== undefined;
                const isFlagged = flagged[idx];
                const isActive = currentQ === idx;

                // Logika Warna Tombol Navigasi
                let btnClass = "bg-white border-slate-200 text-slate-600 hover:border-blue-400"; // Default
                if (isFlagged) {
                  btnClass = "bg-amber-400 border-amber-500 text-white shadow-md shadow-amber-500/20";
                } else if (isAnswered) {
                  btnClass = "bg-blue-600 border-blue-700 text-white shadow-md shadow-blue-500/20";
                }

                // Jika sedang aktif (sedang dilihat), beri outline khusus
                const activeRing = isActive ? "ring-4 ring-blue-200 border-blue-600 !scale-110 z-10" : "";

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentQ(idx);
                      setIsSidebarOpen(false); // Tutup sidebar di HP jika diklik
                    }}
                    className={`aspect-square rounded-xl border-2 font-black text-sm flex items-center justify-center transition-all cursor-pointer ${btnClass} ${activeRing}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legenda Warna */}
            <div className="mt-auto pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <div className="w-4 h-4 bg-blue-600 rounded"></div> Sudah Dijawab
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <div className="w-4 h-4 bg-amber-400 rounded"></div> Ragu-ragu
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <div className="w-4 h-4 bg-white border-2 border-slate-200 rounded"></div> Belum Dijawab
              </div>
            </div>
            
            {/* Tombol Kumpul Manual di Navigasi */}
            <button 
              onClick={() => setShowSubmitModal(true)}
              className="mt-6 w-full py-3 bg-slate-900 text-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-black transition-colors"
            >
              Kumpulkan Ujian
            </button>
          </div>
        </aside>

      </div>

      {/* ========================================= */}
      {/* MODAL KONFIRMASI SELESAI                    */}
      {/* ========================================= */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Background dekoratif */}
            <div className="absolute top-0 left-0 w-full h-24 bg-blue-50 -z-10"></div>
            
            <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg mb-6 text-blue-600 border border-slate-100 relative z-10">
              <SignOut size={40} weight="fill" />
            </div>
            
            <h3 className="text-2xl font-black text-slate-800 mb-2">Selesai Ujian?</h3>
            <p className="text-slate-500 font-medium mb-6">
              Pastikan semua jawaban sudah terisi dengan benar. Waktu Anda masih tersisa <strong className="text-slate-800">{formatTime(timeLeft)}</strong>.
            </p>

            <div className="bg-slate-50 rounded-2xl p-4 mb-8 flex justify-center gap-6 border border-slate-100">
              <div className="text-center">
                <span className="block text-2xl font-black text-blue-600">{totalAnswered}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Dijawab</span>
              </div>
              <div className="text-center">
                <span className="block text-2xl font-black text-amber-500">{totalFlagged}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Ragu-ragu</span>
              </div>
              <div className="text-center">
                <span className="block text-2xl font-black text-red-500">{MOCK_QUESTIONS.length - totalAnswered}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Kosong</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cek Kembali
              </button>
              <button 
                onClick={() => {
                  alert("Ujian berhasil dikumpulkan! Nilai Anda sedang diproses.");
                  // Redirect logic goes here (e.g., window.location.href = '/siswa')
                }}
                className="flex-1 py-3.5 bg-emerald-500 text-white font-black rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
              >
                Ya, Kumpulkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Style untuk Scrollbar di Grid Navigasi */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .animate-bounce-slow { animation: bounce 2s infinite; }
      `}} />

    </div>
  );
}
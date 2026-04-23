"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, FileText, Desktop, Scan, ChartBar, Lightbulb, 
  BookOpenText, ListNumbers, CaretDown, CaretUp, CheckCircle, Flag, PencilCircle, X,
  YoutubeLogo 
} from "@phosphor-icons/react";

export default function TutorialPage() {
  const [showDetail, setShowDetail] = useState(false);
  const [showVideo, setShowVideo] = useState(false); 

  const fiturPanduan = [
    {
      id: "ljk",
      icon: <FileText size={32} weight="fill" className="text-blue-500" />,
      bg: "bg-blue-50",
      border: "border-blue-200",
      title: "1. Buat Ujian LJK (Cetak)",
      desc: "Fitur ini digunakan untuk membuat desain Lembar Jawaban Komputer (LJK) siap cetak. Anda bisa mengatur jumlah soal, mata pelajaran, dan sistem akan otomatis membuatkan kode arsiran.",
      tips: "Pastikan kertas yang dicetak tidak terlipat atau basah saat dibagikan ke santri."
    },
    {
      id: "cbt",
      icon: <Desktop size={32} weight="fill" className="text-indigo-500" />,
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      title: "2. Ujian CBT Online",
      desc: "Gunakan CBT Online untuk ujian tanpa kertas. Anda dapat mengetik soal pilihan ganda, mengatur durasi waktu pengerjaan, dan sistem akan menghasilkan 'Token Ujian' untuk santri.",
      tips: "Santri tidak akan bisa keluar dari mode ujian jika fitur Anti-Kecurangan aktif."
    },
    {
      id: "scan",
      icon: <Scan size={32} weight="fill" className="text-emerald-500" />,
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      title: "3. Scanner Pintar (OMR)",
      desc: "Arahkan kamera HP/Laptop ke kertas LJK yang sudah dikerjakan. Paskan 4 sudut kotak di layar, dan AI akan langsung membaca bulatan hitam, dan menghitung nilai dalam hitungan detik!",
      tips: "Bisa digunakan secara OFFLINE. Data akan tersimpan dan bisa disinkronkan nanti."
    },
    {
      id: "arsip",
      icon: <ChartBar size={32} weight="fill" className="text-purple-500" />,
      bg: "bg-purple-50",
      border: "border-purple-200",
      title: "4. Arsip & Analisis",
      desc: "Semua hasil ujian bermuara di sini. Anda bisa melihat siapa santri dengan nilai tertinggi, soal mana yang paling banyak salah dijawab, dan mengekspor hasilnya ke format Microsoft Excel.",
      tips: "Gunakan filter tanggal untuk mencari ujian di semester sebelumnya dengan cepat."
    }
  ];

  return (
    <div className="max-w-[70rem] mx-auto px-6 py-8 pb-20 font-sans">
      
      {/* Header Halaman */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/guru" className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors shadow-sm text-slate-600">
          <ArrowLeft size={20} weight="bold" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <BookOpenText size={28} className="text-indigo-600" weight="fill"/> Pusat Panduan FastTest
          </h1>
          <p className="text-sm font-bold text-slate-500">Pelajari cara memaksimalkan modul utama sistem manajemen pendidikan ini.</p>
        </div>
      </div>

      {/* Video / Banner Sambutan */}
      <div className="w-full bg-gradient-to-r from-slate-800 to-indigo-900 rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 mb-8 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10 max-w-xl">
          <span className="px-3 py-1 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">Selamat Datang!</span>
          <h2 className="text-3xl font-black mb-3 leading-tight">Digitalisasi Ujian Anda<br/>Menjadi Jauh Lebih Mudah.</h2>
          <p className="text-indigo-200 font-medium text-sm leading-relaxed mb-6">Sistem FastTest didesain agar sangat intuitif. Anda bisa beralih antara ujian kertas tradisional (yang dinilai super cepat dengan AI) atau ujian murni digital berbasis CBT.</p>
          
          <button 
            onClick={() => setShowDetail(!showDetail)}
            className="flex items-center gap-2 px-5 py-3 bg-white text-indigo-900 rounded-xl font-black text-sm hover:bg-indigo-50 transition-colors shadow-lg"
          >
            <ListNumbers size={20} weight="bold" />
            {showDetail ? 'Tutup Alur Kerja' : 'Lihat Alur Kerja Lengkap'}
            {showDetail ? <CaretUp size={16} weight="bold"/> : <CaretDown size={16} weight="bold"/>}
          </button>
        </div>

        {/* Tombol Play Video (Pembaruan: Logo YouTube Putih & Menyala) */}
        <div className="w-full md:w-auto shrink-0 relative z-10 flex flex-col items-center">
          <button 
            onClick={() => setShowVideo(true)}
            className="w-32 h-32 bg-white/5 backdrop-blur-sm rounded-full border-2 border-white/30 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all group shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          >
            {/* Lingkaran Putih Padat di Dalam (Membuat warna merah menyala) */}
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-300">
              {/* Logo YouTube warna merah indigo (agar senada tema) atau merah YouTube asli */}
              <YoutubeLogo size={56} weight="fill" className="text-[#FF0000] drop-shadow-lg" />
            </div>
          </button>
          <p className="mt-3 text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Tonton Video Demo</p>
        </div>
      </div>

      {/* POP-UP VIDEO PLAYER */}
      {showVideo && (
        <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 animate-in fade-in zoom-in duration-300">
          <div className="w-full max-w-5xl bg-black rounded-3xl overflow-hidden shadow-2xl relative border border-white/10">
            {/* Tombol Tutup */}
            <button 
              onClick={() => setShowVideo(false)}
              className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-colors"
            >
              <X size={24} weight="bold" />
            </button>
            
            <div className="aspect-video bg-slate-900 flex items-center justify-center relative">
              <video 
                src="/demo-fasttest.mp4" 
                controls 
                autoPlay 
                className="w-full h-full object-contain"
              >
                <p className="text-white">Video belum ditambahkan. Silakan taruh file demo-fasttest.mp4 di folder public.</p>
              </video>

              <div className="absolute flex flex-col items-center text-slate-500 pointer-events-none p-10 text-center">
                {/* Logo YouTube Putih Menyala di dalam Pop-up */}
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl mb-4">
                  <YoutubeLogo size={56} weight="fill" className="text-[#FF0000]" />
                </div>
                <p className="font-bold text-sm">Taruh file <code className="bg-slate-800 text-slate-300 px-2 py-1 rounded">demo-fasttest.mp4</code> di folder <code className="bg-slate-800 text-slate-300 px-2 py-1 rounded">public</code></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAMPILAN ALUR KERJA LENGKAP */}
      {showDetail && (
        <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <Flag size={24} className="text-indigo-600" weight="fill"/> Alur Kerja dari Awal Hingga Akhir
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-lg mb-4">1</div>
              <h4 className="font-black text-slate-800 mb-2">Persiapan Ujian</h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">Tentukan metode ujian yang ingin digunakan.</p>
              <ul className="text-[11px] text-slate-500 space-y-2">
                <li className="flex gap-1.5"><CheckCircle size={14} className="text-blue-500 shrink-0"/> <b>Pilih Kertas (LJK):</b> Buka menu Buat LJK, atur jumlah soal, lalu cetak.</li>
                <li className="flex gap-1.5"><CheckCircle size={14} className="text-blue-500 shrink-0"/> <b>Pilih Digital (CBT):</b> Buka menu CBT, ketik soal/kunci jawaban, simpan untuk mendapat Token.</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-black text-lg mb-4">2</div>
              <h4 className="font-black text-slate-800 mb-2">Pelaksanaan</h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">Santri mulai mengerjakan ujian sesuai metode.</p>
              <ul className="text-[11px] text-slate-500 space-y-2">
                <li className="flex gap-1.5"><CheckCircle size={14} className="text-amber-500 shrink-0"/> <b>Kertas (LJK):</b> Bagikan kertas, santri menghitamkan bulatan dengan pensil 2B.</li>
                <li className="flex gap-1.5"><CheckCircle size={14} className="text-amber-500 shrink-0"/> <b>Digital (CBT):</b> Bagikan Token ke santri, mereka login di HP dan langsung menjawab.</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-black text-lg mb-4">3</div>
              <h4 className="font-black text-slate-800 mb-2">Proses Koreksi</h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">Sistem FastTest mengambil alih tugas berat Anda.</p>
              <ul className="text-[11px] text-slate-500 space-y-2">
                <li className="flex gap-1.5"><CheckCircle size={14} className="text-emerald-500 shrink-0"/> <b>Kertas (LJK):</b> Buka menu Scanner, arahkan kamera ke kertas santri. AI akan mengoreksi seketika.</li>
                <li className="flex gap-1.5"><CheckCircle size={14} className="text-emerald-500 shrink-0"/> <b>Digital (CBT):</b> Otomatis terkoreksi saat santri menekan tombol "Selesai" di HP mereka.</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-black text-lg mb-4">4</div>
              <h4 className="font-black text-slate-800 mb-2">Hasil & Analisis</h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">Selesai! Semua nilai sudah terkumpul otomatis.</p>
              <ul className="text-[11px] text-slate-500 space-y-2">
                <li className="flex gap-1.5"><CheckCircle size={14} className="text-purple-500 shrink-0"/> <b>Lihat Peringkat:</b> Buka menu Arsip untuk melihat nilai santri dari yang tertinggi.</li>
                <li className="flex gap-1.5"><CheckCircle size={14} className="text-purple-500 shrink-0"/> <b>Ekspor Excel:</b> Klik tombol Export untuk mendownload rekap nilai sebagai laporan ke sekolah.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Grid Panduan Komponen */}
      <div className="space-y-6">
        <h3 className="text-lg font-black text-slate-800 border-b border-slate-200 pb-3 mb-6 flex items-center gap-2">
          <PencilCircle size={28} className="text-indigo-600" weight="fill"/> Fitur-Fitur Utama
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fiturPanduan.map((item) => (
            <div key={item.id} className={`p-6 rounded-3xl border ${item.border} ${item.bg} hover:shadow-lg transition-shadow relative overflow-hidden group`}>
              <div className="absolute -right-6 -top-6 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
                {item.icon}
              </div>
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                {item.icon}
              </div>
              <h4 className="text-lg font-black text-slate-800 mb-3">{item.title}</h4>
              <p className="text-sm font-medium text-slate-600 leading-relaxed mb-5">
                {item.desc}
              </p>
              <div className="bg-white/60 p-4 rounded-xl border border-white/40">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Lightbulb size={14}/> Pro Tip:</p>
                <p className="text-xs font-bold text-slate-700 italic">{item.tips}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
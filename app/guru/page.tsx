"use client";

import React from "react";
import Link from "next/link";
import { 
  PlusCircle, 
  Scan, 
  FileText, 
  UsersThree, 
  ChartLineUp, 
  ClockCounterClockwise,
  CaretRight,
  GraduationCap,
  DotsThreeVertical
} from "@phosphor-icons/react";

// WAJIB: Ada "export default function" agar tidak error di Next.js
export default function DashboardGuru() {
  
  // Data Dummy untuk Statistik
  const statistik = [
    { label: "Total LJK Terpindai", nilai: "1,284", tren: "+12%", warna: "text-blue-600", bg: "bg-blue-50" },
    { label: "Ujian Aktif", nilai: "5", tren: "Minggu ini", warna: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Rata-rata Nilai", nilai: "78.5", tren: "+5.2", warna: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  // Data Dummy Aktivitas Terbaru
  const aktivitas = [
    { id: 1, nama: "Ujian Biologi Sel", kelas: "X-IPA 1", waktu: "2 jam yang lalu", status: "Selesai" },
    { id: 2, nama: "Kuis Tajwid Dasar", kelas: "VII-A", waktu: "5 jam yang lalu", status: "Selesai" },
    { id: 3, nama: "Ujian Akhir Semester", kelas: "XII-IPS", waktu: "Kemarin", status: "Proses" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-xl text-white">
            <GraduationCap size={24} weight="fill" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Fast<span className="text-blue-600">Test</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-900">Ustadz Ahmad</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Administrator</p>
            </div>
            <div className="w-10 h-10 bg-slate-200 rounded-full border-2 border-white shadow-sm overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad" alt="avatar" />
            </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 lg:p-10">
        
        {/* Welcome Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-black text-slate-900 leading-tight">
              Ahlan wa Sahlan, <span className="text-blue-600">Guru!</span>
            </h2>
            <p className="text-slate-500 font-medium mt-1 text-lg">Kelola ujian dan pantau hasil santri dalam satu platform canggih.</p>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <Link href="/guru/ujian/buat" className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
              <PlusCircle size={22} weight="bold" /> Buat Kunci
            </Link>
            <Link href="/guru/scan" className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 hover:-translate-y-1">
              <Scan size={22} weight="bold" /> Mulai Scan
            </Link>
          </div>
        </header>

        {/* Statistik Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {statistik.map((item, idx) => (
            <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300">
              <div className="flex justify-between items-center mb-6">
                <div className={`p-4 ${item.bg} ${item.warna} rounded-2xl`}>
                   {idx === 0 ? <Scan size={32} weight="bold" /> : idx === 1 ? <FileText size={32} weight="bold" /> : <ChartLineUp size={32} weight="bold" />}
                </div>
                <span className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-wider">
                  {item.tren}
                </span>
              </div>
              <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-2">{item.label}</p>
              <h3 className="text-5xl font-black text-slate-900">{item.nilai}</h3>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Main Activity Column */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <ClockCounterClockwise size={28} weight="bold" className="text-blue-600" />
                Aktivitas Terbaru
              </h3>
              <Link href="/guru/ujian" className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                Lihat Semua <CaretRight size={14} weight="bold" />
              </Link>
            </div>
            
            <div className="space-y-4">
              {aktivitas.map((act) => (
                <div key={act.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:border-blue-400 hover:bg-blue-50/10 transition-all cursor-pointer">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      <FileText size={28} weight="duotone" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{act.nama}</h4>
                      <p className="text-sm text-slate-500 font-medium">{act.kelas} • {act.waktu}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${act.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {act.status}
                    </span>
                    <DotsThreeVertical size={24} weight="bold" className="text-slate-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Shortcuts Column */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
              <UsersThree size={28} weight="bold" className="text-blue-600" />
              Navigasi Cepat
            </h3>
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-4 shadow-sm space-y-2">
               <Link href="/guru/siswa" className="flex items-center justify-between p-5 hover:bg-slate-50 rounded-3xl transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-100 text-slate-500 rounded-xl group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      <UsersThree size={24} weight="bold" />
                    </div>
                    <span className="font-bold text-slate-700 text-lg">Data Santri</span>
                  </div>
                  <CaretRight size={20} weight="bold" className="text-slate-300 group-hover:text-blue-600" />
               </Link>
               
               <div className="h-px bg-slate-100 mx-6" />
               
               <Link href="/guru/ujian" className="flex items-center justify-between p-5 hover:bg-slate-50 rounded-3xl transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-100 text-slate-500 rounded-xl group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      <FileText size={24} weight="bold" />
                    </div>
                    <span className="font-bold text-slate-700 text-lg">Bank Ujian</span>
                  </div>
                  <CaretRight size={20} weight="bold" className="text-slate-300 group-hover:text-blue-600" />
               </Link>

               <div className="h-px bg-slate-100 mx-6" />

               <Link href="/guru/settings" className="flex items-center justify-center p-5 mt-4 bg-slate-900 text-white rounded-3xl hover:bg-slate-800 transition-colors font-bold text-sm">
                  Pengaturan Akun
               </Link>
            </div>

            {/* Promo/Info Box */}
            <div className="mt-8 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-200">
               <h4 className="font-black text-xl mb-2">Butuh Bantuan?</h4>
               <p className="text-blue-100 text-sm mb-6 leading-relaxed">Hubungi tim FastTest untuk panduan penggunaan scanner LJK.</p>
               <button className="w-full py-3 bg-white text-blue-600 font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg">
                  WhatsApp Admin
               </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
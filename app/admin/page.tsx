"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  UsersThree, 
  Student, 
  FileText, 
  ChartLineUp, 
  ArrowRight,
  Buildings,
  ClockCounterClockwise
} from "@phosphor-icons/react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    guru: 0,
    santri: 0,
    template: 0
  });
  const [loading, setLoading] = useState(true);

  // Simulasi fetch data statistik sekolah
  useEffect(() => {
    const loadStats = async () => {
      // Nantinya data ini ditarik dari API agregat per sekolah_id
      setStats({ guru: 20, santri: 450, template: 8 });
      setLoading(false);
    };
    loadStats();
  }, []);

  const menuUtama = [
    {
      title: "Manajemen Guru",
      desc: "Daftarkan pengajar baru dan kelola hak akses login ustadz/ustadzah.",
      icon: <UsersThree size={32} weight="fill" />,
      href: "/admin/guru",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      count: stats.guru,
      unit: "Pengajar"
    },
    {
      title: "Data Santri",
      desc: "Kelola database database siswa, NIS, dan pembagian kelas (rombel).",
      icon: <Student size={32} weight="fill" />,
      href: "/admin/santri",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      count: stats.santri,
      unit: "Siswa"
    },
    {
      title: "Master LJK",
      desc: "Buat dan standarisasi format lembar jawaban resmi untuk seluruh sekolah.",
      icon: <FileText size={32} weight="fill" />,
      href: "/admin/template",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      count: stats.template,
      unit: "Format"
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans p-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* HEADER & PROFIL SEKOLAH */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-blue-600 rounded-lg text-white">
                <Buildings size={20} weight="bold" />
              </div>
              <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Dashboard Institusi</span>
            </div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">SDIT UBAY BIN KA'AB</h1>
            <p className="text-slate-500 font-medium mt-1">Selamat datang di pusat kendali administrasi FastTest.</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
             <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <UsersThree size={24} weight="bold" />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Login Sebagai</p>
                <p className="text-sm font-bold text-slate-800 uppercase">Administrator Utama</p>
             </div>
          </div>
        </div>

        {/* MENU UTAMA (NAVIGATION CARDS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {menuUtama.map((menu, idx) => (
            <Link 
              key={idx} 
              href={menu.href}
              className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all group flex flex-col relative overflow-hidden"
            >
              <div className={`w-16 h-16 ${menu.bgColor} ${menu.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                {menu.icon}
              </div>
              
              <h2 className="text-2xl font-black text-slate-800 mb-3">{menu.title}</h2>
              <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8">
                {menu.desc}
              </p>
              
              <div className="mt-auto flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-slate-800">{loading ? '...' : menu.count}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{menu.unit}</span>
                </div>
                <div className={`p-3 ${menu.bgColor} ${menu.color} rounded-xl opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0`}>
                  <ArrowRight size={20} weight="bold" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* AKTIVITAS TERBARU & STATS TAMBAHAN */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-800 flex items-center gap-2">
                <ClockCounterClockwise size={24} className="text-slate-400" /> Aktivitas Sistem Terbaru
              </h3>
              <button className="text-xs font-bold text-blue-600 hover:underline">Lihat Semua Log</button>
            </div>
            
            <div className="space-y-4">
              {[
                { time: "10 menit yang lalu", task: "Pendaftaran Guru Baru", user: "Ustadzah Fatimah, S.Pd", icon: "plus" },
                { time: "2 jam yang lalu", task: "Update Data Santri", user: "Sinkronisasi Dapodik", icon: "sync" },
                { time: "Kemarin", task: "Pembuatan Template LJK", user: "UAS Semester Ganjil", icon: "file" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                    <ChartLineUp size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-800">{item.task}</p>
                    <p className="text-xs font-medium text-slate-500">{item.user}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] p-8 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 opacity-10">
               <FileText size={200} weight="fill" />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-black tracking-tight mb-2">Tips Manajemen</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Gunakan fitur **Master Template** untuk memastikan semua ujian di sekolah Anda memiliki standar visual dan deteksi OMR yang seragam.
              </p>
            </div>
            <div className="relative z-10 pt-10">
              <Link href="/admin/template" className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20">
                Buat Template Master
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
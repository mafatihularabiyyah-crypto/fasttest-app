"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ClockClockwise, Scan, TrendUp, Buildings, 
  CaretRight, ShieldCheck, CheckCircle
} from "@phosphor-icons/react";

export default function AdminDashboardMain() {
  const [stats, setStats] = useState({ guru: 0, santri: 0, template: 0, isLoading: true });

  const [riwayatScan] = useState([
    { id: 1, guru: "Ustadz Ahmad, S.Pd", kelas: "10-A", jumlah: 35, waktu: "10 Menit yang lalu", status: "sukses" },
    { id: 2, guru: "Ustadzah Fatimah", kelas: "11-IPA", jumlah: 40, waktu: "1 Jam yang lalu", status: "sukses" },
    { id: 3, guru: "Ustadz Umar", kelas: "12-IPS", jumlah: 38, waktu: "3 Jam yang lalu", status: "sukses" },
    { id: 4, guru: "Ustadz Ali, Lc", kelas: "10-B", jumlah: 34, waktu: "Kemarin, 14:30", status: "sukses" },
  ]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resGuru, resSantri, resTemplate] = await Promise.all([
          fetch('/api/admin/guru').catch(() => ({ json: () => [] })),
          fetch('/api/admin/santri').catch(() => ({ json: () => [] })),
          fetch('/api/admin/template').catch(() => ({ json: () => [] }))
        ]);
        const [dataGuru, dataSantri, dataTemplate] = await Promise.all([
          resGuru.json(), resSantri.json(), resTemplate.json()
        ]);
        setStats({
          guru: Array.isArray(dataGuru) ? dataGuru.length : 0,
          santri: Array.isArray(dataSantri) ? dataSantri.length : 0,
          template: Array.isArray(dataTemplate) ? dataTemplate.length : 0,
          isLoading: false
        });
      } catch (error) { setStats(prev => ({ ...prev, isLoading: false })); }
    };
    loadData();
  }, []);

  return (
    <div className="p-6 md:p-8 pb-24 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-lg mb-3">
              <ShieldCheck size={14} weight="bold" /> Administrator Portal
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Dashboard Institusi</h1>
            <p className="text-sm font-bold text-slate-500 mt-2 max-w-xl leading-relaxed">
              Pantau aktivitas pengajar, kelola data santri, dan standarisasi lembar jawaban sekolah Anda dalam satu panel terpusat.
            </p>
          </div>
        </div>

        {/* BENTO GRID STATISTIK */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 bg-[#1d4ed8] rounded-[2.5rem] p-8 sm:p-10 relative overflow-hidden shadow-2xl shadow-blue-900/20 flex flex-col justify-between">
            <div className="absolute -top-10 -right-10 p-8 opacity-10 pointer-events-none rotate-12"><Buildings size={280} weight="fill" /></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-300 opacity-50"></div>
            <div className="relative z-10 mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Sistem Aktif</h2>
              <p className="text-blue-200 font-medium max-w-md text-sm sm:text-base leading-relaxed">Tingkatkan efisiensi evaluasi belajar. Pantau jumlah pengajar aktif, data siswa, dan standarisasi Master LJK sekolah Anda.</p>
            </div>
            <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-blue-600/50 pt-6">
              <div><p className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1">Total Santri</p><div className="text-3xl font-black text-white">{stats.isLoading ? "..." : stats.santri}</div></div>
              <div><p className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1">Pengajar Aktif</p><div className="text-3xl font-black text-white">{stats.isLoading ? "..." : stats.guru}</div></div>
              <div><p className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1">Master LJK</p><div className="text-3xl font-black text-white">{stats.isLoading ? "..." : stats.template}</div></div>
            </div>
          </div>

          <div className="md:col-span-4 bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center relative hover:border-indigo-300 transition-all hover:shadow-xl">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center mb-6 ring-8 ring-indigo-50/50"><Scan size={40} weight="duotone" /></div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Koreksi Cepat</h3>
            <p className="text-xs font-bold text-slate-500 mb-6 px-2 leading-relaxed">Pindai lembar jawaban siswa secara masal menggunakan kamera.</p>
            <button onClick={() => alert("Fitur Scanner Masal sedang dalam pengembangan!")} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
              Buka Scanner <CaretRight size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* RIWAYAT AKTIVITAS SCAN GURU */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2"><ClockClockwise size={24} className="text-indigo-600" weight="bold"/> Riwayat Pemindaian LJK</h2>
              <p className="text-xs font-bold text-slate-500 mt-1">Aktivitas koreksi terbaru oleh dewan guru.</p>
            </div>
            <div className="text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100 flex items-center gap-2">
              <TrendUp size={16} weight="bold"/> Total: 1,240 LJK Bulan Ini
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b-2 border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="pb-4 pl-4">Guru / Pengajar</th>
                  <th className="pb-4 text-center">Kelas</th>
                  <th className="pb-4 text-center">Jumlah LJK</th>
                  <th className="pb-4 text-right pr-4">Waktu Selesai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {riwayatScan.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-4 pl-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-black text-xs">{log.guru.charAt(0)}</div>
                      <div><p className="font-bold text-slate-700 text-sm group-hover:text-indigo-600 transition-colors">{log.guru}</p></div>
                    </td>
                    <td className="py-4 text-center"><span className="px-2 py-1 bg-slate-100 text-slate-600 font-bold text-xs rounded-md border border-slate-200">{log.kelas}</span></td>
                    <td className="py-4 text-center"><div className="flex items-center justify-center gap-1.5"><CheckCircle size={16} className="text-emerald-500" weight="fill"/><span className="font-black text-slate-700">{log.jumlah}</span> <span className="text-xs font-bold text-slate-400">Lembar</span></div></td>
                    <td className="py-4 text-right pr-4 font-bold text-xs text-slate-400">{log.waktu}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <button className="text-xs font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest transition-colors">Lihat Semua Riwayat &rarr;</button>
          </div>
        </div>

      </div>
    </div>
  );
}
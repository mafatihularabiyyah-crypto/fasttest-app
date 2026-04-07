// app/page.tsx
"use client";

import Link from "next/link";
import { 
  Scan, 
  DeviceMobileCamera, 
  CloudCheck, 
  ChartBar, 
  CheckCircle, 
  ArrowRight, 
  GraduationCap,
  FileText,
  Users,
  ShieldCheck,
  User
} from "@phosphor-icons/react";

export default function LandingPage() {
  
  // Komponen Helper untuk Ikon Pengguna Tanpa Wajah
  const UserSilhouette = ({ className = "" }) => (
    <div className={`w-12 h-12 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-slate-500 shadow-inner ${className}`}>
      <User size={24} weight="bold" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200">
      
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl text-white shadow-md shadow-blue-200">
              <Scan size={24} weight="bold" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Fast<span className="text-blue-600">Test</span>
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-8 font-bold text-slate-600 text-sm">
            <a href="#fitur" className="hover:text-blue-600 transition-colors">Fitur</a>
            <a href="#cara-kerja" className="hover:text-blue-600 transition-colors">Cara Kerja</a>
            <a href="#harga" className="hover:text-blue-600 transition-colors">Harga</a>
            <a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a>
          </div>
          <Link 
            href="/login" 
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition-all shadow-lg cursor-pointer"
          >
            Masuk Guru <ArrowRight size={16} weight="bold" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400 via-slate-50 to-transparent pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Teks Hero */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-bold text-xs uppercase tracking-widest mb-6 border border-blue-100">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                Solusi Digitalisasi Madrasah
              </div>
              <h2 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
                Koreksi Ratusan LJK dalam <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Hitungan Menit.</span>
              </h2>
              <p className="text-lg lg:text-xl text-slate-500 font-medium mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Tinggalkan mesin scanner kuno dan kertas mahal. Ubah kamera *smartphone* Anda menjadi alat periksa ujian otomatis yang sangat akurat. Didesain khusus untuk beban kerja guru di Indonesia.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link href="/login" className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white font-black text-lg rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 hover:-translate-y-1 cursor-pointer">
                  Mulai Gunakan Gratis
                </Link>
                <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                  <CheckCircle size={20} className="text-emerald-500" weight="fill" /> Tanpa Kartu Kredit
                </div>
              </div>
            </div>

            {/* Ilustrasi HP (Mockup Realistis Scanner OMR) */}
            <div className="flex-1 w-full max-w-md lg:max-w-none relative perspective-1000">
              <div className="relative mx-auto w-[320px] h-[640px] bg-slate-900 rounded-[3rem] border-[12px] border-slate-900 shadow-2xl overflow-hidden flex flex-col z-10 transform lg:rotate-y-[-5deg] lg:rotate-x-[5deg] transition-transform duration-700 hover:rotate-0">
                
                {/* Poni HP (Notch) */}
                <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 rounded-b-3xl w-40 mx-auto z-30"></div>
                
                {/* Layar HP - Tampilan Kamera */}
                <div className="flex-1 bg-slate-200 relative overflow-hidden">
                  
                  {/* Simulasi Kertas LJK di Atas Meja */}
                  <div className="absolute inset-0 bg-[#e0e0e0] flex items-center justify-center">
                    <div className="w-[90%] h-[85%] bg-white rounded shadow-sm border border-slate-300 p-4 flex flex-col relative transform rotate-1">
                      
                      {/* Marker Sudut OMR (Hitam Solid) */}
                      <div className="absolute top-3 left-3 w-4 h-4 bg-black rounded-full"></div>
                      <div className="absolute top-3 right-3 w-4 h-4 bg-black rounded-full"></div>
                      <div className="absolute bottom-3 left-3 w-4 h-4 bg-black rounded-full"></div>
                      <div className="absolute bottom-3 right-3 w-4 h-4 bg-black rounded-full"></div>
                      
                      {/* Header LJK */}
                      <div className="h-6 border-b-2 border-slate-800 w-3/4 mx-auto mb-4 flex items-end justify-between pb-1 mt-2">
                        <div className="h-2 w-16 bg-slate-800"></div>
                        <div className="h-2 w-8 bg-slate-800"></div>
                      </div>

                      {/* Baris Jawaban LJK */}
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-2">
                        {[...Array(8)].map((_, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <span className="text-[8px] font-black">{i+1}</span>
                            {/* Simulasi Bulatan (A B C D) */}
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-500 flex items-center justify-center"></div>
                            {/* Jawaban Benar (Terisi & Ditandai Hijau oleh Scanner) */}
                            {i % 3 === 0 ? (
                               <div className="relative w-3.5 h-3.5 rounded-full bg-slate-800 flex items-center justify-center">
                                 <div className="absolute inset-0 border-2 border-emerald-500 rounded-full scale-150 animate-ping opacity-20"></div>
                               </div>
                            ) : (
                               <div className="w-3.5 h-3.5 rounded-full border border-slate-500 flex items-center justify-center"></div>
                            )}
                            {/* Jawaban Salah (Terisi & Ditandai Merah) */}
                            {i === 5 ? (
                               <div className="w-3.5 h-3.5 rounded-full bg-slate-800 border-2 border-red-500 shadow-[0_0_8px_#ef4444]"></div>
                            ) : (
                               <div className="w-3.5 h-3.5 rounded-full border border-slate-500"></div>
                            )}
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-500"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* UI Scanner Overlay (Kotak Kamera Pembidik) */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Shadow luar */}
                    <div className="absolute inset-0 border-[30px] border-black/40"></div>
                    {/* Frame Pembidik (Hijau jika sukses mendeteksi) */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[75%] border-2 border-emerald-400 rounded-xl transition-all duration-500 shadow-[0_0_15px_#34d399]">
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl"></div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl"></div>
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl"></div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-xl"></div>
                      
                      {/* Garis Laser Animasi */}
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-[bounce_3s_infinite]"></div>
                    </div>
                  </div>

                  {/* UI Notifikasi Hasil (Popup) */}
                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border border-white">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                      <CheckCircle size={24} weight="fill" />
                    </div>
                    <div>
                       <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Santri Terdeteksi</p>
                       <p className="text-lg font-black text-slate-900 leading-tight">Nilai: 85.00</p>
                    </div>
                  </div>

                </div>
              </div>
              {/* Glow Effect */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/10 blur-[80px] rounded-full z-0"></div>
            </div>

          </div>
        </div>
      </section>

      {/* Keunggulan & Fitur Utama */}
      <section id="fitur" className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h3 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">Fitur Standar Internasional</h3>
            <p className="text-slate-500 font-medium">Platform kami menggantikan perangkat keras seharga puluhan juta dengan aplikasi cerdas di genggaman Anda.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <DeviceMobileCamera />, title: "Scan Offline Mode", desc: "Tidak ada sinyal di kelas? Tidak masalah. Pindai LJK tanpa internet, sistem akan otomatis sinkronisasi ke cloud saat Anda online kembali." },
              { icon: <FileText />, title: "Cetak di Kertas HVS Biasa", desc: "Berhenti membeli Lembar Jawaban khusus yang mahal. Cetak format LJK kami langsung dari printer sekolah ke kertas HVS standar." },
              { icon: <ChartBar />, title: "Analisis Butir Soal & Santri", desc: "Algoritma kami otomatis mendeteksi soal mana yang terlalu sulit (daya pembeda) untuk bahan evaluasi mengajar Anda." },
              { icon: <Users />, title: "Database Santri Terpusat", desc: "Import data santri dari Excel. Sekali upload, data bisa digunakan untuk semua jenis ujian dari semester ke semester." },
              { icon: <ShieldCheck />, title: "Anti-Kecurangan (Multi-Kunci)", desc: "Buat soal Paket A, B, dan C. Sistem scanner akan otomatis mengenali kertas mana yang sedang diperiksa tanpa salah kunci." },
              { icon: <CloudCheck />, title: "Ekspor Hasil ke Excel/PDF", desc: "Selesai koreksi, langsung unduh rekap nilai dalam format Excel yang siap diserahkan ke bagian akademik sekolah." }
            ].map((fitur, idx) => (
              <div key={idx} className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-xl hover:-translate-y-1 transition-all group cursor-default">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all text-3xl">
                  {fitur.icon}
                </div>
                <h4 className="text-xl font-black text-slate-900 mb-3">{fitur.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed text-sm">{fitur.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audiens / Use Cases */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-black text-slate-900 mb-12">Siapa yang Menggunakan FastTest?</h3>
          <div className="flex flex-wrap justify-center gap-6">
             {["Pondok Pesantren", "SD/SMP/SMA Islam", "Bimbingan Belajar", "Universitas", "Lembaga Kursus Bahasa"].map((user, i) => (
               <span key={i} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-full shadow-sm cursor-default hover:border-slate-300 transition-colors">
                  {user}
               </span>
             ))}
          </div>
        </div>
      </section>

      {/* Harga & Paket */}
      <section id="harga" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">Investasi Terjangkau untuk Pendidikan</h3>
            <p className="text-slate-500 font-medium">Pilih paket sesuai dengan jumlah murid dan kebutuhan institusi Anda.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Paket Dasar */}
            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 flex flex-col hover:border-slate-300 transition-colors">
               <h4 className="text-xl font-black text-slate-900 mb-2">Guru Personal</h4>
               <p className="text-slate-500 text-sm mb-6">Cocok untuk mencoba sistem.</p>
               <div className="mb-8">
                 <span className="text-4xl font-black text-slate-900">Gratis</span>
               </div>
               <ul className="space-y-4 mb-8 flex-1">
                 <li className="flex gap-3 text-sm font-medium text-slate-700"><CheckCircle size={20} className="text-blue-600 shrink-0" /> Maksimal 100 Scan / Bulan</li>
                 <li className="flex gap-3 text-sm font-medium text-slate-700"><CheckCircle size={20} className="text-blue-600 shrink-0" /> LJK Standar (50 Soal)</li>
                 <li className="flex gap-3 text-sm font-medium text-slate-700"><CheckCircle size={20} className="text-blue-600 shrink-0" /> Analisis Dasar</li>
               </ul>
               <button className="w-full py-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer">Daftar Gratis</button>
            </div>

            {/* Paket Pro (Highlight) */}
            <div className="p-8 bg-blue-600 rounded-[2.5rem] border-4 border-blue-100 shadow-2xl shadow-blue-200 transform md:-translate-y-4 flex flex-col relative hover:scale-[1.02] transition-all">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full">Paling Populer</div>
               <h4 className="text-xl font-black text-white mb-2">Pro Educator</h4>
               <p className="text-blue-200 text-sm mb-6">Untuk beban kerja sekolah standar.</p>
               <div className="mb-8 flex items-end gap-1">
                 <span className="text-4xl font-black text-white">Rp 49.000</span>
                 <span className="text-blue-200 font-medium">/ bulan</span>
               </div>
               <ul className="space-y-4 mb-8 flex-1">
                 <li className="flex gap-3 text-sm font-medium text-white"><CheckCircle size={20} className="text-emerald-400 shrink-0" /> Scan Tanpa Batas (Unlimited)</li>
                 <li className="flex gap-3 text-sm font-medium text-white"><CheckCircle size={20} className="text-emerald-400 shrink-0" /> LJK Custom (S/d 100 Soal)</li>
                 <li className="flex gap-3 text-sm font-medium text-white"><CheckCircle size={20} className="text-emerald-400 shrink-0" /> Ekspor Lengkap (Excel/PDF)</li>
                 <li className="flex gap-3 text-sm font-medium text-white"><CheckCircle size={20} className="text-emerald-400 shrink-0" /> Dukungan Prioritas WhatsApp</li>
               </ul>
               <button className="w-full py-4 bg-white text-blue-600 font-black rounded-xl hover:bg-slate-50 transition-all shadow-lg cursor-pointer">Mulai Trial Pro</button>
            </div>

            {/* Paket Institusi */}
            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 flex flex-col hover:border-slate-300 transition-colors">
               <h4 className="text-xl font-black text-slate-900 mb-2">Institusi</h4>
               <p className="text-slate-500 text-sm mb-6">Sistem terpusat untuk yayasan.</p>
               <div className="mb-8">
                 <span className="text-3xl font-black text-slate-900">Hubungi Kami</span>
               </div>
               <ul className="space-y-4 mb-8 flex-1">
                 <li className="flex gap-3 text-sm font-medium text-slate-700"><CheckCircle size={20} className="text-blue-600 shrink-0" /> Semua Fitur Pro</li>
                 <li className="flex gap-3 text-sm font-medium text-slate-700"><CheckCircle size={20} className="text-blue-600 shrink-0" /> Multi-Akun Guru Terpusat</li>
                 <li className="flex gap-3 text-sm font-medium text-slate-700"><CheckCircle size={20} className="text-blue-600 shrink-0" /> Custom Logo Kop Surat LJK</li>
               </ul>
               <button className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer">Kontak Tim Sales</button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ (Tanya Jawab) */}
      <section id="faq" className="py-24 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-3xl lg:text-4xl font-black mb-4">Pertanyaan Seputar FastTest</h3>
          </div>
          
          <div className="space-y-4">
             {[
               { q: "Apakah saya perlu membeli kertas LJK khusus?", a: "Tidak. Keunggulan utama FastTest adalah Anda bisa mengunduh format LJK kami berformat PDF, lalu mencetaknya sendiri menggunakan kertas HVS biasa dan printer sekolah." },
               { q: "Bagaimana jika kelas tidak ada sinyal internet?", a: "Aplikasi ini dirancang untuk bekerja secara Offline. Anda bisa terus memindai puluhan kertas di kelas, dan nilai akan otomatis tersimpan ke server saat HP Anda kembali terhubung ke Wi-Fi kantor." },
               { q: "Bolehkah santri mengisi menggunakan pensil biasa atau pulpen?", a: "Sangat boleh. Algoritma kamera kami cukup sensitif untuk membaca penebalan dari pensil 2B, pulpen hitam, maupun spidol kecil, asalkan bulatannya tertutup dengan baik." },
             ].map((faq, i) => (
               <details key={i} className="group bg-slate-800 rounded-2xl border border-slate-700 p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
                 <summary className="flex items-center justify-between text-lg font-bold">
                   {faq.q}
                   <span className="transition group-open:rotate-180">
                     <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                   </span>
                 </summary>
                 <p className="text-slate-400 mt-4 leading-relaxed border-t border-slate-700 pt-4 cursor-text">{faq.a}</p>
               </details>
             ))}
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-24 bg-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-8 leading-tight">
            Bersiap untuk Ujian Semester Depan?
          </h2>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">Tinggalkan tumpukan kertas dan lembur berjam-jam untuk mengoreksi. Coba FastTest gratis hari ini.</p>
          <Link href="/login" className="inline-flex items-center gap-3 px-10 py-5 bg-white text-blue-600 font-black text-xl rounded-full hover:scale-105 transition-transform shadow-2xl cursor-pointer">
            Buat Akun Sekarang <ArrowRight size={24} weight="bold" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Scan size={24} weight="bold" className="text-blue-600" />
            <span className="font-black text-slate-900 text-lg">FastTest</span>
          </div>
          <p className="text-slate-500 font-medium text-sm">
            © {new Date().getFullYear()} Solusi Digital Edukasi oleh <span className="font-black text-slate-900">TarbiyahTech</span>.
          </p>
        </div>
      </footer>

    </div>
  );
}
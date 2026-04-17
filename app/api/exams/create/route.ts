export const runtime = 'edge';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, className, teacherName, duration, token, examType, questions } = body;

    // 1. Validasi Token
    const existingExam = await prisma.ujian.findUnique({ where: { token: token } });
    if (existingExam) {
      return NextResponse.json({ message: "Token sudah digunakan! Buat token baru." }, { status: 400 });
    }

    // 2. Cari Guru pengampu
    let guru = await prisma.guru.findFirst({ where: { nama: teacherName } });
    if (!guru) {
  // 1. Cari atau buat sekolah default terlebih dahulu
  let sekolah = await prisma.sekolah.findFirst();
  if (!sekolah) {
    sekolah = await prisma.sekolah.create({
      data: { nama: "Sekolah Default TarbiyahTech" }
    });
  }

  // 2. Buat guru dengan memasukkan sekolahId
  guru = await prisma.guru.create({
    data: { 
      nama: teacherName, 
      email: `${teacherName.replace(/\s+/g, '').toLowerCase()}@sekolah.com`, 
      password: "123",
      sekolahId: sekolah.id // <--- INI ADALAH PENYELAMATNYA
    }
  });
}

    // ==============================================================
    // KUNCI SINKRONISASI: Tarik semua santri dari kelas yang dipilih
    // ==============================================================
    const daftarSantri = await prisma.santri.findMany({
      where: { 
        kelas: className,
        status: "Aktif" 
      }
    });

    // 3. Simpan Ujian, Soal, Opsi, DAN ARSIP KOSONG SEKALIGUS!
    const newExam = await prisma.ujian.create({
      data: {
        sekolahId: guru.sekolahId,
        guruId: guru.id,
        namaUjian: title,
        kelas: className,
        tipe: "UAS", 
        metode: examType,
        durasi: duration,
        token: token,
        
        // Simpan Soal
        soal: {
          create: questions.map((q: any, index: number) => ({
            nomor: index + 1,
            tipeSoal: q.type,
            teksSoal: q.text,
            opsi: {
              create: q.options.map((opt: any, optIndex: number) => {
                let optionLabel = "";
                if (q.type === "bs") optionLabel = optIndex === 0 ? "B" : "S";
                else if (q.type === "angka14") optionLabel = (optIndex + 1).toString();
                else optionLabel = String.fromCharCode(65 + optIndex);

                return { label: optionLabel, teksOpsi: opt.text, isCorrect: opt.isCorrect, points: opt.points };
              }),
            },
          })),
        },

        // ==============================================================
        // BUATKAN DAFTAR HADIR (LEMBAR NILAI KOSONG) UNTUK SEMUA SANTRI
        // ==============================================================
        hasilUjian: {
          create: daftarSantri.map((santri: any) => ({
            santriId: santri.id,
            benar: 0,
            salah: 0,
            kosong: questions.length, // Otomatis menganggap semua soal kosong di awal
            nilaiMurni: 0,
            answersJson: "[]" // Belum ada jawaban yang masuk
          }))
        }
      },
    });

    return NextResponse.json(
      { 
        message: `Ujian berhasil disimpan dan disinkronkan dengan ${daftarSantri.length} santri dari kelas ${className}!`, 
        examId: newExam.id 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Gagal menyimpan:", error);
    return NextResponse.json({ message: "Terjadi kesalahan internal server." }, { status: 500 });
  }
} 